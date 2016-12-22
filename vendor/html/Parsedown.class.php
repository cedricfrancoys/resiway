<?php
/**
 * This file is an adapter for autoload of html\Parsedown
 */
namespace {
    require_once(dirname(realpath(__FILE__)).'/Parsedown/Parsedown.php');    
}
namespace html {
    // interface class for autoload
    class Parsedown extends \Parsedown {
        
        public function __construct($args) {
            parent::__construct($args);
        }
        
        public static function __callStatic($name, $arguments) {            
            return call_user_func_array("\Parsedown::{$name}", $arguments);
        }        
    }   
}