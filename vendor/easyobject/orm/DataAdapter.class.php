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
*
*	You should have received a copy of the GNU General Public License
*	along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
namespace easyobject\orm;

use qinoa\html\HTMLPurifier as HTMLPurifier;
use qinoa\html\HTMLPurifier_Config as HTMLPurifier_Config;
use date\DateFormatter as DateFormatter;
use fs\FSManipulator as FSManipulator;
use \Exception as Exception;



class DataAdapter {

    private function __construct() {
    }

// temp
    public static function getInstance() {
        return new DataAdapter();        
    }
    
    public function __toString() {
        return "DataManager instance";
    }
    
	private static function &getConfig() {
		if( !isset($GLOBALS['DataAdapter_config']) ) {
            $adapter = array();

            $adapter['boolean']['orm']['ui'] =	function($value, $class, $oid, $field, $lang) {
                    if($value) $value = 'true';
                    else $value = 'false';
                    return $value;
            };
            $adapter['boolean']['orm']['db'] =	function($value, $class, $oid, $field, $lang) {
                    if($value) $value = '1';
                    else $value = '0';
                    return $value;
            };
            $adapter['integer']['orm']['db'] =	function($value, $class, $oid, $field, $lang) {
                    return intval($value);
            };            
            $adapter['date']['orm']['ui'] =	function($value, $class, $oid, $field, $lang) {
                    if($value == '0000-00-00') $value = '';
                    else {
                        $dateFormatter = new DateFormatter($value, DATE_SQL);
                        // DATE_FORMAT constant is defined in config.inc.php
                        $value = $dateFormatter->getDate(DATE_FORMAT);
                    }
                    return $value;
            };
            $adapter['date']['ui']['orm'] =	function($value, $class, $oid, $field, $lang) {
                    if(empty($value)) $value = '0000-00-00';
                    else {
                        // DATE_FORMAT constant is defined in config.inc.php
                        $dateFormatter = new DateFormatter($value, DATE_FORMAT);
                        $value = $dateFormatter->getDate(DATE_SQL);
                    }
                    return $value;												
            };
            // exchange format between PHP and Javascript for date, time, datetime	
            $adapter['date-format']['orm']['ui'] =	function($value, $class, $oid, $field, $lang) {
                    if(empty($value)) $value = '0000-00-00';
                    else {
                        $value = str_replace(array('d', 'm', 'Y', 'H', 'i', 's'), array('dd', 'mm', 'yy', 'hh', 'mm', 'ss'), $value);
                    }
                    return $value;												
            };
            $adapter['date-format']['ui']['orm'] = function($value, $class, $oid, $field, $lang) {
                    if(empty($value)) $value = '0000-00-00';
                    else {
                        $value = str_replace(array('dd', 'mm', 'yy', 'hh', 'mm', 'ss'), array('d', 'm', 'Y', 'H', 'i', 's'), $value);
                    }
                    return $value;												
            };
            $adapter['text']['ui']['orm'] =	function($value, $class, $oid, $field, $lang) {                    
                    // return htmlspecialchars($value);
                    return $value;
            };
            $adapter['short_text']['ui']['orm'] = $adapter['text']['ui']['orm'];
            $adapter['string']['ui']['orm'] = $adapter['text']['ui']['orm'];
            $adapter['html']['ui']['orm'] =	function($value, $class, $oid, $field, $lang) {
                    // clean HTML input html
                    // standard cleaning: remove non-standard tags and attributes    
                    $config = HTMLPurifier_Config::createDefault();
                    $purifier = new HTMLPurifier($config);    
                    return $purifier->purify($value);
            };            
            $adapter['file']['ui']['orm'] = function($value, $class, $oid, $field, $lang) {
                    // note : value is expected to be an array holding data from the $_FILES array and having the following keys set:
                    // ['name'], ['type], ['size'], ['tmp_name'], ['error']
                    $res = '';

                    if(!isset($value) || !isset($value['tmp_name'])) {
                        throw new Exception("binary data has not been received or cannot be retrieved", UNKNOWN_ERROR);                    
                    }
                    if(isset($value['error']) && $value['error'] == 2 || isset($value['size']) && $value['size'] > UPLOAD_MAX_FILE_SIZE) {
                        throw new Exception("file exceed maximum allowed size (".floor(UPLOAD_MAX_FILE_SIZE/1024)." ko)", NOT_ALLOWED);
                    }
                    if(FILE_STORAGE_MODE == 'DB') {
                        // store file content in database
                        $res = file_get_contents($value['tmp_name'], FILE_BINARY, null, -1, UPLOAD_MAX_FILE_SIZE);
                    }
                    else if(FILE_STORAGE_MODE == 'FS') { 
                        // build a unique name  (package/class/field/oid.lang)
                        $path = sprintf("%s/%s", str_replace('\\', '/', $class), $field);
                        $file = sprintf("%011d.%s", $oid, $lang);                       
                                                
                        $storage_location = realpath(FILE_STORAGE_DIR).'/'.$path;

                        if (!is_dir($storage_location)) {
                            // make missing directories
                            FSManipulator::assertPath($storage_location);
                        }
                        
                        // note : if a file by that name already exists it will be overwritten
                        move_uploaded_file($value['tmp_name'], $storage_location.'/'.$file);

                        $res = $path.'/'.$file;
                    }
                    return $res;
            };
            $adapter['boolean']['db']['orm'] = function($value, $class, $oid, $field, $lang) {
                return (intval($value) > 0);
            };
            $adapter['integer']['db']['orm'] = function($value, $class, $oid, $field, $lang) {
                return intval($value);
            };            
            $adapter['file']['db']['orm'] = function($value, $class, $oid, $field, $lang) {
                    $res = '';
                    if(FILE_STORAGE_MODE == 'DB') {
                        $res = $value;
                    }
                    else if(FILE_STORAGE_MODE == 'FS') {
                        $filename = $value;                        
                        if(strlen($filename) && file_exists(FILE_STORAGE_DIR.'/'.$filename)) $res = file_get_contents(FILE_STORAGE_DIR.'/'.$filename);
                    }
                    else throw new Exception("binary data has not been received or cannot be retrieved", UNKNOWN_ERROR);
                    
                    return $res;
            };        
            $adapter['file']['orm']['ui'] = function($value, $class, $oid, $field, $lang) {
                    return base64_encode($value);
            };            
            $adapter['one2many']['ui']['orm'] =	function($value, $class, $oid, $field, $lang) {
                    if(is_string($value)) $value = explode(',', $value);
                    return $value;
            };										
            $adapter['many2many']['ui']['orm'] = function($value, $class, $oid, $field, $lang) {
                    if(is_string($value)) $value = explode(',', $value);
                    return $value;
            };	            
            $GLOBALS['DataAdapter_config'] = $adapter;
        }
		return $GLOBALS['DataAdapter_config'];
	}
    
	private static function &getMethod($from, $to, $type) {
        $method = function ($value) { return $value; };
        $config = &self::getConfig();
        if( isset($config[$type][$from][$to]) ) {
            $method = $config[$type][$from][$to];
        }
		return $method;
	}
        
	public static function setMethod($from, $to, $type, $method) {
        $config = &self::getConfig();
        $config[$type][$from][$to] = $method;
	}
    

	public static function adapt($from, $to, $type, $value, $class=null, $oid=null, $field=null, $lang=DEFAULT_LANG) {											
        $method = &self::getMethod($from, $to, $type);
		return $method($value, $class, $oid, $field, $lang);
	}

}