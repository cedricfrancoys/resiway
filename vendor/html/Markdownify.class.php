<?php
/**
 * This file is an adapter for autoload of html\Parsedown
 */
namespace {
    require_once(dirname(realpath(__FILE__)).'/Markdownify/Parser.php');    
    require_once(dirname(realpath(__FILE__)).'/Markdownify/Converter.php');        
}
namespace html {
    // interface class for autoload
    class Markdownify extends \Markdownify\Converter {
        
        public function __construct($args=null) {
            parent::__construct($args);
        }
        
        public static function __callStatic($name, $arguments) {            
            return call_user_func_array("\Markdownify\Converter\Parsedown::{$name}", $arguments);
        }        
    }   
}