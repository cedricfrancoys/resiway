<?php
namespace resiway;

use qinoa\text\TextTransformer as TextTransformer;


class User extends \easyobject\orm\Object {

    public static function getColumns() {
        return array(
            /* all objects must define a 'name' column (default is id) */
            'name'                      => array('type' => 'alias', 'alias' => 'display_name'),
            
            'verified'                  => array('type' => 'boolean'),
        
            /* last time user signed in */
            'last_login'                => array('type' => 'datetime'),
            
            /* valid email of the user */
            'login'                     => array('type' => 'string'),
            
            'password'                  => array('type' => 'string'),
            
            /* origin of the user account (resiway, ekopedia, facebook, google, ...) */
            'account_type'              => array('type' => 'string'),
            
            'firstname'                 => array('type' => 'string', 'onchange' => 'resiway\User::resetDisplayName'),
            
            'lastname'                  => array('type' => 'string', 'onchange' => 'resiway\User::resetDisplayName'),
                                   
            /* URL to display user avatar (holding string '<size>' to be replaced with display size) */
            'avatar_url'                => array('type' => 'string'),

            /* might be set if user is an author (this act as link toward an Author object) */
            'author_id'                 => array('type' => 'many2one', 'foreign_object' => 'resiway\Author'),
            
            /*
             Possible values:
             1 : Full name (ex.: Cédric Françoys) [default]
             2 : Firstname and lastname initial (ex.: Cédric F.)
             3 : Firstname only (ex.: Cédric)
            */
            'publicity_mode'            => array('type' => 'integer', 'onchange' => 'resiway\User::resetDisplayName'),
            
            'display_name'              => array(
                                            'type'          => 'function',
                                            'result_type'   => 'string',
                                            'store'         => true, 
                                            'function'      => 'resiway\User::getDisplayName'
                                           ),
            /* display name URL-formatted (for links) */
            'name_url'                  => array(
                                            'type'          => 'function',
                                            'result_type'   => 'string',
                                            'store'         => true, 
                                            'function'      => 'resiway\User::getNameURL'
                                           ),
            
            'language'                  => array('type' => 'string'),
            'country'                   => array('type' => 'string'),
            'location'                  => array('type' => 'string'),

            'about'                     => array('type' => 'html'),
            
            'reputation'                => array('type' => 'integer'),

            // user role (roles are mutually exclusive): 
            // 'u'->user
            // 'm'->moderator
            // 'a'->admin 
            'role'                      => array('type' => 'string', 'selection' => ['u', 'm', 'a']),
            
            
            /* profile views */
            'count_views'               => array('type' => 'integer'),
            
            'count_questions'           => array('type' => 'integer'),
            'count_answers'             => array('type' => 'integer'),
            'count_comments'            => array('type' => 'integer'),    

            'count_documents'           => array('type' => 'integer'),
            
            'count_articles'            => array('type' => 'integer'),            
            
            // bronze
            'count_badges_1'            => array('type' => 'integer'),
            // silver
            'count_badges_2'            => array('type' => 'integer'),
            // gold
            'count_badges_3'            => array('type' => 'integer'),
            

            'notify_reputation_update'  => array('type' => 'boolean'),
            'notify_badge_awarded'      => array('type' => 'boolean'),
            'notify_question_answer'    => array('type' => 'boolean'),            
            'notify_question_comment'   => array('type' => 'boolean'),
            'notify_answer_comment'     => array('type' => 'boolean'),
            'notify_post_edit'          => array('type' => 'boolean'),
            'notify_post_flag'          => array('type' => 'boolean'),
            'notify_post_delete'        => array('type' => 'boolean'),
            'notify_updates'            => array('type' => 'boolean'),
            
            /* notifications delay (in days):
                0 : instant notify 
                1 : daily report
                7 : weekly report
               30 : monthly report
            */
            'notice_delay'              => array('type' => 'integer'),


            /* last time we sent a mail notice to the user */
            'last_notice'               => array('type' => 'datetime'),            
            
            'notifications_ids'         => array(
                                            'type'              => 'one2many', 
                                            'foreign_object'    => 'resiway\UserNotification', 
                                            'foreign_field'     => 'user_id',
                                            'order'             => 'created',
                                            'sort'              => 'desc'
                                           ),

            'favorites_ids'             => array(
                                            'type'              => 'one2many', 
                                            'foreign_object'    => 'resiway\UserFavorite', 
                                            'foreign_field'     => 'user_id'
                                           ),
                                   
            'user_badges_ids'           => array(
                                            'type'              => 'one2many', 
                                            'foreign_object'    => 'resiway\UserBadge', 
                                            'foreign_field'     => 'user_id'
                                           ),
                                   
            'user_favorites_ids'        => array(
                                            'type'              => 'one2many', 
                                            'foreign_object'    => 'resiway\UserFavorite', 
                                            'foreign_field'     => 'user_id'
                                           ),
          
            'badges_ids'                => array(
                                            'type'              => 'many2many', 
                                            'foreign_object'    => 'resiway\Badge', 
                                            'foreign_field'     => 'users_ids', 
                                            'rel_table'         => 'resiway_userbadge', 
                                            'rel_foreign_key'   => 'badge_id', 
                                            'rel_local_key'     => 'user_id'
                                            ),

            'questions_ids'             => array(
                                            'type'              => 'one2many', 
                                            'foreign_object'    => 'resiexchange\Question', 
                                            'foreign_field'     => 'creator'
                                           ),
                                                
            /* identifiers of the tags marked by user as favorite */
/*
// deprecated : use favorites_ids            
            'categories_ids'    => array(
                                    'type'                 => 'many2many', 
                                    'foreign_object'    => 'resiway\Category', 
                                    'foreign_field'        => 'users_ids', 
                                    'rel_table'            => 'resiway_rel_user_category', 
                                    'rel_foreign_key'    => 'category_id', 
                                    'rel_local_key'        => 'user_id'
                                    ),                                    
*/                                    
                                    
                                   
        );
    }

