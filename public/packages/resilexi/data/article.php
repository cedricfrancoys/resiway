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
    'description'	=>	"Returns a fully loaded article object",
    'params' 		=>	array(                                         
                        'id'    => array(
                                    'description'   => 'Identifier of the article to retrieve.',
                                    // 'type'          => 'integer', 
                                    'type'          => 'string', 
                                    'required'      => true
                                    ),                                            
                        )
	)
);


list($result, $error_message_ids) = [true, []];

list($object_class, $object_id) = ['resilexi\Article', $params['id']];


try {
    if(strpos($object_id, 'eko_') === 0) {
        $object_id = substr($object_id, 4);
        header("Location: http://localhost/eko/article_json.php?id=$object_id");
        exit();
    }
    $om = &ObjectManager::getInstance();
    
    // 0) retrieve parameters
    $user_id = ResiAPI::userId();
    if($user_id < 0) throw new Exception("request_failed", QN_ERROR_UNKNOWN);
    
    
    // 1) check rights  
    // everyone has read access over all articles
    
    // 2) action limitations
    // no limitation    
    // no concurrent action   

    // retrieve article
    $res = $om->read(   $object_class, 
                        $object_id, 
                        [
                            'id', 
                            'creator'       => User::getPublicFields(),
                            'editor'        => User::getPublicFields(), 
                            'categories'    => ['id', 'title', 'path', 'parent_path', 'description'], 
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
                        ]);

    if($res < 0 || !isset($res[$object_id])) throw new Exception("article_unknown", QN_ERROR_INVALID_PARAM);
    $article = $res[$object_id];         

    // retrieve actions performed by the user on this article
    $article_history = ResiAPI::retrieveHistory($user_id, $object_class, $object_id);
    $article['history'] = $article_history[$object_id];

    // retrieve actions performed by the user on these comments    
    $comments_ids = array_map(function($a) { return $a['id'];}, $article['comments']);
    $comments_history = ResiAPI::retrieveHistory($user_id, 'resilexi\ArticleComment', array_keys($article['comments']));

    foreach($comments_history as $comment_id => $history) {
        $article['comments'][$comment_id]['history'] = $history;
    }       

// todo: should we record view activity for non-users ?
    // update article's count_views 
    $om->write($object_class, $object_id, [ 'count_views' => $article['count_views']+1 ]);
    if($user_id > 0 && !isset($article['history']['resilexi_article_view'])) {
        // add article view to user history
        ResiAPI::registerAction($user_id, 'resilexi_article_view', 'resilexi\Article', $object_id);  
    }

    // normalize result : force array conversion for associative arrays with array_values()
    $article['categories'] = array_values($article['categories']);
    $article['comments'] = array_values($article['comments']);        
    // result is a single object
    $result = $article; 
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