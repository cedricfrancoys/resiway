<?php
namespace resiway;

class HelpCategory extends \easyobject\orm\Object {

    public static function getColumns() {
        return array(

            /* name of the category */
            'title'				    => array('type' => 'string', 'multilang' => true),
                        
            /* text describing the category */
            'description'			=> array('type' => 'text', 'multilang' => true)
            
        );
    }
}