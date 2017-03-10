<?php
/* resi.api.php - library holding global functions for controllers of the resiway platform.

    This file is part of the resiway program <http://www.github.com/cedricfrancoys/resiway>
    Copyright (C) ResiWay.org, 2017
    Some Right Reserved, GNU GPL 3 license <http://www.gnu.org/licenses/>

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 3, or (at your option)
    any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program; if not, see <http://www.gnu.org/licenses/>
*/
use easyobject\orm\ObjectManager as ObjectManager;
use easyobject\orm\PersistentDataManager as PersistentDataManager;
use easyobject\orm\DataAdapter as DataAdapter;
use html\HTMLPurifier_Config as HTMLPurifier_Config;

// these utilities require inclusion of main configuration file 
require_once('qn.lib.php');

// override ORM method for date formatting (ISO 8601)
DataAdapter::setMethod('db', 'orm', 'date', function($value) {
    $dateTime = DateTime::createFromFormat('Y-m-d', $value);
    return date("c", $dateTime->getTimestamp());
});
/*
// override ORM method for datetime formatting (ISO 8601)
DataAdapter::setMethod('db', 'orm', 'datetime', function($value) {
    $dateTime = DateTime::createFromFormat('Y-m-d H:i:s', $value);
    return date("c", $dateTime->getTimestamp());
});
  */
  
            
class ResiAPI {
    
