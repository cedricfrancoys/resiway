#!/usr/bin/env php
<?php
/**
 Send a reminder message for users who haven't yet validated their account
*/
use easyobject\orm\ObjectManager as ObjectManager;
use html\HtmlTemplate as HtmlTemplate;


// run this script as if it were located in the public folder
chdir('../../public');
set_time_limit(0);

// this utility script uses qinoa library
// and requires file config/config.inc.php
require_once('../qn.lib.php');
require_once('../resi.api.php');
config\export_config();

set_silent(true);

list($result, $error_message_ids) = [true, []];

try {
    /* attempt to find categories of interest for each user */
    
    $om = &ObjectManager::getInstance();

    // find appropriate actions (ressources views)
    $actions_ids = $om->search('resiway\Action', [
                            [['name', '=', 'resiexchange_question_view']],
                            [['name', '=', 'resilib_document_view']]
                    ]);
    if($actions_ids < 0 || !count($actions_ids)) throw new Exception("action_failed", QN_ERROR_UNKNOWN);


    $users_ids = $om->search('resiway\User', ['verified', '=', true]);
    
    // try to assign 3 more favorite categories
    foreach($users_ids as $user_id) {
        $user_categories = [];
        
        $actionlogs_ids = $om->search('resiway\ActionLog', [
                                ['user_id', '=', $user_id],
                                ['action_id', 'in', $actions_ids]
                        ]);
        if($actionlogs_ids < 0 || !count($actionlogs_ids)) continue;

        $actions = $om->read('resiway\ActionLog', $actionlogs_ids, ['object_class', 'object_id', 'user_id']);
        
        foreach($actions as $action) {
            $res = $om->read($action['object_class'], $action['object_id'], ['id', 'name', 'categories_ids']);
            if($res < 0 || !isset($res[$action['object_id']])) throw new Exception("action_failed", QN_ERROR_UNKNOWN);
            
            $object = $res[$action['object_id']];

            // keep track of unique categories ids
            foreach($object['categories_ids'] as $category_id) {
                $user_categories[$category_id] = true;
            }
        }

        $i = 0;
        foreach($user_categories as $category_id => $flag) {
            // limit auto assigned favorites to 3
            if( $i >= 3) break;
            $om->create('resiway\UserFavorite', [
                            'object_class' => 'resiway\Category',
                            'object_id' => $category_id,
                            'user_id' => $user_id
                    ]);
            ++$i;
        }
                        
    }
   
}
catch(Exception $e) {
    $result = $e->getCode();
    $error_message_ids = array($e->getMessage());
}

header('Content-type: application/json; charset=UTF-8');
echo json_encode([
        'result'            => $result, 
        'error_message_ids' => $error_message_ids
    ], 
    JSON_PRETTY_PRINT);