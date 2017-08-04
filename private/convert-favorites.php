#!/usr/bin/env php
<?php
use easyobject\orm\ObjectManager as ObjectManager;

// run this script as if it were located in the public folder
chdir('../public');
set_time_limit(0);

// this utility script uses qinoa library
// and requires file config/config.inc.php
require_once('../qn.lib.php');
require_once('../resi.api.php');
include_once('packages/resiway/config.inc.php');
config\export_config();

list($result, $error_message_ids) = [true, []];

// force silent mode (debug output would corrupt json data)
set_silent(true);



list($result, $error_message_ids) = [true, []];

try {
    $om = &ObjectManager::getInstance();   
        
    $actions_ids = [4, 42, 53];

    $ids = $om->search('resiway\ActionLog', ['action_id', 'in', $actions_ids]);

    $res = $om->read('resiway\ActionLog', $ids, ['action_id', 'user_id', 'object_class', 'object_id']);

    foreach($res as $oid => $odata) {
        $om->create('resiway\UserFavorite', [
                                                'user_id' => $odata['user_id'], 
                                                'object_class' => $odata['object_class'], 
                                                'object_id' => $odata['object_id']
                                            ]);
    }
}
catch(Exception $e) {
    $error_message_ids = array($e->getMessage());
    $result = $e->getCode();
}

// send json result
header('Content-type: application/json; charset=UTF-8');
echo json_encode([
                    'result'            => $result, 
                    'error_message_ids' => $error_message_ids
                 ], JSON_PRETTY_PRINT);