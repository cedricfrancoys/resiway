<?php
/**
*    This file is part of the easyObject project.
*    http://www.cedricfrancoys.be/easyobject
*
*    Copyright (C) 2012  Cedric Francoys
*
*    This program is free software: you can redistribute it and/or modify
*    it under the terms of the GNU General Public License as published by
*    the Free Software Foundation, either version 3 of the License, or
*    (at your option) any later version.
*
*    This program is distributed in the hope that it will be useful,
*    but WITHOUT ANY WARRANTY; without even the implied warranty of
*    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*    GNU General Public License for more details.
*
*    You should have received a copy of the GNU General Public License
*    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/


/**
* Include dependencies
*/

// load Qinoa bootstrap library : system constants and functions definitions
include_once('../qn.lib.php');

use qinoa\php\PhpContext;
use qinoa\route\Router;

/**
* handle requests that do not match any script from the public filesystem
* the purpose of this script is to find a route matching the requested URL
*/

// disable output
set_silent(true);


$phpContext = &PhpContext::getInstance();
$request = $phpContext->getHttpRequest();

try {
    // retrieve URI path
    $uri = $request->getUri()->getPath();

    // load routes definition
    $json_file = '../config/routing/default.json';    
    if( ($json = @file_get_contents($json_file)) === false) throw new Exception('routing config file is missing');    
    if( ($routes = json_decode($json, true)) == null) throw new Exception('malformed json in routing config file');
    
    $router = new Router($routes);

    // load languages routes
    $json_file = '../config/routing/fr.json';    
    if( ($json = @file_get_contents($json_file)) === false) throw new Exception('routing config file is missing');    
    if( ($routes = json_decode($json, true)) == null) throw new Exception('malformed json in routing config file');
    $router->appendRoutes($routes);
        
    if($request->isBot()) {
        $json_file = '../config/routing/bots.json';
        if( ($json = @file_get_contents($json_file)) === false) throw new Exception('routing config file is missing');    
        if( ($routes = json_decode($json, true)) == null) throw new Exception('malformed json in routing config file');
        $router->prependRoutes($routes);
    }

    $found_url = $router->resolve($uri);    
}
catch(Exception $e) {
    $found_url = null;
}

if(!$found_url) {
	// set the header to HTTP 404 and exit
	header($_SERVER['SERVER_PROTOCOL'].' 404 Not Found');
	header('Status: 404 Not Found');
	include_once('packages/core/html/page_not_found.html');    
}
// URL match found 
else {
    // extract resolved params, if any
    $params = [];
    if($found_url[0] == '?') {
        parse_str(substr($found_url, 1), $params);        
    }
    // merge resolved params with URL params
    $params = array_merge($params, $router->getParams());
    // set the header to HTTP 200 and relay processing to index.php
    header($_SERVER['SERVER_PROTOCOL'].' 200 OK');
    header('Status: 200 OK');
    // if found URL is another location    
    if($found_url[0] == '/') {
        // insert resolved params to pointed location, if any
        foreach($params as $param => $value) {
            $found_url = str_replace(':'.$param, $value, $found_url);
        }
        // redirect to new URL
        header('Location: '.$found_url);
    }
    else {        
        // merge resolved params with original URL params, if any
        if($request->getMethod() == 'GET') {
            $params = array_merge((array) $request->getBody(), $params);            
        }
        // inject resolved params to global '$_REQUEST' (if a param is already set, its value is overwritten)    
        foreach($params as $key => $value) {
            $_REQUEST[$key] = $value;
            $request->set($key, $value);
        }
        include_once('index.php');
    }
}