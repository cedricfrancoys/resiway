<?php
namespace qinoa\route;

class Router {
    
    private $routes;
    private $params;

 
    public function __construct(array $routes = []) {
        $this->routes = [];
        $this->appendRoutes($routes);
        $this->setParams([]);
    }
    
    public function getRoutes() {
        return $this->routes;
    }
    
    /**
    *
    * @param array $routes Associative array of routes and related resolutions
    *
    * Routes and resolutions consist of strings accepting optional ':' and '?' special chars
    */
    public function appendRoutes($routes) {
        array_push($this->routes, $routes);
    }

    public function prependRoutes($routes) {
        array_unshift($this->routes, $routes);
    }
    
    public function setParams($params) {
        $this->params = $params;
    }
        
    public function getParams() {
        return $this->params;
    }
    
    public function resolve($uri, $method='GET') {
        $uri_parts = explode('/', ltrim($uri, '/'));
        $found_url = null;

        foreach($this->routes as $set) {
            // check routes and stop on first match
            foreach($set as $route => $resolver) {
 
                $route_parts = explode('/', ltrim($route, '/'));
                // reset params
                $this->params = [];

                for($i = 0, $j = count($route_parts); $i < $j; ++$i) {
                    $route_part = $route_parts[$i];
                    $is_param = false;
                    $is_mandatory = false;         
                    if(strlen($route_part) && $route_part{0} == ':') {
                        $is_param = true;
                        $is_mandatory = !(substr($route_part, -1) == '?');
                    }
                    if($is_param) {
                        if(isset($uri_parts[$i])) {
                            // store value from URI as parameter (omit leading ':')
                            if($is_mandatory) $this->params[substr($route_part, 1)] = $uri_parts[$i];
                            // omit trailing '?' as well
                            else $this->params[substr($route_part, 1, -1)] = $uri_parts[$i];
                        }
                        else {
                            // if no value is defined in URI, assign parameter to an empty string
                            if($i == $j-1 && !$is_mandatory) $this->params[substr($route_part, 1, -1)] = '';
                            else continue 2;
                        }
                    }
                    else if(!isset($uri_parts[$i]) || $route_part != $uri_parts[$i]) {
                        continue 2;
                    }
                }
                // we have a match
                // 2 accepted formats : 
                // 1) URI => controller resolver (GET method implied)
                if(!is_array($resolver)) {
                    // resolver is an URL
                    $found_url = $resolver;
                }
                // 2) URI => map METHOD / controller resolver
                else {
                    foreach($resolver as $route_method => $route_details) {
                        $url = $route_details['route'];
                        if($route_method == $method) {
                            $found_url = $url;
                            break;
                        }
                    }
                }                
                break 2;
            }
        }
        return $found_url;
    }
    
    
}