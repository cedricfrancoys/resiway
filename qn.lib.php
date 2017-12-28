<?php
/**
*    This file is part of the Qinoa project.
*    https://github.com/cedricfrancoys/qinoa
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
namespace {
	define('__QN_LIB', true) or die('fatal error: __QN_LIB already defined or cannot be defined');
    
	/**
	* Add some global system-related constants (those cannot be modified by other scripts)
	*/
    include_once('config/config.inc.php');


	/** 
	* Add some config-utility functions to the global namespace
	*/

	/**
	* Returns a configuraiton parameter.
	*/
	function config($name, $default=null) {
        return (defined($name))?constant($name):$default;
	}

	/**
	* Force the script to be either silent (no output) or verbose (according to DEBUG_MODE).
	* @param boolean $silent
	*/
	function set_silent($silent) {
		$GLOBALS['SILENT_MODE'] = $silent;
        /*
		ini_set('display_errors', !$silent);
		if($silent) error_reporting(0);
		else error_reporting(E_ALL);
        */
	}

	/**
	* Returns the resulting debug mode (taking $SILENT_MODE under account)
	*/
	function debug_mode() { return ($GLOBALS['SILENT_MODE'])?0:config('DEBUG_MODE'); }	

	// Set script as verbose by default (and ensure $GLOBALS['SILENT_MODE'] is set)
	set_silent(false);
}
namespace config {
    use easyobject\orm\ObjectManager;
    use qinoa\data\DataValidator;
    use \ReflectionClass;
    use \ReflectionException;
    
	/**
	* Add some config-utility functions to the 'config' namespace
	*/

	/**
	* Adds a parameter to the configuration array
	*/	
	function define($name, $value) {
		$GLOBALS['CONFIG_ARRAY'][$name] = $value;
	}

	/**
	* Checks if a parameter has already been defined
	*/	
	function defined($name) {
		return isset($GLOBALS['CONFIG_ARRAY'][$name]);
	}

	function get_config() {
		return $GLOBALS['CONFIG_ARRAY'];
	}

	function set_config($config) {
		return $GLOBALS['CONFIG_ARRAY'] = $config;
	}


	/**
	* Returns a configuraiton parameter.
	*/
	function config($name, $default=null) {
		return (isset($GLOBALS['CONFIG_ARRAY'][$name]))?$GLOBALS['CONFIG_ARRAY'][$name]:$default;
	}
	
	/**
	* Export parameters declared with config\define function, as constants (i.e.: accessible through global scope)
	*/
	function export_config() {
		if(!isset($GLOBALS['CONFIG_ARRAY'])) $GLOBALS['CONFIG_ARRAY'] = array();
		foreach($GLOBALS['CONFIG_ARRAY'] as $name => $value) {
			\defined($name) or \define($name, $value);
			unset($GLOBALS['CONFIG_ARRAY'][$name]);
		}
	}
	
	/**
	*	FC library defines a set of functions whose purpose is to ease php scripting for :
	*	- classes inclusion (especially for cascading inclusions)
	*		load_class($class_path)
	*	- extracting HTTP data (GET / POST/ COOKIE)
	*		extract_params($url)
	*	- script description and the parameters it should receive
	*
	*	Classes folder (either Zend or user-defined framework, or both) needs to be placed in a directory named 'library' located in the same folder as the current fc.lib.php file
	*	User-defined classes naming convention : ClassName.class.php
	*
	*	Expected tree structure :
	*		library
	*		library/classes
	*		library/files
	*		library/Zend
	*
	*	This file should be included only once (for example in the index.php file)
	*		ex. : include_once('fc.lib.php');
	*
	*	Any file requiring functions defined in this library must check its presence :
	*		ex. : defined('__FC_LIB') or die(__FILE__.' requires fc.lib.php');
	*/
	class QNlib {

		/*
		* private methods
		*/

		/**
		* Gets the name of a class given the full path of the file containing its definition.
		*
		* @static
		* @param	string	$class_path
		* @return	string
		*/
		private static function get_class_name($class_path) {
			$parts = explode('/', $class_path);
			return end($parts);
		}

