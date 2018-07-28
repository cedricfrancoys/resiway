<?php
// Dispatcher (index.php) is in charge of setting the context and should include easyObject library
defined('__QN_LIB') or die(__FILE__.' cannot be executed directly.');
require_once('../resi.api.php');

use config\QNLib;
use easyobject\orm\ObjectManager;
use qinoa\orm\Domain;

// force silent mode (debug output would corrupt json data)
set_silent(true);

// announce script and fetch parameters values
$params = QNLib::announce(
	array(
    'description'	=>	"Provide all existing categories",
    'params' 		=>	array(
                        'category_id'	=> array(
                                            'description'   => 'Identifier of the category we want to retrieve related catgeories',
                                            'type'          => 'integer',
                                            'required'      => true
                                            ),
                        'limit'		=> array(
                                            'description'   => 'The maximum number of results.',
                                            'type'          => 'integer',
                                            'min'           => 5,
                                            'max'           => 15,
                                            'default'       => 10
                                            ),                                            
                        'channel'	    => array(
                                            'description'   => 'Channel for which categories are requested (default, help, meta, ...)',
                                            'type'          => 'integer',
                                            'default'       => 1
                                            )
                        )
	)
);

list($result, $error_message_ids) = [[], []];

list($object_class, $object_id) = ['resiway\Category', $params['category_id']];


try {
    $om = &ObjectManager::getInstance();
    
    $res = $om->read($object_class, $object_id, ['path', 'parent_path']);    
    if($res < 0 || !isset($res[$object_id])) throw new Exception("object_unknown", QN_ERROR_INVALID_PARAM);       
    
    $domain = Domain::conditionAdd([], ['channel_id','=', $params['channel']]);
    
    if(strlen($res[$object_id]['parent_path']) > 0) {
        $domain = Domain::conditionAdd($domain, ['path', 'like', $res[$object_id]['parent_path'].'/%']);
    }
    else {
        $domain = Domain::conditionAdd($domain, ['path', 'like', $res[$object_id]['path'].'/%']);        
    }
    
    $categories_ids = $om->search('resiway\Category', $domain, 'id', 'desc', 0, $params['limit']);
    
    // remove given category from list of related categories
    $categories_ids = array_diff($categories_ids, [$object_id]);
    
    if(!empty($categories_ids)) {    
        // retrieve categories
        $res = $om->read('resiway\Category', $categories_ids, ['id', 'title', 'title_url', 'path', 'count_items']);
        if($res < 0) throw new Exception("action_failed", QN_ERROR_UNKNOWN);
        // remove empty categories
        foreach($res as $id => $category) {
            if($category['count_items'] <= 0) {
                unset($res[$id]);
            }
        }
        $result = array_values($res);
        
        // sort subset based on given order and sort parameters
        usort($result, function ($a, $b) {
                $a = $a['count_items']; 
                $b = $b['count_items'];
                if ($a == $b) {
                    return 0;
                }
                return ($a < $b) ? 1 : -1;
            }
        );
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
                    'error_message_ids' => $error_message_ids
                 ],
                 JSON_PRETTY_PRINT);