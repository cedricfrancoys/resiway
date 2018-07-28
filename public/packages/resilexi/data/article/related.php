<?php
// Dispatcher (index.php) is in charge of setting the context and should include easyObject library
defined('__QN_LIB') or die(__FILE__.' cannot be executed directly.');
require_once('../resi.api.php');

use config\QNLib;
use easyobject\orm\ObjectManager;
use qinoa\orm\Domain;

// force silent mode (debug output would corrupt json data)
set_silent(true);

// announce script and fetch parameters values
$params = QNLib::announce(
	array(
    'description'	=>	"Provide articles related to given article",
    'params' 		=>	array(
                        'article_id'	=> array(
                                            'description'   => 'Identifier of the question we want to retrieve related questions',
                                            'type'          => 'integer',
                                            'required'      => true
                                            ),
                        'limit'		    => array(
                                            'description'   => 'The maximum number of results.',
                                            'type'          => 'integer',
                                            'min'           => 5,
                                            'max'           => 15,
                                            'default'       => 10
                                            ),                                            
                        'channel'	    => array(
                                            'description'   => 'Channel for which questions are requested (default, help, meta, ...)',
                                            'type'          => 'integer',
                                            'default'       => 1
                                            )
                        )
	)
);

list($result, $error_message_ids) = [true, []];

list($object_class, $object_id) = ['resilexi\Article', $params['article_id']];


try {
    $om = &ObjectManager::getInstance();
    
    $res = $om->read($object_class, $object_id, ['categories' => ['id', 'path']]);    
    if($res < 0 || !isset($res[$object_id])) throw new Exception("object_unknown", QN_ERROR_INVALID_PARAM);       
    $article = $res[$object_id];
    
    $domain = Domain::conditionAdd([], ['channel_id','=', $params['channel']]);

    $extra_categories_ids = [];
    
    if(count($article['categories']) < 4) {
        $subdomain = [];
        foreach($article['categories'] as $category) {
            $subdomain = Domain::clauseAdd($subdomain, [['path', 'like', $category['path'].'%']]);
        }
        $extra_categories_ids = $om->search('resiway\Category', $subdomain, 'count_questions', 'desc', 0, 5);
    }
    
    $domain = Domain::conditionAdd($domain, ['categories', 'contains', array_merge(array_keys($article['categories']), $extra_categories_ids)]);    
   
    $articles_ids = $om->search($object_class, $domain, 'score', 'desc', 0, $params['limit']);
    
    $articles_ids = array_diff($articles_ids, [$object_id]);
    
    if(!empty($articles_ids)) {    
        // retrieve categories
        $res = $om->read($object_class, $articles_ids, ['id', 'title', 'title_url', 'score']);
        if($res < 0) throw new Exception("action_failed", QN_ERROR_UNKNOWN);
        $result = array_values($res);
    }
}
catch(Exception $e) {
    $result = $e->getCode();
    $error_message_ids = array($e->getMessage());
}

// send json result
header('Content-type: application/json; charset=UTF-8');
echo json_encode([
                    'result'            => $result,
                    'error_message_ids' => $error_message_ids
                 ],
                 JSON_PRETTY_PRINT);