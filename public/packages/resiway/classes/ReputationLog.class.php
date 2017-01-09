<?php
namespace resiway;

class ReputationLog extends \easyobject\orm\Object {

    public static function getColumns() {
        return array(
            /* user whom reputation has been updated */
            'user_id'				=> array('type' => 'many2one', 'foreign_object'=> 'resiway\User'),

            /* amount by which user reputation has been updated */
            'increment'			    => array('type' => 'integer'),
            
            /* short description about reputation update (ex.: action name) */ 
            'reason'		        => array('type' => 'string'),
            
            /* link (hash) to the related object or event that triggered the reputation increment */
            'link' 	                => array('type' => 'string'),
            
            /* text of the link to related event or object */ 
            'description'	        => array('type' => 'string')
            

        );
    }
}
