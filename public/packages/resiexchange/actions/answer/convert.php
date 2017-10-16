<?php
// Dispatcher (index.php) is in charge of setting the context and should include easyObject library
defined('__QN_LIB') or die(__FILE__.' cannot be executed directly.');
require_once('../resi.api.php');

use config\QNLib;
use easyobject\orm\ObjectManager;
use easyobject\orm\PersistentDataManager;

// announce script and fetch parameters values
$params = QNLib::announce(	
	array(	
    'description'	=>	"Converts an answer to a comment",
    'params' 		=>	array(                                         
                        'answer_id' => array(
                                            'description'   => 'Identifier of the answer to be converted',
                                            'type'          => 'integer',
                                            'required'      => true
                                            )
                        )
    )
);


list($result, $error_message_ids) = [[], []];

list($object_class, $object_id) = ['resiexchange\Answer', $params['answer_id']];

// force silent mode (debug output would corrupt json data)
set_silent(true);

try {
    $pdm = &PersistentDataManager::getInstance();
    $om = &ObjectManager::getInstance();    
    $db = $om->getDBHandler();   

    // retrieve current user identifier
    $user_id = ResiAPI::userId();
    if($user_id <= 0) throw new Exception("user_unidentified", QN_ERROR_NOT_ALLOWED);
        
    // read user data
    $res = $om->read('resiway\User', $user_id, ['reputation', 'role']);        
    if($res < 0 || !isset($res[$user_id])) throw new Exception("action_failed", QN_ERROR_UNKNOWN);  
    $user_data = $res[$user_id];
    
    // action is only granted to admin users
    if($user_data['role'] != 'a') throw new Exception("user_not_amin", QN_ERROR_NOT_ALLOWED);
        
    // retrouver la réponse
    $res = $om->read($object_class, $object_id, ['question_id', 'content', 'creator']);   
    if($res < 0 || !isset($res[$object_id])) throw new Exception("action_failed", QN_ERROR_UNKNOWN_OBJECT);   
    $object = $res[$object_id];
    
    // 1) remove logs
    $actionlog_ids = $om->search('resiway\ActionLog', [
                    ['object_class', '=', $object_class],
                    ['action_id', '=', ResiAPI::actionId('resiexchange_answer_post')], 
                    ['user_id', '=', $object['creator']],
                    ['object_id', '=', $object_id]
                   ]);
    $db->sendQuery("DELETE FROM resiway_actionlog WHERE id in ('".implode("','", $actionlog_ids)."');");


    $actionlog_ids = $om->search('resiway\ActionLog', [
                    ['object_class', '=', 'resiexchange\Question'], 
                    ['action_id', '=', ResiAPI::actionId('resiexchange_question_answer')],
                    ['user_id', '=', $object['creator']],
                    ['object_id', '=', $object['question_id']]
                   ]);
    $db->sendQuery("DELETE FROM resiway_actionlog WHERE id in ('".implode("','", $actionlog_ids)."');");
    
    
    // 2) remove from index
        // noop
    
    // 3) udate the question's answers count
    
    // update question count_answers
    $question = $om->read('resiexchange\Question', $object['question_id'], ['count_answers'])[$object['question_id']];       
    $om->write('resiexchange\Question', $object['question_id'], [
        'count_answers' => $question['count_answers']+1
    ]);
    
    // update global counter
    ResiAPI::repositoryDec('resiexchange.count_answers');    
    
    
    // 4) remove the answer
    $db->sendQuery("DELETE FROM resiexchange_answer WHERE id = {$object_id};");
    
    
    // 5) create a new comment with answer data
    $_REQUEST['question_id'] = $object['question_id'];    
    $_REQUEST['content'] = $object['content'];
    
    // log as the author
    $pdm->set('user_id', $object['creator']);

    function get_include_contents($filename) {
        ob_start();	
        include($filename); // assuming  parameters required by the script being called are present in the current URL 
        return ob_get_clean();
    }
    
    $json = json_decode(get_include_contents("packages/resiexchange/actions/question/comment.php"), true);
    $result = $json['result'];
    
    // restore user id
    $pdm->set('user_id', $user_id);    
}
catch(Exception $e) {
    $result = $e->getCode();
    $error_message_ids = array($e->getMessage());    
}

// send json result
header('Content-type: application/json; charset=UTF-8');
echo json_encode([
        'result'            => $result, 
        'error_message_ids' => $error_message_ids
    ], 
    JSON_PRETTY_PRINT);