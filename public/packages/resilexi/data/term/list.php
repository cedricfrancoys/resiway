<?php
// Dispatcher (index.php) is in charge of setting the context and should include easyObject library
defined('__QN_LIB') or die(__FILE__.' cannot be executed directly.');
require_once('../resi.api.php');

use config\QNLib;
use easyobject\orm\ObjectManager;
use qinoa\orm\Domain;

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
    'description'	=>	"Returns a list of lexical terms (i.e. articles titles) matching the received criteria",
    'params' 		=>	array(                                         
                        'q'		    => array(
                                            'description'   => 'Token to search among the articles',
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
                                            'description'   => 'Channel for which articles are requested (default, help, meta, ...)',
                                            'type'          => 'integer',
                                            'default'       => 1
                                            )                                       
                        )
	)
);




list($result, $error_message_ids, $total) = [[], [], $params['total']];


try {
    
    $om = &ObjectManager::getInstance();

    // 0) retrieve matching articles identifiers

    // build domain   
    $params['domain'] = Domain::normalize($params['domain']);
    if(!Domain::validate($params['domain'])) $params['domain'] = [];
    
    // adapt domain to restrict results to given channel
    // $params['domain'] = Domain::conditionAdd($params['domain'], ['channel_id','=', $params['channel']]);

    // total is not knwon yet
    if($params['total'] < 0) {        
        $ids = $om->search('resilexi\Term', $params['domain'], $params['order'], $params['sort']);
        if($ids < 0) throw new Exception("request_failed", QN_ERROR_UNKNOWN);
        $params['total'] = count($ids);
		$articles_ids = array_slice($ids, $params['start'], $params['limit']);
    }
    else {
        $articles_ids = $om->search('resilexi\Term', $params['domain'], $params['order'], $params['sort'], $params['start'], $params['limit']);
        if($articles_ids < 0) throw new Exception("request_failed", QN_ERROR_UNKNOWN);
    } 
    
    if(!empty($articles_ids)) {
        // retrieve terms        
        $terms = $om->read(  'resilexi\Term', 
                                $articles_ids, 
                                [
                                    'id',
                                    'title',
                                    'title_url'
                                ]);        
        
        if($terms < 0 || !count($terms)) throw new Exception("request_failed", QN_ERROR_UNKNOWN);
        
        // result is a (non-associative) array of objects
        $result = array_values($terms);
    }

}
catch(Exception $e) {
    $result = $e->getCode();
    $error_message_ids = array($e->getMessage());
}

// output json result
header('Content-type: application/json; charset=UTF-8');
echo json_encode([
    'result'            => $result,
    'total'             => $params['total'],
    'error_message_ids' => $error_message_ids
], JSON_PRETTY_PRINT);