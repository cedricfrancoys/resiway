<?php
// Dispatcher (index.php) is in charge of setting the context and should include easyObject library
defined('__QN_LIB') or die(__FILE__.' cannot be executed directly.');
require_once('../resi.api.php');

use config\QNLib as QNLib;
use easyobject\orm\ObjectManager as ObjectManager;

// force silent mode (debug output would corrupt json data)
set_silent(true);

// announce script and fetch parameters values
$params = QNLib::announce(	
	array(	
    'description'	=>	"Registers a flag raised by a user on given answer",
    'params' 		=>	array(                                         
                        'answer_id'	=> array(
                                            'description'   => 'Identifier of the answer the user is flaging.',
                                            'type'          => 'integer', 
                                            'required'      => true
                                            )                                       
                        )
	)
);


list($result, $error_message_ids) = [true, []];

list($action_name, $object_class, $object_id) = [
    'resiexchange_answer_flag', 
    'resiexchange\Answer', 
    $params['answer_id']
];


try {

    // try to perform action
    $result = ResiAPI::performAction(
        $action_name,                                               // $action_name
        $object_class,                                              // $object_class
        $object_id,                                                 // $object_id
        ['count_flags'],                                            // $object_fields
        true,                                                       // $toggle
        null,                                                       // $concurrent_action        
        function ($om, $user_id, $object_class, $object_id) {       // $do 
            // vote the comment up
            $object = $om->read($object_class, $object_id, ['count_flags'])[$object_id];       
            $om->write($object_class, $object_id, [
                'count_flags'       => $object['count_flags']+1
            ]);
            return true;
        },
        function ($om, $user_id, $object_class, $object_id) {       // $undo
            // undo action (vote comment up)
            $object = $om->read($object_class, $object_id, ['count_flags'])[$object_id];
            $om->write($object_class, $object_id, [
                'count_flags'       => $object['count_flags']-1
            ]);
            return false;            
        },
        [                                                           // $limitations
            // user cannot perform action on an object of his own
            function ($om, $user_id, $action_id, $object_class, $object_id) {
                $res = $om->read($object_class, $object_id, ['creator']);
                if($res[$object_id]['creator'] == $user_id) {
                    throw new Exception("answer_created_by_user", QN_ERROR_NOT_ALLOWED);          
                }
          
            },        
            // user cannot perform given action more than daily maximum
            function ($om, $user_id, $action_id, $object_class, $object_id) {
                $res = $om->search('resiway\ActionLog', [
                            ['user_id',     '=',  $user_id], 
                            ['action_id',   '=',  $action_id], 
                            ['object_class','=',  $object_class], 
                            ['created',     '>=', date("Y-m-d")]
                       ]);
                if($res > 0 && count($res) > RESIEXCHANGE_ANSWER_FLAG_DAILY_MAX) {
                    throw new Exception("action_max_reached", QN_ERROR_NOT_ALLOWED);
                }        
            }       
        ]
    );

    // update badges
    ResiAPI::updateBadges(
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
        'notifications'     => ResiAPI::userNotifications()
    ], 
    JSON_PRETTY_PRINT);