    public static function getHTMLPurifierConfig() {
        // clean HTML input html
        // strict cleaning: remove non-standard tags and attributes    
        $config = HTMLPurifier_Config::createDefault();
        $config->set('URI.Base',                'http://www.resiway.org/');
        $config->set('URI.MakeAbsolute',        true);                  // make all URLs absolute using the base URL set above
        $config->set('AutoFormat.RemoveEmpty',  true);                  // remove empty elements
        $config->set('HTML.Doctype',            'XHTML 1.0 Strict');    // valid XML output
        $config->set('CSS.AllowedProperties',   []);                    // remove all CSS
        // allow only tags and attributes that match most lightweight markup language 
        $config->set('HTML.AllowedElements',    array('h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'hr', 'pre', 'a', 'img', 'br', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'ul', 'ol', 'li', 'strong', 'b', 'i', 'code', 'blockquote'));
        $config->set('HTML.AllowedAttributes',  array('a.href', 'img.src'));
        return $config;
    }
    
    /**
    * Retrieves resiway-app current revision identifier.
    *
    * @return   string
    */
    public static function currentRevision() {
        $file = trim(explode(' ', file_get_contents('../.git/HEAD'))[1]);
        $hash = substr(file_get_contents("../.git/$file"), 0, 7);
        $time = filemtime ('../.git/index');
        $date = date("Y.m.d", $time);
        return "$date.$hash";
    }
    
    public static function credentialsDecode($code) {
        // convert base64url to base64
        $code = str_replace(['-', '_'], ['+','/'], $code);
        return explode(';', base64_decode($code));
    }
    
    public static function credentialsEncode($login, $password) {
        $code = base64_encode($login.";".$password);
        // convert base64 to url safe-encoded
        return str_replace(['+','/'],['-', '_'], $code);
    }
    
// todo: complete
    public static function makeLink($object_class, $object_Id) {
        $link = '';
        switch($object_class) {
            case 'resiway\User':                    return '#/user/'.$object_id;
            case 'resiway\Category':                return '#/category/'.$object_id;
            case 'resiway\Badge':            
            case 'resiexchange\Question':           return '#/question/'.$object_id;
            case 'resiexchange\Answer':
            case 'resiexchange\QuestionComment':
            case 'resiexchange\AnswerComment':                        
        }
        return $link;
    }

    public static function userSign($login, $password) {
        $om = &ObjectManager::getInstance();        
        $errors = $om->validate('resiway\User', ['login' => $login, 'password' => $password]);
        if(count($errors)) return QN_ERROR_INVALID_PARAM;
        $ids = $om->search('resiway\User', [['login', '=', $login], ['password', '=', $password]]);
        if($ids < 0 || !count($ids)) return QN_ERROR_INVALID_PARAM;
        $pdm = &PersistentDataManager::getInstance();
        return $pdm->set('user_id', $ids[0]);                
    }
    
    /**
    * Retrieves current user identifier.
    * If user is not logged in, returns 0 (GUEST_USER_ID)
    *
    * @return   integer
    */
    public static function userId() {
        $pdm = &PersistentDataManager::getInstance();
        return $pdm->get('user_id', 0);
    }
    
    /**
    * Retrieves given action identifier based on its name.
    * If action is unknown, returns a negative value (QN_ERROR_INVALID_PARAM)
    *
    * @param    string  $action_name    name of the action to resolve
    * @return   integer 
    */
    public static function actionId($action_name) {
        static $actionsTable = [];
        
        if(!isset($actionTable[$action_name])) {        
            $om = &ObjectManager::getInstance();            
            $res = $om->search('resiway\Action', ['name', '=', $action_name]);
            if($res < 0 || !count($res)) return QN_ERROR_INVALID_PARAM;
            $actionTable[$action_name] = $res[0];
        }
        return $actionTable[$action_name];
    }

    
    /**
    * Provides an array holding fields names holding public information
    * This array is used n order to determine which data is public.
    *
    */
    public static function userPublicFields() {
        return ['id', 
                'created',
                'verified',
                'last_login',
                'display_name',
                'hash',
                'avatar_url',
                'about',
                'language', 
                'country', 
                'location',                
                'reputation',
                'count_questions', 
                'count_views', 
                'count_answers', 
                'count_comments',              
                'count_badges_1', 
                'count_badges_2', 
                'count_badges_3'
               ];
    }

    public static function userPrivateFields() {
        return ['login', 
                'firstname',
                'lastname', 
                'publicity_mode',
                'notifications_ids'
               ];
    }
    
    /**
    *
    * to maintain a low load-time, this method should be used only when a single user object is requested 
    */
    public static function loadUserPublic($user_id) {
        // check params consistency
        if($user_id <= 0) return QN_ERROR_INVALID_PARAM;        
        
        $om = &ObjectManager::getInstance();        
        
        $res = $om->read('resiway\User', $user_id, self::userPublicFields() );        
        if($res < 0 || !isset($res[$user_id])) return QN_ERROR_UNKNOWN_OBJECT;    
        return $res[$user_id];        
    }

    /**
    *
    * to maintain a low load-time, this method should be used only when a single user object is requested 
    */
    public static function loadUserPrivate($user_id) {
        // check params consistency
        if($user_id <= 0) return QN_ERROR_INVALID_PARAM;        
        
        $om = &ObjectManager::getInstance();        
        
        $res = $om->read('resiway\User', $user_id, array_merge(self::userPrivateFields(), self::userPublicFields()) );
        if($res < 0 || !isset($res[$user_id])) return QN_ERROR_UNKNOWN_OBJECT;    
        return $res[$user_id];        
    }    

    /**
    * returns an associative array holding keys-values of the records having key matching given mask
    */
    public static function repositoryGet($key_mask) {
        $result = [];
        $om = &ObjectManager::getInstance(); 
        $db = $om->getDBHandler();
        $res = $db->sendQuery("SELECT `key`, `value` FROM `resiway_repository` WHERE `key` like '$key_mask';");
        while ($row = $db->fetchArray($res)) {
            $result[$row['key']] = $row['value'];
        }
        return $result;
    }

    public static function repositorySet($key, $value) {
        $om = &ObjectManager::getInstance(); 
        $db = $om->getDBHandler();      
        $db->sendQuery("UPDATE `resiway_repository` SET `value` = '$value' WHERE `key` like '$key_mask';");        
    }

    /*
    * increments by one the value of the records having key matching given mask
    */
    public static function repositoryInc($key_mask) {
        $om = &ObjectManager::getInstance(); 
        $db = $om->getDBHandler();       
        $db->sendQuery("UPDATE `resiway_repository` SET `value` = `value`+1 WHERE `key` like '$key_mask';");
    }

    /*
    * decrements by one the value of the records having key matching given mask
    */
    public static function repositoryDec($key_mask) {
        $om = &ObjectManager::getInstance(); 
        $db = $om->getDBHandler();       
        $db->sendQuery("UPDATE `resiway_repository` SET `value` = `value`-1 WHERE `key` like '$key_mask';");
    }
    

    public static function notifyUser($user_id, $title, $content) {
        $om = &ObjectManager::getInstance();
// todo : here is the right place to send an email if necessary        
// store message in spool
// todo : script run by cron to send emails every ? minutes
        // in case we decide to send emails, here is the place to add something to user queue
        return $om->create('resiway\UserNotification', [  
            'user_id'   => $user_id, 
            'title'     => $title, 
            'content'   => $content
        ]);        
    }
    
    /**
    * Reflects performed action on user's and object author's reputations
    * by action increment or its opposite, according to $sign parameter
    *
    * @param    integer  $user_id       identifier of the user performing the action
    * @param    integer  $action_id     identifier of the action being performed
    * @param    string   $object_class  class of the targeted object (ex. 'resiexchange\Question')
    * @param    integer  $object_id     identifier of the object on which action is performed
    * @param    integer  $sign          +1 for incrementing reputation, -1 to decrement it
    * @return   boolean  returns an array holding user an author resulting ids and increments
    */      
    private static function impactReputation($user_id, $action_id, $object_class, $object_id, $sign=1) {
        $result = ['user' => ['id' => $user_id, 'increment' => 0], 'author' => ['id' => 0, 'increment' => 0]];
        
        $om = &ObjectManager::getInstance();

        // retrieve action data
        $res = $om->read('resiway\Action', $action_id, ['name', 'user_increment', 'author_increment']);
        if($res > 0 && isset($res[$action_id])) {
            $action_data = $res[$action_id];
            
            if($action_data['user_increment'] != 0) {
                // retrieve user data
                $res = $om->read('resiway\User', $user_id, ['verified', 'reputation']);
                if($res > 0 && isset($res[$user_id])) {
                    $user_data = $res[$user_id];
                    // prevent reputation update for non-verified users
                    if($user_data['verified']) {
                        $result['user']['increment'] = $sign*$action_data['user_increment'];
                        $om->write('resiway\User', $user_id, array('reputation' => $user_data['reputation']+$result['user']['increment']));
                    }
                }
            }
            
            if($action_data['author_increment'] != 0) {
                // retrieve author data (creator of targeted object)
                $res = $om->read($object_class, $object_id, ['creator']);
                if($res > 0 && isset($res[$object_id])) {
                    $author_id = $res[$object_id]['creator'];
                    $result['author']['id'] = $author_id;
                    $res = $om->read('resiway\User', $author_id, ['verified', 'reputation']);        
                    if($res > 0 && isset($res[$author_id])) {    
                        $author_data = $res[$author_id];            
                        // prevent reputation update for non-verified users
                        if($author_data['verified']) {                    
                            $result['author']['increment'] = $sign*$action_data['author_increment'];            
                            $om->write('resiway\User', $author_id, array('reputation' => $author_data['reputation']+$result['author']['increment']));
                        }
                    }
                }
            }
        }
        return $result;
    }
    

    /**
    * Tells if given user is allowed to perform given action.
    * If given user or action is unknown, returns false
    *
    * @param    integer  $user_id       identifier of the user performing the action
    * @param    integer  $action_id     identifier of the action being performed
    * @param    string   $object_class  class of the targeted object (ex. 'resiexchange\Question')
    * @param    integer  $object_id     identifier of the object on which action is performed    
    * @return   boolean 
    */    
    public static function isActionAllowed($user_id, $action_id, $object_class, $object_id) {
        // check params consistency
        if($user_id <= 0 || $action_id <= 0) return false;

        // all actions are granted to root user
        if($user_id == 1) return true;
        
        $om = &ObjectManager::getInstance();

        if($object_id > 0) {
            // retrieve object data 
            $res = $om->read($object_class, $object_id, ['id', 'creator']);
            if($res < 0 || !isset($res[$object_id])) return false;
            
            // unless specified in action limitations, all actions are granted on an object owner
            if($user_id == $res[$object_id]['creator']) return true;
        }
        
        // read user data
        $res = $om->read('resiway\User', $user_id, ['reputation']);        
        if($res < 0 || !isset($res[$user_id])) return false;
        $user_data = $res[$user_id];
        
        // read action data (as this is the first call in the action proccessing logic, 
        // we take advantage of this call to load all fields that will be required at some point
        $res = $om->read('resiway\Action', $action_id, ['required_reputation', 'user_increment', 'author_increment']);
        if($res < 0 || !isset($res[$action_id])) return false;   
        $action_data = $res[$action_id];
        
        // check objects consistency
        if(!isset($action_data['required_reputation']) || !isset($user_data['reputation'])) return false;
        
        // check user reputation against minimum reputation required to perform the action
        if($user_data['reputation'] >= $action_data['required_reputation']) return true;

        return false;
    }
    
    /**
    * Tells if an action has already been performed by given user on specified object.
    *
    * @param    integer  $user_id       identifier of the user performing the action
    * @param    integer  $action_id     identifier of the action being performed
    * @param    string   $object_class  class of the targeted object (ex. 'resiexchange\Question')
    * @param    integer  $object_id     identifier of the object on which action is performed
    * @return   boolean
    */
    public static function isActionRegistered($user_id, $action_id, $object_class, $object_id) {
        // check params consistency
        if($user_id <= 0 || $action_id <= 0) return false;
             
        $om = &ObjectManager::getInstance();
        
        $res = $om->search('resiway\ActionLog', [
                    ['user_id',     '=', $user_id], 
                    ['action_id',   '=', $action_id], 
                    ['object_class','=', $object_class], 
                    ['object_id',   '=', $object_id]
               ]);
        if($res < 0 || !count($res)) return false;
        
        return true;
    }
    
    /**
    * Logs the action being performed by given user on specified object.
    *
    * @param    integer  $user_id       identifier of the user performing the action
    * @param    integer  $action_id     identifier of the action being performed
    * @param    string   $object_class  class of the targeted object (ex. 'resiexchange\Question')
    * @param    integer  $object_id     identifier of the object on which action is performed
    * @return   boolean  returns true if operation succeeds, false otherwise.    
    */
    public static function registerAction($user_id, $action_id, $object_class, $object_id) {
        // check params consistency
        if($user_id <= 0 || $action_id <= 0 || $object_id <= 0) return;
        
        $impact = self::impactReputation($user_id, $action_id, $object_class, $object_id, 1);
        
        $om = &ObjectManager::getInstance();
        
        $om->create('resiway\ActionLog', [
                        'user_id'               => $user_id,
                        'author_id'             => $impact['author']['id'],
                        'action_id'             => $action_id, 
                        'object_class'          => $object_class, 
                        'object_id'             => $object_id,
                        'user_increment'        => $impact['user']['increment'],
                        'author_increment'      => $impact['author']['increment']
                       ]);
        // notify users if there is any reputation change 
        if($impact['user']['increment'] != 0) {
            self::notifyUser($user_id, 
                            "reputation updated", 
                            sprintf("%d points", $impact['user']['increment'])
                            );
            
        }
        if($impact['author']['increment'] != 0) {
            self::notifyUser($user_id, 
                            "reputation updated", 
                            sprintf("%d points", $impact['author']['increment'])
                            );
            
        }
    }
    
    /**
    * Removes latest record of the given action from the log.
    *
    * @param    integer  $user_id       identifier of the user performing the action
    * @param    integer  $action_id     identifier of the action being performed
    * @param    string   $object_class  class of the targeted object (ex. 'resiexchange\Question')
    * @param    integer  $object_id     identifier of the object on which action is performed
    * @return   boolean  returns true if operation succeeds, false otherwise.
    */
    public static function unregisterAction($user_id, $action_id, $object_class, $object_id) {
        // check params consistency
        if($user_id <= 0 || $action_id <= 0 || $object_id <= 0) return;
        
        $impact = self::impactReputation($user_id, $action_id, $object_class, $object_id, -1);
        
        $om = &ObjectManager::getInstance();

        $log_ids = $om->search('resiway\ActionLog', [
                                    ['user_id',      '=', $user_id], 
                                    ['action_id',    '=', $action_id], 
                                    ['object_class', '=', $object_class], 
                                    ['object_id',    '=', $object_id]
                                ], 'created', 'desc');
                   
        if($log_ids > 0 && count($log_ids)) {
            $res = $om->remove('resiway\ActionLog', $log_ids, true);        
        }        
    }
    
    /**
    * Retrieves history of actions performed by given user on specified object(s)
    *
    * @return array list of action names (ex.: resiexchange_question_votedown, resiexchange_comment_voteup, ...)
    */
    public static function retrieveHistory($user_id, $object_class, $object_ids) {
        $om = &ObjectManager::getInstance();
        
        $history = [];
        if(!is_array($object_ids)) $object_ids = (array) $object_ids;
        // init $history array to prevent returning a null result
        foreach($object_ids as $object_id) $history[$object_id] = [];
        if($user_id > 0 && count($object_ids)) {
            $actions_ids = $om->search('resiway\ActionLog', [
                                ['user_id',     '=', $user_id],
                                ['object_class','=', $object_class], 
                                ['object_id',   'in', $object_ids]
                            ]);
            if($actions_ids > 0) {
                // add attributes to the data set
                $res = $om->read('resiway\ActionLog', $actions_ids, ['action_id.name', 'object_id']);
                if($res > 0) {
                    foreach($res as $actionLog_id => $actionLog) {
                        $history[$actionLog['object_id']][$actionLog['action_id.name']] = true;                        
                    }
                }
            }
        }
        return $history;
    }    

    
    
    /**
    * Updates badges status for user and object author.
    * Note: once a badge has been awarded it will never be withrawn.
    * This method expects resiway_user_badge table to be synched with resiway_badge : 
    * which means that if badge list is updated, we need to generate missing entries in resiway_user_badge table for all users
    *
    * @param    string   $action_name   name of the action being performed
    * @param    string   $object_class  class of the targeted object (ex. 'resiexchange\Question')
    * @param    integer  $object_id     identifier of the object on which action is performed
    *
    * @return   boolean  returns true on succes, false if something went wrong
    */     
    public static function updateBadges($action_name, $object_class, $object_id) {
        $notifications = [];
                
        $om = &ObjectManager::getInstance();

        // retrieve user object
        $user_id = self::userId();
        if($user_id <= 0) throw new Exception("user_unidentified", QN_ERROR_NOT_ALLOWED);

        // retrieve action object
        $action_id = self::actionId($action_name);
        if($action_id <= 0) throw new Exception("action_unknown", QN_ERROR_INVALID_PARAM);
        
        // retrieve action data
        $res = $om->read('resiway\Action', $action_id, ['badges_ids']);
        if($res < 0 || !isset($res[$action_id])) return $notifications;    
        $action_data = $res[$action_id];

        // retrieve author 
        $res = $om->read($object_class, $object_id, ['creator']);
        if(!is_array($res) || !isset($res[$object_id])) return $notifications;
        $author_id = $res[$object_id]['creator'];
        
        // get badges impacted by current action
        $users_badges_ids = $om->search('resiway\UserBadge', [['badge_id', 'in', $action_data['badges_ids']], ['user_id', 'in', array($user_id, $author_id)]]);
        if($users_badges_ids < 0 || !count($users_badges_ids)) return $notifications;

        // remove badges already awarded from result list
        $res = $om->read('resiway\UserBadge', $users_badges_ids);
        if($res < 0) return $notifications; 
        foreach($users_badges_ids as $key => $user_badge_id) {
            if($res[$user_badge_id]['awarded']) unset($users_badges_ids[$key]);
        }
        
        // force re-computing values of impacted badges
        $om->write('resiway\UserBadge', $users_badges_ids, array('status' => null));
        $res = $om->read('resiway\UserBadge', $users_badges_ids, ['user_id', 'badge_id', 'status', 'badge_id.type', 'badge_id.name']);
        if($res < 0) return $notifications; 
        
        // check for newly awarded badges
        foreach($res as $user_badge_id => $user_badge) {
            // remove non-awarded badges from list
            if($user_badge['status'] < 1) unset($res[$user_badge_id]);
        }
        
        // mark all newly awarded badges at once
        $om->write('resiway\UserBadge', array_keys($res), array('awarded' => '1'));
        // keep track of user badges-counts update
        $bagdes_increment = array(1 => 0, 2 => 0, 3 => 0);
        // do some treatment to inform user that a new badge has been awarded to him
        foreach($res as $user_badge_id => $user_badge) {
            ++$bagdes_increment[ $user_badge['badge_id.type'] ];
            $uid = $user_badge['user_id'];
            $bid = $user_badge['badge_id'];
// todo : make this multilang and manage email sending according to user settings            
            $notification_id = self::notifyUser($uid, 
                                                "new badge awarded", 
                                                "Congratulations ! You've just been awarded badge '{$user_badge['badge_id.name']}'"
                                                );
            if($notification_id > 0) {
                $notifications[] = ['id' => $notification_id, 'title' => "new badge awarded"];
            }                       
        }
        // update user badges-counts, if any
        if(count($res)) {            
            $res = $om->read('resiway\User', $user_id, ['count_badges_1','count_badges_2','count_badges_3']);
            if($res > 0 && isset($res[$user_id])) {
                $om->write('resiway\User', $user_id, [ 
                                                        'count_badges_1'=> $res[$user_id]['count_badges_1']+$bagdes_increment[1],
                                                        'count_badges_2'=> $res[$user_id]['count_badges_2']+$bagdes_increment[2],
                                                        'count_badges_3'=> $res[$user_id]['count_badges_3']+$bagdes_increment[3] 
                                                     ]);
            }
        }        

        return $notifications;
    }


    
    /**
    *
    * This method throws an error if some rule is broken or if something goes wrong
    * 
    * @param string     $action_name
    * @param string     $object_class
    * @param integer    $object_id
    * @param string     $toggle             indicates the kind of action (repeated actions or toggle between on and off / performed - not performed)
    * @param array      $fields             fields that are going to be impacted by the action (and therefore need to be loaded)
    * @param array      $limitations        array of functions that will raise an error in case some constrainst is violated
    * @param string     $concurrent_action  name of the concurrent action, if any (by default this pram is set to null)
    * @param function   $do                 operations to perform by default
    * @param function   $undo               operations to perform in case of toggle (undo action) or concurrent action has already be performed (undo concurrent action)
    */ 
    public static function performAction(
                                        $action_name, 
                                        $object_class, 
                                        $object_id,
                                        $object_fields = [],                                        
                                        $toggle = false,
                                        $concurrent_action = null,                                        
                                        $do = null,
                                        $undo = null,        
                                        $limitations = []) {
        
        $result = true;
        
        $om = &ObjectManager::getInstance();
                    
        // 0) retrieve parameters 
        
        // retrieve object data (making sure defaults fields are loaded)
        if($object_id > 0) {
            $res = $om->read($object_class, $object_id, array_merge(['id', 'creator', 'created', 'modified', 'modifier'], $object_fields));
            if($res < 0 || !isset($res[$object_id])) throw new Exception("object_unknown", QN_ERROR_INVALID_PARAM);   
        }
        
        // retrieve current user identifier
        $user_id = self::userId();
        if($user_id <= 0) throw new Exception("user_unidentified", QN_ERROR_NOT_ALLOWED);

        // retrieve action object
        $action_id = self::actionId($action_name);
        if($action_id <= 0) throw new Exception("action_unknown", QN_ERROR_INVALID_PARAM);

        // retrieve concurrent action, if any            
        if(isset($concurrent_action)) {
            $concurrent_action_id = self::actionId($concurrent_action);
        }
        
        // 1) check rights
        
        if(!self::isActionAllowed($user_id, $action_id, $object_class, $object_id)) {
            throw new Exception("user_reputation_insufficient", QN_ERROR_NOT_ALLOWED);  
        }
        
        // 2) check action limitations
        
        foreach($limitations as $limitation) {
            if(is_callable($limitation)) {
                call_user_func($limitation, $om, $user_id, $action_id, $object_class, $object_id);
            }
        }

        // 3) & 4) log/unlog action and update reputation
        
        // determine which operation has to be performed ($do or $undo)        
        if($toggle
           && self::isActionRegistered($user_id, $action_id, $object_class, $object_id)) {
            self::unregisterAction($user_id, $action_id, $object_class, $object_id);        
            $result = $undo($om, $user_id, $object_class, $object_id);                    
        }
        else {
            if(isset($concurrent_action_id) 
               && self::isActionRegistered($user_id, $concurrent_action_id, $object_class, $object_id)) {
                self::unregisterAction($user_id, $concurrent_action_id, $object_class, $object_id);        
                $result = $undo($om, $user_id, $object_class, $object_id);
            }
            else {
                self::registerAction($user_id, $action_id, $object_class, $object_id);        
                $result = $do($om, $user_id, $object_class, $object_id);
// todo : notify author about changes
// une action a été réalisée sur une de vos contributions : 
// [action_name] : 'user.display_name' répondu / commenté votre question
            }
        }
        
        return $result;
    }
    
}