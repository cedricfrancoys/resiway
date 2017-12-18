<?php
defined('__QN_LIB') or die(__FILE__.' cannot be executed directly.');
use config\QNlib as QNLib;

require_once('../resi.api.php');

// force silent mode (debug output would corrupt json data)
set_silent(true);

// announce script and fetch parameters values
$params = QNLib::announce(	
	array(	
    'description'	=>	"Attempt to sign a user in.",
    'params' 		=>	array(
                        'login'	    =>  array(
                                        'description'   => 'email address of the user.',
                                        'type'          => 'string', 
                                        'required'      => true
                                        ),
                        'password'	=>  array(
                                        'description'   => 'md5 hash of the user\'s password.',
                                        'type'          => 'string', 
                                        'required'      => true
                                        )
                        )
	)
);


list($login, $password, $error_message_ids) = [strtolower(trim($params['login'])), $params['password'], []];

try {
    $user_id = ResiAPI::userSign($login, $password);
    if($user_id < 0) throw new Exception("user_unidentified", QN_ERROR_NOT_ALLOWED);

    // generate access_token
    $access_token = ResiAPI::userToken($user_id);
    // store token in cookie
    setcookie('access_token', $access_token );
    // along with an access_token    
    $result = $user_id;
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