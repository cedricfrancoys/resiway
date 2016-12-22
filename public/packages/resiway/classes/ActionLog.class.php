<?php
namespace resiway;

class ActionLog extends \easyobject\orm\Object {

    public static function getColumns() {
        return array(
            /* user performing the action */
            'user_id'				=> array('type' => 'many2one', 'foreign_object'=> 'resiway\User'),

            /* action performed */
            'action_id'				=> array('type' => 'many2one', 'foreign_object'=> 'resiway\Action'),
            
            /* class of the object the action applies to */ 
            'object_class'		    => array('type' => 'string'),
                        
            /* identifier of the object the action applies to */
            'object_id' 	        => array('type' => 'integer'),
            
            
        );
    }
}
