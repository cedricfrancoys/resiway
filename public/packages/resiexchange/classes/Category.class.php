<?php
namespace resiexchange;

class Category extends \easyobject\orm\Object {

    public static function getColumns() {
        return array(
// todo : make those fields multilang        
            /* name of the category */
            'title'				    => array('type' => 'string'),
                        
            /* text describing the category */
            'description'			=> array('type' => 'text')
            
        );
    }
}
