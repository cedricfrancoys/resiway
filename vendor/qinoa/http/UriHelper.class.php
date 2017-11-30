<?php
namespace qinoa\http;

/*
    ### URI structure:
    @see http://www.ietf.org/rfc/rfc3986.txt
    @see https://en.wikipedia.org/wiki/Uniform_Resource_Identifier
    
    generic form: scheme:[//[user[:password]@]host[:port]][/path][?query][#fragment]

    examples: 
    * http://www.example.com/index.html
    * https://www.w3.org/hypertext/DataSources/Overview.html
    * ftp://me:mypass@ftp.example.com:80/index.html


    
    
    
                          hierarchical part
            ┌────────────────────┴────────────────────┐
                          authority             path
            ┌────────────────┴──────────────┐┌────┴───┐
      abc://username:password@example.com:123/path/data?key=value&key2=value2#fragid
      └┬┘   └──────┬────────┘ └────┬────┘ └┬┘          └──────────┬─────────┘└──┬──┘
    scheme  user information      host    port                  query        fragment

            
*/   


/**
 *
 * Utility class for URI manipulations
 * can be invoked either with instance or in a static context
 * uses UriHelperTrait with static members 
 */
 
class UriHelper {
    use UriHelperTrait {
        getScheme   as private getSchemeTrait;
        getHost     as private getHostTrait;
        getPort     as private getPortTrait;
        getPath     as private getPathTrait;        
        getQuery    as private getQueryTrait;                
        getFragment as private getFragmentTrait;
        getUser     as private getUserTrait;
        getPassword as private getPasswordTrait;    

    private static $instance;

    private static function &getInstance() {
        if (!(self::$instance instanceof self)) {
            self::$instance = new self();
        }
        return self::$instance;        
    }
    
    public function __call($method, $arguments) {
         return call_user_func_array(array($this, $method.'Trait'), $arguments);
    }

    public static function __callStatic($method, $arguments) {
        $instance = self::getInstance();
        $instance->setUri($arguments[0]);
        return call_user_func_array(array($instance, $method.'Trait'), []);
    }      
}
   