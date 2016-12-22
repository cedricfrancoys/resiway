<?php
namespace resiway;
use easyobject\orm\ObjectManager as ObjectManager;

/**
*
*/
class Badge extends \easyobject\orm\Object {

    public static function getColumns() {
        return array(
// todo : those fields should be multilang
            'name'			    => array('type' => 'string'),
            'description'       => array('type' => 'string'),
            
            /* category of badge : 1, 2 or 3 - for gold, silver, gold / badge_1, badge_2, badge_3 */
            'type'              => array('type' => 'integer'),

            'actions_ids'	    => array(
                                    'type' 			    => 'many2many', 
                                    'foreign_object'	=> 'resiway\Action', 
                                    'foreign_field'		=> 'badges_ids', 
                                    'rel_table'		    => 'resiway_rel_action_badge', 
                                    'rel_foreign_key'	=> 'action_id', 
                                    'rel_local_key'		=> 'badge_id'
                                   ),
            'users_ids'	    => array(
                                    'type' 			    => 'many2many', 
                                    'foreign_object'	=> 'resiway\Badge', 
                                    'foreign_field'		=> 'badges_ids', 
                                    // use UserBadge class as relation table
                                    'rel_table'		    => 'resiway_userbadge', 
                                    'rel_foreign_key'	=> 'user_id', 
                                    'rel_local_key'		=> 'badge_id'
                                    ),                                   
        );
    }
    
    
    /*
    This method defines how badges are granted.
    Badges names in the DB must match those listed below.
    */
    public static function computeBadge($badge, $uid) {
        $om = &ObjectManager::getInstance();
        switch($badge) {

        case 'curious':

            return (float) 1;
        
        case 'verified_human':
            $users = $om->read('resiway\User', $uid, ['registered']);
            return (float) $users[$uid]['registered'];        
            
        case 'autobiographer':
            $required_fields = ['firstname', 'lastname', 'language', 'country', 'location', 'about'];
            $users = $om->read('resiway\User', $uid, $required_fields);
            $count = 0;
            $filled = 0;
            foreach($users[$uid] as $field => $value) {
                if(strlen($value) > 0) ++$filled;
                ++$count;
            }
            return (float) ($filled/$count);
            
            
        }
        return (float) 0;
    }

}