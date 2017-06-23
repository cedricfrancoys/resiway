<?php
// Dispatcher (index.php) is in charge of setting the context and should include easyObject library
defined('__QN_LIB') or die(__FILE__.' cannot be executed directly.');
require_once('../resi.api.php');

use config\QNLib as QNLib;
use html\HTMLPurifier as HTMLPurifier;
use easyobject\orm\DataAdapter as DataAdapter;

// force silent mode (debug output would corrupt json data)
set_silent(true);

// announce script and fetch parameters values
$params = QNLib::announce([
    'description'	=>	"Edit an author profile",
    'params' 		=>	[
        'id'	        => array(
                            'description'   => 'Identifier of the author being edited.',
                            'type'          => 'integer', 
                            'default'       => 0
                            ),    
        'name'	        => array(
                            'description'   => 'Author name.',
                            'type'          => 'string', 
                            'required'      => true
                            ),
        'description'   => array(
                            'description'   => 'Author short description.',
                            'type'          => 'string',
                            'default'       => ''
                            )

    ]
]);


list($result, $error_message_ids, $notifications) = [true, [], []];

list($action_name, $object_class, $object_id) = [ 
    'resiway_author_edit',
    'resiway\Author',
    $params['id']
];

// override ORM method for cleaning HTML (for field 'content')
DataAdapter::setMethod('ui', 'orm', 'html', function($value) {
    $purifier = new HTMLPurifier(ResiAPI::getHTMLPurifierConfig());    
    return $purifier->purify($value);
});

try {
// try to perform action
    $result = ResiAPI::performAction(
        $action_name,                                             // $action_name
        $object_class,                                            // $object_class
        $object_id,                                               // $object_id
        [                                                         // $object_fields  
        'name', 'name_url', 'description'
        ],                                                       
        false,                                                    // $toggle
        function ($om, $user_id, $object_class, $object_id)       // $do
        use ($params) {
            if($object_id == 0) {            
                // create a new document + write given value
                $object_id = $om->create($object_class, array_merge(['creator' => $user_id], $params));                
                
                if($object_id <= 0) throw new Exception("action_failed", QN_ERROR_UNKNOWN);                
            }
            else {                
                $om->write($object_class, $object_id, [
                                'name'                 => $params['name'], 
                                'description'          => $params['description']
                           ]);
            }
            // read updated author as returned value
            $res = $om->read($object_class, $object_id, ['id', 'name', 'name_url', 'description']);
            return $res[$object_id];
        },
        null,                                                      // $undo
        [                                                          // $limitations
            function ($om, $user_id, $action_id, $object_class, $object_id) 
            use ($params) {
                $errors = $om->validate($object_class, $params);
                if(count($errors)) throw new Exception("author_invalid_".array_keys($errors)[0], QN_ERROR_INVALID_PARAM);
            }
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