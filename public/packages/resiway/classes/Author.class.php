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
            
// todo : auto-compute this field (similar to getCountPages)
            'count_documents'   => array('type' => 'integer'),
            
            'count_pages'       => array(
                                    'type'          => 'function',                                    
                                    'result_type'   => 'integer',
                                    'store'         => true, 
                                    'function'      => 'resiway\Author::getCountPages'                                    
                                   ),
            
/*
            'documents_ids'     => array(
                                    'type'              => 'one2many', 
                                    'foreign_object'    => 'resilib\Document',
                                    'foreign_field'	    => 'author_id'
                                    ),
*/
                                    
            'documents_ids'	    => array(
                                    'type'              => 'many2many', 
                                    'foreign_object'    => 'resilib\Document', 
                                    'foreign_field'     => 'authors_ids', 
                                    'rel_table'         => 'resilib_rel_document_author', 
                                    'rel_foreign_key'   => 'document_id', 
                                    'rel_local_key'     => 'author_id'
                                    ),                                    
                                    
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
             'description'              => function() { return ''; },        
             'url'                      => function() { return ''; },                     
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

    public static function getCountPages($om, $oids, $lang) {
        $result = [];
        $res = $om->read('resiway\Author', $oids, ['documents_ids.pages']);
        foreach($res as $oid => $odata) {
            $result[$oid] = array_sum($odata['documents_ids.pages']);
        }
        return $result;
    }
    
    public static function onchangeName($om, $oids, $lang) {
        $om->write('resiway\Author', $oids, ['name_url' => null]);
        // force immediate computing
        $om->read('resiway\Author', $oids, ['name_url']);        
    }
        
    
    

}