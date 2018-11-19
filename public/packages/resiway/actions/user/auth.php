<?php
defined('__QN_LIB') or die(__FILE__.' cannot be executed directly.');
require_once('../resi.api.php');

use config\QNlib;
use qinoa\http\HttpRequest;

// force silent mode (debug output would corrupt json data)
set_silent(true);

// announce script and fetch parameters values
list($params, $providers) = QNLib::announce([
    'description'	=>	"Attempt to auth a user from an external social network.",
    'params' 		=>	[
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
    ],
    'providers'     => ['easyobject\orm\ObjectManager', 'qinoa\php\Context'] 
]);

// initalise local vars with inputs
list($om, $context) = [ $providers['easyobject\orm\ObjectManager'], $providers['qinoa\php\Context'] ];

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
        $avatar_url = "https://graph.facebook.com/{$id}/picture?height=@size&width=@size";
        $context->httpRequest()->set([
            'login'     => $response->get('email'),
            'firstname' => $response->get('first_name'),
            'lastname'  => $response->get('last_name')        
        ]);        
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
        $account_type = 'google';        
        $avatar_url = (explode('?', $data['image']['url'])[0]).'?sz=@size';
        $context->httpRequest()->set([
            'login'     => $data['emails'][0]['value'],
            'firstname' => $data['name']['givenName'],
            'lastname'  => $data['name']['familyName']        
        ]);
        break;
    case 'lescommuns':
        $oauthRequest = new HttpRequest('https://login.lescommuns.org/auth/realms/master/protocol/openid-connect/userinfo');
        $response = $oauthRequest
                    ->header('Authorization', 'Bearer '.$network_token)
                    ->setBody([
                        'access_token' => $network_token
                    ])->send();
        if(!is_null($response->get('error'))) {
            throw new Exception("user_invalid_auth", QN_ERROR_NOT_ALLOWED);
        }
        $account_type = 'lescommuns';
        $avatar_url = 'https://seccdn.libravatar.org/avatar/'.md5($response->get('email')).'?s=@size';
        $context->httpRequest()->set([
            'login'     => $response->get('email'),
            'firstname' => $response->get('given_name'),
            'lastname'  => $response->get('family_name')          
        ]);
    
        break;
    default:
        throw new Exception("user_invalid_network", QN_ERROR_INVALID_PARAM);           
    }


    // check if an account has already been created for this email address
    $ids = $om->search('resiway\User', ['login', '=',  $context->httpRequest()->get('login')]);

    if($ids < 0) throw new Exception("action_failed", QN_ERROR_UNKNOWN); 

    // an account with this email address already exists
    if(count($ids) > 0) {
        $user_id = $ids[0];
    }
    // no account yet : register new user
    else {
        // disable email confirmation
        $context->httpRequest()->set('send_confirm', false);
    
        $json = json_decode(get_include_contents("packages/resiway/actions/user/signup.php"), true);    
        if(is_numeric($json['result']) && $json['result'] < 0) {
            throw new Exception($json['error_message_ids'][0], $json['result']);
        }
        // retrieve user_id
        $user_id = $context->get('user_id', 0);
    }
    
    if($user_id <= 0) throw new Exception("action_failed", QN_ERROR_UNKNOWN); 
    
    // update user data
    $user_data = [
                    'verified'      => true, 
                    'avatar_url'    => $avatar_url, 
                    'account_type'  => $account_type
                 ];
    $om->write('resiway\User', $user_id, $user_data);        
    
    // generate access_token
    $access_token = ResiAPI::userToken($user_id);
    // store token in cookie
    setcookie('access_token', $access_token, time()+60*60*24*365, '/');

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