		/**
		* Gets the relative path of a file containing a class, given its full path.
		*
		* @static
		* @param	string	$class_path
		* @return	string
		*/
		private static function get_class_path($class_path) {
			$sub_path = substr($class_path, 0, strrpos($class_path, '/'));
			if(strlen($sub_path) > 0) {
				$sub_path .= '/';
			}
			// return 'classes/'.$sub_path.self::get_class_name($class_path);
			return $sub_path.self::get_class_name($class_path);            
		}

		/**
		* Checks if the path contains the specified file , given its relative path.
		*
		* @static
		* @param	string	$filename
		* @return	bool
		*/
		private static function path_contains($filename) {
			$include_path = get_include_path();
			if(strpos($include_path, PATH_SEPARATOR)) {
				if(($temp = explode(PATH_SEPARATOR, $include_path))) {
					for($n = 0; $n < count($temp); ++$n) {
						if(file_exists($temp[$n].'/'.$filename)) return true;
					}
				}
			}
			return false;
		}

        
        private static function inject_dependency($dependency) {
            $instance = null;
            $unresolved_dependencies = [];
            try {
                $dependencyClass = new ReflectionClass($dependency);
                $constructor = $dependencyClass->getConstructor();
                $parameters = $constructor->getParameters();    
                if(count($parameters)) {
                    // check dependencies availability
                    $instances = [];
                    foreach($parameters as $parameter) {
                        $constructor_dependancy = $parameter->getClass()->getName();
                        // todo : no cyclic dependency check is done            
                        $res = self::inject_dependency($constructor_dependancy);            
                        if(count($res[1])) {
                            $unresolved_dependencies = array_merge($unresolved_dependencies, $res[1]);
                            continue;
                        }
                        if($res[0] instanceof $constructor_dependancy) {
                            $instances[] = $res[0];
                        }
                    }
                    if(!count($unresolved_dependencies)) {
                        $instance = call_user_func_array($dependency.'::getInstance', $instances);
                    }
                }
                else {
                    if(!is_callable($dependency.'::getInstance')) {
                        $unresolved_dependencies[] = $dependency;
                    }
                    else {
                        $instance = $dependency::getInstance();
                    }
                }
            }
            catch(ReflectionException $e) {
                $unresolved_dependencies[] = $dependency;
            }
            return [$instance, $unresolved_dependencies];
        }        
		/*
		* public methods
		*/

		/**
		* Gets the location of the given script, by default the current file (fc.lib.php)
		*
		* @static
		* @return	string
		*/
		public static function get_script_path($script=__FILE__) {
			$file_path = str_replace('\\', '/', $script);
			if(($pos = strrpos($file_path, '/')) !== false) {
				$file_path = substr($file_path, 0, $pos);
			}
			return $file_path;
		}
        
		/**
		* Adds the library folder to the include path (library folder should contain the Zend framework if required)
		*
		* @static
		*/
		public static function init() {
			$library_folder = self::get_script_path().'/vendor';
			if(is_dir($library_folder))	set_include_path($library_folder.PATH_SEPARATOR.get_include_path());            
            // register own class loader
            spl_autoload_register(__NAMESPACE__.'\QNlib::load_class');            
            // now we can autoload the ORM manager
            $om = &ObjectManager::getInstance();
            // register ORM classes autoloader
            spl_autoload_register([$om, 'getStatic']);
		}

		/**
		* Gets the complete URL (uniform resource locator)
		*
		* @static
		* @param	boolean $server_port	display server port (required when differs from 80)
		* @param	boolean	$query_string	display query_string (i.e.: script.php?...&...&...)
		* @return	string
		*/
// todo : deprecate        
		public static function get_url($server_port=true, $query_string=true) {
            $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? 'https://' : 'http://';
			$url = $protocol.$_SERVER['SERVER_NAME'];
			if($server_port && $_SERVER['SERVER_PORT'] != '80')  $url .= ':'.$_SERVER['SERVER_PORT'];
			// add full request URI if required
			if($query_string) $url .= $_SERVER['REQUEST_URI'];	
			// otherwise get the base directory of the current script (assuming this script is located in the root installation dir)
			else $url .= substr($_SERVER['SCRIPT_NAME'], 0, strrpos($_SERVER['SCRIPT_NAME'], '/')+1);
			return $url;
		}

