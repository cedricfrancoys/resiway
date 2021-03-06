<?php
namespace resiexchange;


class AnswerComment extends \easyobject\orm\Object {

    public static function getColumns() {
        return array(
            /* all objects must define a 'name' column (default is id) */
            'name'				=> array(
                                        'type'              => 'function',
                                        'result_type'       => 'string', 
                                        'store'             => false,
                                        'function'          => 'resiexchange\AnswerComment::getName'
                                        ),        

            /* override default creator field to make it explicitly point to resiway\User objects */
            'creator'				=> array('type' => 'many2one', 'foreign_object'=> 'resiway\User'),
                                        
            /* text of the comment */
            'content'			=> array('type' => 'text'),
            
            'answer_id'         => array('type' => 'many2one', 'foreign_object' => 'resiexchange\Answer'),
            
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
        $res = $om->read(__CLASS__, $oids, ['answer_id']);
        $answers_ids = array_map(function($a){return $a['answer_id'];}, $res);
        $answers = $om->read('resiexchange\Answer', $answers_ids, ['question_id']);
        $questions_ids = array_map(function($a){return $a['question_id'];}, $answers);
        $questions = $om->read('resiexchange\Question', $questions_ids, ['title']);
        foreach($res as $oid => $odata) {
            $result[$oid] = $questions[ $answers[$odata['answer_id']]['question_id'] ]['title'];
        }
        return $result;        
    }
    
}