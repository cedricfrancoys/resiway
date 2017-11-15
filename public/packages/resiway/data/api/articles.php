<?php
// Dispatcher (index.php) is in charge of setting the context and should include easyObject library
defined('__QN_LIB') or die(__FILE__.' cannot be executed directly.');
require_once('../resi.api.php');

use config\QNLib;
use easyobject\orm\ObjectManager;

use resiway\User;

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

    // 0) retrieve matching articles identifiers
    $params['domain'] = [];
    // build domain   
    if(strlen($params['q']) > 0) {
        // adapt domain to restrict results to given channel
        $params['domain'][] = ['channel_id','=', '1'];        
        $indexes_ids = resiway\Index::searchByQuery($om, $params['q']);        
        $articles_ids = $om->search('resilexi\Article', ['indexes_ids', 'contains', $indexes_ids]);
        if(count($articles_ids) > 0) {
            $params['domain'][] = ['id','in', $articles_ids];
        }
        else $params['domain'][] = ['id','=', -1];        
    }
    

    // total is not knwon yet
    if($params['total'] < 0) {        
        $ids = $om->search('resilexi\Article', $params['domain'], $params['order'], $params['sort']);
        if($ids < 0) throw new Exception("request_failed", QN_ERROR_UNKNOWN);
        $params['total'] = count($ids);
		$articles_ids = array_slice($ids, $params['start'], $params['limit']);
    }
    else {
        $articles_ids = $om->search('resilexi\Article', $params['domain'], $params['order'], $params['sort'], $params['start'], $params['limit']);
        if($articles_ids < 0) throw new Exception("request_failed", QN_ERROR_UNKNOWN);
    }

    // output json result
    // JSON API RFC7159
    header('Content-type: application/vnd.api+json');
    echo resilexi\Article::toJSONAPI(   
            $om, 
            $articles_ids, 
            [
                'meta'      => [
                    'count'         => $params['total'], 
                    'page-index'    => floor($params['start']/$params['limit'])+1,
                    'page-size'     => $params['limit'], 
                    'total-pages'   => ceil($params['total']/$params['limit'])
                ],
                'links'     => [
                    'self'          => QNLib::get_url(false, false).'api/articles?start='.$params['start'].'&limit='.$params['limit'], 
                    'next'          => QNLib::get_url(false, false).'api/articles?start='.($params['start']+$params['limit']).'&limit='.$params['limit']
                ]
            ]                                            
    );    
}
catch(Exception $e) {
    $result = $e->getCode();
    $error_message_ids = array($e->getMessage());

    // output json result
    header('Content-type: application/json; charset=UTF-8');
    echo json_encode([
        'result'            => $result,
        'total'             => $params['total'],
        'error_message_ids' => $error_message_ids
    ], JSON_PRETTY_PRINT);    
}