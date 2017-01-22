<?php
// Dispatcher (index.php) is in charge of setting the context and should include easyObject library
defined('__QN_LIB') or die(__FILE__.' cannot be executed directly.');
require_once('../resi.api.php');

use config\QNLib as QNLib;
use easyobject\orm\ObjectManager as ObjectManager;

// force silent mode (debug output would corrupt json data)
set_silent(true);

// announce script and fetch parameters values
$params = QNLib::announce(	
	array(	
    'description'	=>	"Provide all existing categories",
    'params' 		=>	array(                                    
                        'order'	        => array(
                                            'description' => 'Field on which sort the categories.',
                                            'type' => 'string', 
                                            'default'=> 'path'
                                            ),                                          
                        )
	)
);

list($result, $error_message_ids) = [true, []];


try {
    
    $om = &ObjectManager::getInstance();
  
    // retrieve given user
    $tags_ids = $om->search('resiway\Category', [], $params['order']);
    if($tags_ids < 0) throw new Exception("action_failed", QN_ERROR_UNKNOWN);
    
    $res = $om->read('resiway\Category', $tags_ids, ['id', 'title', 'description', 'path', 'parent_path']);
    if($res < 0) throw new Exception("action_failed", QN_ERROR_UNKNOWN);
        
    $result = array_values($res);
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