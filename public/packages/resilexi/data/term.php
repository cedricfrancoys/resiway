<?php
// Dispatcher (index.php) is in charge of setting the context and should include easyObject library
defined('__QN_LIB') or die(__FILE__.' cannot be executed directly.');
require_once('../resi.api.php');

use config\QNLib as QNLib;
use easyobject\orm\ObjectManager as ObjectManager;

use resiway\User;

// force silent mode (debug output would corrupt json data)
set_silent(true);

// announce script and fetch parameters values
$params = QNLib::announce(	
	array(	
    'description'	=>	"Returns a fully loaded term object",
    'params' 		=>	array(                                         
                        'title'    => array(
                                    'description'   => 'Identifier of the term to retrieve.',
                                    'type'          => 'string', 
                                    'required'      => true
                                    ),                                            
                        )
	)
);


list($result, $error_message_ids) = [true, []];

list($object_class, $title) = ['resilexi\Term', $params['title']];


try {
    $om = &ObjectManager::getInstance();
    
    // 0) retrieve parameters
    $user_id = ResiAPI::userId();
    if($user_id < 0) throw new Exception("request_failed", QN_ERROR_UNKNOWN);
    
    
    // 1) check rights  
    // everyone has read access over all items
    
    // 2) action limitations
    // no limitation    
    // no concurrent action   

    $res = $om->search($object_class, ['title_url', '=', $title]);
    if($res <= 0 || !count($res)) throw new Exception("term_unknown", QN_ERROR_UNKNOWN_OBJECT);
    
    $object_id = $res[0];
    
    // retrieve term
    $res = $om->read(   $object_class, 
                        $object_id, 
                        [
                            'id', 
                            'title',
                            'title_url',
                            'articles'  => [
                                'id',
                                'creator'       => User::getPublicFields(),
                                'editor'        => User::getPublicFields(), 
                                'categories'    => ['id', 'title', 'title_url', 'path', 'parent_path', 'description'], 
                                'comments'      => ['id', 'creator' => User::getPublicFields(), 'created', 'content', 'score'],
                                'created',         
                                'edited', 
                                'modified', 
                                'title', 
                                'title_url', 
                                'source_author', 
                                'source_url', 
                                'source_license', 
                                'lang',  
                                'content', 
                                'content_excerpt', 
                                'count_stars', 
                                'count_views', 
                                'count_votes', 
                                'score'
                            ]
                        ]);

    if($res < 0 || !isset($res[$object_id])) throw new Exception("term_unknown", QN_ERROR_UNKNOWN_OBJECT);
    $term = $res[$object_id];         

    foreach($term['articles'] as $article_id => $article) {
        // retrieve actions performed by the user on this article
        $article_history = ResiAPI::retrieveHistory($user_id, 'resilexi\Article', $article_id);
        $article['history'] = $article_history[$article_id];

        // retrieve actions performed by the user on these comments    
        $comments_ids = array_map(function($a) { return $a['id'];}, $article['comments']);
        $comments_history = ResiAPI::retrieveHistory($user_id, 'resilexi\ArticleComment', array_keys($article['comments']));

        foreach($comments_history as $comment_id => $history) {
            $article['comments'][$comment_id]['history'] = $history;
        }       

// todo: should we record view activity for non-users ?
        // update article's count_views 
        $om->write('resilexi\Article', $article_id, [ 'count_views' => $article['count_views']+1 ]);
        if($user_id > 0 && !isset($article['history']['resilexi_article_view'])) {
            // add article view to user history
            ResiAPI::registerAction($user_id, 'resilexi_article_view', 'resilexi\Article', $article_id);  
        }

        // normalize result : force array conversion for associative arrays with array_values()
        $article['categories'] = array_values($article['categories']);
        $article['comments'] = array_values($article['comments']);
        $term['articles'][$article_id] = $article;
    }
    // normalize result : force array conversion for associative arrays with array_values()
    $term['articles'] = array_values($term['articles']);
    // result is a single object
    $result = $term; 
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