<?php
namespace resiway;


class Repository extends \easyobject\orm\Object {

    public static function getColumns() {
        return array(
            
            'key'	    => array('type' => 'string', 'unique' => true),

            'type'	    => array('type' => 'string'),
            
            'value'	    => array('type' => 'binary'),
                                   
        );
    }
}