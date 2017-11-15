<?php
// Dispatcher (index.php) is in charge of setting the context and should include easyObject library
defined('__QN_LIB') or die(__FILE__.' cannot be executed directly.');
require_once('../resi.api.php');

use config\QNLib;
use easyobject\orm\ObjectManager;

use resiway\User;

// force silent mode (debug output would corrupt json data)
set_silent(true);

/*
 @actions   this is a data provider: no change is made to the stored data
 @rights    everyone has read access on these data
 @returns   list of articles matching given criteria
*/

// announce script and fetch parameters values
$params = QNLib::announce(	
	array(	
    'description'	=>	"Returns a list of article objects matching the received criteria",
    'params' 		=>	array(                                         
                        'q'		    => array(
                                            'description'   => 'Token to search among the articles',
                                            'type'          => 'string',
                                            'default'       => ''
                                            ),
                        'domain'	=> array(
                                            'description'   => 'Criterias that results have to match (serie of conjunctions)',
                                            'type'          => 'array',
                                            'default'       => []
                                            ),
                        'order'		=> array(
                                            'description'   => 'Column to use for sorting results.',
                                            'type'          => 'string',
                                            'default'       => 'id'
                                            ),
                        'sort'		=> array(
                                            'description'   => 'The direction  (i.e. \'asc\' or \'desc\').',
                                            'type'          => 'string',
                                            'default'       => 'desc'
                                            ),
                        'start'		=> array(
                                            'description'   => 'The row from which results have to start.',
                                            'type'          => 'integer',
                                            'default'       => 0
                                            ),
                        'limit'		=> array(
                                            'description'   => 'The maximum number of results.',
                                            'type'          => 'integer',
                                            'min'           => 5,
                                            'max'           => 100,
                                            'default'       => 25
                                            ),
                        'total'		=> array(
                                            'description'   => 'Total of record (if known).',
                                            'type'          => 'integer',
                                            'default'       => -1
                                            ),
                        'channel'	=> array(
                                            'description'   => 'Channel for which articles are requested (default, help, meta, ...)',
                                            'type'          => 'integer',
                                            'default'       => 1
                                            )                                       
                        )
	)
);




list($result, $error_message_ids, $total) = [[], [], $params['total']];


try {
    
    $om = &ObjectManager::getInstance();

    // 0) retrieve matching articles identifiers

    // build domain   
    if(strlen($params['q']) > 0) {
        // clear domain
        $params['domain'] = [];
        // adapt domain to restrict results to given channel
        $params['domain'][] = ['channel_id','=', $params['channel']];        
        $indexes_ids = resiway\Index::searchByQuery($om, $params['q']);        
        $articles_ids = $om->search('resilexi\Article', ['indexes_ids', 'contains', $indexes_ids]);
        if(count($articles_ids) > 0) {
            $params['domain'][] = ['id','in', $articles_ids];
        }
        else $params['domain'][] = ['id','=', -1];        
    }
    else {
        $params['domain'] = QNLib::domain_normalize($params['domain']);
        if(!QNLib::domain_check($params['domain'])) $params['domain'] = [];
        
        // adapt domain to restrict results to given channel
        $params['domain'] = QNLib::domain_condition_add($params['domain'], ['channel_id','=', $params['channel']]);

// we shouldn't request articles by categories using the domain, but rather use a specific syntax for the query
// quick and dirty workaround for including sub-categories: 
        foreach($params['domain'] as $clause_id => $clause) {
            foreach($clause as $condition_id => $condition) {
                if($condition[0] == 'categories_ids') {
                    $categories_ids = (array) $condition[2];
                    $articles = $om->read('resiway\Category', $categories_ids, ['title', 'path', 'parent_path', 'description']);
                    foreach($articles as $category) {
                        $sub_categories_ids = $om->search('resiway\Category', ['path', 'like', $category['path'].'%']);
                        $categories_ids = array_merge($categories_ids, $sub_categories_ids);
                    }
                    $params['domain'][$clause_id][$condition_id][2] = array_unique($categories_ids);
                    break 2;
                }
            }
        }
    }

    // total is not knwon yet
    if($params['total'] < 0) {        
        $ids = $om->search('resilexi\Article', $params['domain'], $params['order'], $params['sort']);
        if($ids < 0) throw new Exception("request_failed", QN_ERROR_UNKNOWN);
        $params['total'] = count($ids);
		$articles_ids = array_slice($ids, $params['start'], $params['limit']);
    }
    else {
        $articles_ids = $om->search('resilexi\Article', $params['domain'], $params['order'], $params['sort'], $params['start'], $params['limit']);
        if($articles_ids < 0) throw new Exception("request_failed", QN_ERROR_UNKNOWN);
    } 
    
    if(!empty($articles_ids)) {
        // retrieve articles        
        $articles = $om->read(  'resilexi\Article', 
                                $articles_ids, 
                                [
                                    'id',
                                    'creator'       => User::getPublicFields(), 
                                    'categories'    => ['id', 'title', 'path', 'parent_path', 'description'],
                                    'created', 
                                    'title', 
                                    'title_url', 
                                    'content_excerpt', 
                                    'score', 
                                    'count_views', 
                                    'count_votes'
                                ]);        
        
        if($articles < 0 || !count($articles)) throw new Exception("request_failed", QN_ERROR_UNKNOWN);
        
        $user_id = ResiAPI::userId();
        if($user_id > 0) {
            // retrieve actions performed by the user on each article
            $articles_history = ResiAPI::retrieveHistory($user_id, 'resilexi\Article', array_keys($articles));            
            foreach($articles as $article_id => $article_data) {
                $articles[$article_id]['history'] = $articles_history[$article_id];        
            }
        }
        // normalize result (force array conversion for associative arrays with array_values)
        foreach($articles as $oid => $article) {
            $articles[$oid]['categories'] = array_values($article['categories']);
        }
        // result is a (non-associative) array of objects
        $result = array_values($articles);
    }

}
catch(Exception $e) {
    $result = $e->getCode();
    $error_message_ids = array($e->getMessage());
}

// output json result
header('Content-type: application/json; charset=UTF-8');
echo json_encode([
    'result'            => $result,
    'total'             => $params['total'],
    'error_message_ids' => $error_message_ids
], JSON_PRETTY_PRINT);