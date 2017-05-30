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
    'description'	=>	"Returns a list of documents objects matching the received criteria",
    'params' 		=>	array(                                         
                        'domain'		=> array(
                                            'description'   => 'Criterias that results have to match (serie of conjunctions)',
                                            'type'          => 'array',
                                            'default'       => []
                                            ),
                        'order'		=> array(
                                            'description'   => 'Column to use for sorting results.',
                                            'type'          => 'string',
                                            'default'       => 'id'
                                            ),
                        'sort'		=> array(
                                            'description'   => 'The direction  (i.e. \'asc\' or \'desc\').',
                                            'type'          => 'string',
                                            'default'       => 'desc'
                                            ),
                        'start'		=> array(
                                            'description'   => 'The row from which results have to start.',
                                            'type'          => 'integer',
                                            'default'       => 0
                                            ),
                        'limit'		=> array(
                                            'description'   => 'The maximum number of results.',
                                            'type'          => 'integer',
                                            'min'           => 5,
                                            'max'           => 100,
                                            'default'       => 25
                                            ),
                        'total'		=> array(
                                            'description'   => 'Total of record (if known).',
                                            'type'          => 'integer',
                                            'default'       => -1
                                            )                                              
                        )
	)
);

/*
 @actions   this is a data provider: no change is made to the stored data
 @rights    everyone has read access on these data
 @returns   list of documents matching given criteria
*/


list($result, $error_message_ids, $total) = [[], [], $params['total']];

try {
    
    $om = &ObjectManager::getInstance();

    // 0) retrieve matching documents identifiers
    
    // total is not knwon yet
    if($params['total'] < 0) {        
        $ids = $om->search('resilib\document', $params['domain'], $params['order'], $params['sort']);
        if($ids < 0) throw new Exception("request_failed", QN_ERROR_UNKNOWN);
        $total = count($ids);
		$documents_ids = array_slice($ids, $params['start'], $params['limit']);
    }
    else {
        $documents_ids = $om->search('resilib\document', $params['domain'], $params['order'], $params['sort'], $params['start'], $params['limit']);
        if($documents_ids < 0) throw new Exception("request_failed", QN_ERROR_UNKNOWN);
    }
    
    if(!empty($documents_ids)) {
        // retrieve documents
        $res = $om->read('resilib\document', $documents_ids, ['creator', 'created', 'title', 'title_url', 'author', 'description', 'count_votes', 'categories_ids']);
        if($res < 0 || !count($res)) throw new Exception("request_failed", QN_ERROR_UNKNOWN);

        $authors_ids = [];        
        $tags_ids = [];
        $documents = [];
        foreach($res as $document_id => $document_data) {    
            $authors_ids = array_merge($authors_ids, (array) $document_data['creator']); 
            $tags_ids = array_merge($tags_ids, (array) $document_data['categories_ids']);                 
            $documents[$document_id] = array(
                                        'id'            => $document_id,
                                        'creator'       => $document_data['creator'],
                                        'created'       => $document_data['created'],
                                        'title'         => $document_data['title'],
                                        'title_url'     => $document_data['title_url'],
                                        'author'        => $document_data['author'],
                                        'description'   => $document_data['description'],                                        
                                        'count_votes'   => $document_data['count_votes']
                                       );
        }    

        // retreive authors data
        $documents_authors = $om->read('resiway\User', $authors_ids, ResiAPI::userPublicFields());        
        if($documents_authors < 0) throw new Exception("request_failed", QN_ERROR_UNKNOWN);   

        foreach($res as $document_id => $document_data) {
            $author_id = $document_data['creator'];
            if(isset($documents_authors[$author_id])) {
                $documents[$document_id]['creator'] = $documents_authors[$author_id];
            }
            else unset($res[$document_id]);
        }
               
        // retrieve tags
        $documents_tags = $om->read('resiway\Category', $tags_ids, ['title', 'path', 'parent_path', 'description']);        
        if($documentss_tags < 0) throw new Exception("request_failed", QN_ERROR_UNKNOWN);     

        foreach($res as $document_id => $document_data) {
            $documents[$document_id]['categories'] = [];
            foreach($document_data['categories_ids'] as $tag_id) {
                $tag_data = $documents_tags[$tag_id];
                $documents[$document_id]['categories'][] = array(
                                            'id'            => $tag_id,
                                            'title'         => $tag_data['title'], 
                                            'path'          => $tag_data['path'],
                                            'parent_path'   => $tag_data['parent_path'],
                                            'description'   => $tag_data['description']
                                        );            
            }
        }
        $user_id = ResiAPI::userId();
        if($user_id > 0) {
            // retrieve actions performed by the user on each question
            $documents_history = ResiAPI::retrieveHistory($user_id, 'resilib\Document', array_keys($documents));            
            foreach($res as $document_id => $document_data) {
                $documents[$document_id]['history'] = $documents_history[$document_id];        
            }
        }


        
        $result = array_values($documents);
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
                    'total'             => $total,                     
                    'error_message_ids' => $error_message_ids
                 ], 
                 JSON_PRETTY_PRINT);