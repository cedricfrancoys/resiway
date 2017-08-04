<?php
namespace resiway;

/**
*
*/
class Index extends \easyobject\orm\Object {

    public static function getColumns() {
        return array(
            /* all objects must define a 'name' column (default is id) */
            'name'				=> array('type' => 'alias', 'alias' => 'value'),
            
            'value'             => array('type' => 'string'),
            

            'hash'              => array('type' => 'string'),

            /* list of documents related to this keyword */
            'documents_ids'	    => array(
                                    'type' 			    => 'many2many', 
                                    'foreign_object'	=> 'resilib\Document', 
                                    'foreign_field'		=> 'indexes_ids', 
                                    'rel_table'		    => 'resiway_rel_index_document', 
                                    'rel_foreign_key'	=> 'document_id', 
                                    'rel_local_key'		=> 'index_id'
                                   ),
                                   
            /* list of questions related to this keyword */
            'questions_ids'	    => array(
                                    'type' 			    => 'many2many', 
                                    'foreign_object'	=> 'resiexchange\Question', 
                                    'foreign_field'		=> 'indexes_ids', 
                                    // use UserBadge class as relation table
                                    'rel_table'		    => 'resiway_rel_index_question', 
                                    'rel_foreign_key'	=> 'question_id', 
                                    'rel_local_key'		=> 'index_id'
                                    )
        );
    }   

}