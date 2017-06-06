<?php
// Dispatcher (index.php) is in charge of setting the context and should include easyObject library
defined('__QN_LIB') or die(__FILE__.' cannot be executed directly.');
require_once('../resi.api.php');

use config\QNLib as QNLib;
use easyobject\orm\ObjectManager as ObjectManager;
use fs\FSManipulator as FSManipulator;

// force silent mode (debug output would corrupt json data)
set_silent(true);

// announce script and fetch parameters values
$params = QNLib::announce(	
	array(	
    'description'	=>	"Returns a category thumbnail",
    'params' 		=>	array(                                         
                        'id'	        => array(
                                            'description'   => 'Identifier of the category to retrieve.',
                                            'type'          => 'integer', 
                                            'required'      => true
                                            )
                        )
	)
);

list($object_class, $object_id) = ['resiway\Category', $params['id']];

try {
    $om = &ObjectManager::getInstance();
    $res = $om->read($object_class, $object_id, ['id', 'thumbnail']);   
    
    if($res < 0 || !count($res)) throw new Exception("category_unknown", QN_ERROR_INVALID_PARAM);
    $content = $res[$object_id]['thumbnail'];


    if(!strlen($content)) {
        header("Content-Type: image/png");
        $im = @imagecreate(1, 1);
        imagecolorallocate($im, 255, 255, 255);
        imagepng($im);
        imagedestroy($im);        
    }
    else {
        header("Content-Type: image/png");
        header("Content-Length: ".strlen($content));
        print($content);        
    }    
    
    exit();

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