<?php
use easyobject\orm\ObjectManager as ObjectManager;
use easyobject\orm\PersistentDataManager as PersistentDataManager;

// these utilities require inclusion of main configuration file 
require_once('qn.lib.php');

class ResiAPI {

    // Converts a SQL formatted date to ISO 8601
    public static function dateISO($sql_date) {
        $dateTime = DateTime::createFromFormat('Y-m-d H:i:s', $sql_date);
        return date("c", $dateTime->getTimestamp());
    }
    
    /**
    * Retrieves current user identifier.
    * If user is not logged in, returns 0 (GUEST_USER_ID)
    *
    * @return   integer
    */
    public static function userId() {
        $pdm = &PersistentDataManager::getInstance();
        return $pdm->retrieve('user_id', 0);
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
        
        if(isset($actionTable[$action_name])) return $actionTable[$action_name];
        
        $om = &ObjectManager::getInstance();
        
        $res = $om->search('resiway\Action', ['name', '=', $action_name]);
        if($res < 0 || !count($res)) return QN_ERROR_INVALID_PARAM;
        $actionTable[$action_name] = $res[0];
        
        return $res[0];
    }

    /**
    * Provides an array holding fields names holding public information
    * This array is used n order to determine which data is public.
    *
    */
    public static function userPublicFields() {
        return ['id', 
                'display_name', 
                'picture', 
                'reputation', 
                'count_badges_1', 
                'count_badges_2', 
                'count_badges_3'
               ];
    }
    
    public static function loadUser($user_id) {
        // check params consistency
        if($user_id <= 0) return QN_ERROR_INVALID_PARAM;        
        
        $om = &ObjectManager::getInstance();        
        
        $res = $om->read('resiway\User', $user_id, self::userPublicFields() );        
        if($res < 0 || !isset($res[$user_id])) return QN_ERROR_UNKNOWN_OBJECT;    
        return $res[$user_id];        
    }
    
