<?php
// Dispatcher (index.php) is in charge of setting the context and should include easyObject library
defined('__QN_LIB') or die(__FILE__.' cannot be executed directly.');
require_once('../resi.api.php');

use config\QNLib as QNLib;


// force silent mode (debug output would corrupt json data)
set_silent(true);

// announce script and fetch parameters values
$params = QNLib::announce(	
	array(	
    'description'	=>	"execute all operations required when an action is performed by a user",
    'params' 		=>	array(
                        'action_name'	=> array(
                                            'description' => 'Class of the objets to update.',
                                            'type' => 'string', 
                                            'required'=> true
                                            ),
                        'object_class'	=> array(
                                            'description' => 'Class of the object on which the action is performed',
                                            'type' => 'string',
                                            'default' => null
                                            ),                                            
                        'object_id'	=> array(
                                            'description' => 'List of ids of the objects to browse.',
                                            'type' => 'integer', 
                                            'required'=> true
                                            )
                        )
	)
);


list($action_name, $object_class, $object_id) = [$params['action_name'], $params['object_class'], $params['object_id']];

/**

index.php?do=resiexchange_question_voteup&question_id={}


$result = resiway::perform_action('resiexchange_question_voteup', 'resiexchange\Question', $question_id);
// send json result
header('Content-type: application/json; charset=UTF-8');
echo json_encode($result, JSON_FORCE_OBJECT);

**/
list($result, $error_message_ids) = [true, []];

try {

    // 0) retrieve parameters
    $user_id = ResiAPI::userId();
    if($user_id <= 0) throw new Exception("user_unidentified", QN_ERROR_NOT_ALLOWED);
    
    $action_id = ResiAPI::actionId($action_name);
    if($action_id <= 0) throw new Exception("action_unknown", QN_ERROR_INVALID_PARAM);
    
    // 1) check rights   
    if(!ResiAPI::isAllowed($user_id, $action_id)) {
        throw new Exception("user_reputation_insufficient", QN_ERROR_NOT_ALLOWED);  
    }
    
    // 2) action limitations
    if(ResiAPI::isRegistered($user_id, $action_id, $object_class, $object_id)) {
        throw new Exception("action_already_performed", QN_ERROR_NOT_ALLOWED);  
    }
    else {
        // remove concurrent action from the actionLog
    }
   
    // 3) log action
    ResiAPI::registerAction($user_id, $action_id, $object_class, $object_id);
    
    // 4) update reputation and badges
    ResiAPI::processActionTriggers($user_id, $action_id, $object_class, $object_id);
}
catch(Exception $e) {
    $result = $e->getCode();
    $error_message_ids = array($e->getMessage());
}

// send json result
header('Content-type: application/json; charset=UTF-8');
echo json_encode(['result' => $result, 'error_message_ids' => $error_message_ids], JSON_FORCE_OBJECT);