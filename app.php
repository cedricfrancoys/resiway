<?php
/**
*    This file is part of the qinoa project.
*    http://www.cedricfrancoys.be/qinoa
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
* Dispatcher's role is to set up the context and handle the client calls
*
*/

/**
* Include dependencies
*/

use qinoa\php\Context;

// load bootstrap library : system constants and functions definitions
/*
    QN library allows to include required files and classes	
*/
include_once('../qn.lib.php');

// 3) load current user settings
// try to start or resume the session
// todo : deprecate : init in context
if(!strlen(session_id())) session_start() or die(__FILE__.', line '.__LINE__.", unable to start session.");


/**
* Define context
*/

// prevent vars initialization from generating output
set_silent(true);


// todo : to remove or add to fc.lib
// get the base directory of the current script (easyObject installation directory being considered as root for URL redirection)
define('BASE_DIR', substr($_SERVER['SCRIPT_NAME'], 0, strrpos($_SERVER['SCRIPT_NAME'], '/')+1));


// set the languages in which UI and content must be displayed

// UI items : UI language is the one defined in the user's settings (core/User object)
// todo : remove UI stuff from server
//isset($_SESSION['LANG_UI']) or $_SESSION['LANG_UI'] = user_lang();

// Content items :
//		- for unidentified users, language is DEFAULT_LANG
//		- for identified users, language is the one defined in their preferences
//		- if a parameter lang is defined in the HTTP request, it overrides user's language

// todo : store chosen language in JWT header
isset($_SESSION['LANG']) or $_SESSION['LANG'] = DEFAULT_LANG;
$params = config\QNlib::get_params(array('lang'=>$_SESSION['LANG']));
$_SESSION['LANG'] = $params['lang'];

// from now on, we let the requested script decide whether or not to output error messages if any
set_silent(false);


$context = Context::getInstance();
$request = $context->getHttpRequest();

/**
* Dispatching : try to resolve targetted controller, if specified and include related script file
*/
$resolved = [
    'type'      => null,
    'operation' => null,
    'package'   => null,   
    'script'    => null
];

// define accepted operations specifications
$accepted_operations = array(
    'do'	=> array('kind' => 'ACTION_HANDLER','dir' => 'actions'),    // do something server-side
    'get'	=> array('kind' => 'DATA_PROVIDER',	'dir' => 'data'),       // return some data 
    'show'	=> array('kind' => 'APPLICATION',	'dir' => 'apps')        // output rendering information (UI)
);

// retrieve current query string parameters
$uri_params = [];        
parse_str($request->uri()->query(), $uri_params);
// lookup amongst accepted request kinds
foreach($uri_params as $param => $operation_val) {
    foreach($accepted_operations as $operation_key => $operation_conf) {    
        if($param == $operation_key) {
            $resolved['type'] = $operation_key;
            $resolved['operation'] = $operation_val;
            $parts = explode('_', $resolved['operation']);
            if(count($parts) > 0) {
                // use first part as package name
                $resolved['package'] = array_shift($parts);
                // use reamining parts to build script path
                if(count($parts) > 0) {
                    $resolved['script'] = implode('/', $parts).'.php';     
                }
            }
            break 2;            
        }
    }
}

// if no package is pecified in the URI, check for DEFAULT_PACKAGE constant (which might be defined in root config.inc.php)
if(is_null($resolved['package']) && defined('DEFAULT_PACKAGE')) $resolved['package'] = DEFAULT_PACKAGE;

// if package has a custom configuration file, load it
if(!is_null($resolved['package']) && is_file('packages/'.$resolved['package'].'/config.inc.php')) {	
	include('packages/'.$resolved['package'].'/config.inc.php');
}

// if no request is specified, if possible set DEFAULT_PACKAGE/DEFAULT_APP as requested script
if(is_null($resolved['type'])) {
    if(is_null($resolved['package'])) {
        // send HTTP response
        $context->httpResponse()
                        // set response code to NOT FOUND                
                        ->status(404)
                        // output json data telling what is expected                                    
                        ->body([
                            'errors'    => ['NO_DEFAULT_PACKAGE' => '']
                        ])
                        ->send();
        // terminate script
        exit();        
    }
	if(config\defined('DEFAULT_APP')) {
        $resolved['type'] = 'show';
        $resolved['script'] = config\config('DEFAULT_APP').'.php';
        // maintain current URI consistency
        $request->uri()->set('show', $resolved['package'].'_'.config\config('DEFAULT_APP'));
    }
    else {
        // send HTTP response
        $context->httpResponse()
                        // set response code to NOT FOUND               
                        ->status(404)
                        // output json data telling what is expected                                    
                        ->body([
                            'errors'    => ['NO_DEFAULT_APP_FOR_PACKAGE' => $resolved['package']]
                        ])
                        ->send();
        // terminate script
        exit();
    }
}

// include resolved script, if any
if(isset($accepted_operations[$resolved['type']])) {
    $operation_conf = $accepted_operations[$resolved['type']];
    // remove operation parameter from request body, if any
    if($request->get($resolved['type']) == $resolved['operation']) {
        $request->del($resolved['type']);
    }
    // store current operation into context
    $context->set('operation', $resolved['operation']);
    // if no app is specified, use the default app (if any)
    if(empty($resolved['script']) && config\defined('DEFAULT_APP')) $resolved['script'] = config\config('DEFAULT_APP').'.php';
    $filename = 'packages/'.$resolved['package'].'/'.$operation_conf['dir'].'/'.$resolved['script'];
    if(!is_file($filename)) {
        // send HTTP response
        $context->httpResponse()
                        // set response code to NOT FOUND               
                        ->status(404)
                        // output json data telling what is expected                                    
                        ->body([
                            'errors'    => ['INVALID_'.$operation_conf['kind'] => $resolved['operation']]
                        ])
                        ->send();
        // terminate script
        exit();        
    }
    // export as constants all parameters declared with config\define() to make them accessible through global scope
    config\export_config();
    // include and execute requested script
    include($filename);        
}