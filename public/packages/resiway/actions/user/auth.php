<?php
defined('__QN_LIB') or die(__FILE__.' cannot be executed directly.');
require_once('../resi.api.php');

use config\QNlib as QNLib;
use easyobject\orm\ObjectManager as ObjectManager;
use easyobject\orm\PersistentDataManager as PersistentDataManager;
use qinoa\http\HttpRequest;

// force silent mode (debug output would corrupt json data)
set_silent(true);

// announce script and fetch parameters values
$params = QNLib::announce(	
	array(	
    'description'	=>	"Attempt to auth a user from an external social network.",
    'params' 		=>	array(
                        'network_name'  =>  array(
                                            'description'   => 'name of the social network in case of oauth.',
                                            'type'          => 'string', 
                                            'required'      => true
                                        ),
                        'network_token' =>  array(
                                            'description'   => 'valid acess token for oauth.',
                                            'type'          => 'string',
                                            'required'      => true
                                        )                                            
                        )
	)
);


list($result, $error_message_ids) = [true, []];

list($action_name, $network_name, $network_token) = [ 
    'resiway_user_auth',
    $params['network_name'],
    $params['network_token']
];


function get_include_contents($filename) {
    ob_start();	
    include($filename); // assuming  parameters required by the script being called are present in the current URL 
    return ob_get_clean();
}


try {
    
    $om = &ObjectManager::getInstance();
    $pdm = &PersistentDataManager::getInstance();
    
    switch($network_name) {
    case 'facebook':
        $oauthRequest = new HttpRequest('/v2.9/me', ['Host' => 'graph.facebook.com:443']);    
        $response = $oauthRequest
            ->setBody([
                'fields'       => 'email,first_name,last_name',
                'access_token' => $network_token
            ])->send();
        if(!is_null($response->get('error'))) {
            throw new Exception("user_invalid_auth", QN_ERROR_NOT_ALLOWED);
        }                
        $id = $response->get('id');
        $account_type = 'facebook';        
        $avatar_url = "https://graph.facebook.com/{$id}/picture";
        $_REQUEST['login'] = $response->get('email');
        $_REQUEST['firstname'] = $response->get('first_name');
        $_REQUEST['lastname'] = $response->get('last_name');
        break;
    case 'google':
        $oauthRequest = new HttpRequest('/plus/v1/people/me', ['Host' => 'www.googleapis.com:443']);
        $response = $oauthRequest
            ->setBody([
                'access_token' => $network_token
            ])->send();
        if(!is_null($response->get('error'))) {
            throw new Exception("user_invalid_auth", QN_ERROR_NOT_ALLOWED);
        }
        $data = $response->getBody();
        $account_type] = 'google';        
        $avatar_url = $data['image']['url'];        
        $_REQUEST['login'] = $data['emails'][0]['value'];      
        $_REQUEST['firstname'] = $data['name']['givenName'];
        $_REQUEST['lastname'] = $data['name']['familyName'];
        break;
    default:
        throw new Exception("user_invalid_network", QN_ERROR_INVALID_PARAM);           
    }


    // check if an account has already been created for this email address
    $ids = $om->search('resiway\User', ['login', '=', $_REQUEST['login']]);

    if($ids < 0) throw new Exception("action_failed", QN_ERROR_UNKNOWN); 

    // create a user account for this email address
    if(count($ids) > 0) {
        $user_id = $ids[0];
    }
    // register new account
    else {
        // disable email confirmation
        $_REQUEST['send_confirm'] = false;
        $json = json_decode(get_include_contents("packages/resiway/actions/user/signup.php"), true);    
        if(is_numeric($json['result']) && $json['result'] < 0) {
            throw new Exception($json['error_message_ids'][0], $json['result']);
        }
        // retrieve user_id
        $user_id = $pdm->get('user_id');
    }

    // now user account should exist

    // update user data
    $user_data = [
                    'verified'      => true, 
                    'avatar_url'    => $avatar_url, 
                    'account_type'  => $account_type
                  ];                      
    $user_id = $om->write('resiway\User', $user_id, $user_data);
    
    // sign user in
    $pdm->set('user_id', $user_id);
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