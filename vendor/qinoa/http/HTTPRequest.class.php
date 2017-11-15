<?php
namespace qinoa\http;

class HTTPRequest {
    
    const HEADER_FORWARDED = 'FORWARDED';
    const HEADER_CLIENT_IP = 'X_FORWARDED_FOR';
    const HEADER_CLIENT_HOST = 'X_FORWARDED_HOST';
    const HEADER_CLIENT_PROTO = 'X_FORWARDED_PROTO';
    const HEADER_CLIENT_PORT = 'X_FORWARDED_PORT';

    /**
     * @var array
     */
    protected $headers;
    
    /**
     * @var array
     */
    protected $parameters;
    
        
    
    /**
     * @var array
     */
    protected $languages;

    /**
     * @var array
     */
    protected $charsets;

    /**
     * @var array
     */
    protected $encodings;

    /**
     * @var array
     */
    protected $acceptableContentTypes;

    /**
     * @var string
     */
    protected $pathInfo;

    /**
     * @var string
     */
    protected $requestUri;

    /**
     * @var string
     */
    protected $queryString;
    
    /**
     * @var string
     */
    protected $baseUrl;

    /**
     * @var string
     */
    protected $basePath;

    /**
     * @var string
     */
    protected $method;

    /**
     * @var string
     */
    protected $format;

    /**
     * @var array
     */
    protected static $formats;

 
    protected static $methods;
    
    /**
     * Constructor.
     *
     * @param array           $header      map holding header attributes
     * @param array           $parameters  parameters map : key-values pairs
     * @param array           $attributes  request attributes (parameters parsed from the PATH_INFO, ...)
     * @param array           $files       binary files content
     * @param array           $cookies     cookies to be set client side
     * @param string|resource $content     raw body data
     */
    public function __construct($headers, $parameters, $attributes=[], $files=[], $cookies=[], $content='') {
        
        // init content-types mapping
        self::$formats = [
            'html'  => array('text/html', 'application/xhtml+xml'),
            'txt'   => array('text/plain'),
            'js'    => array('application/javascript', 'application/x-javascript', 'text/javascript'),
            'css'   => array('text/css'),
            'json'  => array('application/json', 'application/x-json'),
            'xml'   => array('text/xml', 'application/xml', 'application/x-xml'),
            'rdf'   => array('application/rdf+xml'),
            'atom'  => array('application/atom+xml'),
            'rss'   => array('application/rss+xml'),
            'form'  => array('application/x-www-form-urlencoded')
        ];
        
        self::$methods = ['HEAD', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'PURGE', 'OPTIONS', 'TRACE', 'CONNECT'];

        $this->languages = null;
        $this->charsets = null;
        $this->encodings = null;
        $this->acceptableContentTypes = null;
        $this->pathInfo = null;
        $this->requestUri = null;
        $this->baseUrl = null;
        $this->basePath = null;
        $this->method = null;
        $this->format = null;
        
        
        $this->headers = $headers;
        $this->parameters = $parameters;
    }


    /**
     * Returns the request as a string.
     *
     * @return string The request
     */
    public function __toString() {
        return sprintf('%s %s %s', $this->getMethod(), $this->getRequestUri(), $this->getProtocol()).PHP_EOL.implode(PHP_EOL, $this->headers).PHP_EOL.implode(PHP_EOL, $this->parameters);
    }

    public function get($parameter, $default=false) {
        return isset($this->parameters[$parameter])?$this->parameters[$parameter]:$default;
    }

    public function set($parameter, $value) {
        return $this->parameters[$parameter] = $value;
    }
    
    public function getParameters() {
        return $this->parameters;
    }
    
    public function getHeaders() {
        return $this->headers;
    }    

    

