<?php
// Dispatcher (index.php) is in charge of setting the context and should include easyObject library
defined('__QN_LIB') or die(__FILE__.' cannot be executed directly.');
require_once('../resi.api.php');

use config\QNLib as QNLib;
use easyobject\orm\ObjectManager as ObjectManager;
use easyobject\orm\PersistentDataManager as PersistentDataManager;

// force silent mode (debug output would corrupt json data)
set_silent(true);

// announce script and fetch parameters values
$params = QNLib::announce([
    'description'	=>	"Edit a document or submit a new one",
    'params' 		=>	[
        'id'	            => array(
                                'description'   => 'Identifier of the document being edited (a null identifier means creation of a new document).',
                                'type'          => 'integer', 
                                'default'       => 0
                            ),    
        'title'	            => array(
                                'description'   => 'Title of the submitted document.',
                                'type'          => 'string', 
                                'required'      => true
                            ),
        'author'            => array(
                                'description'   => 'Author of the submitted document.',
                                'type'          => 'string', 
                                'required'      => true
                            ),
        'last_update'		=> array(
                                'description'   => 'Author of the submitted document.',
                                'type'          => 'date',
                                'required'      => true
                            ),
        'original_url'		=> array(
                                'description'   => 'Original location of the submitted document.',
                                'type'          => 'string',
                                'default'       => ''
                            ),
        'description'       => array(
                                'description'   => 'Description of the submitted document.',
                                'type'          => 'string', 
                                'default'       => ''
                            ),
        'license'           => array(
                                'description'   => 'Licence under which is published the submitted document.',
                                'type'          => 'string', 
                                'default'       => 'CC-by-nc-sa' 
                            ),                            
        'lang'              => array(
                                'description'   => 'Language of the submitted document.',
                                'type'          => 'string', 
                                'default'       => 'fr'
                            ),
        'pages'             => array(
                                'description'   => 'Number of pages of the submitted document.',
                                'type'          => 'integer', 
                                'required'       => true
                            ),                                                        
        'content'	        => array(
                                'description'   => 'Content of the submitted document.',
                                'type'          => 'file', 
                                'default'       => []
                            ),
        'thumbnail'	        => array(
                                'description'   => 'Thumbnail picture fot the submitted document.',
                                'type'          => 'file', 
                                'default'       => []
                            ),
                            
        'categories_ids'    => array(
                                'description'   => 'List of tags assigned to the document.',
                                'type'          => 'array',
                                'required'      => true
                            )
    ]
]);


list($result, $error_message_ids, $notifications) = [true, [], []];

list($action_name, $object_class, $object_id) = [ 
    'resilib_document_edit',
    'resilib\Document',
    $params['id']
];



// handle case of new document submission (which has a distinct reputation requirement)
if($object_id == 0) $action_name = 'resilib_document_post';


try {
    
    // reset file fields if no data have been received
    if(empty($params['content']) || !isset($params['content']['tmp_name'])) unset($params['content']);
    if(empty($params['thumbnail']) || !isset($params['thumbnail']['tmp_name'])) unset($params['thumbnail']);    
    
    // try to perform action
    $result = ResiAPI::performAction(
        $action_name,                                             // $action_name
        $object_class,                                            // $object_class
        $object_id,                                               // $object_id
        [],                                                       // $object_fields
        false,                                                    // $toggle
        function ($om, $user_id, $object_class, $object_id)       // $do
        use ($params) {    

            
            // check categories_ids consistency (we might have received a request for new categories)
            foreach($params['categories_ids'] as $key => $value) {
                if(intval($value) == 0 && strlen($value) > 0) {
                    // create a new category + write given value
                    $tag_id = $om->create('resiway\Category', [ 
                                    'creator'           => $user_id,     
                                    'title'             => $value,
                                    'description'       => '',
                                    'parent_id'         => 0
                                  ]);
                    // update entry
                    $params['categories_ids'][$key] = sprintf("+%d", $tag_id);
                }
            }        
            
            if($object_id == 0) {
            
                // create a new document + write given value
                $object_id = $om->create($object_class, array_merge(['creator' => $user_id], $params));

                if($object_id <= 0) throw new Exception("action_failed", QN_ERROR_UNKNOWN);

                // update user count_documents
                $res = $om->read('resiway\User', $user_id, ['count_documents']);
                if($res > 0 && isset($res[$user_id])) {
                    $om->write('resiway\User', $user_id, [ 'count_documents'=> $res[$user_id]['count_documents']+1 ]);
                }

                // update categories count_documents
                $om->write('resiway\Category', $params['categories_ids'], ['count_documents' => null]);
                
                // update global counter
                ResiAPI::repositoryInc('resilib.count_documents');
            }
            else {
                /*
                 note : expected notation of categories_ids involve a sign 
                 '+': relation to be added
                 '-': relation to be removed
                */
                $om->write($object_class, $object_id, array_merge(['editor' => $user_id, 'edited' => date("Y-m-d H:i:s")], $params));

                // update categories count_documents
                $categories_ids = array_map(function($i) { return abs(intval($i)); }, $params['categories_ids']);
                $om->write('resiway\Category', $categories_ids, ['count_documents' => null]);
            }
            
            // read created document as returned value
            $res = $om->read($object_class, $object_id, ['creator', 'created', 'title', 'author', 'description', 'score', 'categories_ids']);
            if($res > 0) {
                $result = array(
                                'id'                => $object_id,
                                'creator'           => ResiAPI::loadUserPublic($user_id), 
                                'created'           => $res[$object_id]['created'], 
                                'title'             => $res[$object_id]['title'],                             
                                'author'            => $res[$object_id]['author'],
                                'description'       => $res[$object_id]['description'],                                 
                                'score'             => $res[$object_id]['score'],
                                'categories_ids'    => $res[$object_id]['categories_ids'],
                                'comments'          => [],                                
                                'history'           => []
                          );
            }
            else $result = $res;            
            return $result;
        },
        null,                                                      // $undo
        [                                                          // $limitations
            function ($om, $user_id, $action_id, $object_class, $object_id) 
            use ($params) {
                if(strlen($params['title']) < RESILIB_DOCUMENT_TITLE_LENGTH_MIN
                || strlen($params['title']) > RESILIB_DOCUMENT_TITLE_LENGTH_MAX) {
                    throw new Exception("document_title_length_invalid", QN_ERROR_INVALID_PARAM); 
                }
                $count_tags = 0;
                foreach($params['categories_ids'] as $tag_id) {
                    if(intval($tag_id) > 0) ++$count_tags;
                    else if(intval($tag_id) == 0 && strlen($tag_id) > 0) ++$count_tags;
                }
                if($count_tags < RESILIB_DOCUMENT_CATEGORIES_COUNT_MIN
                || $count_tags > RESILIB_DOCUMENT_CATEGORIES_COUNT_MAX) {
                    throw new Exception("document_tags_count_invalid", QN_ERROR_INVALID_PARAM); 
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
                if($res > 0 && count($res) > RESILIB_DOCUMENT_DAILY_MAX) {
                    throw new Exception("action_max_reached", QN_ERROR_NOT_ALLOWED);
                }        
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