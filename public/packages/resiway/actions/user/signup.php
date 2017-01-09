<?php
defined('__QN_LIB') or die(__FILE__.' cannot be executed directly.');
require_once('../resi.api.php');

use config\QNlib as QNLib;
use easyobject\orm\ObjectManager as ObjectManager;
use easyobject\orm\PersistentDataManager as PersistentDataManager;

// force silent mode (debug output would corrupt json data)
set_silent(true);

// announce script and fetch parameters values
$params = QNLib::announce(	
	array(	
    'description'	=>	"Attempt to register a new user.",
    'params' 		=>	array(
                        'login'	    =>  array(
                                        'description' => 'email address of the user.',
                                        'type' => 'string', 
                                        'required'=> true
                                        ),
                        'firstname'	=>  array(
                                        'description' => 'user\'s firstname',
                                        'type' => 'string', 
                                        'required'=> true
                                        )
                        )
	)
);


list($result, $error_message_ids) = [true, []];

list($login, $firstname) = [strtolower(trim($params['login'])),$params['firstname']];

try {
    $om = &ObjectManager::getInstance();
    $pdm = &PersistentDataManager::getInstance();

    // check login format validity
    $user_class = $om->getStatic('resiway\User');
    $constraints = $user_class::getConstraints();    
    if(!$constraints['login']['function']($login)) throw new Exception("invalid_login", QN_ERROR_INVALID_PARAM);   
    if(!$constraints['firstname']['function']($firstname)) throw new Exception("invalid_firstname", QN_ERROR_INVALID_PARAM);       
    
    // make sure no account has already been created for this email address
    $ids = $om->search('resiway\User', ['login', '=', $login]);
    if($ids < 0) throw new Exception("action_failed", QN_ERROR_UNKNOWN); 
    
    if(count($ids)) throw new Exception("already_registered_user", QN_ERROR_NOT_ALLOWED);

    // generate a random password (32 bytes hexadecimal values)
    // force first 8 bytes to NULL (this serves as marking to know which passwords haven't been changed)
    $password = '00000000';
    for($i = 0; $i < 24; ++$i) {
        $password .= sprintf("%x", rand(0, 15)) ;
    }
    
    $user_id = $om->create('resiway\User', ['login'=>$login, 'password'=>$password, 'firstname' => $firstname]);
    if($user_id <= 0) throw new Exception("action_failed", QN_ERROR_UNKNOWN);
    
    $root_url = QNlib::get_url(true, false);    
    $confirm_url = $root_url."#/user/confirm/".base64_encode($login.";".$password);
// todo : send confirmation email    
/*
    echo $confirm_url;
*/
    // update session data
    $pdm->set('user_id', $user_id);
    
    // retrieve newly created user
    $res = $om->read('resiway\User', $user_id, ResiAPI::userPublicFields());  
    $result = $res[$user_id];
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