    /**
     * Returns the client IP addresses.
     *
     * In the returned array the most trusted IP address is first, and the
     * least trusted one last. The "real" client IP address is the last one,
     * but this is also the least trusted one. Trusted proxies are stripped.
     *
     * Use this method carefully; you should use getClientIp() instead.
     *
     * @return array The client IP addresses
     *
     * @see getClientIp()
     */
    private function getClientIPs() {
        $clientIPs = array();
        $ip = $this->headers['REMOTE_ADDR'];


        if (isset($this->headers[self::HEADER_FORWARDED])) {
            $forwardedHeader = $this->headers[self::HEADER_FORWARDED];
            preg_match_all('{(for)=("?\[?)([a-z0-9\.:_\-/]*)}', $forwardedHeader, $matches);
            $clientIPs = $matches[3];
        } elseif ( isset($this->headers[self::HEADER_CLIENT_IP])) {
            $clientIPs = array_map('trim', explode(',', $this->headers[self::HEADER_CLIENT_IP]));
        }

        $clientIPs[] = $ip; // Complete the IP chain with the IP the request actually came from
        $firstTrustedIP = null;

        foreach ($clientIPs as $key => $clientIp) {
            // Remove port (unfortunately, it does happen)
            if (preg_match('{((?:\d+\.){3}\d+)\:\d+}', $clientIp, $match)) {
                $clientIPs[$key] = $clientIp = $match[1];
            }

            if (!filter_var($clientIp, FILTER_VALIDATE_IP)) {
                unset($clientIPs[$key]);

                continue;
            }
        }

        // Now the IP chain contains only untrusted proxies and the client IP
        return array_reverse($clientIPs) ;
    }

    /**
     * Returns the client IP address.
     *
     * This method can read the client IP address from the "X-Forwarded-For" header
     * when trusted proxies were set via "setTrustedProxies()". The "X-Forwarded-For"
     * header value is a comma+space separated list of IP addresses, the left-most
     * being the original client, and each successive proxy that passed the request
     * adding the IP address where it received the request from.
     *
     * If your reverse proxy uses a different header name than "X-Forwarded-For",
     * ("Client-Ip" for instance), configure it via "setTrustedHeaderName()" with
     * the "client-ip" key.
     *
     * @return string The client IP address
     *
     * @see getClientIps()
     * @see http://en.wikipedia.org/wiki/X-Forwarded-For
     */
    public function getClientIP()
    {
        $ipAddresses = $this->getClientIPs();

        return $ipAddresses[0];
    }

    /**
     * Returns current script name.
     *
     * @return string
     */
    public function getScriptName()
    {
        return isset($_SERVER['SCRIPT_NAME'])?$_SERVER['SCRIPT_NAME']: (isset($_SERVER['ORIG_SCRIPT_NAME'])?$_SERVER['ORIG_SCRIPT_NAME']: '');
    }

    /**
     * Returns the path being requested relative to the executed script.
     *
     * The path info always starts with a /.
     *
     * Suppose this request is instantiated from /mysite on localhost:
     *
     *  * http://localhost/mysite              returns an empty string
     *  * http://localhost/mysite/about        returns '/about'
     *  * http://localhost/mysite/enco%20ded   returns '/enco%20ded'
     *  * http://localhost/mysite/about?var=1  returns '/about'
     *
     * @return string The raw path (i.e. not urldecoded)
     */
    public function getPathInfo()
    {
        if (null === $this->pathInfo) {
            $baseUrl = $this->getBaseUrl();

            if (null === ($requestUri = $this->getRequestUri())) {
                $this->pathInfo = '/';
            }
            else {
                // Remove the query string from REQUEST_URI
                if ($pos = strpos($requestUri, '?')) {
                    $requestUri = substr($requestUri, 0, $pos);
                }

                $pathInfo = substr($requestUri, strlen($baseUrl));
                if (null !== $baseUrl && (false === $pathInfo || '' === $pathInfo)) {
                    // If substr() returns false then PATH_INFO is set to an empty string
                    $this->pathInfo = '/';
                } 
                elseif (null === $baseUrl) {
                    $this->pathInfo = $requestUri;
                }
                else {
                    $this->pathInfo = (string) $pathInfo;            
                }
            }
        }

        return $this->pathInfo;
    }

    /**
     * Returns the root path from which this request is executed.
     *
     * Suppose that an index.php file instantiates this request object:
     *
     *  * http://localhost/index.php         returns '/'
     *  * http://localhost/index.php/page    returns '/'
     *  * http://localhost/web/index.php     returns '/web/'
     *  * http://localhost/we%20b/index.php  returns '/we%20b/'
     *
     * @return string The raw path (i.e. not urldecoded)
     */
    public function getBasePath() {
        if (null === $this->basePath) {
            $this->basePath = substr($_SERVER['SCRIPT_NAME'], 0, strrpos($_SERVER['SCRIPT_NAME'], '/')+1);            
        }

        return $this->basePath;
    }

