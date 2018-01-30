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
    'description'	=>	"Returns a list of log objects matching the received criteria",
    'params' 		=>	array(                                         
                        )
	)
);

/*
 @actions   this is a data provider: no change is made to the stored data
 @rights    everyone has read access on these data
 @returns   list of logs matching given criteria
*/


list($result, $error_message_ids) = [[], []];


try {
    
    $om = &ObjectManager::getInstance();

    // check user permissions (prevent accessing other user datalog)

    $user_id = ResiAPI::userId();
    if($user_id < 0) throw new Exception("request_failed", QN_ERROR_UNKNOWN);
    
    // retrieve given user data 
    //$user = ResiAPI::loadUserPublic($user_id);


    // 'resiway_user_signup'
    $actions_names = ['resilexi_article_post', 'resiexchange_question_post', 'resilib_document_post', 'resiexchange_answer_post', 'resiexchange_questioncomment_post', 'resiexchange_answercomment_post', 'resilib_documentcomment_post'];
    
    $actions_ids = $om->search('resiway\Action', ['name', 'in', $actions_names]);    
    // 0) retrieve matching logs identifiers    
    
    $logs_ids = $om->search('resiway\ActionLog', ['action_id', 'in', $actions_ids], 'created', 'desc', 0, 10);
    
    
    if(!empty($logs_ids)) {
        // retrieve logs
        $logs = $om->read('resiway\ActionLog', $logs_ids, ['id', 'created', 'user_id', 'author_id', 'action_id', 'action_id.name', 'object_class', 'object_id']);
        if($logs < 0 || !count($logs)) throw new Exception("request_failed", QN_ERROR_UNKNOWN);
            
        foreach($logs as $oid => $odata) {
            $logs[$oid]['user'] = ResiAPI::loadUserPublic($odata['user_id']);
            switch($odata['action_id.name']) {
            case 'resiway_user_signup':
                
                break;
                
            case 'resiexchange_question_post':
                $question_id = $logs[$oid]['object_id'];
                $logs[$oid]['object'] = $om->read($logs[$oid]['object_class'], $question_id, ['id', 'title', 'title_url', 'categories_ids', 'categories_ids.name'])[$question_id];
                break;
                
            case 'resilib_document_post':
                $document_id = $logs[$oid]['object_id'];
                $logs[$oid]['object'] = $om->read($logs[$oid]['object_class'], $document_id, ['id', 'title', 'title_url', 'categories_ids', 'categories_ids.name'])[$document_id];
                break;

            case 'resiexchange_answer_post':
                $answer_id = $logs[$oid]['object_id'];
                $logs[$oid]['object'] = $om->read($logs[$oid]['object_class'], $answer_id, ['id', 'question_id', 'question_id.creator', 'question_id.title', 'question_id.title_url'])[$answer_id];
                $logs[$oid]['object']['question_id.creator'] = ResiAPI::loadUserPublic($logs[$oid]['object']['question_id.creator']);
                break;                

            case 'resiexchange_questioncomment_post':
                $comment_id = $logs[$oid]['object_id'];
                $logs[$oid]['object'] = $om->read('resiexchange\QuestionComment', $comment_id, ['id', 'content', 'question_id', 'question_id.creator', 'question_id.title', 'question_id.title_url'])[$comment_id];
                $logs[$oid]['object']['question_id.creator'] = ResiAPI::loadUserPublic($logs[$oid]['object']['question_id.creator']);
                break;

            case 'resilib_documentcomment_post':
                $comment_id = $logs[$oid]['object_id'];
                $logs[$oid]['object'] = $om->read('resilib\DocumentComment', $comment_id, ['id', 'content', 'document_id', 'document_id.creator', 'document_id.title', 'document_id.title_url'])[$comment_id];
                $logs[$oid]['object']['document_id.creator'] = ResiAPI::loadUserPublic($logs[$oid]['object']['document_id.creator']);
                break;

            case 'resiexchange_answercomment_post':
                $comment_id = $logs[$oid]['object_id'];
                $logs[$oid]['object'] = $om->read('resiexchange\AnswerComment', $comment_id, ['id', 'content', 'answer_id'])[$comment_id];
                $answer_id = $logs[$oid]['object']['answer_id'];
                $logs[$oid]['object']['answer'] = $om->read('resiexchange\Answer', $answer_id, ['id', 'creator', 'question_id', 'question_id.creator', 'question_id.title', 'question_id.title_url'])[$answer_id];
                $logs[$oid]['object']['answer']['creator'] = ResiAPI::loadUserPublic($logs[$oid]['object']['answer']['creator']);
                break;

            case 'resilexi_article_post':
                $article_id = $logs[$oid]['object_id'];
                $logs[$oid]['object'] = $om->read($logs[$oid]['object_class'], $article_id, ['id', 'title', 'title_url', 'categories' => ['id', 'name']])[$article_id];
                break;                
            }
            
        }
        $result = array_values($logs);
    }
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