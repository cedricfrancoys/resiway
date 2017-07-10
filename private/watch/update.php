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

/*
    This script is intended to be run on a daily basis
    to update users about content they're following
*/

    
    $om = &ObjectManager::getInstance();

    $res = resiAPI::repositoryGet('script.watch.last_run');
    if(isset($res['script.watch.last_run'])) {
        $last_run = $res['script.watch.last_run'];
        $now = strtotime("now");
        
        $actions_ids = $om->search('resiway\Action', [
                                [['name', '=', 'resiexchange_question_post']],
                                [['name', '=', 'resilib_document_post']]
                        ]);
        if($actions_ids < 0 || !count($actions_ids)) throw new Exception("action_failed", QN_ERROR_UNKNOWN);
        
        $actionlogs_ids = $om->search('resiway\ActionLog', [
                                ['created', '>=', $last_run],
                                ['action_id', 'in', $actions_ids]
                        ]);
        if($actionlogs_ids < 0 || !count($actionlogs_ids)) throw new Exception("no_new_action", 0);

        $actions = $om->read('resiway\ActionLog', $actionlogs_ids, ['action_id.name', 'object_class', 'object_id', 'user_id']);
        
        $objects_by_category = [];
        foreach($actions as $action) {
            $res = $om->read($action['object_class'], $action['object_id'], ['id', 'name', 'categories_ids']);
            if($res < 0 || !isset($res[$action['object_id']])) throw new Exception("action_failed", QN_ERROR_UNKNOWN);
            
            $object = $res[$action['object_id']];
                        
            foreach($object['categories_ids'] as $category_id) {
                if(!isset($objects_by_category[$category_id])) $objects_by_category[$category_id] = [];
                if(!isset($objects_by_category[$category_id][$action['object_class']])) $objects_by_category[$category_id][$action['object_class']] = [];
                $objects_by_category[$category_id][$action['object_class']][] = $object;
            }
        }        

        // extract all categories having at least one change
        $categories_ids = array_keys($objects_by_category);

        // obtain list of users watching impacted categories
        $usersfavorites_ids = $om->search('resiway\UserFavorite', [
                                ['object_class', '=', 'resiway\Category'],
                                ['object_id', 'in', $categories_ids]
                        ]);
        if($usersfavorites_ids < 0) throw new Exception("action_failed", QN_ERROR_UNKNOWN);

        $res = $om->read('resiway\UserFavorite', $usersfavorites_ids, ['user_id']);
        $users_ids = array_map(function ($a) {return $a['user_id'];}, $res);
        
        // add admins        
        $admin_ids = $om->search('resiway\User', [['role', '=', 'a']]);
        $users_ids = array_unique(array_merge($users_ids, $admin_ids));
               
        $users = $om->read('resiway\User', $users_ids, ['firstname', 'last_login', 'role', 'favorites_ids', 'language']);

        foreach($users as $user_id => $user) {
            // check if we need to give the user an update
            if( strtotime($user['last_login']) <= strtotime($last_run) ) {            
            // if(true or strtotime($user['last_login']) < strtotime($last_run)) {
                // reset user specific data
                $list_documents = [];
                $list_questions = [];
                $data = ['user' => $user, 'count_categories' => 0, 'count_questions' => 0, 'count_documents' => 0, 'list_questions' => '', 'list_documents' => ''];
                $user_categories_ids = array_intersect($usersfavorites_ids, $user['favorites_ids']);
                foreach($objects_by_category as $category_id => $objects) {
                    if($user['role'] == 'a' || in_array($category_id, $user_categories_ids)) {
                        ++$data['count_categories'];
                        if(isset($objects_by_category[$category_id]['resilib\Document'])) {
                            foreach($objects_by_category[$category_id]['resilib\Document'] as $document) {
                                if(!isset($list_documents[$document['id']])) ++$data['count_documents'];
                                $list_documents[$document['id']] = $document['name'];
                            }
                        }
                        if(isset($objects_by_category[$category_id]['resiexchange\Question'])) {
                            foreach($objects_by_category[$category_id]['resiexchange\Question'] as $question) {
                                if(!isset($list_questions[$question['id']])) ++$data['count_questions'];
                                $list_questions[$question['id']] = $question['name'];
                            }
                        }                           
                    }
                }
                if($data['count_documents'] > 0 || $data['count_questions'] > 0) {
                    // build message from template and send mail to spooler                    
                    $i = 0;
                    foreach($list_questions as $question_id => $question_name) {
                        if($i == 3) break;                        
                        $data['list_questions'] .= '<a href="https://www.resiway.org/resiexchange.fr#/question/'.$question_id.'">'.$question_name.'</a><br />'.PHP_EOL;
                        ++$i;
                    }
                    $i = 0;
                    foreach($list_documents as $document_id => $document_name) {
                        if($i == 3) break;
                        $data['list_documents'] .= '<a href="https://www.resiway.org/resilib.fr#/document/'.$document_id.'">'.$document_name.'</a><br />'.PHP_EOL;
                        ++$i;
                    }                    
                    $notification = resiAPI::getUserNotification('notification_updates', $user['language'], $data);
                    resiAPI::userNotify($user_id, 'updates', $notification);    
                }
                
            }
            
        }
        
    }
    
    resiAPI::repositorySet('script.watch.last_run', date("Y-m-d H:i:s"));
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