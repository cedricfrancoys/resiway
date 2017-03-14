<?php
namespace resiway;

/**
*
*/
class Badge extends \easyobject\orm\Object {

    public static function getColumns() {
        return array(
            'name'			    => array('type' => 'string', 'multilang' => true),
            'description'       => array('type' => 'string', 'multilang' => true),

            /* human-readable unique identifier*/
            'code'			    => array('type' => 'string'),
            
            /* category of badge : 1, 2 or 3 - for bronze, silver, gold / badge_1, badge_2, badge_3 */
            'type'              => array('type' => 'integer'),

            /* list of actions that might trigger badge attribution */
            'actions_ids'	    => array(
                                    'type' 			    => 'many2many', 
                                    'foreign_object'	=> 'resiway\Action', 
                                    'foreign_field'		=> 'badges_ids', 
                                    'rel_table'		    => 'resiway_rel_action_badge', 
                                    'rel_foreign_key'	=> 'action_id', 
                                    'rel_local_key'		=> 'badge_id'
                                   ),
            /* list of users having earned the badge */
            'users_ids'	        => array(
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
    Badges names in the DB table 'resiway_badge' must match those listed below.
    returned values are percentages of achivement (from 0 to 1)
    */
    public static function computeBadge($om, $badge, $uid) {
        switch($badge) {

        case 'curious':
            $res = $om->search('resiexchange\Question', ['creator', '=', $uid]);
            return (float) (count($res)/1);
        
        case 'verified_human':
            $users = $om->read('resiway\User', $uid, ['verified']);
            return (float) $users[$uid]['verified'];        
            
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
            
        default:
            break;
        }
        
        return (float) 0;
    }

}