    /**
     * Returns the root URL from which this request is executed.
     *
     * The base URL never ends with a /.
     *
     * This is similar to getBasePath(), except that it also includes the
     * script filename (e.g. index.php) if one exists.
     *
     * @return string The raw URL (i.e. not urldecoded)
     */
    public function getBaseUrl() {
        if (null === $this->baseUrl) {             
            $filename = basename($_SERVER['SCRIPT_FILENAME']);

            if (basename($_SERVER['SCRIPT_NAME']) === $filename) {
                $baseUrl = $_SERVER['SCRIPT_NAME'];
            } 
            elseif (basename($_SERVER['PHP_SELF']) === $filename) {
                $baseUrl = $_SERVER['PHP_SELF'];
            } 
            elseif (basename($_SERVER['ORIG_SCRIPT_NAME']) === $filename) {
                $baseUrl = $_SERVER['ORIG_SCRIPT_NAME']; // 1and1 shared hosting compatibility
            } 
            else {
                // Backtrack up the script_filename to find the portion matching
                // php_self
                $path = isset($_SERVER['PHP_SELF'])?$_SERVER['PHP_SELF']: '';
                $file = isset($_SERVER['SCRIPT_FILENAME'])?$_SERVER['SCRIPT_FILENAME']: '';

                $segs = explode('/', trim($file, '/'));
                $segs = array_reverse($segs);
                $index = 0;
                $last = count($segs);
                $baseUrl = '';
                do {
                    $seg = $segs[$index];
                    $baseUrl = '/'.$seg.$baseUrl;
                    ++$index;
                } while ($last > $index && (false !== $pos = strpos($path, $baseUrl)) && 0 != $pos);
            }

            // Does the baseUrl have anything in common with the request_uri?
            $requestUri = $this->getRequestUri();

            if ($baseUrl && false !== $prefix = $this->getUrlencodedPrefix($requestUri, $baseUrl)) {
                // full $baseUrl matches
                return $prefix;
            }

            if ($baseUrl && false !== $prefix = $this->getUrlencodedPrefix($requestUri, rtrim(dirname($baseUrl), '/'.DIRECTORY_SEPARATOR).'/')) {
                // directory portion of $baseUrl matches
                return rtrim($prefix, '/'.DIRECTORY_SEPARATOR);
            }

            $truncatedRequestUri = $requestUri;
            if (false !== $pos = strpos($requestUri, '?')) {
                $truncatedRequestUri = substr($requestUri, 0, $pos);
            }

            $basename = basename($baseUrl);
            if (empty($basename) || !strpos(rawurldecode($truncatedRequestUri), $basename)) {
                // no match whatsoever; set it blank
                return '';
            }

            // If using mod_rewrite or ISAPI_Rewrite strip the script filename
            // out of baseUrl. $pos !== 0 makes sure it is not matching a value
            // from PATH_INFO or QUERY_STRING
            if (strlen($requestUri) >= strlen($baseUrl) && (false !== $pos = strpos($requestUri, $baseUrl)) && $pos !== 0) {
                $baseUrl = substr($requestUri, 0, $pos + strlen($baseUrl));
            }

            $this->baseUrl = rtrim($baseUrl, '/'.DIRECTORY_SEPARATOR);            
        }

        return $this->baseUrl;
    }


    /**
     * Returns the port on which the request is made.
     *
     * This method can read the client port from the "X-Forwarded-Port" header
     * when trusted proxies were set via "setTrustedProxies()".
     *
     * The "X-Forwarded-Port" header must contain the client port.
     *
     * If your reverse proxy uses a different header name than "X-Forwarded-Port",
     * configure it via "setTrustedHeaderName()" with the "client-port" key.
     *
     * @return string
     */
    public function getPort() {

        if ($host = $_SERVER['HOST']) {
            if ($host[0] === '[') {
                $pos = strpos($host, ':', strrpos($host, ']'));
            } else {
                $pos = strrpos($host, ':');
            }

            if (false !== $pos) {
                return (int) substr($host, $pos + 1);
            }

            return 'HTTPS' === $this->getProtocol() ? 443 : 80;
        }

        return $_SERVER['SERVER_PORT'];
    }

    /**
     * Returns the user.
     *
     * @return string|null
     */
    public function getUser() {
        return isset($_SERVER['PHP_AUTH_USER'])?$_SERVER['PHP_AUTH_USER']:null;
    }

    /**
     * Returns the password.
     *
     * @return string|null
     */
    public function getPassword() {
        return isset($_SERVER['PHP_AUTH_PW'])?$_SERVER['PHP_AUTH_PW']:null;
    }

