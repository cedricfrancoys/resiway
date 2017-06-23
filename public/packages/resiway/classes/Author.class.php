<?php
namespace resiway;

use qinoa\text\TextTransformer as TextTransformer;


class Author extends \easyobject\orm\Object {

    public static function getColumns() {
        return array(
            
            /* Full name of the author */            
            'name'	    		=> array('type' => 'string', 'onchange' => 'resiway\Author::onchangeName'),

            'name_url'          => array(
                                    'type'          => 'function',
                                    'result_type'   => 'string',
                                    'store'         => true, 
                                    'function'      => 'resiway\Author::getNameURL'
                                   ),

            'description'		=> array('type' => 'html'),
            
            // type : organisation (association, fondation), personne physique, entreprise
            
            'url'       		=> array('type' => 'string'),
            
            /* profile views */
            'count_views'       => array('type' => 'integer'),
            
            'count_documents'   => array('type' => 'integer'),                
            
            /* related user(s), in any */
            /* should be one person, but there may be several users in case of an organisation */
            'users_ids'         => array(
                                    'type'              => 'one2many', 
                                    'foreign_object'    => 'resiway\User',
                                    'foreign_field'	    => 'author_id'
                                    )
            
                                    
                                   
        );
    }

    public static function getUnique() {
        return array(
            ['name']
        );
    }
    
    public static function getDefaults() {
        return array(
             'count_views'              => function() { return 0; },        
             'count_documents'          => function() { return 0; }
        );
    }

    public static function getNameURL($om, $oids, $lang) {
        $result = [];
        $res = $om->read('resiway\Author', $oids, ['name']);
        foreach($res as $oid => $odata) {            
                $result[$oid] = TextTransformer::slugify($odata['name']);
        }
        return $result;    
    }
    
    public static function onchangeName($om, $oids, $lang) {
        $om->write('resiway\Author', $oids, ['name_url' => null]);
    }
        
    
    

}