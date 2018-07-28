<?php
namespace resiexchange;

use resiway\User;

use qinoa\text\TextTransformer;
use qinoa\html\HTMLToText;
use qinoa\pdf\DOMPDF;

class Question extends \easyobject\orm\Object {
   
    public static function getColumns() {
        return array(
            /* all objects must define a 'name' column (default is id) */
            'name'				    => array('type' => 'alias', 'alias' => 'title'),

            /* override default creator field to make it explicitly point to resiway\User objects */
            'creator'				=> array('type' => 'many2one', 'foreign_object'=> 'resiway\User'),
            
            /* identifier of the last user to edit the question.
            (we need this field to make a distinction with ORM writes using special field 'modifier' */
            'editor'				=> array('type' => 'many2one', 'foreign_object'=> 'resiway\User'),

            /* last time question was edited.
            (we need this field to make a distinction with ORM writes using special field 'modified' */
            'edited'				=> array('type' => 'datetime'),
                        
            /* language into which the question is asked */
            'lang'                  => array('type' => 'string'),

            /* channel of the current question ('default', 'help', 'meta', ...) */
            'channel_id'            => array('type' => 'many2one', 'foreign_object'=> 'resiway\Channel'),

            /* does current question need to be (re-)indexed */
            'indexed'               => array('type' => 'boolean'),
            
            /* subject of the question */
            'title'				    => array('type' => 'string', 'onchange' => 'resiexchange\Question::onchangeTitle'),

            /* title URL-formatted (for links) */
            'title_url'             => array(
                                        'type'              => 'function',
                                        'result_type'       => 'string',
                                        'store'             => true, 
                                        'function'          => 'resiexchange\Question::getTitleURL'
                                       ),
                                       
            /* text describing the question */
            'content'			    => array('type' => 'html', 'onchange' => 'resiexchange\Question::onchangeContent'),

            /* auto-generated question summary */
            'content_excerpt'       => array(
                                        'type'              => 'function',
                                        'result_type'       => 'string',
                                        'store'             => true, 
                                        'function'          => 'resiexchange\Question::getContentExcerpt'
                                       ),
            
            /* number of times this question has been displayed */
            'count_views'			=> array('type' => 'integer'),

            /* number of times this question has been downloaded */
            'count_downloads'		=> array('type' => 'integer'),
            
            /* number of times this question has been voted (up and down) */
            'count_votes'			=> array('type' => 'integer'),

            /* number of times this question has been answered */            
            'count_answers'			=> array('type' => 'integer'),  

            /* number of times this question has been marked as favorite */
            'count_stars'			=> array('type' => 'integer'),

            /* resulting score based on up and down votes */
            'count_flags'	        => array('type' => 'integer'),

            /* number of questions pointing back to current question (reverse 'related_questions_ids') */
            'count_links'	        => array('type' => 'integer'),                
            
            /* resulting score based on up and down votes */
            'score'			        => array('type' => 'integer'),


            /* identifiers of the tags to which the question belongs */
            'categories_ids'	    => array(
                                        'type' 			    => 'many2many', 
                                        'foreign_object'	=> 'resiway\Category', 
                                        'foreign_field'		=> 'questions_ids', 
                                        'rel_table'		    => 'resiexchange_rel_question_category', 
                                        'rel_foreign_key'	=> 'tag_id', 
                                        'rel_local_key'		=> 'question_id'
                                        ),
                                        
            'categories'		    => array('type' => 'alias', 'alias' => 'categories_ids'),
            
            /* identifiers of the answers to this question */
            'answers_ids'           => array(
                                        'type'		    => 'one2many', 
                                        'foreign_object'=> 'resiexchange\Answer', 
                                        'foreign_field'	=> 'question_id',
                                        'order'         => 'score',
                                        'sort'          => 'desc'
                                        ),

            'answers'			    => array('type' => 'alias', 'alias' => 'answers_ids'),
            
            /* identifiers of the comments for this question */                                        
            'comments_ids'          => array(
                                        'type'		    => 'one2many', 
                                        'foreign_object'=> 'resiexchange\QuestionComment', 
                                        'foreign_field'	=> 'question_id'
                                        ),
                                        
            'comments'			    => array('type' => 'alias', 'alias' => 'comments_ids'),
            
            /* list of keywords indexes related to this document */
            'indexes_ids'	        => array(
                                        'type' 			    => 'many2many', 
                                        'foreign_object'	=> 'resiway\Index', 
                                        'foreign_field'		=> 'questions_ids', 
                                        'rel_table'		    => 'resiway_rel_index_question', 
                                        'rel_foreign_key'	=> 'index_id', 
                                        'rel_local_key'		=> 'question_id'
                                       ),
                                       
            /* identifiers of other questions to which current question has been linked */
            'related_questions_ids'	 => array(
                                        'type' 			    => 'many2many', 
                                        'foreign_object'	=> 'resiexchange\Question', 
                                        'foreign_field'		=> 'related_questions_ids', 
                                        'rel_table'		    => 'resiexchange_rel_question_question', 
                                        'rel_foreign_key'	=> 'related_id', 
                                        'rel_local_key'		=> 'question_id'
                                        )
                                        
        );
    }
    
