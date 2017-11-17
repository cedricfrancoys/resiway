<?php
namespace qinoa\http;

use qinoa\http\MobileDetect;
use qinoa\http\HTTPRequest;

class HTTPRequestContext extends HTTPRequest {
    
    private $detector;
    
    protected $is_bot;
    protected $is_mobile;
    
	public static function &getInstance()	{
		if (!isset($GLOBALS['HTTPRequestContext_instance'])) $GLOBALS['HTTPRequestContext_instance'] = new HTTPRequestContext();
		return $GLOBALS['HTTPRequestContext_instance'];
	}

    public function __construct() {
        // init mobile detector with unaffected GLOBALS
        $this->detector = new MobileDetect;
        
        // normalize $_SERVER array (populate with indices not having HTTP_ prefix)
        foreach ($_SERVER as $key => $value) {
            if (0 === strpos($key, 'HTTP_')) {
                $_SERVER[substr($key, 5)] = $value;
            }            
        }
        
        // retrieve content for all HTTP methods and store it into global $_REQUEST        
        if (isset($_SERVER['CONTENT_TYPE']) 
            && 0 === strpos($_SERVER['CONTENT_TYPE'], 'application/x-www-form-urlencoded')
            && in_array($this->getMethod(), ['PUT', 'DELETE', 'PATCH']) ) {
            $params = [];
            parse_str(file_get_contents('php://input'), $params);
            $_REQUEST = array_merge($_REQUEST, $params);
        }

        // append parameter from request URI if not already in
        if(false !== strpos($_SERVER['REQUEST_URI'], '?')) {
            $params = [];            
            parse_str(explode('?', $_SERVER['REQUEST_URI'])[1], $params);  
            $_REQUEST = array_merge($_REQUEST, $params);            
        }
        
        // normalize query string
        $parts = array();
        $order = array();

        foreach (explode('&', $_SERVER['QUERY_STRING']) as $param) {
            if ('' === $param || '=' === $param[0]) {
                // Ignore useless delimiters, e.g. "x=y&".
                // Also ignore pairs with empty key, even if there was a value, e.g. "=value", as such nameless values cannot be retrieved anyway.
                // PHP also does not include them when building _GET.
                continue;
            }

            $keyValuePair = explode('=', $param, 2);
            if(count($keyValuePair) < 2) continue;
            
            // GET parameters, that are submitted from a HTML form, encode spaces as "+" by default (as defined in enctype application/x-www-form-urlencoded).
            // PHP also converts "+" to spaces when filling the global _GET or when using the function parse_str. This is why we use urldecode and then normalize to
            // RFC 3986 with rawurlencode.
            $parts[] = isset($keyValuePair[1]) ?
                rawurlencode(urldecode($keyValuePair[0])).'='.rawurlencode(urldecode($keyValuePair[1])) :
                rawurlencode(urldecode($keyValuePair[0]));
            $order[] = urldecode($keyValuePair[0]);
        }

        array_multisort($order, SORT_ASC, $parts);

        $_SERVER['QUERY_STRING'] = implode('&', $parts);

        
        // init class members
        parent::__construct($_SERVER, $_REQUEST);
        

        /** 
         * init method :gets the request "intended" method.
         *
         * If the X-HTTP-Method-Override header is set, and if the method is a POST,
         * then it is used to determine the "real" intended HTTP method.
         *
         * The _method request parameter can also be used to determine the HTTP method
         */
        $this->method = $_SERVER['REQUEST_METHOD'];

        if (in_array($this->method, ['POST', 'post'])) {
            if (isset($_SERVER['X-HTTP-METHOD-OVERRIDE'])) {
                $this->method = $_SERVER['X-HTTP-METHOD-OVERRIDE'];
            } 
            elseif (isset($_REQUEST['_method'])) {                    
                $this->method = $_REQUEST['_method'];
            }
        }
        
        $this->method = strtoupper($this->method);
        
        /**
         * init Request URI (path and query string).
         *
         */        
        $requestUri = '';

        if (isset($_SERVER['X_ORIGINAL_URL'])) {
            // IIS with Microsoft Rewrite Module
            $requestUri = $_SERVER['X_ORIGINAL_URL'];
            unset($_SERVER['X_ORIGINAL_URL']);
            unset($_SERVER['HTTP_X_ORIGINAL_URL']);
            unset($_SERVER['UNENCODED_URL']);
            unset($_SERVER['IIS_WasUrlRewritten']);
        } 
        elseif (isset($_SERVER['X_REWRITE_URL'])) {
            // IIS with ISAPI_Rewrite
            $requestUri = $_SERVER['X_REWRITE_URL'];
            unset($_SERVR['X_REWRITE_URL']);
        } 
        elseif (isset($_SERVER['IIS_WasUrlRewritten'])
        && $_SERVER['IIS_WasUrlRewritten'] == '1' 
        && isset($_SERVER['UNENCODED_URL'])
        && $_SERVER['UNENCODED_URL'] != '') {
            // IIS7 with URL Rewrite: make sure we get the unencoded URL (double slash problem)
            $requestUri = $_SERVER['UNENCODED_URL'];
            unset($_SERVER['UNENCODED_URL']);
            unset($_SERVER['IIS_WasUrlRewritten']);
        } 
        elseif (isset($_SERVER['REQUEST_URI'])) {
            $requestUri = $_SERVER['REQUEST_URI'];
            // HTTP proxy reqs setup request URI with scheme and host [and port] + the URL path, only use URL path
            $schemeAndHttpHost = $this->getProtocol().'://'.$this->getHost();
            if (strpos($requestUri, $schemeAndHttpHost) === 0) {
                $requestUri = substr($requestUri, strlen($schemeAndHttpHost));
            }
        } 
        elseif (isset($_SERVER['ORIG_PATH_INFO'])) {
            // IIS 5.0, PHP as CGI
            $requestUri = $_SERVER['ORIG_PATH_INFO'];
            if ('' != $_SERVER['QUERY_STRING']) {
                $requestUri .= '?'.$_SERVER['QUERY_STRING'];
            }
            unset($_SERVER['ORIG_PATH_INFO']);
        }

        // normalize the request URI to ease creating sub-requests from this request

        // removing everything after question mark, if any
        if(($pos = strpos($requestUri, '?')) !== false) $requestUri = substr($requestUri, 0, $pos);
        // removing everything after hash, if any
        if(($pos = strpos($requestUri, '#')) !== false) $requestUri = substr($requestUri, 0, $pos);
        
        $_SERVER['REQUEST_URI'] = $requestUri;
        $this->requestUri = $requestUri;            
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
        $this->is_mobile = ( $this->detector->isMobile() || $this->detector->isTablet());
        return $this->is_mobile;
    }
    
 
}