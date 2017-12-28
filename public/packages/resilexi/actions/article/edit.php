<?php
// Dispatcher (index.php) is in charge of setting the context and should include easyObject library
defined('__QN_LIB') or die(__FILE__.' cannot be executed directly.');
require_once('../resi.api.php');

use config\QNLib as QNLib;
use easyobject\orm\ObjectManager as ObjectManager;
use easyobject\orm\PersistentDataManager as PersistentDataManager;

// force silent mode (debug output would corrupt json data)
set_silent(true);

// announce script and fetch parameters values
$params = QNLib::announce([
    'description'	=>	"Edit a article or submit a new one",
    'params' 		=>	[
        'id'	            => array(
                                'description'   => 'Identifier of the article being edited (a null identifier means creation of a new article).',
                                'type'          => 'integer', 
                                'default'       => 0
                            ),    
        'title'	            => array(
                                'description'   => 'Title of the submitted article.',
                                'type'          => 'string', 
                                'required'      => true
                            ),
        'content'	        => array(
                                'description'  => 'Content of the article.',
                                'type'          => 'string', 
                                'required'      => true
                            ),
        'source_author'	    => array(
                                'description'   => 'Original author of the submitted article, if any.',
                                'type'          => 'string', 
                                'default'       => ''
                            ),
        'source_license'    => array(
                                'description'   => 'License of the submitted article.',
                                'type'          => 'string', 
                                'default'       => 'CC-by-nc-sa'
                            ),
        'source_url'	    => array(
                                'description'   => 'Content of the submitted article.',
                                'type'          => 'string', 
                                'default'       => ''
                            ),                        
        'lang'              => array(
                                'description'   => 'Language of the submitted article.',
                                'type'          => 'string', 
                                'default'       => 'fr'
                            ),
        'content'	        => array(
                                'description'   => 'Content of the submitted article.',
                                'type'          => 'file', 
                                'default'       => []
                            ),
        'categories_ids'    => array(
                                'description'   => 'List of tags assigned to the article.',
                                'type'          => 'array',
                                'required'      => true
                            )
    ]
]);


list($result, $error_message_ids, $notifications) = [true, [], []];

list($action_name, $object_class, $object_id) = [ 
    'resilexi_article_edit',
    'resilexi\Article',
    $params['id']
];



// handle case of new article submission (which has a distinct reputation requirement)
if($object_id == 0) $action_name = 'resilexi_article_post';


