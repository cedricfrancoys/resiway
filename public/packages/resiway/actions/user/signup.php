<?php
defined('__QN_LIB') or die(__FILE__.' cannot be executed directly.');
require_once('../resi.api.php');

use config\QNlib as QNLib;
use easyobject\orm\ObjectManager as ObjectManager;
use easyobject\orm\PersistentDataManager as PersistentDataManager;
use html\HtmlTemplate as HtmlTemplate;
use maxmind\geoip\GeoIP as GeoIP;


// force silent mode (debug output would corrupt json data)
set_silent(true);

// announce script and fetch parameters values
$params = QNLib::announce(	
	array(	
    'description'	=>	"Attempt to register a new user.",
    'params' 		=>	array(
                        'login'	        =>  array(
                                            'description'   => 'email address of the user.',
                                            'type'          => 'string', 
                                            'required'      => true
                                        ),
                        'firstname'	    =>  array(
                                            'description'   => 'user\'s firstname',
                                            'type'          => 'string', 
                                            'required'      => true
                                        ),
                        'lastname'	    =>  array(
                                            'description'   => 'user\'s lastname',
                                            'type'          => 'string', 
                                            'default'       => ''
                                        ),                                        
                        'lang'	        =>  array(
                                            'description'   => 'user\'s prefered language',
                                            'type'          => 'string', 
                                            'default'       => 'fr'
                                        ),
                        'account_type'  =>  array(
                                            'description'   => 'origin of user account.',
                                            'type'          => 'string', 
                                            'default'       => 'resiway'
                                        ),
                        'avatar_url'    =>  array(
                                            'description'   => 'URL of the user avatar.',
                                            'type'          => 'string', 
                                            'default'       => ''
                                        ),
                        'send_confirm'  =>  array(
                                            'description'   => 'Flag telling if we need to send a confirmation email.',
                                            'type'          => 'boolean', 
                                            'default'       => true
                                        )                                        
                        )
	)
);


list($result, $error_message_ids) = [true, []];

list($action_name, $login, $firstname, $lastname, $language, $account_type, $avatar_url, $send_confirm) = [ 
    'resiway_user_signup',
    strtolower(trim($params['login'])),
    $params['firstname'],
    $params['lastname'],
    $params['lang'],
    $params['account_type'],
    $params['avatar_url'],
    $params['send_confirm']    
];

$messages_folder = '../spool';

try {    
    $om = &ObjectManager::getInstance();
    $pdm = &PersistentDataManager::getInstance();

    // check login format validity
    $userClass = &$om->getStatic('resiway\User');
    $constraints = $userClass::getConstraints();    
    if(!$constraints['login']['function']($login)) throw new Exception("user_invalid_login", QN_ERROR_INVALID_PARAM);   
    if(!$constraints['firstname']['function']($firstname)) throw new Exception("user_invalid_firstname", QN_ERROR_INVALID_PARAM);       
    
    // make sure no account has already been created for this email address
    $ids = $om->search('resiway\User', ['login', '=', $login]);
    if($ids < 0) throw new Exception("action_failed", QN_ERROR_UNKNOWN); 
    
    if(count($ids)) throw new Exception("user_already_registered", QN_ERROR_NOT_ALLOWED);

    // generate a random password (32 bytes hexadecimal values)
    // force first 8 bytes to NULL (this serves as marking to know which passwords haven't been changed)
    $password = '00000000';
    for($i = 0; $i < 24; ++$i) {
        $password .= sprintf("%x", rand(0, 15)) ;
    }
    
    if(strlen($avatar_url) <= 0) {
        // generate avatar URL using identicon with a random hash
        $avatar_url = 'https://www.gravatar.com/avatar/'.md5($firstname.rand()).'?d=identicon&s=@size';
    }
    // get requesting IP geo location
    $location = GeoIP::getLocationFromIP($_SERVER['REMOTE_ADDR']);
    // init creation array with new user info
    $user_data = [
                    'login'         => $login, 
                    'password'      => $password, 
                    'firstname'     => $firstname,
                    'lastname'      => $lastname,
                    'language'      => $language, 
                    'avatar_url'    => $avatar_url,                    
                    'location'      => $location->city,
                    'account_type'  => $account_type
                   ];
    // assign returned country code only if consistent              
    if( strlen($location->country_code) == 2) $user_data['country'] = strtoupper($location->country_code);
    
    // internal consistency check 
    $errors = $om->validate('resiway\User', $user_data);
    if($errors < 0 || count($errors)) throw new Exception("action_failed", QN_ERROR_INVALID_PARAM);
    // create a new user account
    $user_id = $om->create('resiway\User', $user_data);
                                           
    if($user_id <= 0) throw new Exception("action_failed", QN_ERROR_UNKNOWN);
   
    // update global counter
    ResiAPI::repositoryInc('resiway.count_users');     
    
    // update session data
    $pdm->set('user_id', $user_id);
    
    if($send_confirm) {
        // retrieve newly created user
        $user_data = ResiAPI::loadUserPrivate($user_id);
        // we need the password to generate confirmation code in the email
        $user_data['password'] = $password;

        
        // subject of the email should be defined in the template, as a <var> tag holding a 'title' attribute
        $subject = '';
        // read template according to user prefered language
        $file = "packages/resiway/i18n/{$user_data['language']}/mail_user_confirm.html";
        if(!($html = @file_get_contents($file, FILE_TEXT))) throw new Exception("action_failed", QN_ERROR_UNKNOWN);
        $template = new HtmlTemplate($html, [
                                    'subject'		=>	function ($params, $attributes) use (&$subject) {
                                                            $subject = $attributes['title'];
                                                            return '';
                                                        },
                                    'username'		=>	function ($params, $attributes) {
                                                            return $params['firstname'];
                                                        },
                                    'confirm_url'	=>	function ($params, $attributes) {
                                                            $code = ResiAPI::credentialsEncode($params['login'],$params['password']);
                                                            $url = QNlib::get_url(true, false)."user/confirm/{$code}";
                                                            return "<a href=\"$url\">{$attributes['title']}</a>";
                                                        }
                                    ], 
                                    $user_data);
        // parse template as html
        $body = $template->getHtml();
        
        /**
        * message files format is: 11 digits (user unique identifier) with 3 digits extension in case of multiple files
        */
        $temp = sprintf("%011d", $user_id);
        $filename = $temp;
        $i = 0;
        while(file_exists("$messages_folder/{$filename}")) {
            $filename = sprintf("%s.%03d", $temp, ++$i);
        }
        // data consists of parsed template and subject
        $json = json_encode(array("subject" => $subject, "body" => $body), JSON_PRETTY_PRINT);
        file_put_contents("$messages_folder/$filename", $json);
    }
    
    // log user registration
    ResiAPI::registerAction($user_id, $action_name, 'resiway\User', $user_id);
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