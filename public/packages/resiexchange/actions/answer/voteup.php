<?php
// Dispatcher (index.php) is in charge of setting the context and should include easyObject library
defined('__QN_LIB') or die(__FILE__.' cannot be executed directly.');
require_once('../resi.api.php');

use config\QNLib as QNLib;
use easyobject\orm\ObjectManager as ObjectManager;

// force silent mode (debug output would corrupt json data)
set_silent(true);

// announce script and fetch parameters values
$params = QNLib::announce([
    'description'	=>	"Registers a vote up performed by a user on an answer",
    'params' 		=>	[                                        
        'answer_id'	=> [
            'description'   => 'Identifier of the answer the user votes up.',
            'type'          => 'integer', 
            'required'      => true
        ]
    ]
]);


list($result, $error_message_ids, $notifications) = [true, [], []];

list($action_name, $object_class, $object_id) = [ 
    'resiexchange_answer_voteup',                         
    'resiexchange\Answer',                                   
    $params['answer_id']
];

try {

    // try to perform action
    $result = ResiAPI::performAction(
        $action_name,                                               // $action_name
        $object_class,                                              // $object_class
        $object_id,                                                 // $object_id
        ['count_votes', 'score'],                                   // $object_fields
        false,                                                      // $toggle
        'resiexchange_answer_votedown',                             // $concurrent_action        
        function ($om, $user_id, $object_class, $object_id) {       // $do 
            // vote the anwer up
            $object = $om->read($object_class, $object_id, ['count_votes', 'score'])[$object_id];       
            $om->write($object_class, $object_id, [
                'count_votes' => $object['count_votes']+1, 
                'score'       => $object['score']+1
            ]);
            return true;
        },
        function ($om, $user_id, $object_class, $object_id) {       // $undo
            // undo concurrent action (vote answer down)
            $object = $om->read($object_class, $object_id, ['count_votes', 'score'])[$object_id];
            $om->write($object_class, $object_id, [
                'count_votes' => $object['count_votes']-1, 
                'score'       => $object['score']+1
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
            // user cannot perform action on an object more than once
            function ($om, $user_id, $action_id, $object_class, $object_id) {
                if(ResiAPI::isActionRegistered($user_id, $action_id, $object_class, $object_id)) {
                    throw new Exception("action_already_performed", QN_ERROR_NOT_ALLOWED);  
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
                if($res > 0 && count($res) > RESIEXCHANGE_ANSWER_VOTEUP_DAILY_MAX) {
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