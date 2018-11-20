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
    'description'	=>	"Provide all existing categories as a tree",
    'params' 		=>	array(
                        'channel'	    => array(
                                            'description'   => 'Channel for which categories are requested (default, help, meta, ...)',
                                            'type'          => 'integer',
                                            'default'       => 1
                                            )
                        )
	)
);

list($result, $error_message_ids) = [true, []];

function getTree($om, $oids) {
    $result = [];
    $res = $om->read('resiway\Category', $oids, ['id', 'title', 'title_url', 'description', 'parent_id', 'count_documents', 'count_questions', 'children_ids']);
    foreach($res as $oid => $odata) {
        $values =  [
                    'id'                => $oid, 
                    'title'             => $odata['title'], 
                    'title_url'         => $odata['title_url'], 
                    'description'       => $odata['description'], 
                    'parent_id'         => $odata['parent_id'],
                    'count_documents'   => $odata['count_documents'],
                    'count_questions'   => $odata['count_questions']                    
                    ];
        if(count($odata['children_ids'])) {
            $values['nodes'] = getTree($om, $odata['children_ids']);
        }
        $result[] = $values;
    }
    return $result;
}

try {

    $om = &ObjectManager::getInstance();
    $result = [];
    
    // request root categories
    $ids = $om->search('resiway\Category', [['parent_id', '=', 0], ['channel_id', '=', $params['channel']]], 'title', 'asc');
    $res = getTree($om, $ids);

    $result = array_values($res);
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