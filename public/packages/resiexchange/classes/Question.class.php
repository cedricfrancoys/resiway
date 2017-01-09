<?php
namespace resiexchange;

use easyobject\orm\DataAdapter as DataAdapter;


class Question extends \easyobject\orm\Object {
   
    public static function getColumns() {
        return array(
            /* all objects must define a 'name' column (default is id) */
            'name'				    => array('type' => 'alias', 'alias' => 'title'),
            
            /* subject of the question */
            'title'				    => array('type' => 'string', 'onchange' => 'resiexchange\Question::onchangeTitle'),
                           
            /* text describing the question */
            'content'			    => array('type' => 'html', 'onchange' => 'resiexchange\Question::onchangeContent'),

            'content_excerpt'       => array(
                                        'type'              => 'function',
                                        'result_type'       => 'short_text',
                                        'store'             => true, 
                                        'function'          => 'resiexchange\Question::getContentExcerpt'
                                       ),
            
            /* number of times this question has been displayed */
            'count_views'			=> array('type' => 'integer'),

            /* number of times this question has been voted (up and down) */
            'count_votes'			=> array('type' => 'integer'),

            /* number of times this question has been answered */            
            'count_answers'			=> array('type' => 'integer'),  

            /* number of times this question has been marked as favorite */
            'count_stars'			=> array('type' => 'integer'),

            /* resulting score based on up and down votes */
            'count_flags'	        => array('type' => 'integer'),    
            
            /* resulting score based on up and down votes */
            'score'			        => array('type' => 'integer'),

            'url_id'			    => array('type' => 'many2one', 'foreign_object' => 'core\UrlResolver'),

            /* identifiers of the tags to which the question belongs */
            'categories_ids'	    => array(
                                        'type' 			    => 'many2many', 
                                        'foreign_object'	=> 'resiway\Category', 
                                        'foreign_field'		=> 'questions_ids', 
                                        'rel_table'		    => 'resiexchange_rel_question_category', 
                                        'rel_foreign_key'	=> 'tag_id', 
                                        'rel_local_key'		=> 'question_id'
                                        ),
            
            /* identifiers of the answers to this question */
            'answers_ids'           => array(
                                        'type'		    => 'one2many', 
                                        'foreign_object'=> 'resiexchange\Answer', 
                                        'foreign_field'	=> 'question_id'
                                        ),
                                        
            /* identifiers of the comments for this question */                                        
            'comments_ids'           => array(
                                        'type'		    => 'one2many', 
                                        'foreign_object'=> 'resiexchange\QuestionComment', 
                                        'foreign_field'	=> 'question_id'
                                        ),


            
        );
    }
    
    public static function getDefaults() {
        return array(
             'count_views'      => function() { return 0; },
             'count_votes'      => function() { return 0; },
             'count_answers'    => function() { return 0; },
             'count_stars'      => function() { return 0; },             
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
        $om->write('resiexchange\Question', $oids, ['content_excerpt' => null], $lang);        
    }

    // Returns excerpt of the content of max 200 chars cutting on a word-basis   
    // todo: define excerpt length in config file
    public static function getContentExcerpt($om, $oids, $lang) {
        $result = [];
        $res = $om->read('resiexchange\Question', $oids, ['content']);
        foreach($res as $oid => $odata) {
            $result[$oid] = self::excerpt($odata['content'], 200);
        }
        return $result;        
    }

}