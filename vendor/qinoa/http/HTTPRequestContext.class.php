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
        parent::__construct();
        $this->detector = new MobileDetect;
    }

    public function isBot() {
        if (isset($this->is_bot)) return $this->is_bot;

        $res = false;
        if(isset($_REQUEST['bot'])) {
            $res = $_REQUEST['bot'];
        }
        /* Google */
        // $_SERVER['HTTP_USER_AGENT'] = 'Googlebot';
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