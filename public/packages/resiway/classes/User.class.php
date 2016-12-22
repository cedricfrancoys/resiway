<?php
namespace resiway;


class User extends \easyobject\orm\Object {

    public static function getColumns() {
        return array(
            'registered'        => array('type' => 'boolean'),
            
            /* valid email of the user */
            'login'			    => array('type' => 'string', 'unique' => true),
            
            'password'			=> array('type' => 'string'),
            
            'firstname'			=> array('type' => 'string'),
            'lastname'			=> array('type' => 'string'),

            /*
             Possible values:
             1 : Full name (ex.: Cédric Françoys)
             2 : Firstname and lastname initial (ex.: Cédric F.)
             3 : Firstname only (ex.: Cédric)
            */
            'identity_mode'     => array('type' => 'integer'),
            
            'display_name'      => array(
                                    'type'              => 'function',
                                    'result_type'       => 'string',
                                    'store'             => true, 
                                    'function'          => 'resiway\User::getDisplayName'
                                   ),
            
            
            'language'			=> array('type' => 'string'),
            'country'			=> array('type' => 'string'),
            'location'			=> array('type' => 'string'),
            'picture'			=> array('type' => 'binary'),
            'about'			    => array('type' => 'text'),
            
            'reputation'		=> array('type' => 'integer'),
            
            'count_badges_1'    => array('type' => 'integer'),
            'count_badges_2'    => array('type' => 'integer'),
            'count_badges_3'    => array('type' => 'integer'),            
            
            'user_notifications_ids'	
                                => array(
                                    'type'		        => 'one2many', 
                                    'foreign_object'    => 'resiway\UserNotification', 
                                    'foreign_field'	    => 'user_id'
                                   ),
                                   
            'user_badges_ids'	=> array(
                                    'type'		        => 'one2many', 
                                    'foreign_object'    => 'resiway\UserBadge', 
                                    'foreign_field'	    => 'user_id'
                                   ),
                                   
          
            'badges_ids'	    => array(
                                    'type' 			    => 'many2many', 
                                    'foreign_object'	=> 'resiway\Badge', 
                                    'foreign_field'		=> 'users_ids', 
                                    'rel_table'		    => 'resiway_userbadge', 
                                    'rel_foreign_key'	=> 'badge_id', 
                                    'rel_local_key'		=> 'user_id'
                                    ),
                                    
                                    
                                    
                                   
        );
    }
    
    public static function getDefaults() {
        return array(
             'registered'           => function() { return false; },             
             'reputation'           => function() { return 0; },
             'identity_mode'        => function() { return 1; },
             'count_badges_1'       => function() { return 0; },
             'count_badges_2'       => function() { return 0; },             
             'count_badges_3'       => function() { return 0; },                          
        );
    }
    
    public static function getConstraints() {
        return array(
            'login'			    => array(
                                    /* login must be a valid email address */
                                    'error_message_id' => 'invalid_login',
                                    'function' => function ($login) {
                                            return (bool) (preg_match('/^([_a-z0-9-]+)(\.[_a-z0-9-]+)*@([a-z0-9-]+)(\.[a-z0-9-]+)*(\.[a-z]{2,8})$/', $login, $matches));
                                    }
                                ),
            'password'		    => array(
                                    /* password must be a 32 bytes MD5 hash */
                                    'error_message_id' => 'invalid_password',
                                    'function' => function ($password) {
                                            return (bool) (preg_match('/^[0-9|a-z]{32}$/', $password, $matches));
                                    }
                                ),
            'language'		    => array(
                                    /* language must be a valid ISO 639-1 code */
                                    'error_message_id' => 'invalid_language',
                                    'function' => function ($language) {
                                            return (bool) (preg_match('/^[a-z]{2}$/', $language, $matches));
                                    }
                                ),
            'country'		    => array(
                                    /* country must be a valid ISO 3166 code */
                                    'error_message_id' => 'invalid_country',
                                    'function' => function ($country) {
                                            return (bool) (preg_match('/^[A-Z]{2}$/', $country, $matches));
                                    }
                                ),                                                                
        );
    }
    
    public static function getDisplayName($om, $oids, $lang) {
        $result = [];
        $res = $om->read('resiway\User', $oids, ['firstname', 'lastname', 'identity_mode']);
        foreach($res as $oid => $odata) {
            switch($odata['identity_mode']) {
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

}