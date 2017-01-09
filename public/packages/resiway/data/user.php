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
    'description'	=>	"Returns a user object",
    'params' 		=>	array(                                         
                        'id'	        => array(
                                            'description' => 'Identifier of the user to retrieve.',
                                            'type' => 'integer', 
                                            'required'=> true
                                            ),                                            
                        )
	)
);

list($object_class, $object_id) = ['resiway\User', $params['id']];

list($result, $error_message_ids) = [true, []];



try {
    
    $om = &ObjectManager::getInstance();

    $user_id = ResiAPI::userId();
    if($user_id < 0) throw new Exception("request_failed", QN_ERROR_UNKNOWN);
    
    $object_fields = ResiAPI::userPublicFields();
    
    // user and admins have acess to all fields
    if($user_id == $object_id
    || $user_id == 1) {
        $object_fields = array_merge($object_fields, ResiAPI::userPrivateFields());
    }
    
    // retrieve given user
    $res = $om->read($object_class, $object_id, $object_fields);
    if($res < 0 || !isset($res[$object_id])) throw new Exception("user_unknown", QN_ERROR_INVALID_PARAM);
    
    // retrieve notifications
    $res[$object_id]['notifications'] = [];
    if(isset($res[$object_id]['notifications_ids'])) {
        $notifications = $om->read('resiway\UserNotification', $res[$object_id]['notifications_ids']);
        if($notifications > 0) {
            $res[$object_id]['notifications'] = array_values($notifications);
        }
    }
    
    $result = $res[$object_id];
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