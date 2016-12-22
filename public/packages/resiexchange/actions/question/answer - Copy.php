<?php
// Dispatcher (index.php) is in charge of setting the context and should include easyObject library
defined('__QN_LIB') or die(__FILE__.' cannot be executed directly.');
require_once('../resi.api.php');

use config\QNLib as QNLib;
use easyobject\orm\ObjectManager as ObjectManager;
use html\HTMLPurifier as HTMLPurifier;
use html\HTMLPurifierConfig as HTMLPurifierConfig;


// force silent mode (debug output would corrupt json data)
set_silent(true);

// announce script and fetch parameters values
$params = QNLib::announce(	
	array(	
    'description'	=>	"Submit a new answer to a question",
    'params' 		=>	array(                                         
                        'question_id'	=> array(
                                            'description'   => 'Identifier of the question the answer refers to.',
                                            'type'          => 'integer', 
                                            'required'      => true
                                            ),
                        'content'       => array(
                                            'description'   => 'Content of the subitted question.',
                                            'type'          => 'string', 
                                            'required'      => true
                                            )
                                            
                        )
	)
);


list($result, $error_message_ids) = [true, []];

list($action_name, $object_class, $object_id) = [
    'resiexchange_question_answer', 
    'resiexchange\Question', 
    $params['question_id']
];


try {
   
    $om = &ObjectManager::getInstance();

    // 0) retrieve parameters
    $user_id = ResiAPI::userId();
    if($user_id <= 0) throw new Exception("user_unidentified", QN_ERROR_NOT_ALLOWED);
    
    $action_id = ResiAPI::actionId($action_name);
    if($action_id <= 0) throw new Exception("action_unknown", QN_ERROR_INVALID_PARAM);
    
	// strict cleaning: remove non-standard tags and attributes    
    $config = HtmlPurifierConfig::createDefault();
    $config->set('URI.Base',                'http://www.resiway.gdn/');
    $config->set('URI.MakeAbsolute',        true);             // make all URLs absolute using the base URL set above
    $config->set('AutoFormat.RemoveEmpty',  true);       // remove empty elements
    $config->set('HTML.Doctype',            'XHTML 1.0 Strict');   // valid XML output (?)
    $config->set('CSS.AllowedProperties',   []);     // remove all CSS
// allow only tags and attributes that might be used by some lightweight markup language 
    $config->set('HTML.AllowedElements',    array('h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'hr', 'pre', 'a', 'img', 'br', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'ul', 'ol', 'li', 'b', 'i', 'code', 'blockquote'));
    $config->set('HTML.AllowedAttributes',  array('a.href', 'img.src'));

    $purifier = new HTMLPurifier($config);
    $content = $purifier->purify($content);
    
    
    // 1) check rights
    
    // normally any user is allowed to submit new questions
    // the only exception is when a user has been suspended because of repeatedly flagged activity
    if(!ResiAPI::isActionAllowed($user_id, $action_id)) {
        throw new Exception("user_reputation_insufficient", QN_ERROR_NOT_ALLOWED);  
    }
    
    // 2) action limitations
    // user can submit only one answer for a given question
    if(ResiAPI::isActionRegistered($user_id, $action_id, $object_class, $object_id)) {
        // throw new Exception("action_already_performed", QN_ERROR_NOT_ALLOWED);  
    }    
    // in addition, a daily maximum of submission might be set 
    $res = $om->search('resiway\ActionLog', [
                ['user_id',     '=',  $user_id], 
                ['action_id',   '=',  $action_id], 
                ['object_class','=',  $object_class], 
                ['created',     '>=', date("Y-m-d")]
           ]);
           
    if($res > 0) $count = count($res);
    else $count = 0;   

    if($count > RESIEXCHANGE_ANSWERS_DAILY_MAX) {
        throw new Exception("action_max_reached", QN_ERROR_NOT_ALLOWED);
    }        

    // create new question    
    $answer_id = $om->create('resiexchange\Answer', [
                                'creator'    => $user_id, 
                                'question_id'=> $object_id, 
                                'content'    => $content
                            ]);    
    if($answer_id <= 0) throw new Exception("action_failed", QN_ERROR_UNKNOWN);

    // read created answer as returned value
    $res = $om->read('resiexchange\Answer', $answer_id, ['creator', 'created', 'content', 'score']);
    if($res > 0) {
        $result = array(
                            'id'        => $answer_id,
                            'creator'   => ResiAPI::loadUser($user_id), 
                            'created'   => ResiAPI::dateISO($res[$answer_id]['created']), 
                            'content'   => $res[$answer_id]['content'], 
                            'score'     => $res[$answer_id]['score']
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