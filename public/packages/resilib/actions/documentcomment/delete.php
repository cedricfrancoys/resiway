<?php
// Dispatcher (index.php) is in charge of setting the context and should include easyObject library
defined('__QN_LIB') or die(__FILE__.' cannot be executed directly.');
require_once('../resi.api.php');

use config\QNLib as QNLib;


// force silent mode (debug output would corrupt json data)
set_silent(true);

// announce script and fetch parameters values
$params = QNLib::announce([
    'description'	=>	"Deletes a comment from a document",
    'params' 		=>	[
        'comment_id'	=> array(
                            'description'   => 'Identifier of the (document-) comment the user is commenting.',
                            'type'          => 'integer', 
                            'required'      => true
                            )
    ]
]);

list($result, $error_message_ids, $notifications) = [true, [], []];

list($action_name, $object_class, $object_id) = [ 
    'resilib_documentcomment_delete',
    'resilib\DocumentComment',                                   
    $params['comment_id']
];

try {
    
    // try to perform action
    $result = ResiAPI::performAction(
        $action_name,                                               // $action_name
        $object_class,                                              // $object_class
        $object_id,                                                 // $object_id
        ['creator', 'deleted', 'document_id'],                      // $object_fields
        true,                                                       // $toggle
        function ($om, $user_id, $object_class, $object_id) {       // $do
            // retreive related document id
            $objects = $om->read($object_class, $object_id, ['document_id']);            
            // retrieve related action object                      
            $related_object_class = 'resilib\Document';
            $related_object_id = $objects[$object_id]['document_id'];
            // undo related action            
            ResiAPI::unregisterAction($user_id, 'resilib_documentcomment_post', $object_class, $object_id);
            ResiAPI::unregisterAction($user_id, 'resilib_document_comment', $related_object_class, $related_object_id);  
            // update deletion status
            $om->write($object_class, $object_id, [
                        'deleted' => 1
                      ]);

            // update global questions-counter
            ResiAPI::repositoryDec('resilib.count_comments');
            return true;
        },
        function ($om, $user_id, $object_class, $object_id) {       // $undo
            // retreive related document id
            $objects = $om->read($object_class, $object_id, ['document_id']);            
            // retrieve related action object                      
            $related_object_class = 'resilib\Document';
            $related_object_id = $objects[$object_id]['document_id'];
            // perform related action            
            ResiAPI::registerAction($user_id, 'resilib_document_comment', $related_object_class, $related_object_id);  
            ResiAPI::registerAction($user_id, 'resilib_documentcomment_post', $object_class, $object_id);
            // update deletion status
            $om->write($object_class, $object_id, [
                        'deleted' => 0
                      ]);            

            // update global questions-counter
            ResiAPI::repositoryInc('resilib.count_comments');                      
            return false;
        },
        [                                                           // $limitations     
        ]
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
        'error_message_ids' => $error_message_ids
    ], 
    JSON_PRETTY_PRINT);