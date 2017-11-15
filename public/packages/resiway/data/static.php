<?php
// Dispatcher (index.php) is in charge of setting the context and should include easyObject library
defined('__QN_LIB') or die(__FILE__.' cannot be executed directly.');
require_once('../resi.api.php');

use config\QNLib;
use easyobject\orm\ObjectManager;

// force silent mode (debug output would corrupt json data)
set_silent(true);

// announce script and fetch parameters values
$params = QNLib::announce(	
	array(	
    'description'	=>	"Serve static content (raw HTML) for given object",
    'params' 		=>	array(                                         
                        'class'	        => array(
                                            'description'   => 'Pseudo class of the object to retrieve (article, document, question, answer, category, user).',
                                            'type'          => 'string', 
                                            'required'      => true
                                            ),    
                        'id'	        => array(
                                            'description'   => 'Identifier of the object to retrieve.',
                                            'type'          => 'integer', 
                                            'required'      => true
                                            ),                                            
                        'title'	        => array(
                                            'description'   => 'URL formatted title',
                                            'type'          => 'string', 
                                            'default'       => ''
                                            )
                        )
	)
);


list($result, $error_message_ids) = [true, []];

list($object_pseudo_class, $object_id) = [$params['class'], $params['id']];


try {
    switch($object_pseudo_class) {
    case 'article':
        $object_class = 'resilexi\Article';   
        break;        
    case 'document':
        $object_class = 'resilib\Document';   
        break;       
    case 'question':
        $object_class = 'resiexchange\Question';   
        break;    
    case 'answer':
        $object_class = 'resiexchange\Answer';   
        break;    
    case 'category':
        $object_class = 'resiway\Category';   
        break;    
    case 'user': 
        $object_class = 'resiway\User';   
        break;
    default: throw new Exception('unknown class', QN_ERROR_INVALID_PARAM);
    }
    
    $om = &ObjectManager::getInstance();
    $html = $object_class::toHTML($om, $object_id);
}
catch(Exception $e) {
    $html = sprintf("Error: %d, %s", $e->getCode(), $e->getMessage());
}

// send json result
header('Content-type: text/html; charset=UTF-8');
echo $html;