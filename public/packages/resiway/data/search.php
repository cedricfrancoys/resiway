<?php
// Dispatcher (index.php) is in charge of setting the context and should include easyObject library
defined('__QN_LIB') or die(__FILE__.' cannot be executed directly.');
require_once('../resi.api.php');

use config\QNLib;
use easyobject\orm\ObjectManager;

use resiway\User;
use resiway\Index;

use qinoa\html\HTMLToText;
// force silent mode (debug output would corrupt json data)
set_silent(true);

/*
 @actions   this is a data provider: no change is made to the stored data
 @rights    everyone has read access on these data
 @returns   list of articles matching given criteria
*/

// announce script and fetch parameters values
$params = QNLib::announce(	
	array(	
    'description'	=>	"Returns a list of article objects matching the received criteria",
    'params' 		=>	array(                                         
                        'q'		    => array(
                                            'description'   => 'Token to search among the articles',
                                            'type'          => 'string',
                                            'default'       => ''
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
                                            'default'       => 10
                                            ),
                        'total'		=> array(
                                            'description'   => 'Total of record (if known).',
                                            'type'          => 'integer',
                                            'default'       => -1
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
    $db = $om->getDBHandler();

    // Define target fields and related content to index (have to match schema)
    $batches = [
        'questions_ids'     => ['2' => 'title', '0.1' => 'content', '0.01' => 'answers_ids.content', '0.5' => 'categories_ids.title'],
        'documents_ids'     => ['2' => 'title', '1' => 'authors_ids.name', '0.01' => 'description', '0.5' => 'categories_ids.title'],
        'articles_ids'      => ['2' => 'title', '0.1' => 'content', '0.5' => 'categories.title']        
    ];    
    
    // clear domain
    $params['domain'] = [];
   

    if(strlen($params['q']) > 0) {

        $objects = [];
        
        // determine cache filename
        $cache_filename = '../cache/index/'.md5(serialize(Index::normalizeQuery($params['q'])));

        // if request is cached, deliver result from cache
        if(file_exists($cache_filename)) {
            $content = file_get_contents($cache_filename);
            $result = unserialize($content);
        }
        // generate the result
        else {
            // look for matching indexes, if any
            $indexes_ids = Index::searchByQuery($om, $params['q']);
            
            if(count($indexes_ids)) {
            
                $schema = $om->getObjectSchema('resiway\Index');
                
                foreach($batches as $index_field => $object_fields) {
                    // object_class used here are expected to have 'indexes_ids' and 'indexed' fields
                    $object_class = $schema[$index_field]['foreign_object'];
                    $object_table = $schema[$index_field]['rel_table'];
                    $object_field = $schema[$index_field]['rel_foreign_key'];
                    
                    // intersection query
                    $query =   "SELECT $object_field,
                                SUM(CASE ".PHP_EOL;
                    foreach($object_fields as $weight => $field) {
                        $weight = floatval($weight);
                        $query .= "    WHEN field='$field' THEN (count*$weight)".PHP_EOL;
                    }
                    
                    $query .=  "    ELSE 0 END) as score
                                FROM $object_table
                                WHERE
                                index_id in (".implode(',', $indexes_ids).")".PHP_EOL;
                    foreach($indexes_ids as $index_id) {    
                        $query.= "AND $object_field in (SELECT DISTINCT $object_field from $object_table where index_id = {$index_id}) ".PHP_EOL;
                    }

                    $query .=  "GROUP BY $object_field  
                                ORDER BY `score` DESC
                                LIMIT 0, {$params['limit']}".PHP_EOL;
                                
                    $res = $db->sendQuery($query);
                    
                    if($db->getAffectedRows() <= 0) {
                        // union query
                        $query =   "SELECT $object_field, 
                                SUM(CASE ".PHP_EOL;
                        foreach($object_fields as $weight => $field) {
                            $weight = floatval($weight);
                            $query .= "    WHEN field='$field' THEN (count*$weight)".PHP_EOL;
                        }
                        
                        $query .=  "    ELSE 0 END) as score
                                    FROM $object_table
                                    WHERE
                                    (index_id in (".implode(',', $indexes_ids)."))
                                    GROUP BY $object_field  
                                    ORDER BY `score` DESC
                                    LIMIT 0, {$params['limit']}";
                        $res = $db->sendQuery($query);                    
                    }
                    
                    $objects[$object_class] = [];
                    while ($row = $db->fetchArray($res)) {
                        $objects[$object_class][$row[$object_field]] = $row['score'];
                    }

                }               

                // load objects values
                $items = [];
                foreach($batches as $index_field => $object_fields) {
                    $object_class = $schema[$index_field]['foreign_object'];
                            
                    $objects_scores = $objects[$object_class];
                                        
                    $res = $om->read($object_class, array_keys($objects_scores), ['title', 'title_url', 'content_excerpt', 'count_views', 'score', 'creator' => User::getPublicFields(), 'categories' => ['id', 'title', 'title_url', 'path'] ]);
                    if($res > 0 && count($res)) {
                        foreach($objects_scores as $object_id => $score) {
                            if(!isset($items[$score])) $items[$score] = [];
                            $pseudo_type = strtolower(explode('\\', $object_class)[1]);
                            $items[$score][] = [
                                'id'            => $object_id, 
                                'title'         => $res[$object_id]['title'], 
                                'type'          => $pseudo_type,
                                'url'           => $pseudo_type.'/'.$object_id.'/'.$res[$object_id]['title_url'],
                                'description'   => $res[$object_id]['content_excerpt'],
                                'count_views'   => $res[$object_id]['count_views'], 
                                'score'         => $res[$object_id]['score'],
                                'creator'       => $res[$object_id]['creator'],
                                'categories'    => array_values($res[$object_id]['categories'])
                            ];
                        }            
                    }
                }
                
                // order results by score
                krsort($items);
                foreach($items as $score => $slice) {
                    $result = array_merge($result, $slice);
                }
                // limit result set
                $result = array_slice($result, 0, $params['limit']);
                // cache search result
                if(!is_dir(dirname($cache_filename))) mkdir(dirname($cache_filename), 0777, true);
                file_put_contents($cache_filename, serialize($result));            
            }
        }
    }
    
    // update total (results count)
    $params['total'] = count($result);
}
catch(Exception $e) {
    $result = $e->getCode();
    $error_message_ids = array($e->getMessage());
}

// announce UTF-8 encoded JSON
header('Content-type: application/json; charset=UTF-8');
// allow CORS
header('Access-Control-Allow-Origin: *');
// output json result
echo json_encode([
    'result'            => $result,
    'total'             => $params['total'],
    'error_message_ids' => $error_message_ids
], JSON_PRETTY_PRINT);