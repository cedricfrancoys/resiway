<?php
namespace qinoa\http;

use qinoa\http\UriHelperTrait;
use qinoa\http\HttpHeaderHelperTrait;


/*
    What is a HTTP request ?


    ## HTTP request

    @link http://www.ietf.org/rfc/rfc2616.txt

    * method    string
    * URI       object
    * protocol  object

    example: GET http://www.example.com/path/to/file/index.html HTTP/1.0

    getters : method, URI, protocol


    ### URI structure:
    @link http://www.ietf.org/rfc/rfc3986.txt

    generic form: scheme:[//[user[:password]@]host[:port]][/path][?query][#fragment]
    example: http://www.example.com/index.html


    URI __toString 

    getters :   scheme, user, password, host, port, path, query, fragment


    ### protocol structure:
        name    always 'HTTP'
        version HTTP version (1.0 or 1.1)

    generic form: name/version    
    example: HTTP/1.0

    getters: name (string), version (string) 

    ## HTTP response

    protocol
        name    always 'HTTP'
        version HTTP version (1.0 or 1.1)
    status
        code    HTTP status code
        reason  human readable HTTP status

*/


class HttpMessage {

    use UriHelperTrait, HttpHeaderHelperTrait {
        UriHelperTrait::isValid as isValidUri;
    }
    
    protected static $valid_methods = ['GET', 'POST', 'HEAD', 'PUT', 'PATCH', 'DELETE', 'PURGE', 'OPTIONS', 'TRACE', 'CONNECT'];
    
    private $method;
    
    private $protocol;
    
    private $body;
    
    private $status;

    // $uri is defined in UriHelperTrait
    // private $uri;        
    
    // $headers is defined in HttpHeaderHelperTrait
    // private $headers;    

    
    /**
     *
     * @param $body mixed (array, string)   either associative array (of key-value pairs) or raw text for unknown content-type
     */
    public function __construct($headline, $headers=[], $body='') {
        $this->setStatus(null); 
        $this->setHeaders($headers);
        $this->setBody($body);
    }
    
    public function setMethod($method) {
        $method = strtoupper($method);
        if(in_array($method, self::$valid_methods) ) {
            $this->method = $method;
        }
        return $this;
    }
    
    /**
     * setUri and setHeaders are defined respectively in UriHelperTrait, HttpHeaderHelperTrait
     *
     */
    /*
    public function setUri($uri);
    public function setHeaders($headers);
    */
    
    public function setBody($body) {
        // try to force conversion to an associative array based on content-type
        if(!is_array($body)) {
            switch($this->getContentType()) {
            case 'application/x-www-form-urlencoded':
                $params = [];
                parse_str($body, $params);
                $body = (array) $params;
                break;
            case 'application/json':
            case 'text/javascript':
                $body = json_decode($body, true);
                break;
            case 'text/xml':
            case 'application/xml':
            case 'text/xml, application/xml':
                $xml = simplexml_load_string($body, "SimpleXMLElement", LIBXML_NOCDATA);
                $json = json_encode($xml);
                $body = json_decode($json, true);                
            }
        }        
        $this->body = $body;
        return $this;
    }

    public function setProtocol($protocol) {
        $this->protocol = $protocol;
        return $this;
    }

    
    public function setStatus($status) {
        $this->status = $status;
        return $this;
    }
    
