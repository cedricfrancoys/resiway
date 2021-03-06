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
    'description'	=>	"Delete a document",
    'params' 		=>	[
        'document_id'	=> [
            'description'   => 'Identifier of the document to delete.',
            'type'          => 'integer', 
            'required'      => true
        ]
    ]
]);

list($result, $error_message_ids, $notifications) = [true, [], []];

list($action_name, $object_class, $object_id) = [ 
    'resilib_document_delete',                         
    'resilib\Document',                                   
    $params['document_id']
];

try {
    
    // try to perform action
    $result = ResiAPI::performAction(
        $action_name,                                               // $action_name
        $object_class,                                              // $object_class
        $object_id,                                                 // $object_id
        ['creator', 'deleted', 'categories_ids'],                   // $object_fields
        true,                                                       // $toggle
        function ($om, $user_id, $object_class, $object_id) {       // $do
            // undo related action
            ResiAPI::unregisterAction($user_id, 'resilib_document_post', $object_class, $object_id);
            // update deletion status
            $om->write($object_class, $object_id, [
                        'deleted' => 1
                      ]);
            // update categories and authors count_documents
            $object = $om->read($object_class, $object_id, ['categories_ids', 'pages', 'authors_ids'])[$object_id];
            $om->write('resiway\Category', $object['categories_ids'], ['count_documents' => null]);
            $om->write('resiway\Author', $object['authors_ids'], ['count_pages' => null]);

            // update global documents-counter
            ResiAPI::repositoryDec('resilib.count_documents');            
            ResiAPI::repositoryDec('resilib.count_pages', $object['pages']);
            
            return true;
        },
        function ($om, $user_id, $object_class, $object_id) {       // $undo
            // perform related action
            ResiAPI::registerAction($user_id, 'resilib_document_post', $object_class, $object_id);
            // update deletion status
            $om->write($object_class, $object_id, [
                        'deleted' => 0
                      ]);            
            // update categories and documents count_documents
            $object = $om->read($object_class, $object_id, ['categories_ids', 'pages', 'authors_ids'])[$object_id];
            $om->write('resiway\Category', $object['categories_ids'], ['count_documents' => null]);
            $om->write('resiway\Author', $object['authors_ids'], ['count_pages' => null]);            

            // update global documents-counter
            ResiAPI::repositoryInc('resilib.count_documents');                      
            ResiAPI::repositoryInc('resilib.count_pages', $object['pages']);

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