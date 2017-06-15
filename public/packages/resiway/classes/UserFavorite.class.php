<?php
namespace resiway;


class UserFavorite extends \easyobject\orm\Object {

    public static function getColumns() {
        return array(
        
            'user_id'        => array('type' => 'many2one', 'foreign_object' => 'resiway\User'),
            
            'object_class'	 => array('type' => 'string'),    
            
            'object_id'		 => array('type' => 'integer')
                                   
        );
    } 

}