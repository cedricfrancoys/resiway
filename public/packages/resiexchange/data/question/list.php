<?php
// Dispatcher (index.php) is in charge of setting the context and should include easyObject library
defined('__QN_LIB') or die(__FILE__.' cannot be executed directly.');
require_once('../resi.api.php');

use config\QNLib as QNLib;
use easyobject\orm\ObjectManager as ObjectManager;
use easyobject\orm\PersistentDataManager as PersistentDataManager;

// force silent mode (debug output would corrupt json data)
set_silent(true);

/*
 @actions   this is a data provider: no change is made to the stored data
 @rights    everyone has read access on these data
 @returns   list of questions matching given criteria
*/

// announce script and fetch parameters values
$params = QNLib::announce(	
	array(	
    'description'	=>	"Returns a list of question objects matching the received criteria",
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




list($result, $error_message_ids, $total) = [[], [], $params['total']];

try {
    
    $om = &ObjectManager::getInstance();

    // 0) retrieve matching questions identifiers

    // if a channel has been specified in current session, adapt domain to restrict results
    $pdm = &PersistentDataManager::getInstance();
    $channel = $pdm->get('channel', 1);
    $params['domain'][] = ['channel_id','=',$channel];
    
    // total is not knwon yet
    if($params['total'] < 0) {        
        $ids = $om->search('resiexchange\Question', $params['domain'], $params['order'], $params['sort']);
        if($ids < 0) throw new Exception("request_failed", QN_ERROR_UNKNOWN);
        $total = count($ids);
		$questions_ids = array_slice($ids, $params['start'], $params['limit']);
    }
    else {
        $questions_ids = $om->search('resiexchange\Question', $params['domain'], $params['order'], $params['sort'], $params['start'], $params['limit']);
        if($questions_ids < 0) throw new Exception("request_failed", QN_ERROR_UNKNOWN);
    }
    
    if(!empty($questions_ids)) {
        // retrieve questions
        $res = $om->read('resiexchange\Question', $questions_ids, ['creator', 'created', 'title', 'content_excerpt', 'count_views', 'count_votes', 'count_answers', 'categories_ids']);
        if($res < 0 || !count($res)) throw new Exception("request_failed", QN_ERROR_UNKNOWN);

        $authors_ids = [];
        $tags_ids = [];
        $questions = [];
        foreach($res as $question_id => $question_data) {
            // remember creators ids for each question
            $authors_ids = array_merge($authors_ids, (array) $question_data['creator']); 
            $tags_ids = array_merge($tags_ids, (array) $question_data['categories_ids']);         
            
            $questions[$question_id] = array(
                                        'id'            => $question_id,
                                        'title'         => $question_data['title'],                                    
                                        'content'       => $question_data['content_excerpt'],
                                        'created'       => $question_data['created'],
                                        'count_views'   => $question_data['count_views'],
                                        'count_votes'   => $question_data['count_votes'],
                                        'count_answers' => $question_data['count_answers']
                                       );
        }    
        
        // retreive authors data
        $questions_authors = $om->read('resiway\User', $authors_ids, ResiAPI::userPublicFields());        
        if($questions_authors < 0) throw new Exception("request_failed", QN_ERROR_UNKNOWN);   

        foreach($res as $question_id => $question_data) {
            $author_id = $question_data['creator'];
            $questions[$question_id]['creator'] = $questions_authors[$author_id];
        }
       
        // retrieve tags
        $questions_tags = $om->read('resiway\Category', $tags_ids, ['title', 'path', 'parent_path', 'description']);        
        if($questions_tags < 0) throw new Exception("request_failed", QN_ERROR_UNKNOWN);     

        foreach($res as $question_id => $question_data) {
            $questions[$question_id]['tags'] = [];
            foreach($question_data['categories_ids'] as $tag_id) {
                $tag_data = $questions_tags[$tag_id];
                $questions[$question_id]['tags'][] = array(
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
            $questions_history = ResiAPI::retrieveHistory($user_id, 'resiexchange\Question', array_keys($questions));            
            foreach($res as $question_id => $question_data) {
                $questions[$question_id]['history'] = $questions_history[$question_id];        
            }
        }            
        $result = array_values($questions);
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