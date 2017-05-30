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
    'description'	=>	"Returns a fully loaded document object",
    'params' 		=>	array(                                         
                        'id'    => array(
                                    'description'   => 'Identifier of the document to retrieve.',
                                    'type'          => 'integer', 
                                    'required'      => true
                                    ),                                            
                        )
	)
);


list($object_class, $object_id) = ['resilib\Document', $params['id']];

list($result, $error_message_ids) = [true, []];

try {
    
    $om = &ObjectManager::getInstance();
    
    // 0) retrieve parameters
    $user_id = ResiAPI::userId();
    if($user_id < 0) throw new Exception("request_failed", QN_ERROR_UNKNOWN);
    
    
    // 1) check rights  
    // everyone has read access over all documents
    
    // 2) action limitations
    // no limitation    
    // no concurrent action   

    // retrieve document
    $result = [];
    $res = $om->read($object_class, $object_id, ['id', 'creator', 'created', 'editor', 'edited', 'modified', 'last_update', 'title', 'title_url', 'description', 'author', 'pages', 'original_filename', 'count_stars', 'count_views', 'count_votes', 'score', 'categories_ids', 'comments_ids']);    
    
    if($res < 0 || !isset($res[$object_id])) throw new Exception("document_unknown", QN_ERROR_INVALID_PARAM);
    $document_data = $res[$object_id];

    $result = $document_data;
    
    // retreive author data
    $author_data = ResiAPI::loadUserPublic($document_data['creator']);
    if($author_data < 0) throw new Exception("document_author_unknown", QN_ERROR_UNKNOWN_OBJECT);
    $result['creator'] = $author_data;
    
    // retrieve editor data
    if($document_data['editor'] > 0) {
        $editor_data = ResiAPI::loadUserPublic($document_data['editor']);
        if($editor_data < 0) throw new Exception("document_editor_unknown", QN_ERROR_UNKNOWN_OBJECT);        
        $result['editor'] = $editor_data;
    }    

    // retrieve actions performed by the user on this question
    $document_history = ResiAPI::retrieveHistory($user_id, $object_class, $object_id);
    $result['history'] = $document_history[$object_id];

    
    if($user_id > 0 && !isset($result['history']['resilib_document_view'])) {
        // update question's count_views 
        $om->write($object_class, $object_id, [ 'count_views' => $document_data['count_views']+1 ]);
        // add question view to user history
        ResiAPI::registerAction($user_id, 'resilib_document_view', 'resilib\Document', $object_id);  
    }
    
    // retrieve tags
    $result['categories'] = [];
    $res = $om->read('resiway\Category', $document_data['categories_ids'], ['title', 'description', 'path', 'parent_path']);        
    if($res > 0) {
        $categories = [];
        foreach($res as $cat_id => $cat_data) {           
            $categories[$cat_id] = array(
                                        'id'            => $cat_id,
                                        'title'         => $cat_data['title'], 
                                        'description'   => $cat_data['description'],                                         
                                        'path'          => $cat_data['path'],
                                        'parent_path'   => $cat_data['parent_path']
                                    );
        }      
        
        // asign resulting array to returned value
        $result['categories'] = array_values($categories);
    }

    // retrieve comments
    // output JSON type has to be Array
    $result['comments'] = [];
    $res = $om->read('resilib\DocumentComment', $document_data['comments_ids'], ['creator', 'created', 'content', 'score']);        
    if($res > 0) {
        // memorize comments authors identifiers for later load
        $comments_authors_ids = [];
        $comments = [];
        foreach($res as $comment_id => $comment_data) {
            $comments_authors_ids[] = $comment_data['creator'];
            $comments[$comment_id] = array(
                                        'id'        => $comment_id,
                                        'created'   => $comment_data['created'], 
                                        'content'   => $comment_data['content'], 
                                        'score'     => $comment_data['score']
                                    );
        }
        
        // retrieve comments authors
        $comments_authors = $om->read('resiway\User', $comments_authors_ids, ResiAPI::userPublicFields());        
        if($comments_authors > 0) {
            foreach($res as $comment_id => $comment_data) {
                $author_id = $comment_data['creator'];
                $comments[$comment_id]['creator'] = $comments_authors[$author_id];
            }
        }
        
        // retrieve actions performed by the user on these comments
        $comments_history = ResiAPI::retrieveHistory($user_id, 'resilib\DocumentComment', $document_data['comments_ids']);
        foreach($comments_history as $comment_id => $history) {
            $comments[$comment_id]['history'] = $history;
        }        
        
        // asign resulting array to returned value
        $result['comments'] = array_values($comments);
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