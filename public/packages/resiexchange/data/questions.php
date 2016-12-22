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
    'description'	=>	"Returns a list of question objects matching the received criteria",
    'params' 		=>	array(                                         
                        'domain'		=> array(
                                            'description' => 'The domain holds the criteria that results have to match (serie of conjunctions)',
                                            'type' => 'array',
                                            'default' => []
                                            ),
                        'order'		=> array(
                                            'description' => 'Column to use for sorting results.',
                                            'type' => 'string',
                                            'default' => 'id'
                                            ),
                        'sort'		=> array(
                                            'description' => 'The direction  (i.e. \'asc\' or \'desc\').',
                                            'type' => 'string',
                                            'default' => 'desc'
                                            ),
                        'start'		=> array(
                                            'description' => 'The row from which results have to start.',
                                            'type' => 'integer',
                                            'default' => '0'
                                            ),
                        'limit'		=> array(
                                            'description' => 'The maximum number of results.',
                                            'type' => 'integer',
                                            'default' => '0'
                                            )                                      
                        )
	)
);

/*
 @actions   this is a data provider: no change is made to the stored data
 @rights    everyone has read access on these data
 @returns   list of questions matching given criteria
*/


list($result, $error_message_ids) = [true, []];

try {
    
    $om = &ObjectManager::getInstance();

    // 0) retrieve matching questions identifiers
    $questions_ids = $om->search('resiexchange\Question', $params['domain'], $params['order'], $params['sort'], $params['start'], $params['limit']);
    if($questions_ids < 0) throw new Exception("search_invalid", QN_ERROR_INVALID_PARAM);        
    if(empty($questions_ids)) throw new Exception("search_nomatch", QN_ERROR_UNKNOWN_OBJECT);
    
    // retrieve questions   

    $res = $om->read('resiexchange\Question', $questions_ids, ['creator', 'created', 'title', 'content_excerpt', 'count_views', 'count_votes', 'count_answers', 'tags_ids']);
    if($res < 0 || !count($res)) throw new Exception("request_failed", QN_ERROR_UNKNOWN);

    $authors_ids = [];
    $questions = [];
    foreach($res as $question_id => $question_data) {
        // remember creators ids for each question
        $authors_ids = array_merge($authors_ids, (array) $question_data['creator']); 
        
        $questions[$question_id] = array(
                                    'id'            => $question_id,
                                    'title'         => $question_data['title'],                                    
                                    'content'       => $question_data['content_excerpt'],
                                    'created'       => ResiAPI::dateISO($question_data['created']),
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
    $result = array_values($questions);
    
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