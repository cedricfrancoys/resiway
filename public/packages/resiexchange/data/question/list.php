<?php
// Dispatcher (index.php) is in charge of setting the context and should include easyObject library
defined('__QN_LIB') or die(__FILE__.' cannot be executed directly.');
require_once('../resi.api.php');

use config\QNLib;
use easyobject\orm\ObjectManager;
use qinoa\text\TextTransformer;

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
                        'q'		    => array(
                                            'description'   => 'Token to search among the questions',
                                            'type'          => 'string',
                                            'default'       => ''
                                            ),
                        'domain'	=> array(
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
                                            'description'   => 'Channel for which questions are requested (default, help, meta, ...)',
                                            'type'          => 'integer',
                                            'default'       => 1
                                            ),
                        'api'	    => array(
                                            'description'   => 'Flag for API requests',
                                            'type'          => 'boolean',
                                            'default'       => false
                                            )                                            
                        )
	)
);




list($result, $error_message_ids, $total) = [[], [], $params['total']];

try {
    
    $om = &ObjectManager::getInstance();

    // 0) retrieve matching questions identifiers

    // build domain   
    if(strlen($params['q']) > 0) {
        // clear domain
        $params['domain'] = [];
        // adapt domain to restrict results to given channel
        $params['domain'][] = ['channel_id','=', $params['channel']];        
        
        $indexes_ids = resiway\Index::searchByQuery($om, $params['q']);        
        $questions_ids = $om->search('resiexchange\Question', ['indexes_ids', 'contains', $indexes_ids]);
               
        if(count($questions_ids) > 0) {
            $params['domain'][] = ['id','in', $questions_ids];
        }
        else $params['domain'][] = ['id','=', -1];        
    }
    else {
        $params['domain'] = QNLib::domain_normalize($params['domain']);
        if(!QNLib::domain_check($params['domain'])) $params['domain'] = [];
        
        // adapt domain to restrict results to given channel
        $params['domain'] = QNLib::domain_condition_add($params['domain'], ['channel_id','=', $params['channel']]);

// we shouldn't request questions by categories using the domain, but rather use a specific syntax for the query
// quick and dirty workaround for including sub-categories: 
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
        $ids = $om->search('resiexchange\Question', $params['domain'], $params['order'], $params['sort']);
        if($ids < 0) throw new Exception("request_failed", QN_ERROR_UNKNOWN);
        $params['total'] = count($ids);
		$questions_ids = array_slice($ids, $params['start'], $params['limit']);
    }
    else {
        $questions_ids = $om->search('resiexchange\Question', $params['domain'], $params['order'], $params['sort'], $params['start'], $params['limit']);
        if($questions_ids < 0) throw new Exception("request_failed", QN_ERROR_UNKNOWN);
    }
    
    if(!empty($questions_ids)) {
        // retrieve questions
        $res = $om->read('resiexchange\Question', $questions_ids, ['creator', 'created', 'title', 'title_url', 'content_excerpt', 'score', 'count_views', 'count_votes', 'count_answers', 'categories_ids']);
        if($res < 0 || !count($res)) throw new Exception("request_failed", QN_ERROR_UNKNOWN);

        $authors_ids = [];
        $categories_ids = [];
        $questions = [];
        foreach($res as $question_id => $question_data) {
            
            // remember creators ids for each question
            $authors_ids = array_merge($authors_ids, (array) $question_data['creator']); 
            $categories_ids = array_merge($categories_ids, (array) $question_data['categories_ids']);         
            
            $questions[$question_id] = array(
                                        'id'                => $question_id,
                                        'title'             => $question_data['title'],                                    
                                        'title_url'         => $question_data['title_url'],
                                        'content_excerpt'   => $question_data['content_excerpt'],
                                        'created'           => $question_data['created'],
                                        'score'             => $question_data['score'],                                        
                                        'count_views'       => $question_data['count_views'],
                                        'count_votes'       => $question_data['count_votes'],
                                        'count_answers'     => $question_data['count_answers']
                                       );
        }    
        
        // retreive authors data
        $questions_authors = $om->read('resiway\User', $authors_ids, ResiAPI::userPublicFields());        
        if($questions_authors < 0) throw new Exception("request_failed", QN_ERROR_UNKNOWN);   

        foreach($res as $question_id => $question_data) {
            $author_id = $question_data['creator'];
            if(isset($questions_authors[$author_id])) {
                $questions[$question_id]['creator'] = $questions_authors[$author_id];
            }
            else unset($res[$question_id]);
        }
       
        // retrieve categories
        $questions_categories = $om->read('resiway\Category', $categories_ids, ['title', 'path', 'parent_path', 'description']);        
        if($questions_categories < 0) throw new Exception("request_failed", QN_ERROR_UNKNOWN);     

        foreach($res as $question_id => $question_data) {
            $questions[$question_id]['categories'] = [];
            foreach($question_data['categories_ids'] as $category_id) {
                $category_data = $questions_categories[$category_id];
                $questions[$question_id]['categories'][] = array(
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
                    'total'             => $params['total'],                     
                    'error_message_ids' => $error_message_ids
                 ], 
                 JSON_PRETTY_PRINT);