try {    
    // try to perform action
    $result = ResiAPI::performAction(
        $action_name,                                             // $action_name
        $object_class,                                            // $object_class
        $object_id,                                               // $object_id
        [],                                                       // $object_fields
        false,                                                    // $toggle
        function ($om, $user_id, $object_class, $object_id)       // $do
        use ($params) {
            // retrieve related term
            $terms_ids = $om->search('resilexi\Term', ['title', 'ilike', $params['title']]);
            if($terms_ids < 0) throw new Exception("action_failed", QN_ERROR_UNKNOWN);
            if(count($terms_ids)) {
                $term_id = $terms_ids[0];
            }
            else {
                // create a new term + write given value
                $term_id = $om->create('resilexi\Term', [ 
                                'creator'           => $user_id,     
                                'title'             => $params['title']
                              ]);
            }
            $res = $om->read('resilexi\Term', $term_id, ['title', 'title_url']);
            if($res <= 0 || !isset($res[$term_id])) {
                throw new Exception("action_failed", QN_ERROR_UNKNOWN);
            }
            
            $params['title'] = $res[$term_id]['title'];
            $params['term'] = $term_id;
            
            // Article objects expect a 'categories' field
            $params['categories'] = [];
            // check categories_ids consistency (we might have received a request for new categories)
            foreach($params['categories_ids'] as $key => $value) {
                if(intval($value) == 0 && strlen($value) > 0) {
                    // check if a category by that name already exists
                    $cats_ids = $om->search('resiway\Category', ['title', 'ilike', $value]);
                    if($cats_ids && count($cats_ids)) {
                        $cat_id = $cats_ids[0];
                    }
                    else {
                        // create a new category + write given value
                        $cat_id = $om->create('resiway\Category', [ 
                                        'creator'           => $user_id,     
                                        'title'             => $value,
                                        'description'       => '',
                                        'parent_id'         => 0
                                      ]);
                    }
                    // update entry
                    $params['categories_ids'][$key] = sprintf("+%d", $cat_id);
                }
                // Article objects expect a 'categories' field
                $params['categories'][$key] = $params['categories_ids'][$key];
            }
            // Article objects expect a 'categories' field
            unset($params['categories_ids']);
            
            if($object_id == 0) {
            
                // create a new article + write given value
                unset($params['id']);
                $object_id = $om->create($object_class, array_merge(['creator' => $user_id], $params));                
                
                if($object_id <= 0) throw new Exception("action_failed", QN_ERROR_UNKNOWN);

                // update user count_articles
                $res = $om->read('resiway\User', $user_id, ['count_articles']);
                if($res > 0 && isset($res[$user_id])) {
                    $om->write('resiway\User', $user_id, [ 'count_articles'=> $res[$user_id]['count_articles']+1 ]);
                }

                // update categories count_articles
                $om->write('resiway\Category', $params['categories'], ['count_articles' => null]);
                
                // update global counters
                ResiAPI::repositoryInc('resilexi.count_articles');
            }
            else {
                /*
                 note : expected notation of categories_ids involve a sign 
                 '+': relation to be added
                 '-': relation to be removed
                */
                $om->write($object_class, $object_id, array_merge(['editor' => $user_id, 'edited' => date("Y-m-d H:i:s")], $params));

                // update categories count_articles
                $categories_ids = array_map(function($i) { return abs(intval($i)); }, $params['categories']);
                $om->write('resiway\Category', $categories_ids, ['count_articles' => null]);
            }
            
            // read created article as returned value
            $res = $om->read($object_class, $object_id, ['creator', 'created', 'title', 'content', 'content_excerpt', 'score', 'categories']);
            if($res > 0) {
                $result = array(
                                'id'                => $object_id,
                                'creator'           => ResiAPI::loadUserPublic($user_id), 
                                'created'           => $res[$object_id]['created'], 
                                'title'             => $res[$object_id]['title'],                             
                                'content'           => $res[$object_id]['content'],
                                'content_excerpt'   => $res[$object_id]['content_excerpt'],                                 
                                'score'             => $res[$object_id]['score'],
                                'categories'        => $res[$object_id]['categories'],
                                'comments'          => [],                                
                                'history'           => []
                          );
            }
            else $result = $res;
            return $result;
        },
        null,                                                      // $undo
        [                                                          // $limitations
            function ($om, $user_id, $action_id, $object_class, $object_id) 
            use ($params) {
                if(strlen($params['title']) < RESILEXI_ARTICLE_TITLE_LENGTH_MIN
                || strlen($params['title']) > RESILEXI_ARTICLE_TITLE_LENGTH_MAX) {
                    throw new Exception("article_title_length_invalid", QN_ERROR_INVALID_PARAM); 
                }
                $count_tags = 0;
                foreach($params['categories_ids'] as $category_id) {
                    if(intval($category_id) > 0) ++$count_tags;
                    else if(intval($category_id) == 0 && strlen($category_id) > 0) ++$count_tags;
                }
                if($count_tags < RESILEXI_ARTICLE_CATEGORIES_COUNT_MIN
                || $count_tags > RESILEXI_ARTICLE_CATEGORIES_COUNT_MAX) {
                    throw new Exception("article_categories_count_invalid", QN_ERROR_INVALID_PARAM); 
                }
                
            },
            // user cannot perform given action more than daily maximum
            function ($om, $user_id, $action_id, $object_class, $object_id) {
                $res = $om->search('resiway\ActionLog', [
                            ['user_id',     '=',  $user_id], 
                            ['action_id',   '=',  $action_id], 
                            ['object_class','=',  $object_class], 
                            ['created',     '>=', date("Y-m-d")]
                       ]);
                if($res > 0 && count($res) > RESILEXI_ARTICLE_DAILY_MAX) {
                    throw new Exception("action_max_reached", QN_ERROR_NOT_ALLOWED);
                }        
            }
        ]
    );
 
}
catch(Exception $e) {
    $result = $e->getCode();
    $error_message_ids = array($e->getMessage());
}

// send json result
header('Content-type: application/json; charset=UTF-8');
echo json_encode([
        'result'            => $result, 
        'error_message_ids' => $error_message_ids
    ], 
    JSON_PRETTY_PRINT);