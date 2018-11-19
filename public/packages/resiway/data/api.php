<?php
// Dispatcher (index.php) is in charge of setting the context and should include easyObject library
defined('__QN_LIB') or die(__FILE__.' cannot be executed directly.');
require_once('../resi.api.php');

use config\QNLib;
use easyobject\orm\ObjectManager;

use resiway\User;
use resiway\Index;

// force silent mode (debug output would corrupt json data)
set_silent(true);

/*
 @actions   this is a data provider: no change is made to the stored data
 @rights    everyone has read access on these data
 @returns   list of objects matching given criteria
*/

// announce script and fetch parameters values
$params = QNLib::announce(	
	array(	
    'description'	=>	"JSON-API interface for querying objects matching given criteria",
    'params' 		=>	array(
                        'class'	    => array(
                                            'description'   => 'Pseudo class of the object to retrieve (article, document, question, answer, category, user).',
                                            'type'          => 'string', 
                                            'required'      => true
                                            ),
                        'domain'	=> array(
                                            'description'   => 'Search domain.',
                                            'type'          => 'array',
                                            'default'       => []
                                            ),                                            
                        'q'		    => array(
                                            'description'   => 'Token to search among the objects',
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

list($object_pseudo_class) = [$params['class']];


try {    
    $om = &ObjectManager::getInstance();

    // resolve object class
    $object_class = ResiAPI::resolvePseudoClass($object_pseudo_class);
    if(!$object_class) throw new Exception('unknown class', QN_ERROR_INVALID_PARAM);

    // resovle API URL
    $API_URLs = [ 
        'article'   => 'api/articles',
        'document'  => 'api/documents',
        'question'  => 'api/questions'
    ];
    if(!isset($API_URLs[$object_pseudo_class])) throw new Exception('unknown API URL', QN_ERROR_INVALID_PARAM);
    $API_URL = $API_URLs[$object_pseudo_class];
    
    // 0) retrieve matching objects identifiers

    // build domain   
    if(strlen($params['q']) > 0) {
        $params['domain'] = [];        
        // adapt domain to restrict results to given channel
        $params['domain'][] = ['channel_id','=', '1'];        
        $indexes_ids = resiway\Index::searchByQuery($om, $params['q']);        
        $objects_ids = $om->search($object_class, ['indexes_ids', 'contains', $indexes_ids]);
        if(count($objects_ids) > 0) {
            $params['domain'][] = ['id','in', $objects_ids];
        }
        else $params['domain'][] = ['id','=', -1];        
    }
    
    // total is not knwon yet
    if($params['total'] < 0) {        
        $ids = $om->search($object_class, $params['domain'], $params['order'], $params['sort']);
        if($ids < 0) throw new Exception("request_failed", QN_ERROR_UNKNOWN);
        $params['total'] = count($ids);
		$objects_ids = array_slice($ids, $params['start'], $params['limit']);
    }
    else {
        $objects_ids = $om->search($object_class, $params['domain'], $params['order'], $params['sort'], $params['start'], $params['limit']);
        if($objects_ids < 0) throw new Exception("request_failed", QN_ERROR_UNKNOWN);
    }

    // announce API RFC7159 encoded JSON
    header('Content-type: application/vnd.api+json');
    // explicitely allow CORS
    header('Access-Control-Allow-Origin: *');    
    // output json result        
    echo $object_class::toJSONAPI(   
            $om, 
            $objects_ids, 
            [
                'meta'      => [
                    'count'         => $params['total'], 
                    'page-index'    => floor($params['start']/$params['limit'])+1,
                    'page-size'     => $params['limit'], 
                    'total-pages'   => ceil($params['total']/$params['limit'])
                ],
                'links'     => [
                    'self'          => QNLib::get_url(false, false).$API_URL.'?start='.$params['start'].'&limit='.$params['limit'], 
                    'next'          => QNLib::get_url(false, false).$API_URL.'?start='.($params['start']+$params['limit']).'&limit='.$params['limit']
                ]
            ]                                            
    );    
}
catch(Exception $e) {
    $result = $e->getCode();
    $error_message_ids = array($e->getMessage());
    
    // announce UTF-8 encoded JSON
    header('Content-type: application/json; charset=UTF-8');
    // explicitely allow CORS
    header('Access-Control-Allow-Origin: *');        
    // output json result
    echo json_encode([
        'result'            => $result,
        'total'             => $params['total'],
        'error_message_ids' => $error_message_ids
    ], JSON_PRETTY_PRINT);    
}