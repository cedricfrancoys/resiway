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
$params = QNLib::announce([
    'description'	=>	"Registers a question as favorite for current user",
    'params' 		=>	[
        'question_id'	=> array(
                            'description'   => 'Identifier of the question the answer refers to.',
                            'type'          => 'integer', 
                            'required'      => true
                            ),
        'content'	    => array(
                            'description'   => 'Content of the subitted question.',
                            'type'          => 'string', 
                            'required'      => true
                            )
    ]
]);

list($result, $error_message_ids, $notifications) = [true, [], []];

list($action_name, $object_class, $object_id) = [ 
    'resiexchange_question_answer',                         
    'resiexchange\Question',                                   
    $params['question_id']
];

function purify($html) {
    // clean HTML input html
    // strict cleaning: remove non-standard tags and attributes    
    $config = HTMLPurifierConfig::createDefault();
    $config->set('URI.Base',                'http://www.resiway.gdn/');
    $config->set('URI.MakeAbsolute',        true);                  // make all URLs absolute using the base URL set above
    $config->set('AutoFormat.RemoveEmpty',  true);                  // remove empty elements
    $config->set('HTML.Doctype',            'XHTML 1.0 Strict');    // valid XML output
    $config->set('CSS.AllowedProperties',   []);                    // remove all CSS
    // allow only tags and attributes that might be used by some lightweight markup language 
    $config->set('HTML.AllowedElements',    array('h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'hr', 'pre', 'a', 'img', 'br', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'ul', 'ol', 'li', 'b', 'i', 'code', 'blockquote'));
    $config->set('HTML.AllowedAttributes',  array('a.href', 'img.src'));

    $purifier = new HTMLPurifier($config);    
    return $purifier->purify($html);
}


$params['content'] = purify($params['content']);


try {
    
    // try to perform action
    $result = ResiAPI::performAction(
        $action_name,                                             // $action_name
        $object_class,                                            // $object_class
        $object_id,                                               // $object_id
        [],                                                       // $object_fields
        false,                                                    // $toggle
        null,                                                     // $concurrent_action
        function ($om, $user_id, $object_class, $object_id)       // $do
        use ($params) {    
            // create a new comment + write given value
            $answer_id = $om->create('resiexchange\Answer', [ 
                            'creator'       => $user_id,     
                            'question_id'   => $object_id,
                            'content'       => $params['content']
                          ]);

            if($answer_id <= 0) throw new Exception("action_failed", QN_ERROR_UNKNOWN);

            // read created comment as returned value
            $res = $om->read('resiexchange\Answer', $answer_id, ['creator', 'created', 'content', 'score']);
            if($res > 0) {
                $result = array(
                            'id'        => $answer_id,
                            'creator'   => ResiAPI::loadUser($user_id), 
                            'created'   => ResiAPI::dateISO($res[$answer_id]['created']), 
                            'content'   => $res[$answer_id]['content'], 
                            'score'     => $res[$answer_id]['score'],
                            'comments'  => [],                            
                            'history'   => []
                          );
            }
            else $result = $res;
            return $result;
        },
        null,                                                      // $undo
        [                                                          // $limitations
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
                if($res > 0 && count($res) > RESIEXCHANGE_ANSWERS_DAILY_MAX) {
                    throw new Exception("action_max_reached", QN_ERROR_NOT_ALLOWED);
                }        
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