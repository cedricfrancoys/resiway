<?php
namespace qinoa\php;

use qinoa\organic\Singleton;
use qinoa\http\HttpRequest;
use qinoa\http\HttpResponse;


class Context extends Singleton {
    
    private $httpRequest;
    private $httpResponse;
    private $session_id;
    
    /**
     * This method cannot be called directly (should be invoked through Singleton::getInstance)
     *
     */
    protected function __construct(/* no dependency */) {
        // retrieve current session identifier
        $this->session_id = session_id();
        // init session if not yet started
        if(!strlen($this->session_id)) {
            session_start();
            $this->session_id = session_id();
        }        
        // retrieve current request 
        $this->httpRequest = new HttpRequest($this->getHttpMethod().' '.$this->getHttpUri().' '.$this->getHttpProtocol(), $this->getHttpRequestHeaders(), $this->getHttpBody());
        // build response (set protocol to HTTP 1.1, status to success, and retrieve default headers set by PHP)
        $this->httpResponse = new HttpResponse('HTTP/1.1 200 OK', $this->getHttpResponseHeaders());       
    }
    
    
    public function __toString() {
        return 'This is the PHP context instance';
    }
    
   
    public function get($var, $default=null) {
        if(isset($GLOBALS[$var])) {
            return $GLOBALS[$var];
        }
        return $default;
    }

    public function set($var, $value) {
        $GLOBALS[$var] = $value;
        return $this;
    }
    
    public function getHttpRequest() {
        return $this->httpRequest;
    }

    public function getHttpResponse() {
        return $this->httpResponse;
    }
    
    public function getSessionId() {
        return $this->session_id;
    }
    
    public function setHttpRequest(HttpRequest $request) {
        $this->httpRequest = $request;
        return $this;
    }

    public function setHttpResponse(HttpResponse $response) {
        $this->httpResponse = $response;
        return $this;
    }
    
    public function setSessionId(int $session_id) {
        $this->session_id = $session_id;
        return $this;
    }    

    // below are additional method using short name and get/set based on arguments
    
    public function httpRequest() {
        $args = func_get_args();
        if(count($args) < 1) {
            return $this->getHttpRequest();
        }
        else {
            $request = $args[0];
            return $this->setHttpRequest($request);
        }        
    }

    public function httpResponse() {
        $args = func_get_args();
        if(count($args) < 1) {
            return $this->getHttpResponse();
        }
        else {
            $response = $args[0];
            return $this->setHttpResponse($response);
        }
    }
    
    // private methods
    
    
    private function getHttpResponseHeaders() {
        $res = [];
        $headers = headers_list();
        // set default content type to JSON and default charset to UTF-8
        $headers[] = 'Content-type: application/json; charset=UTF-8';
        foreach($headers as $header) {
            list($name, $value) = explode(':', $header, 2);
            $res[$name] = trim($value);
        }
        return $res;
    }
    /**
     *
     * HTTP message formatted protocol (i.e. HTTP/1.0 or HTTP/1.1)
     *
     */
    private function getHttpProtocol() {
        // default to HTTP 1.1
        $protocol = 'HTTP/1.1';
        if(isset($_SERVER['SERVER_PROTOCOL'])) {
            $protocol = $_SERVER['SERVER_PROTOCOL'];
        }
        return $protocol;
    }

    /** 
     * Retrieve the request method.
     *
     * If the X-HTTP-Method-Override header is set, and if the method is a POST,
     * then it is used to determine the "real" intended HTTP method.
     *
     */    
    private function getHttpMethod() {
        static $method = null;        
        if(!$method) {
            // fallback to GET method (using CLI, REQUEST_METHOD is not set), i.e. 'GET'
            $method = 'GET';
            if(isset($_SERVER['REQUEST_METHOD'])) {
                $method = $_SERVER['REQUEST_METHOD'];
                if (strcasecmp($method, 'POST') === 0) {
                    if (isset($_SERVER['X-HTTP-METHOD-OVERRIDE'])) {
                        $method = $_SERVER['X-HTTP-METHOD-OVERRIDE'];
                    }
                }
                // normalize to upper case
                $method = strtoupper($method);                
            }
        }
        return $method;        
    }
    
