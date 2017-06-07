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
    'description'	=>	"Returns a fully-loaded document object",
    'params' 		=>	array(                                         
                        'id'	        => array(
                                            'description'   => 'Identifier of the document to retrieve.',
                                            'type'          => 'integer', 
                                            'required'      => true
                                            ),
                        'title'	        => array(
                                            'description'   => 'URL formatted title',
                                            'type'          => 'string', 
                                            'required'      => true
                                            )                                            
                        )
	)
);


list($result, $error_message_ids) = [true, []];

list($document_id) = [
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
/*
    if( !isGoogleBot() ) {
        // redirect to JS application
        header('Location: '.'/resilib.fr#/document/'.$params['id'].'/'.$params['title']);
        exit();
    } 
    else {
        */
        $om = &ObjectManager::getInstance();
        $res = $om->read('resilib\Document', $params['id'], ['content']);
        if($res <= 0 || !count($res)) throw new Exception("document_unknown", QN_ERROR_UNKNOWN_OBJECT);
        // header('Location: '.'/resilib.static/data/documents/'.$params['title'].'/document.pdf');
        // $filepath = getcwd().'/resilib.static/data/documents/'.$params['title'].'/document.pdf';

        $document = $res[$params['id']];
        $len = strlen($document['content']);
        if($len <=0) throw new Exception("document_empty", QN_ERROR_INVALID_PARAM);
        
        header("Pragma: public");
        header("Expires: 0");
        header("Cache-Control: must-revalidate, post-check=0, pre-check=0");
        header("Cache-Control: public");
        header("Content-Type: application/pdf");
        header("Content-Length: ".$len);
        print($document['content']);
        exit();

    /* } */
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