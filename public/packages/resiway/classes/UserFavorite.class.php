<?php
namespace resiway;


class UserFavorite extends \easyobject\orm\Object {

    public static function getColumns() {
        return array(

            'name'           => array(
                                    'type'          => 'function',
                                    'result_type'   => 'string',
                                    'store'         => true, 
                                    'function'      => 'resiway\UserFavorite::getName'
                               ),
                               
            'user_id'        => array('type' => 'many2one', 'foreign_object' => 'resiway\User'),
            
            'object_class'	 => array('type' => 'string'),    
            
            'object_id'		 => array('type' => 'integer')
                                   
        );
    }
    
    public static function getUnique() {
        return array( 
            ['user_id', 'object_class', 'object_id'] 
        );
    }

    public static function getName($om, $oids, $lang) {
        $result = [];
        $res = $om->read('resiway\UserFavorite', $oids, ['object_class', 'object_id']);
        foreach($res as $oid => $odata) {
            $res = $om->read($odata['object_class'], $odata['object_id'], ['name']);
            if( $res > 0 && isset($res[$odata['object_id']]) ) {
                $result[$oid] = $res[$odata['object_id']]['name'];
            }
        }
        return $result;        
    }    

}