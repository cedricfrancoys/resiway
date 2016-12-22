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
    'description'	=>	"Tries to log a user in.",
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


list($login, $password, $error_message_ids) = [$params['login'], $params['password'], []];

try {
    $om = &ObjectManager::getInstance();
    $pdm = &PersistentDataManager::getInstance();
    $user_class = $om->getStatic('resiway\User');
    $constraints = $user_class::getConstraints();    
    if(!$constraints['login']['function']($login) || !$constraints['password']['function']($password)) throw new Exception("invalid_login_password", QN_ERROR_INVALID_PARAM);   
    $ids = $om->search('resiway\User', [['login', '=', $login], ['password', '=', $password]]);
    if($ids < 0 || !count($ids)) throw new Exception("unidentified_user", QN_ERROR_INVALID_PARAM); 
    $pdm->register('user_id', $ids[0]);
    $result = $ids[0];
}
catch(Exception $e) {
    $error_message_ids = array($e->getMessage());
    $result = $e->getCode();
}

// send json result
header('Content-type: application/json; charset=UTF-8');
echo json_encode(array('result' => $result, 'error_message_ids' => $error_message_ids), JSON_FORCE_OBJECT);