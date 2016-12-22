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
    'description'	=>	"Submit a new question",
    'params' 		=>	array(                                         
                        'title'	        => array(
                                            'description' => 'Title of the submitted question.',
                                            'type' => 'string', 
                                            'required'=> true
                                            ),
                        'content'       => array(
                                            'description' => 'Content of the subitted question.',
                                            'type' => 'string', 
                                            'required'=> true
                                            ),
                        'tags'          => array(
                                            'description' => 'List of tags assigned to the question.',
                                            'type' => 'array'
                                            ),
                                            
                        )
	)
);


list($action_name, $object_class, $title, $content) = ['resiexchange_question_post', 'resiexchange\Question', $params['title'], $params['content']];

list($result, $error_message_ids) = [true, []];


function slugify($value) {
    // remove accentuated chars
    $value = htmlentities($value, ENT_QUOTES, 'UTF-8');
    $value = preg_replace('~&([a-z]{1,2})(acute|cedil|circ|grave|lig|orn|ring|slash|th|tilde|uml);~i', '$1', $value);
    $value = html_entity_decode($value, ENT_QUOTES, 'UTF-8');
    // remove all non-space-alphanum-dash chars
    $value = preg_replace('/[^\s-a-z0-9]/i', '', $value);
    // replace spaces with dashes
    $value = preg_replace('/[\s-]+/', '-', $value);           
    // trim the end of the string
    $value = trim($value, '.-_');
    return strtolower($value);
}

try {
    
    $om = &ObjectManager::getInstance();

    // 0) retrieve parameters
    $user_id = ResiAPI::userId();
    if($user_id <= 0) throw new Exception("user_unidentified", QN_ERROR_NOT_ALLOWED);
    
    $action_id = ResiAPI::actionId($action_name);
    if($action_id <= 0) throw new Exception("action_unknown", QN_ERROR_INVALID_PARAM);
    
    // 1) check rights  
    // normally any user is allowed to submit new questions
    // the only exception is when a user has been suspended because of repeatedly flagged activity
    if(!ResiAPI::isActionAllowed($user_id, $action_id)) {
        throw new Exception("user_reputation_insufficient", QN_ERROR_NOT_ALLOWED);  
    }
    
    // 2) action limitations
    // there is no limit to the number of questions a user can submit
    // however a daily maximum of submission might be set 
    $res = $om->search('resiway\ActionLog', [
                ['user_id',     '=',  $user_id], 
                ['action_id',   '=',  $action_id], 
                ['object_class','=',  $object_class], 
                ['created',     '>=', date("Y-m-d")]
           ]);
    if($res > 0) $count = count($res);
    else $count = 0;   

    if($count > RESIEXCHANGE_QUESTIONS_DAILY_MAX) {
        throw new Exception("action_max_reached", QN_ERROR_NOT_ALLOWED);
    }
    
    // no concurrent action
    
    // create new question     
    $question_id = $om->create($object_class, [
                                'creator'=> $user_id, 
                                'title'=> $title, 
                                'content'=> $content
                            ]);    
    if($question_id <= 0) throw new Exception("action_failed", QN_ERROR_UNKNOWN);
    
    // if everything went well, create a new absolute URL for this question
    // format: /question/{id}/{title}
    $title_slug = slugify($title);
    $url_id = $om->create('core\UrlResolver', ['human_readable_url'=> "/question/{$question_id}/{$title_slug}", 'complete_url'=> "/index.html#/question/{$question_id}"]);    
    $om->write($object_class, $question_id, ['url_id'=> $url_id]);
    
    // 5) update badges
    ResiAPI::updateBadges($user_id, $action_id, $object_class, $question_id);
}
catch(Exception $e) {
    $result = $e->getCode();
    $error_message_ids = array($e->getMessage());
}

// send json result
header('Content-type: application/json; charset=UTF-8');
echo json_encode(['result' => $result, 'error_message_ids' => $error_message_ids], JSON_FORCE_OBJECT);