<?php
// Dispatcher (index.php) is in charge of setting the context and should include easyObject library
defined('__QN_LIB') or die(__FILE__.' cannot be executed directly.');
require_once('../resi.api.php');

use config\QNLib as QNLib;


// force silent mode (debug output would corrupt json data)
set_silent(true);

// announce script and fetch parameters values
$params = QNLib::announce([
    'description'	=>	"Edit a user profile",
    'params' 		=>	[
        'id'	        => array(
                            'description'   => 'Identifier of the user being edited.',
                            'type'          => 'integer', 
                            'default'       => 0
                            ),    
        'firstname'	    => array(
                            'description'   => 'User firstname.',
                            'type'          => 'string', 
                            'required'      => true
                            ),
        'lastname'	    => array(
                            'description'   => 'User lastname.',
                            'type'          => 'string',
                            'default'       => ''
                            ),                            
        'publicity_mode'	=> array(
                            'description'   => 'Description of the submitted category.',
                            'type'          => 'integer', 
                            'default'       => 1
                            ),
        'language'	=> array(
                            'description'   => 'User prefered language.',
                            'type'          => 'string', 
                            'default'       => 'fr'
                            ),
        'country'	=> array(
                            'description'   => 'Description of the submitted category.',
                            'type'          => 'string',
                            'default'       => ''
                            ),

        'location'	=> array(
                            'description'   => 'Description of the submitted category.',
                            'type'          => 'string',
                            'default'       => ''
                            ),
        'about'     => array(
                            'description'   => 'User short self description.',
                            'type'          => 'string',
                            'default'       => ''
                            )                           
    ]
]);


list($result, $error_message_ids, $notifications) = [true, [], []];

list($action_name, $object_class, $object_id) = [ 
    'resiway_user_edit',
    'resiway\User',
    $params['id']
];

try {
// try to perform action
    $result = ResiAPI::performAction(
        $action_name,                                             // $action_name
        $object_class,                                            // $object_class
        $object_id,                                               // $object_id
        [                                                         // $object_fields  
        'verified', 
        'firstname', 'lastname', 'about',
        'publicity_mode', 'language', 'country', 'location'
        ],                                                       
        false,                                                    // $toggle
        null,                                                     // $concurrent_action
        function ($om, $user_id, $object_class, $object_id)       // $do
        use ($params) {        
            $om->write($object_class, $object_id, [
                            'firstname'         => $params['firstname'], 
                            'lastname'          => $params['lastname'],
                            'publicity_mode'    => $params['publicity_mode'],
                            'language'          => $params['language'],
                            'country'           => $params['country'],
                            'location'          => $params['location'],
                            'about'             => $params['about']
                       ]);
            
            // read updated user as returned value
            return ResiAPI::loadUserPrivate($object_id);
        },
        null,                                                      // $undo
        [                                                          // $limitations
            // only user and root user can change profile
            function ($om, $user_id, $action_id, $object_class, $object_id) {
                if($user_id != $object_id
                && $user_id != 1) {
                    throw new Exception("user_not_admin", QN_ERROR_NOT_ALLOWED);
                }      
            },
            // only verified users can change their profile
            function ($om, $user_id, $action_id, $object_class, $object_id) {
                $res = $om->read($object_class, $object_id, ['verified']);
                if(!$res[$object_id]['verified']) throw new Exception("user_not_verified", QN_ERROR_NOT_ALLOWED);   
            },
            function ($om, $user_id, $action_id, $object_class, $object_id) 
            use ($params) {
                $errors = $om->validate($object_class, $params);
                if(count($errors)) throw new Exception("user_invalid_".array_keys($errors)[0], QN_ERROR_INVALID_PARAM);
            }
        ]
    );
    
    // update badges
    $notifications = ResiAPI::updateBadges(
        $action_name,
        $object_class,
        $object_id
    );     
}
catch(Exception $e) {
    $result = $e->getCode();
    $error_message_ids = array($e->getMessage());
}

// send json result
header('Content-type: application/json; charset=UTF-8');
echo json_encode([
        'result'            => $result, 
        'error_message_ids' => $error_message_ids,
        'notifications'     => $notifications
    ], 
    JSON_PRETTY_PRINT);