    public static function getDefaults() {
        return array(
             'indexed'          => function() { return false; },        
             'channel_id'       => function() { return 1; },
             'lang'             => function() { return 'fr'; },
             'editor'           => function() { return 0; },             
             'count_views'      => function() { return 0; },
             'count_votes'      => function() { return 0; },
             'count_answers'    => function() { return 0; },
             'count_stars'      => function() { return 0; },             
             'score'            => function() { return 0; },             
             'count_flags'      => function() { return 0; },
             'count_links'      => function() { return 0; }
        );
    }
           
    public static function onchangeContent($om, $oids, $lang) {
        // force re-compute content_excerpt
        $om->write(__CLASS__, $oids, ['content_excerpt' => null, 'indexed' => false], $lang);        
    }

    public static function onchangeTitle($om, $oids, $lang) {
        // force re-compute title_url
        $om->write(__CLASS__, $oids, ['title_url' => null, 'indexed' => false], $lang);        
    }    

    // Returns excerpt of the content of max 200 chars cutting on a word-basis   
    public static function getContentExcerpt($om, $oids, $lang) {
        $result = [];
        $res = $om->read(__CLASS__, $oids, ['content']);
        foreach($res as $oid => $odata) {
            $result[$oid] = TextTransformer::excerpt(HTMLToText::convert($odata['content'], false), RESIEXCHANGE_QUESTION_CONTENT_EXCERPT_LENGTH_MAX);
        }
        return $result;        
    }

    // todo: define slug length in config file
    public static function getTitleURL($om, $oids, $lang) {
        $result = [];
        $res = $om->read(__CLASS__, $oids, ['title']);
        foreach($res as $oid => $odata) {
            // note: final format will be: #/question/{id}/{title}
            $result[$oid] = TextTransformer::slugify($odata['title'], 200);
        }
        return $result;        
    }
           
    
    /**
    * Converts a list of questions to a JSON structure matching JSON API RFC7159 specifications
    * content-type: application/vnd.api+json
    * 
    */  
    public static function toJSONAPI($om, $oids, $meta) {
        $result = [];
        $included = [];
        
        $questions = $om->read(__CLASS__, $oids, [
                                                    'creator'  => User::getPublicFields(), 
                                                    'created', 
                                                    'title', 
                                                    'title_url', 
                                                    'content_excerpt', 
                                                    'score', 
                                                    'count_views', 
                                                    'count_votes', 
                                                    'count_answers', 
                                                    'categories_ids' => ['id', 'title', 'path', 'parent_path', 'description']
                                                ]);
                       
        // build JSON object
        foreach($questions as $id => $question) {
            $author_id = $question['creator']['id'];
            unset($question['creator']['id']);
            if(!isset($included['creator_'.$author_id])) {
                $included['creator_'.$author_id] = ['type' => 'people', 'id' => $author_id, 'attributes' => (object) $question['creator']];
            }        
            foreach($question['categories_ids'] as $category) {
                $category_id = $category['id'];
                unset($category['id']);
                if(!isset($included['category_'.$category_id])) {
                    $included['category_'.$category_id] = ['type' => 'category', 'id' => $category_id, 'attributes' => (object) $category];
                }        
            }
            $categories = array_values($question['categories_ids']);
            unset($question['id']);        
            unset($question['creator']);        
            unset($question['categories_ids']);                
            $result[] = [
                'type'          => 'question', 
                'id'            => $id, 
                'attributes'    => (object) $question, 
                'relationships' => (object) [
                    'creator'       => (object)['data' => (object)['type' => 'people', 'id' => $author_id]],
                    'categories'    => (object)['data' => array_map(function($a) {return (object)['id'=>$a['id'], 'type'=>'category'];}, $categories)]
                ]
            ];       
        }
        ksort($included);
        return json_encode(array_merge(
            ['jsonapi'   => (object) ['version' => '1.0'] ],
            $meta,
            [
                'data'      => $result,
                'included'  => array_values($included)
            ]
        ), JSON_PRETTY_PRINT);
    }
    