    public static function getUnique() {
        return array(
            ['login']
        );
    }
    
    public static function getDefaults() {
        return array(        
             'verified'                  => function() { return false; },             
             'reputation'                => function() { return 1; },
             'role'                      => function() { return 'u'; },
             'language'                  => function() { return 'fr'; },
             'country'                   => function() { return ''; },
             'location'                  => function() { return ''; },
             'publicity_mode'            => function() { return 1; },             
             'count_profile_views'       => function() { return 0; },
             'count_questions'           => function() { return 0; },
             'count_answers'             => function() { return 0; },
             'count_comments'            => function() { return 0; },
             'count_documents'           => function() { return 0; },             
             'count_badges_1'            => function() { return 0; },
             'count_badges_2'            => function() { return 0; },             
             'count_badges_3'            => function() { return 0; },
             'notify_reputation_update'  => function() { return true; }, 
             'notify_badge_awarded'      => function() { return true; }, 
             'notify_question_comment'   => function() { return true; }, 
             'notify_answer_comment'     => function() { return true; }, 
             'notify_question_answer'    => function() { return true; },
             'notify_post_edit'          => function() { return true; },
             'notify_post_flag'          => function() { return true; },
             'notify_post_delete'        => function() { return true; },
             'notify_updates'            => function() { return true; },
             'notice_delay'              => function() { return 0; }
        );
    }
    