    public function setStatusCode($code) {
        static $status_codes = null;

        // list from Wikipedia article "List of HTTP status codes"
        // @link https://en.wikipedia.org/wiki/List_of_HTTP_status_codes
        if(is_null($status_codes)) {
            $status_codes = [
            '100' => 'Continue',
            '101' => 'Switching Protocols',
            '102' => 'Processing',
            '200' => 'OK',
            '201' => 'Created',
            '202' => 'Accepted',
            '203' => 'Non-Authoritative Information',
            '204' => 'No Content',
            '205' => 'Reset Content',
            '206' => 'Partial Content',
            '207' => 'Multi-Status',
            '208' => 'Already Reported',
            '210' => 'Content Different',
            '226' => 'IM Used',
            '300' => 'Multiple Choices',
            '301' => 'Moved Permanently',
            '302' => 'Found',
            '303' => 'See Other',
            '304' => 'Not Modified',
            '305' => 'Use Proxy',
            '306' => '(aucun)',
            '307' => 'Temporary Redirect',
            '308' => 'Permanent Redirect',
            '310' => 'Too many Redirects',
            '400' => 'Bad Request',
            '401' => 'Unauthorized',
            '402' => 'Payment Required',
            '403' => 'Forbidden',
            '404' => 'Not Found',
            '405' => 'Method Not Allowed',
            '406' => 'Not Acceptable',
            '407' => 'Proxy Authentication Required',
            '408' => 'Request Time-out',
            '409' => 'Conflict',
            '410' => 'Gone',
            '411' => 'Length Required',
            '412' => 'Precondition Failed',
            '413' => 'Request Entity Too Large',
            '414' => 'Request-URI Too Long',
            '415' => 'Unsupported Media Type',
            '416' => 'Requested range unsatisfiable',
            '417' => 'Expectation failed',
            '418' => 'I’m a teapot',
            '421' => 'Bad mapping / Misdirected Request',
            '422' => 'Unprocessable entity',
            '423' => 'Locked',
            '424' => 'Method failure',
            '425' => 'Unordered Collection',
            '426' => 'Upgrade Required',
            '428' => 'Precondition Required',
            '429' => 'Too Many Requests',
            '431' => 'Request Header Fields Too Large',
            '449' => 'Retry With',
            '450' => 'Blocked by Windows Parental Controls',
            '451' => 'Unavailable For Legal Reasons',
            '456' => 'Unrecoverable Error',
            '444' => 'No Response',
            '495' => 'SSL Certificate Error',
            '496' => 'SSL Certificate Required',
            '497' => 'HTTP Request Sent to HTTPS Port',
            '499' => 'Client Closed Request',
            '500' => 'Internal Server Error',
            '501' => 'Not Implemented',
            '502' => 'Bad Gateway ou Proxy Error',
            '503' => 'Service Unavailable',
            '504' => 'Gateway Time-out',
            '505' => 'HTTP Version not supported',
            '506' => 'Variant Also Negotiates',
            '507' => 'Insufficient storage',
            '508' => 'Loop detected',
            '509' => 'Bandwidth Limit Exceeded',
            '510' => 'Not extended',
            '511' => 'Network authentication required',
            '520' => 'Unknown Error',
            '521' => 'Web Server Is Down',
            '522' => 'Connection Timed Out',
            '523' => 'Origin Is Unreachable',
            '524' => 'A Timeout Occurred',
            '525' => 'SSL Handshake Failed',
            '526' => 'Invalid SSL Certificate',
            '527' => 'Railgun Error'
            ];            
        }
        $reason = isset($status_codes[$code])?$status_codes[$code]:'';

        return $this->setStatus($code.' '.$reason);
    }
    
    public function getStatus() {
        return $this->status;
    }
    
    public function getStatusCode() {
        list($code, $reason) = explode(' ', $this->status, 2);
        return $code;
    }
    
    public function getMethod() {
        return $this->method;
    }

    /**
     * getUri and getHeaders are defined respectively in UriHelperTrait, HttpHeaderHelperTrait
     *
     */    
    /*
    public function getUri() {
        return $this->uri;
    }    
    public function getHeaders() {
        return $this->headers;
    }
    */

    
    /**
     *
     * @return mixed    array or string associative array or raw data
     */
    public function getBody() {
        return $this->body;
    }    

    public function getProtocol() {
        return $this->protocol;
    }
    
    public function getProtocolVersion() {
        return (float) explode('/', $this->getProtocol())[1];
    }

    public function get($param, $default=null) {
        $res = $default;
        if(isset($this->body) && is_array($this->body)) {
            if(isset($this->body[$param])) {
                $res = $this->body[$param];
            }
        }
        return $res;
    }
    
    public function set($param, $value) {
        if(isset($this->body) && is_array($this->body)) {
            $this->body[$param] = $value;
        }
    }
    

    /**
     * send method is defined in HttpResponse and HttpRequest classes
     *
     */
    public function send() {}
        
}