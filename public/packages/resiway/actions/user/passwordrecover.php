<?php
defined('__QN_LIB') or die(__FILE__.' cannot be executed directly.');

use config\QNlib as QNLib;
use easyobject\orm\ObjectManager as ObjectManager;

require_once('../resi.api.php');

// force silent mode (debug output would corrupt json data)
set_silent(true);

// announce script and fetch parameters values
$params = QNLib::announce(	
	array(	
    'description'	=>	"Send an email with instructions to recover password.",
    'params' 		=>	array(
                        'email'	=>  array(
                                        'description'   => 'email address associated with the account to recover.',
                                        'type'          => 'string', 
                                        'required'      => true
                                        )
                        )
	)
);

list($result, $error_message_ids) = [true, []];


try {
    $om = &ObjectManager::getInstance();
    // check if provided email address is registerd

    $login = $params['email'];
    
    // retrieve user id
    $ids = $om->search('resiway\User', ['login', '=', $login]);    
    if($ids < 0 || !count($ids)) throw new Exception("action_failed", QN_ERROR_UNKNOWN);
    $user_id = $ids[0];
    
    // retrieve md5 hash of current password
    $res = $om->read('resiway\User', $user_id, ['password']);
    if($res < 0) throw new Exception("action_failed", QN_ERROR_UNKNOWN);    
    $password = $res[$user_id]['password'];
    
    $code = base64_encode($login.";".$password);
    $confirm_url = QNlib::get_url(true, false)."#/user/confirm/{$code}";
        
   // todo: send an email
   
   
   // todo: remove - this is for testing purpose only (securit breach)
   /*
   $res[$user_id]['code'] = $code;   
   $result = $res[$user_id];
   */
   
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