		/**
		* Checks if all parameters have been received in the HTTP request. If not, the script is terminated.
		*
		* @deprecated : use announce method instead
		*
		* @static
		*/
		public static function check_params($mandatory_params) {
			if(count(array_intersect($mandatory_params, array_keys($_REQUEST))) != count($mandatory_params)) {
				// alternate output: send json data telling which params are expected
				echo json_encode(array('expected_params' => $mandatory_params), JSON_FORCE_OBJECT);
				// terminate script
				die();
			}
		}
		
		/**
		* Gets the value of a list of parameters received in the HTTP request. If a parameter is not defined, its default value is returned.
		*
		* @deprecated : use announce method instead
		*
		* @static
		* @param	array	$params
		* @param	array	$default_values
		* @return	array
		*/
		public static function get_params($params) {
			$result = array();
			foreach($params as $param => $default) {
				if(isset($_REQUEST[$param]) && !empty($_REQUEST[$param])) $result[$param] = $_REQUEST[$param];
				else $result[$param] = $default;
			}
			return $result;
		}

		/**
		* This method describes the current script and its parameters. It also ensures that required parameters have been transmitted.
		* And, if necessary, sets default values for missing optional params.
		*
		* Accepted types for parameters types are : int, bool, float, string, array
		* Note: invalid parameters in $_REQUEST will not be taken under consideration
        *
		* @static
		* @param	array	$announcement	array holding the description of the script and its parameters
		* @return	array	parameters and their final values
		*/
		public static function announce($announcement) {		
			$result = array();            
//todo : use context->request()->body() instead of $_REQUEST
// use DataAdapter

			// 0) check presence of all mandatory parameters
			// build mandatory fields array
			$mandatory_params = array();
			if(!isset($announcement['params'])) $announcement['params'] = array();
            
            // 1) fetch values from command line, in case script was invoked by CLI
            if( $options = getopt("", array_map(function ($a) { return $a.'::'; }, array_keys($announcement['params']))) ) {
                foreach($options as $param => $value) {
                    $_REQUEST[$param] = $value;
                }
            }
            
            // chek if all required parameters have been received
			foreach($announcement['params'] as $param => $config) {
				if(isset($config['required']) && $config['required']) $mandatory_params[] = $param;
            }
			// if at least one mandatory param is missing
            $missing_params = array_diff($mandatory_params, array_keys($_REQUEST));
			// if(	count(array_intersect($mandatory_params, array_keys($_REQUEST))) != count($mandatory_params) 
            if( count($missing_params) || isset($_REQUEST['announce']) ) {
				// output json data telling what is expected
                header('Content-type: application/json; charset=UTF-8');
				echo json_encode([
                                    'result'        => isset($_REQUEST['announce'])?0:QN_ERROR_MISSING_PARAM,
                                    'announcement'  => $announcement, 
                                    'errors'        => array_map(function($a) {return 'missing param '.$a;}, $missing_params)
                                 ], JSON_PRETTY_PRINT);
				// terminate script
				exit();
			}
		
			// 2) find any missing parameters            
			$allowed_params = array_keys($announcement['params']);
			$missing_params = array_diff($allowed_params, array_intersect($allowed_params, array_keys($_REQUEST)));

			// 3) build result array and set default values for optional missing parameters
			foreach($announcement['params'] as $param => $config) {
                // note : at some point condition had a clause " || empty($_REQUEST[$param]) ", remember not to alter received data
				if(in_array($param, $missing_params)) {
					if(isset($config['default'])) {
                        $result[$param] = $config['default'];
                    }
				}
                else {
// DataAdapter (all inputs are handled as text, conversion is made based on expected type)                    
                    // prevent some js/php misunderstanding
                    if(in_array($_REQUEST[$param], ['NULL', 'null'])) $_REQUEST[$param] = null;
                    
                    switch($config['type']) {
                        case 'bool':
                        case 'boolean':
                            if(in_array($_REQUEST[$param], ['TRUE', 'true', '1', 1, true], true)) $_REQUEST[$param] = true;
                            else if(in_array($_REQUEST[$param], ['FALSE', 'false', '0', 0, false], true)) $_REQUEST[$param] = false;
                            break;
                        case 'array':
                            if(!is_array($_REQUEST[$param])) {
                                if(empty($_REQUEST[$param])) $_REQUEST[$param] = array();
                                else $_REQUEST[$param] = explode(',', str_replace(array("'", '"'), '', $_REQUEST[$param]));
                            }
                            break;
                        case 'string':
                            if($_REQUEST[$param] == null) $_REQUEST[$param] = '';
                            break;
                        case 'float':
                        case 'double':
                            if(is_numeric($_REQUEST[$param])) {
                                $_REQUEST[$param] = floatval($_REQUEST[$param]);
                            }
                            break;
                        case 'int':
                        case 'integer':
                            if(in_array($_REQUEST[$param], ['TRUE', 'true'])) $_REQUEST[$param] = 1;
                            else if(in_array($_REQUEST[$param], ['FALSE', 'false'])) $_REQUEST[$param] = 0;
                            if(is_numeric($_REQUEST[$param])) {
                                $_REQUEST[$param] = intval($_REQUEST[$param]);
                            }                            
                            break;                        
                    }
                    $result[$param] = $_REQUEST[$param];                    
                }				
			}
 
 
            // 4) validate result array values types and handle optional attributes, if any
            $invalid_params = [];
            foreach($result as $param => $value) {
                $config = $announcement['params'][$param];
                // build constraints array
                $constraints = [];
                // adapt type to match PHP internals
                switch($config['type']) {
                case 'bool':
                case 'boolean':
                    $constraints[] = ['kind' => 'type', 'rule' => 'boolean'];
                    break;
                case 'float':
                case 'double':
                    $constraints[] = ['kind' => 'type', 'rule' => 'double'];                
                    break;
                case 'int':
                case 'integer':
                    $constraints[] = ['kind' => 'type', 'rule' => 'integer'];
                    break;
                default:
                    $constraints[] = ['kind' => 'type', 'rule' => $config['type']];
                    break;
                }
                // append specific constraints
                if(isset($config['min'])) {
                    $constraints[] = ['kind' => 'min', 'rule' => $config['min']];
                }
                if(isset($config['max'])) {
                    $constraints[] = ['kind' => 'max', 'rule' => $config['max']];
                }
                if(isset($config['in'])) {
                    $constraints[] = ['kind' => 'in', 'rule' => $config['in']];
                }
                if(isset($config['not in'])) {
                    $constraints[] = ['kind' => 'not in', 'rule' => $config['not in']];
                }
                // validate parameter's value 
                if(!DataValidator::validate($value, $constraints)) {
                    if(!in_array($param, $mandatory_params)) {
                        // warning
                        unset($result[$param]);
                    }
                    else $invalid_params[] = $param;
                }
            }
            if(count($invalid_params)) {
                // output json data telling what is expected
                header('Content-type: application/json; charset=UTF-8');                    
                echo json_encode([
                                    'result'            => QN_ERROR_INVALID_PARAM,
                                    'announcement'      => $announcement, 
                                    'errors' => array_map(function($a) {return "invalid value received for param '".$a."' (check announcement rules)";}, $invalid_params)
                                 ], JSON_PRETTY_PRINT);
                // terminate script
                exit();                    
            }            
            
            // 5) check for requested providers
            if(isset($announcement['providers']) && count($announcement['providers'])) {
                $providers = [];
                // inject dependencies
                $unknown_providers = [];
                foreach($announcement['providers'] as $provider) {
                    $res = self::inject_dependency($provider);
                    $unknown_providers = array_merge($unknown_providers, $res[1]);
                    if($res[0]) {
                        $providers[$provider] = $res[0];
                    }
                }
                
                if(count($unknown_providers)) {
                    // output json data telling what is expected
                    header('Content-type: application/json; charset=UTF-8');                    
                    echo json_encode([
                                        'result'            => QN_ERROR_INVALID_PARAM,
                                        'announcement'      => $announcement, 
                                        'errors' => array_map(function($a) {return 'unknown provider '.$a;}, $unknown_providers)
                                     ], JSON_PRETTY_PRINT);
                    // terminate script
                    exit();                    
                }
                                
                $result = [$result, $providers];                
            }
			return $result;
		}
		
