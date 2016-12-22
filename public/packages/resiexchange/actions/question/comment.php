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
    'description'	=>	"Adds a new comment to a question.",
    'params' 		=>	array(                                         
                        'question_id'	=> array(
                                            'description'   => 'Identifier of the question the user comments.',
                                            'type'          => 'integer', 
                                            'required'      => true
                                            ),
                        'content'	    => array(
                                            'description'   => 'Short text the user is submitting as comment.',
                                            'type'          => 'string', 
                                            'required'      => true
                                            )
                        )
	)
);


list($action_name, $object_class, $object_id) = ['resiexchange_question_comment', 'resiexchange\Question', $params['question_id']];

list($result, $error_message_ids, $notifications) = [true, []];



try {

    $om = &ObjectManager::getInstance();
        
    // retrieve question data
    $res = $om->read($object_class, $object_id);
    if($res < 0 || !isset($res[$object_id])) throw new Exception("question_unknown", QN_ERROR_INVALID_PARAM);
    $question_data = $res[$object_id];
    
        
    // 0) retrieve parameters
    $user_id = ResiAPI::userId();
    if($user_id <= 0) throw new Exception("user_unidentified", QN_ERROR_NOT_ALLOWED);
    
    $action_id = ResiAPI::actionId($action_name);
    if($action_id <= 0) throw new Exception("action_unknown", QN_ERROR_INVALID_PARAM);
    
    // 1) check rights   
    if(!ResiAPI::isActionAllowed($user_id, $action_id)) {
        throw new Exception("user_reputation_insufficient", QN_ERROR_NOT_ALLOWED);  
    }
    
    // 2) action limitations
    // a daily maximum of submission might be set 
    $res = $om->search('resiway\ActionLog', [
                ['user_id',     '=',  $user_id], 
                ['action_id',   '=',  $action_id], 
                ['object_class','=',  $object_class], 
                ['created',     '>=', date("Y-m-d")]
           ]);
           
    if($res > 0) $count = count($res);
    else $count = 0;   

    if($count > RESIEXCHANGE_COMMENTS_DAILY_MAX) {
        throw new Exception("action_max_reached", QN_ERROR_NOT_ALLOWED);
    } 
    
    // create a new comment + write given value
    $comment_id = $om->create('resiexchange\QuestionComment', [ 
                                'creator'       => $user_id,     
                                'question_id'   => $object_id,
                                'content'       => $params['content']
                             ]);

    if($comment_id <= 0) throw new Exception("action_failed", QN_ERROR_UNKNOWN);

    // read created comment as returned value
    $res = $om->read('resiexchange\QuestionComment', $comment_id, ['creator', 'created', 'content', 'score']);
    if($res > 0) {
        $result = array(
                            'id'        => $comment_id,
                            'creator'   => ResiAPI::loadUser($user_id), 
                            'created'   => ResiAPI::dateISO($res[$comment_id]['created']), 
                            'content'   => $res[$comment_id]['content'], 
                            'score'     => $res[$comment_id]['score'],
                            'history'   => []
                        );
    }

    // 3) log action
    ResiAPI::registerAction($user_id, $action_id, $object_class, $object_id);
    
    // 4) update reputation 
    ResiAPI::applyActionOnReputation($user_id, $action_id, $object_class, $object_id);    
    
    // 5) update badges
    ResiAPI::updateBadges($user_id, $action_id, $object_class, $object_id);
}
catch(Exception $e) {
    $result = $e->getCode();
    $error_message_ids = array($e->getMessage());
}

// send json result
header('Content-type: application/json; charset=UTF-8');

echo json_encode([
                    'result' => $result, 
                    'error_message_ids' => $error_message_ids
                 ], 
                 JSON_PRETTY_PRINT);