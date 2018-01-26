<?php
/*
* Public entry point for Qinoa framework
* For obvious security reasons, developers should ensure that this script remains the only entry-point.
*/
include_once('../qn.lib.php');

use qinoa\php\Context;

$context = &Context::getInstance();
$request = $context->httpRequest();

function getAppOutput() {
    ob_start();	
    include('../app.php'); 
    return ob_get_clean();
};

// handle the '_escaped_fragment_' parameter in case page is requested by a crawler
if(!is_null($request->get('_escaped_fragment_', null))) {
    $uri = $request->get('_escaped_fragment_');
    header('Status: 200 OK');
    header('Location: '.$uri);
    exit();
}

// This script is used to cache result of 'show' requests 
// ('show' requests should always return static HTML, and expect no params)
if( $request->get('show')) {
    $cache_filename = '../cache/'.$request->get('show');
    if(file_exists($cache_filename)) {
        print(file_get_contents($cache_filename));
        exit();
    }
}

$content = getAppOutput();
if( isset($cache_filename) && is_writable(dirname($cache_filename)) ) {
    file_put_contents($cache_filename, $content);
}
print($content);