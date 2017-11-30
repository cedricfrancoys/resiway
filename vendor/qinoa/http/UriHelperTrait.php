<?php
namespace qinoa\http;

/*
    ### URI structure:
    @link http://www.ietf.org/rfc/rfc3986.txt
    @link https://en.wikipedia.org/wiki/Uniform_Resource_Identifier
    
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
 *
 *  This trait is used to simulate multiple inheritance 
 *  and should not be used outside of current folder (use class UriHelper instead)
 *
 *  @see class UriHelper
 *
 *  getters :   scheme, user, password, host, port, path, query, fragment
 */
trait UriHelperTrait {
 
    private $parts = null;
    
    public function __construct($uri) {    
        $this->setUri($uri);
    }    
    
    public function getUri() {
        $uri = '';
        $user_info = '';
        if(isset($this->parts['user']) && strlen($this->parts['user']) > 0) {
            $user_info = $this->parts['user'];
            if(isset($this->parts['pass']) && strlen($this->parts['pass']) > 0) {
                $user_info .= ':'.$this->parts['pass'];
            }
            $user_info .= '@';
        }
        $query = $this->getQuery();
        $fragment = $this->getFragment();
        if(strlen($fragment) > 0) {
            $query = $query.'#'.$fragment;
        }
        if(strlen($query) > 0) {
            $query = '?'.$query;
        }
        return $this->getScheme().'://'.$user_info.$this->getHost().':'.$this->getPort().$this->getPath().$query;
    }
    
    public function setUri($uri) {
        if(self::isValid($uri)) {
            $this->parts = parse_url($uri);
        }
        return $this;
    }

    public function setScheme($scheme) {
        $this->parts['scheme'] = $scheme;
        return $this;
    }
    
    public function setHost($host) {
        $this->parts['host'] = $host;
        return $this;
    }

    public function setPort($port) {
        $this->parts['port'] = $port;
        return $this;
    }

    public function setPath($path) {
        $this->parts['path'] = $path;
        return $this;
    }

    public function setQuery($query) {
        $this->parts['query'] = $query;
        return $this;
    }

    public function setFragment($fragement) {
        $this->parts['fragment'] = $fragment;
        return $this;
    }
    
    public function setUser($user) {
        $this->parts['user'] = $user;
        return $this;
    }

    public function setPassword($password) {
        $this->parts['pass'] = $password;
        return $this;
    }
    
    /**
     *
     * with internationalized domain name (IDN) support (non-ASCII chars)
     */
    public static function isValid($uri) {
        $res = filter_var($uri, FILTER_VALIDATE_URL);
        if (!$res) {
            // check if uri contains unicode chars
            $mb_len = mb_strlen($uri);
            if ($mb_len !== strlen($uri)) {
                // replace all multi-bytes chars with a single-byte char (X)
                $safe_uri = '';
                for ($i = 0; $i < $mb_len; ++$i) {
                    $ch = mb_substr($uri, $i, 1);
                    $safe_uri .= strlen($ch) > 1 ? 'X' : $ch;
                }
                // re-check safe-uri
                $res = filter_var($safe_uri, FILTER_VALIDATE_URL);
            }
        }
        return $res;
    }


    /**
     *
     *
     * @example http, https, ftp
     */
    public function getScheme() {
        return isset($this->parts['scheme'])?$this->parts['scheme']:'';
    }
    
    public function getHost() {
        return isset($this->parts['host'])?$this->parts['host']:'';
    }

    public function getPort() {
        static $standard_ports = [
            'ftp'   => 21,
            'sftp'  => 22,
            'ssh'   => 22,
            'http'  => 80,
            'https' => 443
        ];
        $scheme = $this->getScheme();
        $default_port = isset($standard_ports[$scheme])?$standard_ports[$scheme]:'';
        return isset($this->parts['port'])?$this->parts['port']:$default_port;
    }

    public function getPath() {
        return isset($this->parts['path'])?$this->parts['path']:'';
    }

    public function getQuery() {
        return isset($this->parts['query'])?$this->parts['query']:'';
    }

    public function getFragment() {
        return isset($this->parts['fragment'])?$this->parts['fragment']:'';
    }
    
    public function getUser() {
        return isset($this->parts['user'])?$this->parts['user']:'';
    }

    public function getPassword() {
        return isset($this->parts['pass'])?$this->parts['pass']:'';
    }

    public function getBasePath() {
        return str_replace(DIRECTORY_SEPARATOR, '/', dirname($this->parts['path']));        
    }
    
}
