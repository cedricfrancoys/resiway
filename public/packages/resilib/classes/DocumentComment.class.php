<?php
namespace resilib;

class DocumentComment extends \easyobject\orm\Object {

    public static function getColumns() {
        return array(
            /* all objects must define a 'name' column (default is id) */
            'name'				=> array(
                                        'type'              => 'function',
                                        'result_type'       => 'string', 
                                        'store'             => false,
                                        'function'          => 'resilib\DocumentComment::getName'
                                   ),  

            /* override default creator field to make it explicitly point to resiway\User objects */
            'creator'			=> array('type' => 'many2one', 'foreign_object'=> 'resiway\User'),
                                        
            /* text of the comment */
            'content'			=> array('type' => 'text'),
            
            'document_id'       => array('type' => 'many2one', 'foreign_object' => 'resilib\Document'),
            
            'score'             => array('type' => 'integer'),
            
            'count_flags'       => array('type' => 'integer')            
        );
    }
    
    public static function getDefaults() {
        return array(        
             'score'            => function() { return 0; },
             'count_flags'      => function() { return 0; },             
        );
    }

    public static function getName($om, $oids, $lang) {
        $result = [];
        $res = $om->read('resilib\DocumentComment', $oids, ['document_id']);
        $documents_ids = array_map(function($a){return $a['document_id'];}, $res);
        $documents = $om->read('resilib\Document', $documents_ids, ['title']);
        foreach($res as $oid => $odata) {
            $result[$oid] = $documents[$odata['document_id']]['title'];
        }
        return $result;        
    }
    
}