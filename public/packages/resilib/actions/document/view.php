<?php
/* view.php - resilib_document_view controller

    This file is part of the ResiSuite program <http://www.github.com/cedricfrancoys/resiway>
    Copyright (C) Cedric Francoys, 2017, Yegen
    Some Rights Reserved, GNU GPL 3 license <http://www.gnu.org/licenses/>
*/


// Dispatcher (index.php) is in charge of setting the context and should include easyObject library
defined('__QN_LIB') or die(__FILE__.' cannot be executed directly.');
require_once('../resi.api.php');

use config\QNLib as QNLib;
use easyobject\orm\ObjectManager as ObjectManager;

// force silent mode (debug output would corrupt json data)
set_silent(true);

// announce script and fetch parameters values
$params = QNLib::announce([
    'description'	=>	"Registers a view on a document",
    'params' 		=>	[                                        
        'document_id'	=> [
            'description'   => 'Identifier of the document the user is viewing.',
            'type'          => 'integer', 
            'required'      => true
        ]
    ]
]);


list($result, $error_message_ids, $notifications) = [true, [], []];

list($action_name, $object_class, $object_id) = [ 
    'resilib_document_view',                         
    'resilib\Document',                                   
    $params['document_id']
];

try {
    // try to perform action
    $result = ResiAPI::performAction(
        $action_name,                                               // $action_name
        $object_class,                                              // $object_class
        $object_id,                                                 // $object_id
        ['count_views'],                                            // $object_fields
        false,                                                      // $toggle
        function ($om, $user_id, $object_class, $object_id) {       // $do 
            // read document values
            $object = $om->read($object_class, $object_id, ['count_views'])[$object_id];
            // update document downloads count
            $om->write($object_class, $object_id, [
                        'count_views' => $object['count_views']+1
                      ]);          
            return true;
        },
        function ($om, $user_id, $object_class, $object_id) {       // $undo       
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