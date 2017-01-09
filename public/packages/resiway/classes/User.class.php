<?php
namespace resiway;


class User extends \easyobject\orm\Object {

    public static function getColumns() {
        return array(
            /* all objects must define a 'name' column (default is id) */
            'name'				=> array('type' => 'alias', 'alias' => 'display_name'),
            
            'verified'          => array('type' => 'boolean'),
            
            /* valid email of the user */
            'login'			    => array('type' => 'string', 'unique' => true),
            
            'password'			=> array('type' => 'string'),
            
            'firstname'			=> array('type' => 'string'),
            'lastname'			=> array('type' => 'string'),

            /* public hash (md5 of login/email) */
            'hash'              => array(
                                    'type'          => 'function',
                                    'result_type'   => 'string', 
                                    'store'         => true,
                                    'function'      => 'resiway\User::getHash'                                    
                                    ),
            /*
             Possible values:
             1 : Full name (ex.: Cédric Françoys) [default]
             2 : Firstname and lastname initial (ex.: Cédric F.)
             3 : Firstname only (ex.: Cédric)
            */
            'publicity_mode'    => array('type' => 'integer'),
            
            'display_name'      => array(
                                    'type'          => 'function',
                                    'result_type'   => 'string',
                                    'store'         => true, 
                                    'function'      => 'resiway\User::getDisplayName'
                                   ),
            
            
            'language'			=> array('type' => 'string'),
            'country'			=> array('type' => 'string'),
            'location'			=> array('type' => 'string'),

            'about'			    => array('type' => 'text'),
            
            'reputation'		=> array('type' => 'integer'),
            
            'count_badges_1'    => array('type' => 'integer'),
            'count_badges_2'    => array('type' => 'integer'),
            'count_badges_3'    => array('type' => 'integer'),            
            
            'notifications_ids'	=> array(
                                    'type'		    => 'one2many', 
                                    'foreign_object'=> 'resiway\UserNotification', 
                                    'foreign_field'	=> 'user_id'
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
             'verified'             => function() { return false; },             
             'reputation'           => function() { return 1; },
             'publicity_mode'       => function() { return 1; },
             'count_badges_1'       => function() { return 0; },
             'count_badges_2'       => function() { return 0; },             
             'count_badges_3'       => function() { return 0; },                          
        );
    }
    
    public static function getConstraints() {
        return array(
            'login'			    => array(
                                    /* login must be a valid email address */
// todo : check taht this regexp still covers all domain names                                    
                                    'error_message_id' => 'invalid_login',
                                    'function' => function ($login) {
                                            return (bool) (preg_match('/^([_a-z0-9-]+)(\.[_a-z0-9-]+)*@([a-z0-9-]+)(\.[a-z0-9-]+)*(\.[a-z]{2,8})$/i', $login, $matches));
                                    }
                                ),
            'password'		    => array(
                                    /* password must be a 32 bytes string in hexadecimal notation (MD5 hash) */
                                    'error_message_id' => 'invalid_password',
                                    'function' => function ($password) {
                                            return (bool) (preg_match('/^[a-z0-9]{32}$/i', $password, $matches));
                                    }
                                ),
                                
            'firstname'			=> array(
                                    /* firstname must contain only letters or dashes */
                                    'error_message_id' => 'invalid_firstname',
                                    'function' => function ($firstname) {
                                            $value = htmlentities($firstname, ENT_QUOTES, 'UTF-8');
                                            $value = preg_replace('~&([a-z]{1,2})(acute|cedil|circ|grave|lig|orn|ring|slash|th|tilde|uml);~i', '$1', $value);
                                            $value = html_entity_decode($value, ENT_QUOTES, 'UTF-8');                                        
                                            return (bool) (preg_match('/^[a-z-]+$/i', $value, $matches));
                                    }            
                                ),
            'lastname'			=> array(
                                    /* lastname must contain only letters or spaces */
                                    'error_message_id' => 'invalid_lastname',
                                    'function' => function ($lastname) {
                                            $value = htmlentities($lastname, ENT_QUOTES, 'UTF-8');
                                            $value = preg_replace('~&([a-z]{1,2})(acute|cedil|circ|grave|lig|orn|ring|slash|th|tilde|uml);~i', '$1', $value);
                                            $value = html_entity_decode($value, ENT_QUOTES, 'UTF-8');                                          
                                            return (bool) (preg_match('/^[\sa-z]+$/i', $value, $matches));
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
    
    public static function getHash($om, $oids, $lang) {
        $result = [];
        $res = $om->read('resiway\User', $oids, ['login']);
        foreach($res as $oid => $odata) {
            $result[$oid] = md5($odata['login']);
        }
        return $result;           
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

}