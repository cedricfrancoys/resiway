<?php
/*  resiway\Api.class.php - Service holding helper methods for controllers of the Resipedia project

    This file is part of the Resipedia project <http://www.github.com/cedricfrancoys/resipedia>
    Some Rights Reserved, Cedric Francoys, 2018, Yegen
    Licensed under GNU GPL 3 license <http://www.gnu.org/licenses/>

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
namespace resiway;

use qinoa\organic\Service;
use qinoa\html\HtmlTemplate;

use resiexchange\Question;
use resiexchange\QuestionComment;
use resiexchange\Answer;
use resiexchange\AnswerComment;

class Api extends Service {
      
    protected function __construct() {    
    }

    /**
     * Adds a message to the spool (email queue)
     *
     *
     */
    public function spool($user_id, $subject, $body) {
        // spool_flush script is run by cron to send emails every 5 minutes        
        // message files format : 
        // 11 digits with leading zeros (user unique identifier) with 3 digits extension in case of multiple files for same user
        $temp = sprintf("%011d", $user_id);
        $filename = $temp;
        $i = 0;
        while(file_exists(EMAIL_SPOOL_DIR."/{$filename}")) {
            $filename = sprintf("%s.%03d", $temp, ++$i);
        }
        // data consists of parsed template and subject (JSON formatted)
        return file_put_contents(EMAIL_SPOOL_DIR."/$filename", json_encode(array("subject" => $subject, "body" => $body), JSON_PRETTY_PRINT));
    }    
    
    /**
     * Creates a notification (title and html body) based on template and lang
     *
     * @param $data  array   an array holding a 'user' entry with (at least) a 'id' index
     *
     * @return
     */
    public function getUserNotification($template_id, $lang, $data) {
        
        $makeLink = function ($object_class, $object_id) {
            switch($object_class) {
                case 'resiway\User':                    
                    return '#!/user/'.$object_id;                    
                case 'resiway\Category':                
                    return '#!/category/'.$object_id;
                case 'resiway\Badge':    
                    return '#!/badge/'.$object_id;                
                case 'resiexchange\Question':          
                    return '#!/question/'.$object_id;                    
                case 'resiexchange\Answer':
                    $answer = Answer::id($object_id)->read(['id', 'question_id'])->first();
                    return '#!/question/'.$answer['question_id'].'#answer-'.$comment['id'];                    
                case 'resiexchange\QuestionComment':
                    $comment = QuestionComment::id($object_id)->read(['id', 'question_id'])->first();
                    return '#!/question/'.$comment['question_id'].'#comment-'.$comment['id'];                    
                case 'resiexchange\AnswerComment':
                    $comment = AnswerComment::id($object_id)->read(['id', 'answer_id' => ['id', 'question_id']])->first();
                    return '#!/question/'.$comment['answer_id']['question_id'].'#answer-'.$comment['answer_id']['id'].'-comment-'.$comment['id'];
            }
            return '';
        };

        // subject of the email should be defined in the template, as a <var> tag holding a 'title' attribute
        $subject = '';
        $body = '';
        
        // read template according to user prefered language
        $file = "packages/resiway/i18n/{$lang}/{$template_id}.html";
        if( ($html = @file_get_contents($file, FILE_TEXT)) ) {
            $template = new HtmlTemplate($html, 
                                        // renderer is in charge of resolving vars common to all templates
                                        [
                                        'subject'		    =>	function ($params, $attributes) use (&$subject) {
                                                $subject = date("d/m/Y").' @ '.date("H:i").', '.$attributes['title'];
                                                return '';
                                        },
                                        'url_object'	    =>	function ($params, $attributes) use($makeLink) {
                                                $link = $makeLink($params['object_class'], $params['object_id']);
                                                return "<a href=\"https://www.resiway.org/resiexchange.fr{$link}\">{$attributes['title']}</a>";
                                        },                                                        
                                        'url_profile'	    =>	function ($params, $attributes) {
                                                return "<a href=\"https://www.resiway.org/resiexchange.fr#!/user/profile/{$params['user']['id']}\">{$attributes['title']}</a>";
                                        },
                                        'url_profile_edit'	=>	function ($params, $attributes) {
                                                return "<a href=\"https://www.resiway.org/resiexchange.fr#!/user/edit/{$params['user']['id']}\">{$attributes['title']}</a>";
                                        }                                        
                                        ], 
                                        // remaining data is given in the $data parameter
                                        $data);
            // parse template as html
            $body = $template->getHtml();
        }
        return array("subject" => $subject, "body" => $body);
    }

    /**
     * @param integer    $user_id   identifier of the user to which notification is addressed
     * @param string     $type      type of notification (reputation_update, badge_awarded, question_answered, question_commented, answer_commented)
     * @param string     $title     short title describing the notice
     * @param string     $content   html to be displayed (whatever the media)
     */
    public function userNotify($user_id, $type, $notification) {
        $om = $this->container->get('orm');
        $user_data = User::id($user_id)->read(User::getUserPrivate())->first();
        // if notification has to be sent by email, store message in spool
        if( isset($user_data['notify_'.$type]) && $user_data['notify_'.$type] ) {
            $this->spool($user_id, $notification['subject'], $notification['body']);  
        }
        // in case we decide to send emails, here is the place to add something to user queue
        $notification_id = $om->create('resiway\UserNotification', [  
            'user_id'   => $user_id, 
            'title'     => $notification['subject'], 
            'content'   => $notification['body']
        ]);
        // return identifier of the newly created notification
        return $notification_id;
    }
    
    /**
     * Retrieves history of action(s) performed by current user on specified object(s)
     *
     * @param $object_class string  class of the objects we request the history for
     * @param $object_ids   mixed   single object identifier (integer) or an array of identifiers
     *
     * @return array map of action names (ex.: ['resiexchange_question_votedown', 'resiexchange_comment_voteup'])
     */
    public function history($object_class, $object_ids) {
        $history = [];
        // retrieve required services
        list($om, $auth) = $this->container->get(['orm', 'auth']);
        // get current user id
        $user_id = $auth->userId();
        // force $object_ids to an array (single object id is accepted)
        if(!is_array($object_ids)) $object_ids = (array) $object_ids;
        // init $history array to prevent returning a null result
        foreach($object_ids as $object_id) $history[$object_id] = [];
        if($user_id > 0 && count($object_ids)) {
            $actionlogs_ids = $om->search('resiway\ActionLog', [
                                ['user_id',     '=', $user_id],
                                ['object_class','=', $object_class], 
                                ['object_id',   'in', $object_ids]
                            ]);
            if($actionlogs_ids > 0) {
                // retrieve logs 
                $actionLogs = $om->read('resiway\ActionLog', $actionlogs_ids, ['action_id', 'object_id']);
                if($actionLogs > 0) {
                    $actions_ids = array_map(function ($a) { return $a['action_id']; }, $actionLogs);
                    // bulk read all related actions 
                    $actions = $om->read('resiway\Action', $actions_ids, ['name']);
                    if($actions > 0) {
                        foreach($actionLogs as $actionLog_id => $actionLog) {
                            $history[$actionLog['object_id']][$actions[$actionLog['action_id']]['name']] = true;                        
                        }
                    }
                }
            }
        }
        return $history;
    }

    /**
     * Increments by one the value of the records having key matching given mask
     */
    public function increment($key_mask, $diff=1) {
        $diff = intval($diff);
        $om = $this->container->get('orm'); 
        $db = $om->getDBHandler();       
        $db->sendQuery("UPDATE `resiway_repository` SET `value` = `value`+{$diff} WHERE `key` like '$key_mask';");
    }
    
    /**
     * Resolves given action name to its related object identifier.
     *
     * @param    string  $action_name    name of the action to resolve
     * @return   integer action identifier or QN_ERROR_INVALID_PARAM if action is unknonwn
     */
    public function actionId($action_name) {
        static $actions_map = [];
        
        if(!isset($actions_map[$action_name])) {        
            $om = $this->container->get('orm');         
            $res = $om->search('resiway\Action', ['name', '=', $action_name]);
            if($res < 0 || !count($res)) return QN_ERROR_INVALID_PARAM;
            $actions_map[$action_name] = $res[0];
        }
        return $actions_map[$action_name];
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
     * @return   array    returns an array holding user and author respective ids and increments
     */      
    private function impactReputation($user_id, $action_id, $object_class, $object_id, $sign=1) {
        $result = ['user' => ['id' => $user_id, 'increment' => 0], 'author' => ['id' => 0, 'increment' => 0]];
        
        $om = $this->container->get('orm');  

        // retrieve author identifier
        $res = $om->read($object_class, $object_id, ['creator']);
        if($res > 0 && isset($res[$object_id])) {
            $result['author']['id'] = $res[$object_id]['creator'];
        }
        
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
                        $new_reputation = $user_data['reputation']+$result['user']['increment'];
                        // prevent reputation from dropping below 1 (which would prevent user from taking any action)
                        if($new_reputation < 1) $new_reputation = 1;
                        $om->write('resiway\User', $user_id, array('reputation' => $new_reputation));
                    }
                }
            }
            
            if($action_data['author_increment'] != 0) {
                // retrieve author data (creator of targeted object)
                $author_id = $result['author']['id'];
                $res = $om->read('resiway\User', $author_id, ['verified', 'reputation']);        
                if($res > 0 && isset($res[$author_id])) {    
                    $author_data = $res[$author_id];            
                    // prevent reputation update for non-verified users
                    if($author_data['verified']) {                    
                        $result['author']['increment'] = $sign*$action_data['author_increment'];
                        $new_reputation = $author_data['reputation']+$result['author']['increment'];
                        // prevent reputation from dropping below 1 (which would prevent user from taking any action)                        
                        if($new_reputation < 1) $new_reputation = 1;
                        $om->write('resiway\User', $author_id, array('reputation' => $new_reputation));
                    }
                }

            }
        }
        return $result;
    }
    
    /**
     * Tells if given user is allowed to perform given action.
     *
     * An action is granted to a user if its reputation is higher or equal than what the action specifies.
     *
     * @param    integer  $user_id       identifier of the user performing the action
     * @param    integer  $action_id     identifier of the action being performed
     * @param    string   $object_class  class of the targeted object (ex. 'resiexchange\Question')
     * @param    integer  $object_id     identifier of the object on which action is performed    
     * @return   boolean    Returns true uppon success, false if given user or action is unknown
     */    
    public function isActionAllowed($user_id, $action_id, $object_class, $object_id) {
        // check params consistency
        if($user_id <= 0 || $action_id <= 0) return false;
       
        $om = $this->container->get('orm');  

        if($object_id > 0) {
            // retrieve object data 
            $res = $om->read($object_class, $object_id, ['id', 'creator']);
            if($res < 0 || !isset($res[$object_id])) return false;
            
            // unless specified in action limitations, all actions are granted on an object owner
            if($user_id == $res[$object_id]['creator']) return true;
            // users have full access on their own profile
            if($object_class == 'resiway\User' && $user_id == $object_id) return true;
        }
        
        // read user data
        $res = $om->read('resiway\User', $user_id, ['reputation', 'role']);        
        if($res < 0 || !isset($res[$user_id])) return false;
        $user_data = $res[$user_id];
        
        // all actions are granted to admin users
        if($user_data['role'] == 'a') return true;
        // most actions are granted to moderators         
        if($user_data['role'] == 'm') {
            if(!isset($user_data['reputation']) || $user_data['reputation'] < 10000) {
                $user_data['reputation'] = 10000;
            }
        }
        
        // read action data 
        // (as this is the first call in the action proccessing logic, we load all fields that will be required later on)
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
     * @param    mixed    $action        action name or identifier of the action being performed
     * @param    string   $object_class  class of the targeted object (ex. 'resiexchange\Question')
     * @param    integer  $object_id     identifier of the object on which action is performed
     *
     * @return   boolean
     */
    public function isActionRegistered($user_id, $action, $object_class, $object_id) {
        
        // retrieve action object identifier
        $action_id = intval($action);
        if($action_id == 0) {
            // if we received a string, try to resolve action name
            $action_id = $this->actionId($action);            
        }
        
        // check params consistency
        if($user_id <= 0 || $action_id <= 0) return false;
             
        $om = $this->container->get('orm'); 
        
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
     *
     * @return   boolean  returns true if operation succeeds, false otherwise.   
     */
    public  function registerAction($user_id, $action_name, $object_class, $object_id) {        
        // retrieve action identifier
        $action_id = $this->actionId($action_name);

        // check params consistency
        if($user_id <= 0 || $action_id <= 0 || $object_id <= 0) return false;
        
        $impact = $this->impactReputation($user_id, $action_id, $object_class, $object_id, 1);
        $author_id = $impact['author']['id'];
        
        $om = $this->container->get('orm');  
        
        // register action
        $actionlog_id = $om->create('resiway\ActionLog', [
                        'user_id'               => $user_id,
                        'author_id'             => $author_id,
                        'action_id'             => $action_id, 
                        'object_class'          => $object_class, 
                        'object_id'             => $object_id,
                        'user_increment'        => $impact['user']['increment'],
                        'author_increment'      => $impact['author']['increment']
                       ]);

        // update current user's pending actions list
        // we'll need to be able to provide js-client with pending actions (for badges update)        
/*        
        $pdm = &PersistentDataManager::getInstance();
        $pdm->set('actions', array_merge($pdm->get('actions', []), [$actionlog_id]));
*/
        // do not notify user about his own actions
        if($user_id == $author_id) return true;
        
        // handle notifications
        $user_data = User::id($user_id)->read(array_merge(User::getPrivateFields(), User::getPublicFields()))->first();
        $author_data = User::id($author_id)->read(array_merge(User::getPrivateFields(), User::getPublicFields()))->first();

        $res = $om->read($object_class, $object_id, ['id', 'name']);
        $object = $res[$object_id];
        
        // build array that will hold the data for the message
        $data = [
            'user'          => $user_data,
            'author'        => $author_data,
            'object'        => $object,
            'object_id'     => $object_id,
            'object_class'  => $object_class            
        ];        
                
        // handle notifiable actions 
        switch($action_name) {
        case 'resiexchange_question_answer':
            $notification = $this->getUserNotification('notification_question_answer', $author_data['language'], $data);
            $this->userNotify($author_id, 'question_answer', $notification);
            break;
        case 'resiexchange_question_comment':
            $notification = $this->getUserNotification('notification_question_comment', $author_data['language'], $data);
            $this->userNotify($author_id, 'question_comment', $notification);        
            break;
        case 'resiexchange_answer_comment':
            $notification = $this->getUserNotification('notification_answer_comment', $author_data['language'], $data);
            $this->userNotify($author_id, 'answer_comment', $notification);        
            break;
        }
        
        // notify users if there is any reputation change 
        if($impact['user']['increment'] != 0) {
            $data['reputation_increment'] = sprintf("%+d", $impact['user']['increment']);
            $notification = $this->getUserNotification('notification_reputation_update', $user_data['language'], $data);
            $this->userNotify($user_id, 'reputation_update', $notification);            
        }
        if($impact['author']['increment'] != 0) {
            $data['user'] = $author_data;
            $data['reputation_increment'] = sprintf("%+d", $impact['author']['increment']);
            $this->userNotify( $author_id, 
                              'reputation_update', 
                              $this->getUserNotification('notification_reputation_update', $author_data['language'], $data)
                             );
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
     *
     * @return   boolean  returns true if operation succeeds, false otherwise.
     */
    public function unregisterAction($user_id, $action_name, $object_class, $object_id) {
        // retrieve action identifier
        $action_id = $this->actionId($action_name);
        
        // check params consistency
        if($user_id <= 0 || $action_id <= 0 || $object_id <= 0) return false;
        
        $impact = $this->impactReputation($user_id, $action_id, $object_class, $object_id, -1);
        $author_id = $impact['author']['id'];
        
        $om = $this->container->get('orm');

        // 1) remove related action logs
        
        $log_ids = $om->search('resiway\ActionLog', [
                                    ['user_id',      '=', $user_id], 
                                    ['action_id',    '=', $action_id], 
                                    ['object_class', '=', $object_class], 
                                    ['object_id',    '=', $object_id]
                                ], 'created', 'desc');
                   
        if($log_ids < 0 || !count($log_ids)) return;
        
        $res = $om->remove('resiway\ActionLog', $log_ids, true);        

        // 2) handle notifications

        $user_data = User::id($user_id)->read(array_merge(User::getPrivateFields(), User::getPublicFields()))->first();
        $author_data = User::id($author_id)->read(array_merge(User::getPrivateFields(), User::getPublicFields()))->first();
        
        // build array that will hold the data for the message
        $data = [
            'user'          => $user_data,
            'author'        => $author_data
        ];
        
        // notify users if there is any reputation change 
        if($impact['user']['increment'] != 0) {
            $data['reputation_increment'] = sprintf("%+d", $impact['user']['increment']);
            $notification = $this->getUserNotification('notification_reputation_update', $user_data['language'], $data);
            $this->userNotify($user_id, 'reputation_update', $notification);            
        }
        if($impact['author']['increment'] != 0) {
            $data['user'] = $author_data;
            $data['reputation_increment'] = sprintf("%+d", $impact['author']['increment']);
            $notification = $this->getUserNotification('notification_reputation_update', $author_data['language'], $data);            
            $this->userNotify($author_id, 'reputation_update', $notification);            
        }
        
        return true;
    }
    
    /**
     * Performs the requested action on given object.
     * This method throws an error if some rule is broken or if something goes wrong
     * 
     * @param mixed      $action_name
     * @param string     $object_class
     * @param integer    $object_id
     * @param string     $toggle             indicates the kind of action (repeated actions or toggle between on and off / performed - not performed)
     * @param array      $fields             fields that are going to be impacted by the action (and therefore need to be loaded)
     * @param array      $limitations        array of functions that will raise an error in case some constrainst is violated
     * @param function   $do                 operations to perform by default
     * @param function   $undo               operations to perform in case of toggle (undo action) or concurrent action has already be performed (undo concurrent action)
     *
     * @return mixed    Returns either true (bool), or the result of $do or $undo function, when applicable
     */ 
    public function performAction(
                                    $action_name, 
                                    $object_class, 
                                    $object_id,
                                    $object_fields = [],                                        
                                    $toggle = false,
                                    $do = null,
                                    $undo = null,        
                                    $limitations = [] ) {
    
        $result = true;       
        $om = $this->container->get('orm');  
                    
        // 0) retrieve parameters 
        
        // retrieve object data (and make sure defaults fields are loaded)
        if($object_id > 0) {
            $res = $om->read($object_class, $object_id, array_merge(['id', 'creator', 'created', 'modified', 'modifier'], $object_fields));
            if($res < 0 || !isset($res[$object_id])) throw new \Exception("object_unknown", QN_ERROR_INVALID_PARAM);   
        }
        
        // retrieve current user identifier
        $user_id = $this->container->get('auth')->userId();        
        if($user_id <= 0) throw new \Exception("user_unidentified", QN_ERROR_NOT_ALLOWED);

        // retrieve action object
        $action_id = $this->actionId($action_name);
        if($action_id <= 0) throw new \Exception("action_unknown", QN_ERROR_INVALID_PARAM);
        
        // 1) check reputation
        
        if(!$this->isActionAllowed($user_id, $action_id, $object_class, $object_id)) {
            throw new \Exception("user_reputation_insufficient", QN_ERROR_NOT_ALLOWED);  
        }
        
        // 2) check action limitations
        
        foreach($limitations as $limitation) {
            if(is_callable($limitation)) {
                call_user_func($limitation, $om, $user_id, $action_id, $object_class, $object_id);
            }
        }

        // 3) & 4) toggle (log/unlog) action and update reputation accordingly
        
        // determine which operation has to be performed ($do or $undo)        
        if($toggle && $this->isActionRegistered($user_id, $action_id, $object_class, $object_id)) {
            $this->unregisterAction($user_id, $action_name, $object_class, $object_id);        
            $result = $undo($om, $user_id, $object_class, $object_id);                    
        }
        else {
            $result = $do($om, $user_id, $object_class, $object_id);
            if($object_id == 0 && isset($result['id'])) $object_id = $result['id'];
            $this->registerAction($user_id, $action_name, $object_class, $object_id);            
        }
  
        return $result;
    }    
}