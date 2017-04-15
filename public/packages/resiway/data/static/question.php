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
    'description'	=>	"Returns a fully-loaded question object",
    'params' 		=>	array(                                         
                        'id'	        => array(
                                            'description' => 'Identifier of the question to retrieve.',
                                            'type' => 'integer', 
                                            'required'=> true
                                            ),                                            
                        )
	)
);


list($result, $error_message_ids) = [true, []];

list($question_id) = [
    $params['id']
];


function isGoogleBot() {
    $res = false;
    // $_SERVER['HTTP_USER_AGENT'] = 'Googlebot';
    if(stripos($_SERVER['HTTP_USER_AGENT'], 'Google') !== false) {
        $hostname = gethostbyaddr($_SERVER['REMOTE_ADDR']);
        // possible formats (https://support.google.com/webmasters/answer/1061943)
        //  crawl-66-249-66-1.googlebot.com
        //  rate-limited-proxy-66-249-90-77.google.com
        $res = preg_match('/\.googlebot\.com$/i', $hostname);
        if(!$res) {
            $res = preg_match('/\.google\.com$/i', $hostname);        
        }        
    }
    return $res;
}

try {
    
    $om = &ObjectManager::getInstance();

    // retrieve question
    $result = [];
    $res = $om->read('resiexchange\Question', $question_id, ['id', 'lang', 'creator', 'created', 'editor', 'edited', 'modified', 'title', 'title_url', 'content', 'content_excerpt', 'count_views', 'count_votes', 'score', 'answers_ids']);
    if($res < 0 || !isset($res[$question_id])) throw new Exception("question_unknown", QN_ERROR_INVALID_PARAM);
    $question_data = $res[$question_id];
    
    if( !isGoogleBot() ) {
        // redirect to JS application
        header('Location: '.'/resiexchange.fr#/question/'.$question_data['id'].'/'.$question_data['title_url']);
        exit();
    } 
    else {
        // serve a static version of the content
        echo '<!DOCTYPE html>'.PHP_EOL;
        echo '<html lang="'.$question_data['lang'].'">'.PHP_EOL;
        echo '<head>'.PHP_EOL;    
        echo '<meta charset="utf-8">'.PHP_EOL;
        echo '<meta name="title" content="'.$question_data['title'].' - ResiExchange - Des réponses pour la résilience">'.PHP_EOL;
        echo '<meta name="description" content="'.$question_data['content_excerpt'].'">'.PHP_EOL;
        echo '</head>'.PHP_EOL;
        echo '<body>'.PHP_EOL;
        echo '<div class="question wrapper"'.PHP_EOL;
        echo '   itemscope=""'.PHP_EOL;
        echo '   itemtype="https://schema.org/Question">'.PHP_EOL;

        echo '<h1 itemprop="name">'.$question_data['title'].'</h1>'.PHP_EOL;
        echo '<div itemprop="upvoteCount">'.$question_data['score'].'</div>'.PHP_EOL;
        echo '<div itemprop="answerCount">'.count($question_data['answers_ids']).'</div>'.PHP_EOL;
        echo '<div itemprop="text">'.$question_data['content'].'</div>'.PHP_EOL;
        echo '<div itemprop="dateCreated">'.$question_data['created'].'</div>'.PHP_EOL;        
        echo '<div itemprop="dateModified">'.$question_data['modified'].'</div>'.PHP_EOL;                

        $res = $om->read('resiexchange\Answer', $question_data['answers_ids'], ['creator', 'created', 'editor', 'edited', 'content', 'content_excerpt', 'score', 'comments_ids']);    
        if($res > 0) {
            $first = true;
            foreach($res as $answer_id => $answer_data) {    
                echo '<div id="answer-'.$answer_id.'"'.PHP_EOL;
                echo ' itemscope="" '.PHP_EOL;
                echo ' itemtype="https://schema.org/Answer"'.PHP_EOL;
                if($first) echo ' itemprop="suggestedAnswer"'.PHP_EOL;
                echo '>'.PHP_EOL;
                echo '<div itemprop="upvoteCount">'.$answer_data['score'].'</div>'.PHP_EOL;
                echo '<div itemprop="text">'.$answer_data['content'].'</div>'.PHP_EOL;                
                echo '</div>'.PHP_EOL;                        
                $first = false;
            }
        }
        echo '</div>'.PHP_EOL;        
        echo '</body>'.PHP_EOL;        
        echo '</html>'.PHP_EOL;
        exit();
    }
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