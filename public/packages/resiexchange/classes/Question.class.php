<?php
namespace resiexchange;

use resiway\User;

use qinoa\html\HTMLToText;


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

            'content_excerpt'       => array(
                                        'type'              => 'function',
                                        'result_type'       => 'string',
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
            
            /* identifiers of the answers to this question */
            'answers_ids'           => array(
                                        'type'		    => 'one2many', 
                                        'foreign_object'=> 'resiexchange\Answer', 
                                        'foreign_field'	=> 'question_id',
                                        'order'         => 'score',
                                        'sort'          => 'desc'
                                        ),
                                        
            /* identifiers of the comments for this question */                                        
            'comments_ids'           => array(
                                        'type'		    => 'one2many', 
                                        'foreign_object'=> 'resiexchange\QuestionComment', 
                                        'foreign_field'	=> 'question_id'
                                        ),

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
                                        ),
            
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

    public static function slugify($value) {
        // remove accentuated chars
        $value = htmlentities($value, ENT_QUOTES, 'UTF-8');
        $value = preg_replace('~&([a-z]{1,2})(acute|cedil|circ|grave|lig|orn|ring|slash|th|tilde|uml);~i', '$1', $value);
        $value = html_entity_decode($value, ENT_QUOTES, 'UTF-8');
        // remove all non-quote-space-alphanum-dash chars
        $value = preg_replace('/[^\'\s-a-z0-9]/i', '', $value);
        // replace spaces, dashes and quotes with dashes
        $value = preg_replace('/[\s-\']+/', '-', $value);           
        // trim the end of the string
        $value = trim($value, '.-_');
        return strtolower($value);
    }
        
    public static function excerpt($html, $max_chars) {
        $res = '';        
        // convert html to txt
        $string = HtmlToText::convert($html, false);
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
        $om->write('resiexchange\Question', $oids, ['content_excerpt' => null, 'indexed' => false], $lang);        
    }

    public static function onchangeTitle($om, $oids, $lang) {
        // force re-compute title_url
        $om->write('resiexchange\Question', $oids, ['title_url' => null], $lang);        
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

    public static function getTitleURL($om, $oids, $lang) {
        $result = [];
        $res = $om->read('resiexchange\Question', $oids, ['title']);
        foreach($res as $oid => $odata) {
            // note: final format will be: #/question/{id}/{title}
            $result[$oid] = self::slugify($odata['title'], 200);
        }
        return $result;        
    }
    
    public static function getAuthor($om, $oids) {
        $result = [];
        $questions = $om->read(__CLASS__, $oids, ['creator']);
        $authors_ids = [];
        if($questions > 0) {
            foreach($questions as $question_id => $question_data) {
                // remember creators ids for each question
                $authors_ids = array_merge($authors_ids, (array) $question_data['creator']); 
            }            
            // retrieve authors data
            $questions_authors = $om->read('resiway\User', $authors_ids, User::getPublicFields());        
            if($questions_authors > 0) {
                foreach($questions as $question_id => $question_data) {
                    $author_id = $question_data['creator'];
                    if(isset($questions_authors[$author_id])) {
                        $result[$question_id]['creator'] = $questions_authors[$author_id];
                    }
                }
            }
        }
        return $result;
    }
    
    public static function getCategories($om, $oids) {
        $result = [];
        $questions = $om->read(__CLASS__, $oids, ['categories_ids']);
        $categories_ids = [];
        if($questions > 0) {
            foreach($questions as $question_id => $question_data) {
                // remember categories ids for each question
                $categories_ids = array_merge($categories_ids, (array) $question_data['categories_ids']); 
            }            
            // retrieve categories data
            $questions_categories = $om->read('resiway\Category', $categories_ids, ['id', 'title', 'path', 'parent_path', 'description']);        
            if($questions_categories > 0) {
                foreach($questions as $question_id => $question_data) {
                    $categories_ids = $question_data['categories_ids'];
                    $result[$question_id]['categories'] = [];
                    foreach($categories_ids as $category_id) {
                        if(isset($questions_categories[$category_id])) {
                            $result[$question_id]['categories'][] = $questions_categories[$category_id];
                        }                        
                    }
                }
            }
        }
        return $result;
    }    
    
    /**
    * Converts a list of questions to a JSON structure
    * 
    */
    public static function toJSON($om, $oids, $params) {
        $result = [];
        $included = [];
        
        $questions = $om->read(__CLASS__, $oids, ['creator', 'created', 'title', 'title_url', 'content_excerpt', 'score', 'count_views', 'count_votes', 'count_answers', 'categories_ids']);        

        // read authors
        $authors = self::getAuthor($om, $oids);
        $questions = array_replace_recursive($questions, $authors);
        
        // read categories
        $categories = self::getCategories($om, $oids);
        $questions = array_replace_recursive($questions, $categories);
                        
        // build JSON object
        foreach($questions as $id => $question) {
            $author_id = $question['creator']['id'];
            unset($question['creator']['id']);
            if(!isset($included['creator_'.$author_id])) {
                $included['creator_'.$author_id] = ['type' => 'people', 'id' => $author_id, 'attributes' => (object) $question['creator']];
            }        
            foreach($question['categories'] as $category) {
                $category_id = $category['id'];
                unset($category['id']);
                if(!isset($included['category_'.$category_id])) {
                    $included['category_'.$category_id] = ['type' => 'category', 'id' => $category_id, 'attributes' => (object) $category];
                }        
            }
            $categories = $question['categories'];
            unset($question['id']);        
            unset($question['creator']);        
            unset($question['categories']);                
            $result[] = [
                'type'          => 'question', 
                'id'            => $id, 
                'attributes'    => (object) $question, 
                'relationships' => (object) [
                    'creator'       => (object)['data' => (object)['id'=>$author_id, 'type'=>'people']],
                    'categories'    => (object)['data' => array_map(function($a) {return (object)['id'=>$a['id'], 'type'=>'category'];}, $categories)]
                ]
            ];       
        }
        ksort($included);
        return json_encode([
            'jsonapi'   => (object) ['version' => '1.0'],        
            'meta'      => ['count' => $params['total'], 'page-size' => $params['limit'], 'total-pages' => $params['pages']],
            'data'      => $result,
            'included'  => array_values($included)
        ], JSON_PRETTY_PRINT);
    }
    
    /** 
    * Converts a single object serve a static version of the content
    *
    */    
    public static function toHTML($om, $oid) {
        $html = [];

        $questions = $om->read(__CLASS__, $oid, ['id', 'lang', 'creator', 'created', 'editor', 'edited', 'modified', 'title', 'title_url', 'content', 'content_excerpt', 'count_views', 'count_votes', 'score', 'answers_ids', 'categories_ids.title']);
        if($questions > 0 && isset($questions[$oid])) {
            // merge all answers_ids
            $answers_ids = array_reduce($questions, function($result, $question) { return array_merge($result, $question['answers_ids']); }, []);
            // pre-load all answers at once
            $answers = $om->read('resiexchange\Answer', $answers_ids, ['creator', 'created', 'editor', 'edited', 'content', 'content_excerpt', 'score']);    

            $odata = $questions[$oid];

            $html[] = '<!DOCTYPE html>'.PHP_EOL;
            $html[] = '<html lang="'.$question_data['lang'].'">'.PHP_EOL;
            $html[] = '<head>'.PHP_EOL;    
            $html[] = '<meta charset="utf-8">'.PHP_EOL;
            $html[] = '<meta name="title" content="'.$question_data['title'].' - ResiExchange - Des réponses pour la résilience">'.PHP_EOL;
            $html[] = '<meta name="description" content="'.$question_data['content_excerpt'].'">'.PHP_EOL;
            $html[] = '</head>'.PHP_EOL;
            $html[] = '<body>'.PHP_EOL;
        
            $html[] = '<div class="question wrapper"';
            $html[] = '   itemscope=""';
            $html[] = '   itemtype="https://schema.org/Question">';

            $html[] = '<h1 itemprop="name">'.$odata['title'].'</h1>';
            $html[] = '<div itemprop="upvoteCount">'.$odata['score'].'</div>';
            $html[] = '<div itemprop="answerCount">'.count($odata['answers_ids']).'</div>';
            $html[] = '<div itemprop="text">'.$odata['content'].'</div>';
            $html[] = '<div itemprop="dateCreated">'.$odata['created'].'</div>';        
            $html[] = '<div itemprop="dateModified">'.$odata['modified'].'</div>';                

            foreach($odata['categories_ids.title'] as $category) {
                $html[] = '<h2>'.$category.'</h2>';
            }
            
            $answers = $om->read('resiexchange\Answer', $odata['answers_ids'], ['creator', 'created', 'editor', 'edited', 'content', 'content_excerpt', 'score']);    
            if($answers > 0) {
                $first = true;
                foreach($answers as $answer_id => $answer_data) {    
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
}