		/**
		* Extracts paramters from an URL : returns an associative array with the params and their values
		*
		* @static
		* @param	string	$url
		* @return	array
		*/
		public static function extract_params($url) {
            $val = parse_url($url, PHP_URL_QUERY);
            parse_str($val, $result);
            return $result;
            /*
			preg_match_all('/([^?&=#]+)=([^&#]*)/', $url, $matches);
			return array_combine(
						array_map(function($arg){return htmlspecialchars(urldecode($arg));}, $matches[1]),
						array_map(function($arg){return htmlspecialchars(urldecode($arg));}, $matches[2])
					);
            */
		}

		/**
		* Loads a class file from its class name (compatible with Zend classes)
		*
		* @static
		* @example	load_class('db/DBConnection');
		* @param	string	$class_path
		* @param	string	$class_name	in case the actual name of the class differs from the class file name (which may be the case when using namespaces)
		* @return	bool
		*/
		public static function load_class($class_path, $class_name='') {
			$result = false;
			if(strpos($class_path, 'Zend_') === 0) {
				// Zend framework 1
				 require_once 'Zend/Loader.php';
				 $result = \Zend_Loader::loadClass($class_path);
				// Zend framework 2
				/*
				require_once 'Zend/Loader/StandardAutoloader.php';
				$loader = new \Zend\Loader\StandardAutoloader(array('autoregister_zf' => true));
				$result = $loader->autoload($class_path);
				*/
			}
			else {
				if($class_name == '') $class_name = self::get_class_name($class_path);
				if(class_exists($class_name, false) || isset($GLOBALS['QNlib_loading_classes'][$class_name])) $result = true;
				else {
					$GLOBALS['QNlib_loading_classes'][$class_name] = true;
					$file_path = self::get_class_path(str_replace('\\', '/', $class_path));
                    // use Qinoa class extention
					if(self::path_contains($file_path.'.class.php')) $result = include_once $file_path.'.class.php';
                    // Fallback to simple php extension
                    else if(self::path_contains($file_path.'.php')) $result = include_once $file_path.'.php';
					unset($GLOBALS['QNlib_loading_classes']);
				}
			}
			return $result;
		}
        