    /**
    * Tells if given user is allowed to perform given action.
    * If given user or action is unknown, returns false
    *
    * @param    integer  $user_id    identifier of the user performing the action
    * @param    integer  $action_id  identifier of the action being performed
    * @return   boolean 
    */    
    public static function isActionAllowed($user_id, $action_id) {
        // check params consistency
        if($user_id <= 0 || $action_id <= 0) return false;

        $om = &ObjectManager::getInstance();
        
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
        
        // check reputation
        if($action_data['required_reputation'] > $user_data['reputation']) return false;

        // action is allowed
        return true;
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
        $om = &ObjectManager::getInstance();

        if($om->create('resiway\ActionLog', [
                        'user_id'       => $user_id, 
                        'action_id'     => $action_id, 
                        'object_class'  => $object_class, 
                        'object_id'     => $object_id
                       ]) <= 0) {
            return false;
        }            
        
        return true;
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
        $om = &ObjectManager::getInstance();

        $log_ids = $om->search('resiway\ActionLog', [
                                    ['user_id',      '=', $user_id], 
                                    ['action_id',    '=', $action_id], 
                                    ['object_class', '=', $object_class], 
                                    ['object_id',    '=', $object_id]
                                ], 'created', 'desc');
                   
        if($log_ids < 0 || !count($log_ids)) return false;
        
        $res = $om->remove('resiway\ActionLog', $log_ids[0], true);
        if(!in_array($log_ids[0], $res)) return false;
        
        return true;
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
    * Reflects performed action on user's and object author's reputations
    * by action increment or its opposite, according to $sign parameter
    *
    * @param    integer  $user_id       identifier of the user performing the action
    * @param    integer  $action_id     identifier of the action being performed
    * @param    string   $object_class  class of the targeted object (ex. 'resiexchange\Question')
    * @param    integer  $object_id     identifier of the object on which action is performed
    * @param    integer  $sign          +1 for incrementing reputation, -1 to decrement it
    * @return   boolean  returns true on succes, false if something went wrong
    */      
    private static function impactReputation($user_id, $action_id, $object_class, $object_id, $sign=1) {    
        // check params consistency
        if($user_id <= 0 || $action_id <= 0 || $object_id <= 0) return false;
        
        $om = &ObjectManager::getInstance();

        // retrieve action data
        $res = $om->read('resiway\Action', $action_id, ['user_increment', 'author_increment']);
        if($res < 0 || !isset($res[$action_id])) return false;    
        $action_data = $res[$action_id];
        
        if($action_data['user_increment'] != 0) {
            // retrieve user data
            $res = $om->read('resiway\User', $user_id);
            if($res < 0 || !isset($res[$user_id])) return false;          
            $user_data = $res[$user_id];
            $om->write('resiway\User', $user_id, array('reputation' => $user_data['reputation']+($sign*$action_data['user_increment'])));            
        }
        
        if($action_data['author_increment'] != 0) {
            // retrieve author data (creator of targeted object)
            $res = $om->read($object_class, $object_id, ['creator']);
            if(!is_array($res) || !isset($res[$object_id])) return false;
            $author_id = $res[$object_id]['creator'];
            $res = $om->read('resiway\User', $author_id, ['reputation']);        
            if(!is_array($res) || !isset($res[$author_id])) return false;    
            $author_data = $res[$author_id];            
            $om->write('resiway\User', $author_id, array('reputation' => $author_data['reputation']+($sign*$action_data['author_increment'])));        
        }
            
        return true;
    }
    
    /**
    * Reflects performed action on user's and object author's reputations
    *
    * @param    integer  $user_id       identifier of the user performing the action
    * @param    integer  $action_id     identifier of the action being performed
    * @param    string   $object_class  class of the targeted object (ex. 'resiexchange\Question')
    * @param    integer  $object_id     identifier of the object on which action is performed
    * @return   boolean  returns true on succes, false if something went wrong
    */    
    public static function applyActionOnReputation($user_id, $action_id, $object_class, $object_id) {
        return self::impactReputation($user_id, $action_id, $object_class, $object_id, 1);
    }

    /**
    * Undo reflection of action on user's and object author's reputations
    *
    * @param    integer  $user_id       identifier of the user performing the action
    * @param    integer  $action_id     identifier of the action being performed
    * @param    string   $object_class  class of the targeted object (ex. 'resiexchange\Question')
    * @param    integer  $object_id     identifier of the object on which action is performed
    * @return   boolean  returns true on succes, false if something went wrong
    */     
    public static function unapplyActionOnReputation($user_id, $action_id, $object_class, $object_id) {
        return self::impactReputation($user_id, $action_id, $object_class, $object_id, -1);        
    }
    
    /**
    * Updates badges status for user and object author.
    * Note: once a badge has been awarded it will never be withrawn.
    *
    * @param    string   $action_name   name of the action being performed
    * @param    string   $object_class  class of the targeted object (ex. 'resiexchange\Question')
    * @param    integer  $object_id     identifier of the object on which action is performed
    *
    * @return   boolean  returns true on succes, false if something went wrong
    */     
    public static function updateBadges($action_name, $object_class, $object_id) {
        $notifictions = [];
                
        $om = &ObjectManager::getInstance();

        // retrieve user object
        $user_id = self::userId();
        if($user_id <= 0) throw new Exception("user_unidentified", QN_ERROR_NOT_ALLOWED);

        // retrieve action object
        $action_id = self::actionId($action_name);
        if($action_id <= 0) throw new Exception("action_unknown", QN_ERROR_INVALID_PARAM);
        
        // retrieve action data
        $res = $om->read('resiway\Action', $action_id, ['badges_ids']);
        if($res < 0 || !isset($res[$action_id])) return $notifictions;    
        $action_data = $res[$action_id];

        // retrieve author 
        $res = $om->read($object_class, $object_id, ['creator']);
        if(!is_array($res) || !isset($res[$object_id])) return $notifictions;
        $author_id = $res[$object_id]['creator'];
        
        // get badges impacted by current action
        $users_badges_ids = $om->search('resiway\UserBadge', [['badge_id', 'in', $action_data['badges_ids']], ['user_id', 'in', array($user_id, $author_id)]]);
        if($users_badges_ids < 0 || !count($users_badges_ids)) return $notifictions;

        // remove badges already awarded from result list
        $res = $om->read('resiway\UserBadge', $users_badges_ids);
        if($res < 0) return $notifictions; 
        foreach($users_badges_ids as $key => $user_badge_id) {
            if($res[$user_badge_id]['awarded']) unset($users_badges_ids[$key]);
        }
        
        // force re-computing values of impacted badges
        $om->write('resiway\UserBadge', $users_badges_ids, array('status' => null));
        $res = $om->read('resiway\UserBadge', $users_badges_ids, ['user_id', 'badge_id', 'status', 'badge_id.name']);
        if($res < 0) return $notifictions; 
        
        // check for newly awarded badges
        foreach($res as $user_badge_id => $user_badge) {
            // remove non-awarded badges from list
            if($user_badge['status'] < 1) unset($res[$user_badge_id]);
        }
        
        // mark all newly awarded badges at once
        $om->write('resiway\UserBadge', array_keys($res), array('awarded' => '1'));
        // do some treatment to inform user that a new badge has been awarded to him
        foreach($res as $user_badge_id => $user_badge) {
            $uid = $user_badge['user_id'];
            $bid = $user_badge['badge_id'];
            $notification_id = $om->create('resiway\UserNotification', [  
                'user_id'   => $uid, 
                'title'     => "new badge awarded", 
                'content'   => "Congratulations ! You've just been awarded badge {$user_badge['badge_id.name']}"
            ]);
            if($notification_id > 0) {
                $notifictions[] = ['id' => $notification_id, 'title' => "new badge awarded"];
            }                       
        }   

        return $notifictions;
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
        $res = $om->read($object_class, $object_id, array_merge(['id', 'creator', 'created', 'modified', 'modifier'], $object_fields));
        if($res < 0 || !isset($res[$object_id])) throw new Exception("object_unknown", QN_ERROR_INVALID_PARAM);
        $object_data = $res[$object_id];        

        // retrieve user object
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
        
        if(!self::isActionAllowed($user_id, $action_id)) {
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
            self::unapplyActionOnReputation($user_id, $action_id, $object_class, $object_id);
            $result = $undo($om, $user_id, $object_class, $object_id);                    
        }
        else {
            if(isset($concurrent_action_id) 
               && self::isActionRegistered($user_id, $concurrent_action_id, $object_class, $object_id)) {
                self::unregisterAction($user_id, $concurrent_action_id, $object_class, $object_id);        
                self::unapplyActionOnReputation($user_id, $concurrent_action_id, $object_class, $object_id);
                $result = $undo($om, $user_id, $object_class, $object_id);
            }
            else {
                self::registerAction($user_id, $action_id, $object_class, $object_id);        
                self::applyActionOnReputation($user_id, $action_id, $object_class, $object_id);
                $result = $do($om, $user_id, $object_class, $object_id);            
            }
        }
        
        return $result;
    }
    
}