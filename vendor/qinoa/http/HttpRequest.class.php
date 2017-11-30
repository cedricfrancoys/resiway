<?php
namespace qinoa\http;

use qinoa\http\HttpMessage;
use qinoa\http\MobileDetect;

class HttpRequest extends HttpMessage {

    public function __construct($headline='', $headers=[], $body='') {
        parent::__construct($headline, $headers, $body);        
        // parse headline
        $parts = explode(' ', $headline, 3);        
        // 1) retrieve protocol
        if(isset($parts[2])) {
            $this->setProtocol($parts[2]);
        }
        else {
            $this->setProtocol('HTTP/1.1');
        }
        // 2) retrieve URI and host
        if(isset($parts[1])) {
            if($this->isValidUri($parts[1])) {
                $this->setUri($parts[1]);
                $this->setHeader('Host', $this->getHost());            
            }
            else {
                // check Host header for a port number (see RFC2616)
                // @link https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.23
                $host = $this->getHeader('Host', null);
                if(!is_null($host)) {
                    $host_parts = explode(':', $host);
                    $host = $host_parts[0];
                    $port = isset($host_parts[1])?trim($host_parts[1]):80;
                    $scheme = ($port==443)?'https':'http';
                    $uri = $scheme.'://'.$host.':'.$port.$parts[1];
                    if($this->isValidUri($uri)) {
                        $this->setUri($uri);
                    }
                }
            }
        }
        // 3) retrieve method
        if(isset($parts[0])) {
            // method ?
            if(in_array($parts[0], self::$valid_methods) ) {
                $this->setMethod($parts[0]);
            }
            else {
                $this->setMethod('GET');
                // URI ?
                if($this->isValidUri($parts[0])) {
                    $this->setUri($parts[0]);
                }
                else {
                    // check Host header for a port number (see RFC2616)
                    // @link https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.23
                    $host = $this->getHeader('Host', null);
                    if(!is_null($host)) {
                        $host_parts = explode(':', $host);
                        $host = $host_parts[0];
                        $port = isset($host_parts[1])?trim($host_parts[1]):80;
                        $scheme = ($port==443)?'https':'http';
                        $uri = $scheme.'://'.$host.':'.$port.$parts[0];
                        if($this->isValidUri($uri)) {
                            $this->setUri($uri);
                        }
                    }                
                }                
            }
        }
        else {
            $this->setMethod('GET');
        }
    }
        
    
    public function send() {       
        $response = null;
        
        $uri = $this->getUri();
        
        if(strlen($uri) > 0) {
            $method = $this->getMethod();
            $http_options = [];
            $additional_headers = [
                // invalidate keep-alive behavior
                'Connection'        => 'close', 
                // simulate a XHR request
                'X-Requested-With'  => 'XMLHttpRequest',
                // accept any content type
                'Accept'            => '*',
                // ask for unicode charset
                'Accept-Charset'    => 'utf-8'
            ];
            // retrieve content type
            $content_type = $this->getContentType();            
            if(strlen($content_type) <= 0 && in_array($method,['GET', 'POST'])) {
                // fallback to form encoded data 
                $content_type = 'application/x-www-form-urlencoded';
            }            
            // retrieve content
            $body = $this->getBody();
            if(is_array($body)) {
                $body = http_build_query($body);
                // force parameters to the URI in case of GET request
                if($method == 'GET') {
                    $uri = explode('?', $uri)[0].'?'.$body;
                    // GET request shouldn't hold a body
                    $body = '';
                }
            }            
            // compute content length
            $body_length = strlen($body);
            // set content and content-type if relevant
            if($body_length > 0) {
                $http_options['content'] = $body;
                $additional_headers['Content-Type'] = $content_type;
            }
            // set content-length (might be 0)
            $additional_headers['Content-Length'] = $body_length;            
            // merge manually defined headers with additional headers (later overwrites the former)
            $headers = array_merge($this->getHeaders(), $additional_headers);
            // adapt headers to fit into a numerically indexed array
            $headers = array_map(function ($header, $value) {return "$header: $value";}, array_keys($headers), $headers);
            // build the HTTP options array
            $http_options = array_merge($http_options, [
                    'method'            => $method,
                    'request_fulluri'   => true,
                    'header'            => $headers,
                    'ignore_errors'     => true,
                    'timeout'           => 5,
                    'protocol_version'  => $this->getProtocolVersion()
            ]);
            // create the HTTP stream context
            $context = stream_context_create([
                'http' => $http_options
            ]);
            // send request                     
            $data = @file_get_contents(
                                        $uri, 
                                        false,
                                        $context
                                       );
            // build HTTP response object                           
            if($data && isset($http_response_header[0])) {                               
                $response_status = $http_response_header[0];
                unset($http_response_header[0]);
                $headers = [];
                foreach($http_response_header as $line) {
                    list($header, $value) = array_map('trim', explode(':', $line));
                    $headers[$header] = $value;
                }
                $response = new HttpResponse($response_status, $headers, $data);
            }
        }
        return $response;
    }
    
    public function isBot() {
        if (isset($this->is_bot)) return $this->is_bot;

        $res = false;
        if(isset($_REQUEST['bot'])) {
            $res = $_REQUEST['bot'];
        }
        /* Google */
        // $_SERVER['HTTP_USER_AGENT'] = 'Googlebot';
        else {
            if(empty($_SERVER['HTTP_USER_AGENT'])) {
                $res = false;
            }
            else if(stripos($_SERVER['HTTP_USER_AGENT'], 'Google') !== false) {
                $hostname = gethostbyaddr($_SERVER['REMOTE_ADDR']);
                // possible formats (https://support.google.com/webmasters/answer/1061943)
                //  crawl-66-249-66-1.googlebot.com
                //  rate-limited-proxy-66-249-90-77.google.com
                $res = preg_match('/\.googlebot\.com$/i', $hostname);
                if(!$res) {
                    $res = preg_match('/\.google\.com$/i', $hostname);        
                }        
            }
            /* Facebook */
            else if(stripos($_SERVER["HTTP_USER_AGENT"], "facebookexternalhit/") !== false 
                || stripos($_SERVER["HTTP_USER_AGENT"], "Facebot") !== false ) {
                $res = true;
            }
            /* Twitter */
            else if(stripos($_SERVER["HTTP_USER_AGENT"], "Twitterbot") !== false) {
                $res = true;    
            }            
        }
        $this->is_bot = $res;        
        return $this->is_bot;
    }
    
    
    
    public function isMobile() {
        if (isset($this->is_mobile)) return $this->is_mobile;
        // Any mobile device (phones or tablets).
        // init mobile detector with unaffected GLOBALS
        $detector = new MobileDetect();
        $this->is_mobile = ( $detector->isMobile() || $detector->isTablet());
        return $this->is_mobile;
    }    
    
    /**
     * Returns true if the request is a XMLHttpRequest.
     *
     * Checks HTTP header for an X-Requested-With entry set to 'XMLHttpRequest'.
     *
     * @link http://en.wikipedia.org/wiki/List_of_Ajax_frameworks#JavaScript
     *
     * @return bool true if the request is an XMLHttpRequest, false otherwise
     */
    public function isXHR() {
        static $is_xhr = null;
        if(is_null($is_xhr)) {
            $is_xhr = false;
            if(isset($this->headers['X-Requested-With'])) {
                $is_xhr = ('XMLHttpRequest' == $this->headers['X-Requested-With']);
            }
        }
        return $is_xhr;
    }        
    
}