    /**
     * Gets the user info.
     *
     * @return string A user name and, optionally, scheme-specific information about how to gain authorization to access the server
     */
    public function getUserInfo() {
        $userinfo = $this->getUser();

        $pass = $this->getPassword();
        if ('' != $pass) {
            $userinfo .= ":$pass";
        }

        return $userinfo;
    }



    /**
     * Returns the requested URI (path and query string).
     *
     * @return string The raw URI (i.e. not URI decoded)
     */
    public function getRequestUri() {
        return $this->requestUri;
    }

    /**
     * Gets the scheme and HTTP host.
     *
     * If the URL was called with basic authentication, the user
     * and the password are not added to the generated string.
     *
     * @return string The scheme and HTTP host
     */
    public function getSchemeAndHttpHost()
    {
        return $this->getScheme().'://'.$this->getHttpHost();
    }

    /**
     * Generates a normalized URI (URL) for the Request.
     *
     * @return string A normalized URI (URL) for the Request
     *
     * @see getQueryString()
     */
    public function getUri()
    {
        if (null !== $qs = $this->getQueryString()) {
            $qs = '?'.$qs;
        }

        return $this->getSchemeAndHttpHost().$this->getBaseUrl().$this->getPathInfo().$qs;
    }

    /**
     * Generates a normalized URI for the given path.
     *
     * @param string $path A path to use instead of the current one
     *
     * @return string The normalized URI for the path
     */
    public function getUriForPath($path)
    {
        return $this->getSchemeAndHttpHost().$this->getBaseUrl().$path;
    }

    

    /**
     * Generates the normalized query string for the Request.
     *
     * It builds a normalized query string, where keys/value pairs are alphabetized
     * and have consistent escaping.
     *
     * @return string|null A normalized query string for the Request
     */
    public function getQueryString() {

        return $this->queryString;
    }

    /**
     * Checks the request protocol.
     *
     * @return string
     */
    public function getProtocol() {
        return explode('/', $_SERVER['SERVER_PROTOCOL'])[0];
    }

    /**
     * Returns the host name.
     *
     * This method can read the client host name from the "X-Forwarded-Host" header
     * when trusted proxies were set via "setTrustedProxies()".
     *
     * The "X-Forwarded-Host" header must contain the client host name.
     *
     * If your reverse proxy uses a different header name than "X-Forwarded-Host",
     * configure it via "setTrustedHeaderName()" with the "client-host" key.
     *
     * @return string
     *
     * @throws \UnexpectedValueException when the host name is invalid
     */
    public function getHost() {

        if(isset($_SERVER['HOST'])) {
            $host = $_SERVER['HOST'];
        }
        elseif (isset($_SERVER['SERVER_NAME'])) {
             $host = $_SERVER['SERVER_NAME'];
        }
        elseif(isset($_SERVER['SERVER_ADDR'])){
            $host = $_SERVER['SERVER_ADDR'];
        }
        else {
            $host = '';
        }

        // trim and remove port number from host
        // host is lowercase as per RFC 952/2181
        $host = strtolower(preg_replace('/:\d+$/', '', trim($host)));

        // as the host can come from the user (HTTP_HOST and depending on the configuration, SERVER_NAME too can come from the user)
        // check that it does not contain forbidden characters (see RFC 952 and RFC 2181)
        // use preg_replace() instead of preg_match() to prevent DoS attacks with long host names
        if ($host && '' !== preg_replace('/(?:^\[)?[a-zA-Z0-9-:\]_]+\.?/', '', $host)) {
            throw new \Exception(sprintf('Invalid Host "%s"', $host));
        }      

        $protocol = $this->getProtocol();
        $port = $this->getPort();
        
        if (('HTTP' == $protocol && $port != 80) || ('HTTPS' == $protocol && $port != 443)) {
            $host = $host.':'.$port;  
        }
        
        return $host;
    }


    public function getMethod() {
        return $this->method;
    }

    /**
     * Gets the mime type associated with the format.
     *
     * @param string $format The format
     *
     * @return string The associated mime type (null if not found)
     */
    public static function getMimeType($format) {
        return isset(self::$formats[$format]) ? self::$formats[$format][0] : null;
    }

    /**
     * Gets the mime types associated with the format.
     *
     * @param string $format The format
     *
     * @return array The associated mime types
     */
    public static function getMimeTypes($format) {
        return isset(self::$formats[$format]) ? self::$formats[$format] : array();
    }

