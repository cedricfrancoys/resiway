<?php
// Dispatcher (index.php) is in charge of setting the context and should include easyObject library
defined('__QN_LIB') or die(__FILE__.' cannot be executed directly.');
require_once('../resi.api.php');

use config\QNLib as QNLib;
use easyobject\orm\ObjectManager as ObjectManager;
use qinoa\text\TextTransformer as TextTransformer;

// force silent mode (debug output would corrupt json data)
set_silent(true);

// announce script and fetch parameters values
$params = QNLib::announce(	
	array(	
    'description'	=>	"Returns a list of documents objects matching the received criteria",
    'params' 		=>	array(
                        'q'		    => array(
                                            'description'   => 'Token to search among the documents',
                                            'type'          => 'string',
                                            'default'       => ''
                                            ),    
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
                                            ),
                        'channel'	=> array(
                                            'description'   => 'Channel for which documents are requested (default, help, meta, ...)',
                                            'type'          => 'integer',
                                            'default'       => 1
                                            ),                                            
                        'api'		=> array(
                                            'description'   => 'API version (for output format)',
                                            'type'          => 'string',
                                            'default'       => null
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


function searchFromIndex($query) {
    $result = [];
    $query = TextTransformer::normalize($query);
    $keywords = explode(' ', $query);
    $hash_list = array_map(function($a) { return TextTransformer::hash(TextTransformer::axiomize($a)); }, $keywords);
    // we have all words related to the document :
    $om = &ObjectManager::getInstance();    
    $db = $om->getDBHandler();    
    // obtain related ids of index entries to add to document (don't mind the collision / false-positive)
	$res = $db->sendQuery("SELECT id FROM resiway_index WHERE hash in ('".implode("','", $hash_list)."');");
    $index_ids = [];
    while($row = $db->fetchArray($res)) {
        $index_ids[] = $row['id'];
    }
    
    if(count($index_ids)) {
        $res = $db->sendQuery("SELECT DISTINCT(document_id) FROM resiway_rel_index_document WHERE index_id in ('".implode("','", $index_ids)."');");
        while($row = $db->fetchArray($res)) {
            $result[] = $row['document_id'];
        }
    }
    return $result;
}


try {
    $om = &ObjectManager::getInstance();

    // 0) retrieve matching documents identifiers

    // build domain   
    if(strlen($params['q']) > 0) {
        // clear domain
        $params['domain'] = [];
        // adapt domain to restrict results to given channel
        $params['domain'][] = ['channel_id','=', $params['channel']];        
        $documents_ids = searchFromIndex($params['q']);
        if(count($documents_ids) > 0) {
            $params['domain'][] = ['id','in', $documents_ids];
        }
        else $params['domain'][] = ['id','=', -1];        
    }
    else {
        $params['domain'] = QNLib::domain_normalize($params['domain']);
        if(!QNLib::domain_check($params['domain'])) $params['domain'] = [];
        
        // adapt domain to restrict results to given channel
        $params['domain'] = QNLib::domain_condition_add($params['domain'], ['channel_id','=', $params['channel']]);

// we shouldn't request documents by categories using the domain, but rather use a specific syntax for the query
// quick and dirty workaround: 
        foreach($params['domain'] as $clause_id => $clause) {
            foreach($clause as $condition_id => $condition) {
                if($condition[0] == 'categories_ids') {
                    $categories_ids = (array) $condition[2];
                    $res = $om->read('resiway\Category', $categories_ids, ['title', 'path', 'parent_path', 'description']);
                    foreach($res as $category) {
                        $sub_categories_ids = $om->search('resiway\Category', ['path', 'like', $category['path'].'%']);
                        $categories_ids = array_merge($categories_ids, $sub_categories_ids);
                    }
                    $params['domain'][$clause_id][$condition_id][2] = array_unique($categories_ids);
                    break 2;
                }
            }
        }
    }

    
    // total is not knwon yet
    if($params['total'] < 0) {        
        $ids = $om->search('resilib\Document', $params['domain'], $params['order'], $params['sort']);
        if($ids < 0) throw new Exception("request_failed", QN_ERROR_UNKNOWN);
        $params['total'] = count($ids);
		$documents_ids = array_slice($ids, $params['start'], $params['limit']);
    }
    else {
        $documents_ids = $om->search('resilib\Document', $params['domain'], $params['order'], $params['sort'], $params['start'], $params['limit']);
        if($documents_ids < 0) throw new Exception("request_failed", QN_ERROR_UNKNOWN);
    }
    
    $documents = [];
    if(!empty($documents_ids)) {
        // retrieve documents
        $res = $om->read('resilib\Document', $documents_ids, ['creator', 'created', 'title', 'title_url', 'authors_ids', 'description', 'original_url', 'content_type', 'score', 'count_views', 'categories_ids']);
        if($res < 0 || !count($res)) throw new Exception("request_failed", QN_ERROR_UNKNOWN);

        $creators_ids = [];        
        $authors_ids = [];
        $categories_ids = [];

        foreach($res as $document_id => $document_data) {    
            $creators_ids = array_merge($creators_ids, (array) $document_data['creator']); 
            $authors_ids = array_merge($authors_ids, (array) $document_data['authors_ids']);                 
            $categories_ids = array_merge($categories_ids, (array) $document_data['categories_ids']);                 
            $documents[$document_id] = array(
                                        'id'            => $document_id,
                                        'creator'       => $document_data['creator'],
                                        'created'       => $document_data['created'],
                                        'title'         => $document_data['title'],
                                        'title_url'     => $document_data['title_url'],
                                        'description'   => $document_data['description'],
                                        'original_url'  => $document_data['original_url'],
                                        'content_type'  => $document_data['content_type'],                                        
                                        'score'         => $document_data['score'],
                                        'count_views'   => $document_data['count_views']
                                       );
        }    

        // retreive creators data
        $documents_creators = $om->read('resiway\User', $creators_ids, ResiAPI::userPublicFields());        
        if($documents_creators < 0) throw new Exception("request_failed", QN_ERROR_UNKNOWN);   

        foreach($res as $document_id => $document_data) {
            $author_id = $document_data['creator'];
            if(isset($documents_creators[$author_id])) {
                $documents[$document_id]['creator'] = $documents_creators[$author_id];
            }
            else unset($res[$document_id]);
        }

        // retrieve authors
        $documents_authors = $om->read('resiway\Author', $authors_ids, ['name', 'name_url', 'description']);        
        if($documents_authors < 0) throw new Exception("request_failed", QN_ERROR_UNKNOWN);     

        foreach($res as $document_id => $document_data) {
            $documents[$document_id]['authors'] = [];
            foreach($document_data['authors_ids'] as $author_id) {
                $author_data = $documents_authors[$author_id];
                $documents[$document_id]['authors'][] = array(
                                            'id'            => $author_id,
                                            'name'          => $author_data['name'], 
                                            'name_url'      => $author_data['name_url'],
                                            'description'   => $author_data['description']
                                        );            
            }
        }
        
        // retrieve categories
        $documents_categories = $om->read('resiway\Category', $categories_ids, ['title', 'path', 'parent_path', 'description']);        
        if($documents_categories < 0) throw new Exception("request_failed", QN_ERROR_UNKNOWN);     

        foreach($res as $document_id => $document_data) {
            $documents[$document_id]['categories'] = [];
            foreach($document_data['categories_ids'] as $category_id) {
                $category_data = $documents_categories[$category_id];
                $documents[$document_id]['categories'][] = array(
                                            'id'            => $category_id,
                                            'title'         => $category_data['title'], 
                                            'path'          => $category_data['path'],
                                            'parent_path'   => $category_data['parent_path'],
                                            'description'   => $category_data['description']
                                        );            
            }
        }
        $user_id = ResiAPI::userId();
        if($user_id > 0) {
            // retrieve actions performed by the user on each document
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
                    'total'             => $params['total'],
                    'error_message_ids' => $error_message_ids
                 ], 
                 JSON_PRETTY_PRINT);