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

/*
* file: packages/core/apps/user/login.php
*
* Displays a logon form.
*
*/

// the dispatcher (index.php) is in charge of setting the context and should include the easyObject library
defined('__QN_LIB') or die(__FILE__.' cannot be executed directly.');
require_once('../qn.api.php');

use html\phpQuery as phpQuery;
use html\HtmlPurifier as HtmlPurifier;

set_silent(true);


// announce script and fetch parameters values
$params = announce(	
	array(	
    'description'	=>	"Displays a signin form.",
    'params' 		=>	array(
                        'user_name' 	=>  array(
                                            'description' => 'User to logon to.',
                                            'type' => 'string', 
                                            'default'=> ''
                                            ),
                        'lang'			=>  array(
                                            'description'=> 'Specific language for multilang field.',
                                            'type' => 'string', 
                                            'default' => DEFAULT_LANG
                                            )
                        )
	)
);




			
$params = get_params(array('ui'=>user_lang()));


$html = file_get_contents('packages/core/html/templates/login.html');



print($html );