    /**
     * Gets the format associated with the mime type.
     *
     * @param string $mimeType The associated mime type
     *
     * @return string|null The format (null if not found)
     */
    public function getFormat($mimeType) {
        $canonicalMimeType = null;
        if (false !== $pos = strpos($mimeType, ';')) {
            $canonicalMimeType = substr($mimeType, 0, $pos);
        }

        foreach (self::$formats as $format => $mimeTypes) {
            if (in_array($mimeType, (array) $mimeTypes)) {
                return $format;
            }
            if (null !== $canonicalMimeType && in_array($canonicalMimeType, (array) $mimeTypes)) {
                return $format;
            }
        }
    }


    /**
     * Gets the request format.
     *
     * Here is the process to determine the format:
     *
     *  * format defined by the user (with setRequestFormat())
     *  * _format request attribute
     *  * $default
     *
     * @param string $default The default format
     *
     * @return string The request format
     */
    public function getRequestFormat($default = 'html') {
        if (null === $this->format) {
            $this->format = isset($_REQUEST['_format'])?$_REQUEST['_format']:$default;
        }

        return $this->format;
    }


    /**
     * Gets the format associated with the request.
     *
     * @return string|null The format (null if no content type is present)
     */
    public function getContentType() {
        return $this->getFormat($_SERVER['CONTENT_TYPE']);
    }


    /**
     * Gets the Etags.
     *
     * @return array The entity tags
     */
    public function getETags() {
        return preg_split('/\s*,\s*/', $_SERVER['if_none_match'], null, PREG_SPLIT_NO_EMPTY);
    }

/*
    public function isNoCache()
    {
        return $this->headers->hasCacheControlDirective('no-cache') || 'no-cache' == $_SERVER['Pragma']);
    }


    public function getLanguages()
    {
        if (null !== $this->languages) {
            return $this->languages;
        }

        $languages = AcceptHeader::fromString($this->headers->get('ACCEPT_LANGUAGE'))->all();
        $this->languages = array();
        foreach ($languages as $lang => $acceptHeaderItem) {
            if (false !== strpos($lang, '-')) {
                $codes = explode('-', $lang);
                if ('i' === $codes[0]) {
                    // Language not listed in ISO 639 that are not variants
                    // of any listed language, which can be registered with the
                    // i-prefix, such as i-cherokee
                    if (count($codes) > 1) {
                        $lang = $codes[1];
                    }
                } else {
                    for ($i = 0, $max = count($codes); $i < $max; ++$i) {
                        if ($i === 0) {
                            $lang = strtolower($codes[0]);
                        } else {
                            $lang .= '_'.strtoupper($codes[$i]);
                        }
                    }
                }
            }

            $this->languages[] = $lang;
        }

        return $this->languages;
    }


    public function getCharsets()  {
        if (null !== $this->charsets) {
            return $this->charsets;
        }

        return $this->charsets = array_keys(AcceptHeader::fromString($_SERVER['ACCEPT_CHARSET'])->all());
    }


    public function getEncodings()
    {
        if (null !== $this->encodings) {
            return $this->encodings;
        }

        return $this->encodings = array_keys(AcceptHeader::fromString($this->headers->get('ACCEPT_ENCODING'))->all());
    }


    public function getAcceptableContentTypes()
    {
        if (null !== $this->acceptableContentTypes) {
            return $this->acceptableContentTypes;
        }

        return $this->acceptableContentTypes = array_keys(AcceptHeader::fromString($this->headers->get('ACCEPT'))->all());
    }

*/    


    /**
     * Returns true if the request is a XMLHttpRequest.
     *
     * It works if your JavaScript library sets an X-Requested-With HTTP header.
     * It is known to work with common JavaScript frameworks:
     *
     * @link http://en.wikipedia.org/wiki/List_of_Ajax_frameworks#JavaScript
     *
     * @return bool true if the request is an XMLHttpRequest, false otherwise
     */
    public function isXmlHttpRequest() {
        return 'XMLHttpRequest' == $this->headers->get('X-Requested-With');
    }

    

    
    
    /*
     * Returns the prefix as encoded in the string when the string starts with
     * the given prefix, false otherwise.
     *
     * @param string $string The urlencoded string
     * @param string $prefix The prefix not encoded
     *
     * @return string|false The prefix as it is encoded in $string, or false
     */
    private function getUrlencodedPrefix($string, $prefix)
    {
        if (0 !== strpos(rawurldecode($string), $prefix)) {
            return false;
        }

        $len = strlen($prefix);

        if (preg_match(sprintf('#^(%%[[:xdigit:]]{2}|.){%d}#', $len), $string, $match)) {
            return $match[0];
        }

        return false;
    }


}