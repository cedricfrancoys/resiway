<?php
defined('__QN_LIB') or die(__FILE__.' cannot be executed directly.');

use config\QNlib as QNLib;
use easyobject\orm\ObjectManager as ObjectManager;
use easyobject\orm\PersistentDataManager as PersistentDataManager;

// force silent mode (debug output would corrupt json data)
set_silent(true);

// announce script and fetch parameters values
$params = QNLib::announce(	
	array(	
    'description'	=>	"Attempt to sign a user in.",
    'params' 		=>	array(
                        'login'	    =>  array(
                                        'description' => 'email address of the user.',
                                        'type' => 'string', 
                                        'required'=> true
                                        ),
                        'password'	=>  array(
                                        'description' => 'md5 hash of the user\'s password.',
                                        'type' => 'string', 
                                        'required'=> true
                                        )
                        )
	)
);


list($login, $password, $error_message_ids) = [strtolower(trim($params['login'])), $params['password'], []];

try {
    $om = &ObjectManager::getInstance();
    $pdm = &PersistentDataManager::getInstance();
    
    // check login and password formats validity    
    $user_class = $om->getStatic('resiway\User');
    $constraints = $user_class::getConstraints();    
    if(!$constraints['login']['function']($login)) throw new Exception("invalid_login", QN_ERROR_INVALID_PARAM);   
    if(!$constraints['password']['function']($password)) throw new Exception("invalid_password", QN_ERROR_INVALID_PARAM);
    
    $ids = $om->search('resiway\User', [['login', '=', $login], ['password', '=', $password]]);
    if($ids < 0 || !count($ids)) throw new Exception("unidentified_user", QN_ERROR_INVALID_PARAM); 
    $pdm->set('user_id', $ids[0]);
    $result = $ids[0];
}
catch(Exception $e) {
    $error_message_ids = array($e->getMessage());
    $result = $e->getCode();
}

// send json result
header('Content-type: application/json; charset=UTF-8');
echo json_encode([
        'result' => $result, 
        'error_message_ids' => $error_message_ids
     ], JSON_FORCE_OBJECT);