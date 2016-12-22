<?php
/**
 * This file is an adapter for autoload of html\HtmlPurifier
 */
namespace {
    require_once(dirname(realpath(__FILE__)).'/HtmlPurifier/HTMLPurifier/Bootstrap.php');
    require_once(dirname(realpath(__FILE__)).'/HtmlPurifier/HTMLPurifier.autoload.php');
}
namespace html {
    // interface class for autoload
    class HtmlPurifier extends \HTMLPurifier {
        
        public function __construct($args) {
            parent::__construct($args);
        }
        
        public static function __callStatic($name, $arguments) {            
            return call_user_func_array("\HTMLPurifier::{$name}", $arguments);
        }        
    }    
}