    /** 
    * Serve a static HTML version of a single question object
    *
    */
// todo : include CSS styling / HTML templating        
    public static function toHTML($om, $oid) {
        $html = [];

        $questions = $om->read(__CLASS__, $oid, [
            'id', 'lang', 'creator', 'created', 'editor', 'edited', 'modified', 
            'title', 'title_url', 'content', 'content_excerpt', 
            'count_views', 'count_votes', 'score', 
            'categories_ids.title',
            'answers_ids' => ['creator', 'created', 'editor', 'edited', 'content', 'content_excerpt', 'score']
        ]);
        if($questions > 0 && isset($questions[$oid])) {

            $odata = $questions[$oid];

            $html[] = '<!DOCTYPE html>'.PHP_EOL;
            $html[] = '<html lang="'.$odata['lang'].'">'.PHP_EOL;
            $html[] = '<head>'.PHP_EOL;    
            $html[] = '<meta charset="utf-8">'.PHP_EOL;
            $html[] = '<meta name="title" content="'.$odata['title'].' - ResiExchange - Des réponses pour la résilience">'.PHP_EOL;
            $html[] = '<meta name="description" content="'.$odata['content_excerpt'].'">'.PHP_EOL;
            $html[] = '</head>'.PHP_EOL;
            $html[] = '<body>'.PHP_EOL;
        
            $html[] = '<div class="question wrapper"';
            $html[] = '   itemscope=""';
            $html[] = '   itemtype="https://schema.org/Question">';

            $html[] = '<h1 itemprop="name">'.$odata['title'].'</h1>';
            $html[] = '<div><label>score:</label><span itemprop="upvoteCount">'.$odata['score'].'</span></div>';
            $html[] = '<div><label>answers:</label><span itemprop="answerCount">'.count($odata['answers_ids']).'</span></div>';
            $html[] = '<div itemprop="text">'.$odata['content'].'</div>';
            $html[] = '<div itemprop="dateCreated">'.$odata['created'].'</div>';        
            $html[] = '<div itemprop="dateModified">'.$odata['modified'].'</div>';                

            foreach($odata['categories_ids.title'] as $category) {
                $html[] = '<h2>'.$category.'</h2>';
            }
            
            if($odata['answers_ids'] > 0) {
                $first = true;
                foreach($odata['answers_ids'] as $answer_id => $answer_data) {    
                    $html[] = '<div id="answer-'.$answer_id.'"';
                    $html[] = ' itemscope="" ';
                    $html[] = ' itemtype="https://schema.org/Answer"';
                    if($first) $html[] = ' itemprop="suggestedAnswer"';
                    $html[] = '>';
                    $html[] = '<div itemprop="upvoteCount">'.$answer_data['score'].'</div>';
                    $html[] = '<div itemprop="text">'.$answer_data['content'].'</div>';                
                    $html[] = '</div>';                        
                    $first = false;
                }
            }
            $html[] = '</div>';
            $html[] = '</body>'.PHP_EOL;        
            $html[] = '</html>'.PHP_EOL;
        }
        return implode(PHP_EOL, $html);
    }
    
    /** 
    * Serve a PDF version of a single article object
    *
    */    
    public static function toPDF($om, $oid) {
        $result = null;
        $html = self::toHTML($om, $oid);
        if(strlen($html) > 0) {
            $dompdf = new DOMPDF();
            $dompdf->load_html($html, 'UTF-8');
            $dompdf->set_paper("letter", 'portrait');
            $dompdf->render();	
            $result = $dompdf->output();
        }
        return $result;
    }      
}