        /*
        * domain checks and operations
        * a domain should always be composed of a serie of clauses against which a OR test is made
        * a clause should always be composed of a serie of conditions agaisnt which a AND test is made
        * a condition should always be composed of a property operand, an operator, and a value
        */
        
        public static function domain_condition_check($condition) {
            if(!is_array($condition)) return false;
            if(count($condition) != 3) return false;
            if(!is_string($condition[0])) return false;
            // if(!cehck_operator($condition[1])) return false;
            return true;
        }

        public static function domain_clause_check($clause) {
            if(!is_array($clause)) return false;
            foreach($clause as $condition) {
                if(!self::domain_condition_check($condition)) return false;
            }
            return true;
        }

        public static function domain_check($domain) {
            if(!is_array($domain)) return false;
            foreach($domain as $clause) {
                if(!self::domain_clause_check($clause)) return false;
            }
            return true;
        }

        public static function domain_normalize($domain) {
            if(!is_array($domain)) return [];
            if(!empty($domain)) {
                if(!is_array($domain[0])) {
                    // single condition
                    $domain = [[$domain]];
                }
                else {
                    if(empty($domain[0])) return [];
                    if(!is_array($domain[0][0])) {
                        // single clause
                        $domain = [$domain];
                    }
                }
            }
            return $domain;
        }
        
        public static function domain_clause_condition_add($clause, $condition) {
            if(!self::domain_condition_check($condition)) return $clause;
            $clause[] = $condition;
            return $clause;
        }
        
        public static function domain_condition_add($domain, $condition) {
            if(!self::domain_condition_check($condition)) return $dest;
            
            if(empty($domain)) {
                $domain[] = self::domain_clause_condition_add([], $condition);
            }
            else {
                for($i = 0, $j = count($domain); $i < $j; ++$i) {
                    $domain[$i] = self::domain_clause_condition_add($domain[$i], $condition);
                }
            }
            return $domain;
        }

        public static function domain_clause_add($domain, $clause) {
            if(!self::domain_clause_check($clause)) return $domain;
            $domain[] = $clause;
            return $domain;
        }        

	}

	/**
	* We add some standalone functions to relieve the user from the scope resolution notation.
	*/
	function get_url($server_port=true, $query_string=true) {
		return QNlib::get_url($server_port, $query_string);
	}
	
	function get_script_path($script=__FILE__) {
		return QNlib::get_script_path($script);	
	}
	
	//Initialize the QNlib class for further 'load_class' calls
	QNlib::init();
}
namespace {
    function load_class($class_path, $class_name='') {
        return config\QNlib::load_class($class_path, $class_name);
    }
}