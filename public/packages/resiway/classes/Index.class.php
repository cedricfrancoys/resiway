<?php
namespace resiway;

use qinoa\text\TextTransformer;

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
                                    'rel_table'		    => 'resiway_rel_index_question', 
                                    'rel_foreign_key'	=> 'question_id', 
                                    'rel_local_key'		=> 'index_id'
                                    ),
                                    
            /* list of articles related to this keyword */
            'articles_ids'	    => array(
                                    'type' 			    => 'many2many', 
                                    'foreign_object'	=> 'resilexi\Article', 
                                    'foreign_field'		=> 'indexes_ids', 
                                    'rel_table'		    => 'resiway_rel_index_article', 
                                    'rel_foreign_key'	=> 'article_id', 
                                    'rel_local_key'		=> 'index_id'
                                    )                                    
        );
    }

    public static function normalizeQuery($query) {
        $query = TextTransformer::normalize($query);
        $keywords = explode(' ', $query);
        // drop irrelevant words        
        foreach($keywords as $id => $keyword) {
            if(!TextTransformer::is_relevant($keyword)) {
                unset($keywords[$id]);
                continue;
            }
            $keywords[$id] = TextTransformer::axiomize($keyword);
        }
        return $keywords;
    }
    
    public static function searchByQuery($om, $query) {
        $result = [];
        $keywords = self::normalizeQuery($query);
        $hash_list = array_map(function($a) { return TextTransformer::hash($a); }, $keywords);
        if(count($hash_list)) {
            $db = $om->getDBHandler();
            // obtain indexes ids for all relevant hashes (don't mind the collision / false-positive)
            $res = $db->sendQuery("SELECT id FROM resiway_index WHERE hash in (".implode(",", $hash_list).");");
            // assign found ids to result array
            while($row = $db->fetchArray($res)) {
                $result[] = $row['id'];
            }
        }
        return $result;        
    }    

}