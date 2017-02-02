<?php
/**
*	This file is part of the easyObject project.
*	http://www.cedricfrancoys.be/easyobject
*
*	Copyright (C) 2012  Cedric Francoys
*
*	This program is free software: you can redistribute it and/or modify
*	it under the terms of the GNU General Public License as published by
*	the Free Software Foundation, either version 3 of the License, or
*	(at your option) any later version.
*
*	This program is distributed in the hope that it will be useful,
*	but WITHOUT ANY WARRANTY; without even the implied warranty of
*	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*	GNU General Public License for more details.

*	You should have received a copy of the GNU General Public License
*	along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
/** 
* Add stuff in the global namespace.
* Constants defined in this file are mandatory and cannot be modified in customs config.inc.php
*/

namespace {
    /**
    *	All constants required by the core are prefixed with QN_
    *	(in addition, user might define its own constants following his own formatting rules)
    */    
    
    /**
    * Current version of Qinoa
    */
    define('VERSION', '0.9.4');
        
	/**
	* Error codes
    * we use negative values to make it possible to distinguish error codes from object ids
	*/
	define('UNKNOWN_ERROR',		 -1);	// something went wrong (that requires to check the logs)
	define('MISSING_PARAM',		 -2);	// one or more mandatory parameters are missing
	define('INVALID_PARAM',		 -4);	// one or more parameters have invalid or incompatible value
	define('SQL_ERROR',			 -8);	// error while building SQL query or processing it (check that object class matches DB schema)
	define('UNKNOWN_OBJECT',	 -16);	// unknown resource (class, object, view, ...)
	define('NOT_ALLOWED',		 -32);	// action violates some rule (including UPLOAD_MAX_FILE_SIZE for binary fields) or user don't have required permissions

   	define('QN_ERROR_UNKNOWN',	        UNKNOWN_ERROR);
	define('QN_ERROR_MISSING_PARAM',    MISSING_PARAM);	// one or more mandatory parameters are missing
	define('QN_ERROR_INVALID_PARAM',	INVALID_PARAM);	// one or more parameters have invalid or incompatible value
	define('QN_ERROR_SQL',			    SQL_ERROR);	// error while building SQL query or processing it (check that object class matches DB schema)
	define('QN_ERROR_UNKNOWN_OBJECT',	UNKNOWN_OBJECT);	// unknown resource (class, object, view, ...)
	define('QN_ERROR_NOT_ALLOWED',		NOT_ALLOWED);	// action violates some rule (including UPLOAD_MAX_FILE_SIZE for binary fields) or user don't have required permissions

	/**
	* Debugging modes
	*/	
	define('DEBUG_PHP',			1);
	define('DEBUG_SQL',			2);
	define('DEBUG_ORM',			4);

	/**
	* Users & Groups permissions masks
	*/
	define('R_CREATE',			1);
	define('R_READ',			2);
	define('R_WRITE',			4);
	define('R_DELETE',			8);
	define('R_MANAGE',			16);

	/**
	* Built-in Users and Groups
	*
	* Note : make sure that the ids in DB are set and matching these
	*/
	define('GUEST_USER_ID',		0);
	define('ROOT_USER_ID',		1);
    
	define('DEFAULT_GROUP_ID',	1);	// default group (all users are members of the default group)
    
    /**
    * Session parameters
    */
    // Use session identification by COOKIE only
    ini_set('session.use_cookies', '1');
    ini_set('session.use_only_cookies', '1');
    // and make sure not to rewrite URL
    ini_set('session.use_trans_sid', '0');
    ini_set('url_rewriter.tags', '');



    /**
    *
    * Possible values are: 'ORM' and 'JSON' (router.json)
    */
    define('ROUTING_METHOD', 'JSON');
    
    /**
    * Binary type storage mode
    *
    * Possible values are: 'DB' (database) and 'FS' (filesystem)
    */
    define('FILE_STORAGE_MODE', 'FS');


    /**
    * Binaries storage directory
    */
    // Note: ensure http service has read/write permissions on this directory
    define('FILE_STORAGE_DIR', '../bin');


    /**
    * Default ACL
    *
    * If no ACL is defined (which is the case by default) for an object nor for its class, any user will be granted the permissions set below
    */
    // Note: in order to allow a user to fully create objects, he must be granted R_CREATE and R_WRITE permissions
    // Note: to set several rights at once, use the OR binary operator	
    define('DEFAULT_RIGHTS', R_CREATE | R_READ | R_WRITE | R_DELETE | R_MANAGE);


    /**
    * Access control level
    */
    // By default, the control is done at the class level. It means that a user will be granted the same rights for every objects of a given class.
    // However, sometimes we must take the object id under account (for instance, if pages of a web site can have their own permissions)
    define('CONTROL_LEVEL', 'class');	// allowed values are 'class' or ' object'
    
    
    /**
    * Language parameters
    */
    // The language in which the content must be displayed by default.
    define('DEFAULT_LANG', 'fr');
    define('GUEST_USER_LANG', 'fr');
    
    
    /**
    * Default Package
    */
    // Package we'll try to access if nothing is specified in the url (typically while accessing root folder)
    define('DEFAULT_PACKAGE', 'core');
 
    define('MAIL_SMTP_HOST', 'ssl0.ovh.net');
    define('MAIL_SMTP_PORT', '465');
    define('MAIL_USERNAME', 'info@resiway.org');
    define('MAIL_PASSWORD', 'resiway0123');      
}
namespace config {
    /** 
    * Constants defined in this section are mandatory but can be modified/re-defined in customs config.inc.php (i.e.: packages/[package_name]/config.inc.php)
    *
    */
    
    /**
    * Debugging
    */	
    define('DEBUG_MODE', DEBUG_PHP | DEBUG_ORM | DEBUG_SQL);
    // define('DEBUG_MODE', 0);

    /**
    * List of public objects 
    */
    // array of classes involved in right management and SPAM protection mechanism
    define ("PUBLIC_OBJECTS", serialize (array ('icway\Comment')));


    /**
    * Database parameters
    * note: most utilities need these parameters. 
    * Remember that when using them, package-specific parameters might not be loaded.
    * Overriding these is allowed but need to be done with caution.
    */
    define('DB_DBMS',		'MYSQL');		// only MySQL is supported so far
    define('DB_HOST',		'localhost');   // the full qualified domain name (ex.: www.example.com)
    define('DB_PORT',		'3306');		// this is the default port for MySQL
    define('DB_USER',		'root');        // this should be changed for security reasons
    define('DB_PASSWORD',	'');			// this should be changed for security reasons
    define('DB_NAME', 		'easyobject');	// specify the name of the DB that you have created or you plan to use
    define('DB_CHARSET',	'UTF8');		// unless you are really sure of what you're doing, leave this constant to 'UTF8'
    
    
  
}