<?php
defined('__QN_LIB') or die(__FILE__.' cannot be executed directly.');

use config\QNlib;
use qinoa\php\Context;

// force silent mode (debug output would corrupt json data)
set_silent(true);

// announce script and fetch parameters values
$params = QNLib::announce(	
	array(	
    'description'	=>	"Log current user out.",
	)
);


// destroy persistent data
$context = Context::getInstance();    
$context->set('user_id', 0);
foreach ($_COOKIE as $name => $value) setcookie($name, null);
setcookie(session_name(), '');
session_regenerate_id(true);

// send json result
header('Content-type: application/json; charset=UTF-8');
echo json_encode([
        'result'            => true, 
        'error_message_ids' => []
     ], JSON_PRETTY_PRINT);