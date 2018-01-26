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

use qinoa\php\Context;
use qinoa\route\Router;

/**
* handle requests that do not match any script from the public filesystem
* the purpose of this script is to find a route matching the requested URL
*/

// disable output
set_silent(true);


$context = &Context::getInstance();
$request = $context->getHttpRequest();

try {
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

    $found_url = $router->resolve($request->getUri()->getPath(), $request->getMethod());
}
catch(Exception $e) {
    $found_url = null;
}

if(!$found_url) {
    // send HTTP response
    $context->httpResponse()
            // set response code to NOT FOUND
            ->status(404)
            // output json data telling what is expected                                    
            ->body([
                'errors' => ['UNKNOWN_ROUTE' => $request->getUri()->getPath()]
            ])
            ->send();       
//	include_once('packages/core/html/page_not_found.html');    
}
// URL match found 
else {
    // extract resolved params, if any
    $params = $router->getParams();    
    // set the response header to HTTP 200
    header($_SERVER['SERVER_PROTOCOL'].' 200 OK');
    header('Status: 200 OK');
    // if found URL is another location, redirect to it
    if($found_url[0] == '/') {
        // resolve params in pointed location, if any
        foreach($params as $param => $value) {
            $found_url = str_replace(':'.$param, $value, $found_url);
        }
        // redirect to resulting URL
        header('Location: '.$found_url);
    }
    // otherwise, relay processing to index.php
    else {
        $uri_params = [];        
        // handle resolution notation
        if($found_url[0] == '?') {
            // merge current query string with the one from found URL
            parse_str(substr($found_url, 1), $uri_params);
            // update query string of current request URI 
            $request->uri()->set($uri_params);
        }        
        // in most cases, parameters from query string will be expected as body parameters
        $params = array_merge($params, $uri_params);
        // inject resolved parameters into current HTTP request body (if a param is already set, its value is overwritten)    
        foreach($params as $key => $value) {
            $request->set($key, $value);
        }
        include_once('index.php');
    }
}