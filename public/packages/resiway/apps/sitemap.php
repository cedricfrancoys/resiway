<?php
// Dispatcher (index.php) is in charge of setting the context and should include easyObject library
defined('__QN_LIB') or die(__FILE__.' cannot be executed directly.');
require_once('../resi.api.php');

use config\QNLib as QNLib;
use easyobject\orm\ObjectManager as ObjectManager;

// force silent mode (debug output would corrupt json data)
set_silent(true);

// announce script and fetch parameters values
$params = QNLib::announce(	
	array(	
    'description'	=>	"Returns sitemap file",
    'params' 		=>	array( 
                            'output' =>  array(
                                        'description'   => 'output format (txt, html, json)',
                                        'type'          => 'string', 
                                        'default'       => 'txt'
                                        )     
                        )
	)
);

list($result, $error_message_ids) = [true, []];

// note : as this is an app, if caching is enabled, make sure to empty cache folder on regular basis 
// (or to trigger it when some event occurs)
try {
    $om = &ObjectManager::getInstance();    
    $questions_ids = $om->search('resiexchange\Question');
    if($questions_ids > 0 && count($questions_ids)){
        $questions = $om->read('resiexchange\Question', $questions_ids, ['id', 'title_url', 'title']);
        foreach($questions as $question_id => $question) {
            switch($params['output']) {
            case 'txt':
                echo "https://www.resiway.org/question/{$question['id']}/{$question['title_url']}".PHP_EOL;
                break;
            case 'html':
                echo '<a href="https://www.resiway.org/question/'.$question['id'].'/'.$question['title_url'].'">'.$question['title'].'</a><br />'.PHP_EOL;
            }
        }
        exit();
    }
}
catch(Exception $e) {
    $error_message_ids = array($e->getMessage());
    $result = $e->getCode();
}

// send json result
header('Content-type: application/json; charset=UTF-8');
echo json_encode([
                    'result'            => $result, 
                    'error_message_ids' => $error_message_ids
                 ], JSON_PRETTY_PRINT);