    public static function getConstraints() {
        return array(
            'login'                => array(
                                    /* login must be a valid email address */
// todo : check taht this regexp still covers all domain names                                    
                                    'error_message_id' => 'user_invalid_login',
                                    'function' => function ($login) {
                                            return (bool) (preg_match('/^([_a-z0-9-]+)(\.[_a-z0-9-]+)*@([a-z0-9-]+)(\.[a-z0-9-]+)*(\.[a-z]{2,8})$/i', $login, $matches));
                                    }
                                ),
            'password'            => array(
                                    /* password must be a 32 bytes string in hexadecimal notation (MD5 hash) */
                                    'error_message_id' => 'user_invalid_password',
                                    'function' => function ($password) {
                                            return (bool) (preg_match('/^[a-z0-9]{32}$/i', $password, $matches));
                                    }
                                ),
                                
            'firstname'            => array(
                                    /* firstname must contain only letters or dashes */
                                    'error_message_id' => 'user_invalid_firstname',
                                    'function' => function ($firstname) {
                                            $value = htmlentities($firstname, ENT_QUOTES, 'UTF-8');
                                            $value = preg_replace('~&([a-z]{1,2})(acute|cedil|circ|grave|lig|orn|ring|slash|th|tilde|uml);~i', '$1', $value);
                                            $value = html_entity_decode($value, ENT_QUOTES, 'UTF-8');                                        
                                            return (bool) (preg_match("/^[a-z -.]+$/i", $value, $matches));
                                    }            
                                ),
            'lastname'            => array(
                                    /* lastname must contain only letters or spaces */
                                    'error_message_id' => 'user_invalid_lastname',
                                    'function' => function ($lastname) {
                                            if(!strlen($lastname)) return true;
                                            $value = htmlentities($lastname, ENT_QUOTES, 'UTF-8');
                                            $value = preg_replace('~&([a-z]{1,2})(acute|cedil|circ|grave|lig|orn|ring|slash|th|tilde|uml);~i', '$1', $value);
                                            $value = html_entity_decode($value, ENT_QUOTES, 'UTF-8');                                          
                                            return (bool) (preg_match("/^[a-z -.']+$/i", $value, $matches));
                                    }            
                                ),
            
            'language'            => array(
                                    /* language must be a valid ISO 639-1 code */
                                    'error_message_id' => 'user_invalid_language',
                                    'function' => function ($language) {
                                            return (bool) (preg_match('/^[a-z]{2}$/', $language, $matches));
                                    }
                                ),
            'country'            => array(
                                    /* country must be a valid ISO 3166 code */
                                    'error_message_id' => 'user_invalid_country',
                                    'function' => function ($country) {
                                            if(!strlen($country)) return true;
                                            return (bool) (preg_match('/^[A-Z]{2}$/', $country, $matches));
                                    }
                                ),                                                                
        );
    }
    
    public static function getPublicFields() {
        return ['id', 
                'created',
                'verified',
                'last_login',
                'display_name',
                'name_url',                
                'avatar_url',
                'about',
                'language', 
                'country', 
                'location',                
                'reputation',
                'role',
                'count_questions', 
                'count_views', 
                'count_answers', 
                'count_comments',              
                'count_badges_1', 
                'count_badges_2', 
                'count_badges_3'
        ];
    }

    public static function getPrivateFields() {
        return ['login', 
                'firstname',
                'lastname', 
                'publicity_mode',
                'notify_reputation_update',
                'notify_badge_awarded', 
                'notify_question_comment', 
                'notify_answer_comment', 
                'notify_question_answer',
                'notify_post_edit',
                'notify_post_flag',
                'notify_post_delete',
                'notify_updates',
                'notice_delay',
                'last_notice'
        ];
    }    
    
    public static function resetDisplayName($om, $oids, $lang) {
        $om->write('resiway\User', $oids, ['display_name' => null, 'name_url' => null]);
    }
    
    public static function getDisplayName($om, $oids, $lang) {
        $result = [];
        $res = $om->read('resiway\User', $oids, ['firstname', 'lastname', 'publicity_mode']);
        foreach($res as $oid => $odata) {
            switch($odata['publicity_mode']) {
            case 1:
                $result[$oid] = $odata['firstname'].' '.$odata['lastname'];
                break;
            case 2:
            $result[$oid] = $odata['firstname'];
                if(strlen($odata['lastname']) > 0) $result[$oid] .= ' '.substr($odata['lastname'], 0, 1).'.';
                break;
            case 3:
            default:
                $result[$oid] = $odata['firstname'];           
            }
        }
        return $result;        
    }

    public static function getNameURL($om, $oids, $lang) {
        $result = [];
        $res = $om->read('resiway\User', $oids, ['display_name']);
        foreach($res as $oid => $odata) {
            // note: final format will be: #/user/{id}/{name}
            $result[$oid] = TextTransformer::slugify($odata['display_name']);
        }
        return $result;        
    }    

}