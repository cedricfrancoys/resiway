<?php
// Dispatcher (index.php) is in charge of setting the context and should include easyObject library
defined('__QN_LIB') or die(__FILE__.' cannot be executed directly.');
require_once('../resi.api.php');

use config\QNLib as QNLib;
use easyobject\orm\ObjectManager as ObjectManager;
use qinoa\text\TextTransformer as TextTransformer;

// force silent mode (debug output would corrupt json data)
set_silent(true);

// announce script and fetch parameters values
$params = QNLib::announce(	
	array(	
    'description'	=>	"Returns an author object",
    'params' 		=>	array(                     
                        'id'	        => array(
                                            'description'   => 'Identifier of the author to retrieve.',
                                            'type'          => 'integer', 
                                            'default'       => null
                                            ),    
                        'name'	        => array(
                                            'description'   => 'Name of the author to retrieve (URL formatted).',
                                            'type'          => 'string', 
                                            'default'       => ''
                                            )
                        )
	)
);

list($object_class, $object_id, $name) = ['resiway\Author', $params['id'], TextTransformer::slugify($params['name'])];

list($result, $error_message_ids) = [true, []];


/**
* note: for performance reasons, this script should not be requested for views involving authors listing
*/
try {
    $om = &ObjectManager::getInstance();
    if(isset($object_id) && $object_id > 0) {
        $author_id = $object_id;
    }
    else {
        if(!isset($name) || strlen($name) <= 0) throw new Exception("missing_id_or_name", QN_ERROR_MISSING_PARAM);    
        
        $ids = $om->search($object_class, ['name_url', 'like', "%{$name}%"], 'id', 'asc', 0, 1);

        if($ids < 0 || !count($ids)) throw new Exception("author_unknown", QN_ERROR_UNKNOWN_OBJECT);    

        $author_id = $ids[0];
    }

    $res = $om->read($object_class, $author_id, ['id', 'creator', 'name', 'name_url', 'url', 'description', 'count_views', 'count_documents', 'count_pages', 'documents_ids']);

    if($res < 0 || !isset($res[$author_id])) throw new Exception("request_failed", QN_ERROR_UNKNOWN);    
    $author = $res[$author_id];

    $author['documents'] = [];
    $res = $om->read('resilib\Document', $author['documents_ids'], ['id', 'creator', 'created', 'editor', 'edited', 'modified', 'last_update', 'license', 'title', 'title_url', 'lang', 'description', 'pages', 'count_stars', 'count_views', 'count_votes', 'score', 'categories_ids']);        
    if($res > 0) {
        // asign resulting array to returned value
        $author['documents'] = array_values($res);
    }
    
    $result = $author;
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