<?php
namespace resiexchange;

class Answer extends \easyobject\orm\Object {

    public static function getColumns() {
        return array(

            /* identifier of the question to which the answer refers to */
            'question_id'           => array('type' => 'many2one', 'foreign_object'=> 'resiexchange\Question'),

            /* text describing the answer */
            'content'			    => array('type' => 'text'),

            /* number of times this answer has been voted (up and down) */
            'count_votes'			=> array('type' => 'integer'),

            /* number of times a flag has been raised for this answer */
            'count_flags'			=> array('type' => 'integer'),
            
            /* resulting score based on vote_up and vote_down actions */            
            'score'			        => array('type' => 'integer'),

            /* identifiers of the comments for this answer */                                        
            'comments_ids'          => array(
                                        'type'		    => 'one2many', 
                                        'foreign_object'=> 'resiexchange\AnswerComment', 
                                        'foreign_field'	=> 'answer_id'
                                        )            
            
        );
    }
}
