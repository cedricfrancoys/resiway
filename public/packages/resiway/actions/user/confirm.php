<?php
defined('__QN_LIB') or die(__FILE__.' cannot be executed directly.');

use config\QNlib as QNLib;
use easyobject\orm\ObjectManager as ObjectManager;

// force silent mode (debug output would corrupt json data)
set_silent(true);

// announce script and fetch parameters values
$params = QNLib::announce(	
	array(	
    'description'	=>	"Attempt to register a new user.",
    'params' 		=>	array(
                        'code'	    =>  array(
                                        'description'   => 'unique identification code sent to the user.',
                                        'type'          => 'string', 
                                        'required'      => true
                                        )
                        )
	)
);

list($result, $error_message_ids) = [true, []];
list($code) = [$params['code']];

try {
    $om = &ObjectManager::getInstance();
    
    list($login, $password) = explode(';', base64_decode($code));
    
    $ids = $om->search('resiway\User', [['login', '=', $login], ['password', '=', $password]]);
    
    if($ids < 0 || !count($ids)) throw new Exception("action_failed", QN_ERROR_UNKNOWN); 
    
    $user_id = $ids[0];
    
    // update 'verified' field
    $om->write('resiway\User', $user_id, [ 'verified' => 1 ]);
    
}
catch(Exception $e) {
    $error_message_ids = array($e->getMessage());
    $result = $e->getCode();
}

// send json result
header('Content-type: application/json; charset=UTF-8');
echo json_encode([
                    'result'            => $result, 
                    'error_message_ids' => $error_message_ids
                 ], JSON_PRETTY_PRINT);
