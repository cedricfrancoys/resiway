<?php
namespace resiway;


class Tag extends \easyobject\orm\Object {

    public static function getColumns() {
        return array(

            'title'             => array('type' => 'string', 'multilang' => true, 'onchange' => 'resiway\Tag::onchangeTitle'),
            
            'description'		=> array('type' => 'short_text', 'multilang' => true),
            
            'parent_id'			=> array(
                                    'type'              => 'many2one', 
                                    'foreign_object'    => 'resiway\Tag', 
                                    'onchange'          => 'resiway\Tag::onchangeTitle'),
                                    
            'path'				=> array(
                                    'type'              => 'function', 
                                    'store'             => true,
                                    'multilang'         => true,
                                    'result_type'       => 'string', 
                                    'function'          => 'resiway\Tag::getPath'),
            
            'children_ids'		=> array(
                                    'type'              => 'one2many', 
                                    'foreign_object'    => 'resiway\Tag', 
                                    'foreign_field'     => 'parent_id', 
                                    'order'             => 'name'),

            
            'questions_ids'	    => array(
                                    'type' 			    => 'many2many', 
                                    'foreign_object'	=> 'resiexchange\Question', 
                                    'foreign_field'		=> 'tags_ids', 
                                    'rel_table'		    => 'resiexchange_rel_question_tag', 
                                    'rel_foreign_key'	=> 'question_id', 
                                    'rel_local_key'		=> 'tag_id'
                                    ),
                                    
                                    
                                    
                                   
        );
    }
    
    public static function slugify($value) {
        // remove accentuated chars
        $value = htmlentities($value, ENT_QUOTES, 'UTF-8');
        $value = preg_replace('~&([a-z]{1,2})(acute|cedil|circ|grave|lig|orn|ring|slash|th|tilde|uml);~i', '$1', $value);
        $value = html_entity_decode($value, ENT_QUOTES, 'UTF-8');
        // remove all non-space-alphanum-dash chars
        $value = preg_replace('/[^\s-a-z0-9]/i', '', $value);
        // replace spaces with dashes
        $value = preg_replace('/[\s-]+/', '-', $value);           
        // trim the end of the string
        $value = trim($value, '.-_');
        return strtolower($value);
    }
    
    /*
    * Handler to be run either when title of the tag is changed or it is reassigned to another parent tag
    */
    public static function onchangeTitle($om, $oids, $lang) {
        // force re-compute mnemonic and path
        $om->write('resiway\Tag', $oids, ['path' => null], $lang);
        // find children tags and force to re-compute path
        $tags_ids = $om->search('resiway\Tag', ['parent_id', 'in', $oids]);
        if($tags_ids > 0 && count($tags_ids)) Tag::onchangeTitle($om, $tags_ids, $lang);
    }

    public static function getPath($om, $oids, $lang) {
        $result = [];
        $res = $om->read('resiway\Tag', $oids, ['title', 'parent_id', 'parent_id.path'], $lang);        
        foreach($res as $oid => $object_data) {
            if(isset($object_data['parent_id']) && $object_data['parent_id'] > 0) {
                $result[$oid] = $object_data['parent_id.path'].'/'.self::slugify($object_data['title']);
            }
            else $result[$oid] = self::slugify($object_data['title']);
        }
        return $result;        
    }  

}