<?php
// Dispatcher (index.php) is in charge of setting the context and should include easyObject library
defined('__QN_LIB') or die(__FILE__.' cannot be executed directly.');
require_once('../resi.api.php');

use config\QNLib as QNLib;
use easyobject\orm\ObjectManager as ObjectManager;
use easyobject\orm\PersistentDataManager as PersistentDataManager;

// announce script and fetch parameters values
$params = QNLib::announce(	
	array(	
    'description'	=>	"Returns sitemap file",
    'params' 		=>	array( 
                            'user_id' =>  array(
                                        'description'   => '',
                                        'type'          => 'integer', 
                                        'default'       => '0'
                                        )     
                        )
	)
);
list($result, $error_message_ids) = [true, []];

set_silent(true);

try {
    $om = &ObjectManager::getInstance();        
    $pdm = &PersistentDataManager::getInstance();
    
    if($params['user_id'] <= 0) {
        // set identity as one of the random test-user
        $users_ids = $om->search('resiway\User', [['login', 'like', 'resiway_u%']]);
        $users = $om->read('resiway\User', $users_ids, ['id', 'count_questions', 'count_answers', 'count_comments', 'count_documents']);
        $scores = [];
        foreach($users as $user) {
            $scores[$user['id']] = $user['count_questions'] + $user['count_answers'] + $user['count_comments'] + $user['count_documents'];
        }
        asort($scores);
        $user_id = array_keys($scores)[0];
    }
    else {
        $user_id = $params['user_id'];
    }
    // generate access_token
    $access_token = ResiAPI::userToken($user_id);
    // store token in cookie
    setcookie('access_token', $access_token );
    $result = $user_id;
}
catch(Exception $e) {
    $result = $e->getCode();
    $error_message_ids = array($e->getMessage());
}

// send json result
header('Content-type: application/json; charset=UTF-8');
echo json_encode([
    'result' => $result, 
    'error_message_ids' => $error_message_ids
    ], 
    JSON_PRETTY_PRINT);