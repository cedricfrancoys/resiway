<?php
// Dispatcher (index.php) is in charge of setting the context and should include easyObject library
defined('__QN_LIB') or die(__FILE__.' cannot be executed directly.');
require_once('../resi.api.php');

use config\QNLib as QNLib;
use easyobject\orm\ObjectManager as ObjectManager;


// force silent mode (debug output would corrupt json data)
set_silent(true);

// announce script and fetch parameters values
$params = QNLib::announce([
    'description'	=>	"Delete a article",
    'params' 		=>	[
        'article_id'	=> [
            'description'   => 'Identifier of the article to delete.',
            'type'          => 'integer', 
            'required'      => true
        ]
    ]
]);

list($result, $error_message_ids, $notifications) = [true, [], []];

list($action_name, $object_class, $object_id) = [ 
    'resilexi_article_delete',                         
    'resilexi\Article',
    $params['article_id']
];

try {
    
    // try to perform action
    $result = ResiAPI::performAction(
        $action_name,                                               // $action_name
        $object_class,                                              // $object_class
        $object_id,                                                 // $object_id
        ['creator', 'deleted', 'categories_ids'],                   // $object_fields
        true,                                                       // $toggle
        function ($om, $user_id, $object_class, $object_id) {       // $do
            // undo related action
            ResiAPI::unregisterAction($user_id, 'resilexi_article_post', $object_class, $object_id);
            // update deletion status
            $om->write($object_class, $object_id, [
                        'deleted' => 1
                      ]);
            // update categories and authors count_articles
            $object = $om->read($object_class, $object_id, ['categories_ids', 'pages', 'authors_ids'])[$object_id];
            $om->write('resiway\Category', $object['categories_ids'], ['count_articles' => null]);

            // update global articles-counter
            ResiAPI::repositoryDec('resilexi.count_articles');
            
            return true;
        },
        function ($om, $user_id, $object_class, $object_id) {       // $undo
            // perform related action
            ResiAPI::registerAction($user_id, 'resilexi_article_post', $object_class, $object_id);
            // update deletion status
            $om->write($object_class, $object_id, [
                        'deleted' => 0
                      ]);            
            // update categories and articles count_articles
            $object = $om->read($object_class, $object_id, ['categories_ids', 'pages', 'authors_ids'])[$object_id];
            $om->write('resiway\Category', $object['categories_ids'], ['count_articles' => null]);

            // update global articles-counter
            ResiAPI::repositoryInc('resilexi.count_articles');                      

            return false;
        },
        [                                                           // $limitations     
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