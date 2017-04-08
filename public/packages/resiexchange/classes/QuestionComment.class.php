<?php
namespace resiexchange;

class QuestionComment extends \easyobject\orm\Object {

    public static function getColumns() {
        return array(
            /* all objects must define a 'name' column (default is id) */
            'name'				=> array(
                                        'type'              => 'function',
                                        'result_type'       => 'string', 
                                        'store'             => false,
                                        'function'          => 'resiexchange\QuestionComment::getName'
                                        ),  
                                        
            /* text of the comment */
            'content'			=> array('type' => 'short_text'),
            
            'question_id'       => array('type' => 'many2one', 'foreign_object' => 'resiexchange\Question'),
            
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
        $res = $om->read('resiexchange\QuestionComment', $oids, ['question_id']);
        $questions_ids = array_map(function($a){return $a['question_id'];}, $res);
        $questions = $om->read('resiexchange\Question', $questions_ids, ['title']);
        foreach($res as $oid => $odata) {
            $result[$oid] = $questions[$odata['question_id']]['title'];
        }
        return $result;        
    }
    
}