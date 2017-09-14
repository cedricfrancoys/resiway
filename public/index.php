<?php
/*
* Public entry point for Qinoa framework
* For obvious security reasons, developers should ensure that this script remains the only entry-point.
*/


function getAppOutput() {
    ob_start();	
    include('../app.php'); 
    return ob_get_clean();
};

// handle the '_escaped_fragment_' parameter in case page is requested by a crawler
if(isset($_REQUEST['_escaped_fragment_'])) {
    $uri = $_REQUEST['_escaped_fragment_'];
    header('Status: 200 OK');
    header('Location: '.$uri);
    exit();
}

// This script is used to cache result of 'show' requests (that should return static HTML, and expect no params)
if(isset($_REQUEST['show'])) {
    $cache_filename = '../cache/'.$_REQUEST['show'];
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