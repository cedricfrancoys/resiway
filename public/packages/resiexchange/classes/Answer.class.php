<?php
namespace resiexchange;

use easyobject\orm\DataAdapter as DataAdapter;


class Answer extends \easyobject\orm\Object {

    public static function getColumns() {
        return array(
            /* all objects must define a 'name' column (default is id) */
            'name'				    => array('type' => 'alias', 'alias' => 'title'),

            /* override default creator field to make it explicitly point to resiway\User objects */
            'creator'				=> array('type' => 'many2one', 'foreign_object'=> 'resiway\User'),
            
            /* identifier of the last user to edit the answer.
            (we need this field to make a distinction with ORM writes using special field 'modifier' */
            'editor'				=> array('type' => 'many2one', 'foreign_object'=> 'resiway\User'),

            /* last time answer was edited.
            (we need this field to make a distinction with ORM writes using special field 'modified' */
            'edited'				=> array('type' => 'datetime'),
            
            'indexed'				=> array('type' => 'boolean'),
            
            /* subject of related question */
            'title'				    => array(
                                        'type'              => 'function',
                                        'result_type'       => 'string', 
                                        'store'             => false,
                                        'function'          => 'resiexchange\Answer::getTitle'
                                        ),

            'source_author'         => array('type' => 'string'),
            'source_license'        => array('type' => 'string'),
            'source_url'            => array('type' => 'string'),            
            
            /* identifier of the question to which the answer refers to */
            'question_id'           => array('type' => 'many2one', 'foreign_object'=> 'resiexchange\Question'),

            /* text describing the answer */
            'content'			    => array('type' => 'html', 'onchange' => 'resiexchange\Answer::onchangeContent'),

            'content_excerpt'       => array(
                                        'type'              => 'function',
                                        'result_type'       => 'short_text',
                                        'store'             => true, 
                                        'function'          => 'resiexchange\Answer::getContentExcerpt'
                                       ),
                                       
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

    public static function getDefaults() {
        return array(
             'editor'           => function() { return 0; },
             'indexed'          => function() { return false; }, 
             'count_votes'      => function() { return 0; },
             'score'            => function() { return 0; },             
             'count_flags'      => function() { return 0; },                          
        );
    }
    
    public static function excerpt($html, $max_chars) {
        $res = '';        
        // convert html to txt
        $string = DataAdapter::adapt('ui', 'orm', 'text', $html);
        $len = 0;
        for($i = 0, $parts = explode(' ', $string), $j = count($parts); $i < $j; ++$i) {
            $piece = $parts[$i].' ';
            $p_len = strlen($piece);
            if($len + $p_len > $max_chars) break;
            $len += $p_len;
            $res .= $piece;
        } if($len == 0) $res = substr($string, 0, $max_chars);
        return $res;
    }
    
    public static function onchangeContent($om, $oids, $lang) {
        // force re-compute content_excerpt
        $om->write(__CLASS__, $oids, ['content_excerpt' => null, 'indexed' => false], $lang);
        // force re-index related question
        $res = $om->read(__CLASS__, $oids, ['question_id']);
        $questions_ids = array_map(function($a){return $a['question_id'];}, $res);
        $om->write('resiexchange\Question', $questions_ids, ['indexed' => false], $lang);
    }
    
    // Returns excerpt of the content of max 200 chars cutting on a word-basis
    public static function getContentExcerpt($om, $oids, $lang) {
        $result = [];
        $res = $om->read(__CLASS__, $oids, ['content']);
        foreach($res as $oid => $odata) {
            $result[$oid] = self::excerpt($odata['content'], RESIEXCHANGE_ANSWER_CONTENT_EXCERPT_LENGTH_MAX);
        }
        return $result;        
    }
    
    public static function getTitle($om, $oids, $lang) {
        $result = [];
        $res = $om->read(__CLASS__, $oids, ['question_id']);
        $questions_ids = array_map(function($a){return $a['question_id'];}, $res);
        $questions = $om->read('resiexchange\Question', $questions_ids, ['title']);
        foreach($res as $oid => $odata) {
            $result[$oid] = $questions[$odata['question_id']]['title'];
        }
        return $result;        
    }        
}
