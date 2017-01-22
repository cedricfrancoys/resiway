<?php
namespace resiway;

class HelpTopic extends \easyobject\orm\Object {

    public static function getColumns() {
        return array(

            /* subject of the topic */
            'title'				    => array('type' => 'string', 'multilang' => true),

            /* text covering the topic */
            'content'			    => array('type' => 'html', 'multilang' => true),
            
            /* identifier of the category to which the topic belongs to */
            'category_id'           => array('type' => 'many2one', 'foreign_object'=> 'resiway\HelpCategory')
                     
        );
    }

   
}