    /**
     * Get all HTTP header key/values as an associative array for the current request.
     *
     */    
    private function getHttpRequestHeaders() {
        static $headers = null;
        
        if(!$headers) {
            // 1) retrieve headers
            if (function_exists('getallheaders')) {
                $headers = (array) getallheaders();                  
            }
            else {
                // Polyfill from https://github.com/ralouphie/getallheaders
                // Copyright (c) 2014 Ralph Khattar - License: The MIT License (MIT)                            
                $headers = array();
                $copy_server = array(
                    'CONTENT_TYPE'   => 'Content-Type',
                    'CONTENT_LENGTH' => 'Content-Length',
                    'CONTENT_MD5'    => 'Content-MD5',
                );
                foreach ($_SERVER as $key => $value) {
                    if (substr($key, 0, 5) === 'HTTP_') {
                        $key = substr($key, 5);
                        if (!isset($copy_server[$key]) || !isset($_SERVER[$key])) {
                            $key = str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', $key))));
                            $headers[$key] = $value;
                        }
                    } elseif (isset($copy_server[$key])) {
                        $headers[$copy_server[$key]] = $value;
                    }
                }              
            }
            // 2) normalize headers            
            if (!isset($headers['Authorization'])) {
                if (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
                    $headers['Authorization'] = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
                } elseif (isset($_SERVER['PHP_AUTH_USER'])) {
                    $basic_pass = isset($_SERVER['PHP_AUTH_PW']) ? $_SERVER['PHP_AUTH_PW'] : '';
                    $headers['Authorization'] = 'Basic ' . base64_encode($_SERVER['PHP_AUTH_USER'] . ':' . $basic_pass);
                } elseif (isset($_SERVER['PHP_AUTH_DIGEST'])) {
                    $headers['Authorization'] = $_SERVER['PHP_AUTH_DIGEST'];
                }
            }              
            // handle ETags
            if(!isset($headers['ETag'])) {
                if(isset($_SERVER['HTTP_IF_NONE_MATCH'])) {
                    $headers['ETag'] = $_SERVER['HTTP_IF_NONE_MATCH'];
                }
                else {
                    $headers['ETag'] = '';
                }
            }
            // handle client's IP address
            // fallback to localhost (using CLI, REMOTE_ADDR is not set), i.e. '127.0.0.1'
            $client_ip = '127.0.0.1';
            if(isset($_SERVER['REMOTE_ADDR'])) {
                $client_ip = $_SERVER['REMOTE_ADDR'];
                if(!isset($headers['X-Forwarded-For']) || strpos($headers['X-Forwarded-For'], $client_ip) === false ) {
                    if(!isset($headers['X-Forwarded-For'])) {
                        $headers['X-Forwarded-For'] = $_SERVER['REMOTE_ADDR'];
                    } 
                    else {
                        $headers['X-Forwarded-For'] = $_SERVER['REMOTE_ADDR'].','.$headers['X-Forwarded-For'];
                    }
                }
            }
        }
        // adapt Content-Type for multipart/form-data (already parsed by PHP)
        if(isset($headers['Content-Type']) && strpos($headers['Content-Type'], 'multipart/form-data') == 0) {
            $headers['Content-Type'] = 'application/x-www-form-urlencoded';
        }
        return $headers;
    }
    
    private function getHttpUri() {
        $scheme = isset($_SERVER['HTTPS']) ? "https" : "http";
        $auth = '';
        if(isset($_SERVER['PHP_AUTH_USER']) && strlen($_SERVER['PHP_AUTH_USER']) > 0) {
            $auth = $_SERVER['PHP_AUTH_USER'];
            if(isset($_SERVER['PHP_AUTH_PW']) && strlen($_SERVER['PHP_AUTH_PW']) > 0) {
                $auth .= ':'.$_SERVER['PHP_AUTH_PW'];
            }
            $auth .= '@';
        }
        $host = isset($_SERVER['HTTP_HOST'])?$_SERVER['HTTP_HOST']:'localhost';
        $port = isset($_SERVER['SERVER_PORT'])?$_SERVER['SERVER_PORT']:80;
        // fallback to current script name (using CLI, REQUEST_URI is not set), i.e. '/index.php'
        $uri = $_SERVER['SCRIPT_NAME'];
        if(isset($_SERVER['REQUEST_URI'])) {
            $uri = $_SERVER['REQUEST_URI'];
        }
        return $scheme."://".$auth."$host:$port{$uri}";
    }
    
    private function getHttpBody() {
        // load raw content from input stream (HttpMessage class in in charge of turning it into an associative array)
        $body = file_get_contents('php://input');
        // in some cases, PHP consumes the input to populate $_REQUEST and $_FILES (i.e. with multipart/form-data content-type)
        if(empty($body)) {
            // for GET methods, PHP improperly fills $_GET and $_REQUEST with query string parameters
            // we allow this only when there's nothing from ://stdin
            if(isset($_FILES) && !empty($_FILES)) {
                $body = array_merge($_REQUEST, $_FILES);
            }
            else {
                $body = $_REQUEST;
            }
            // we should have set content-type accordingly while retrieving headers (in getHttpRequestHeaders())
        }
        return $body;
    }    
}