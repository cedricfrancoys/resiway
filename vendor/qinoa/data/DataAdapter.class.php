<?php
namespace qinoa\data;

use qinoa\organic\Singleton;

class DataAdapter extends Singleton {
    
    private $config;

    /**
     * This method cannot be called directly (should be invoked through Singleton::getInstance)
     * the value will be returned unchanged if:
     * - a conversion is not explicitely defined
     * - a conversion cannot be made
     */
    protected function __construct(/* no dependency */) {
        // initial configuration
        $this->config = [
            'boolean' => [
                'text' => [
                    'php' =>    function ($value) {
                                    if(in_array($value, ['TRUE', 'true', '1', 1, true], true)) return true;
                                    else if(in_array($value, ['FALSE', 'false', '0', 0, false], true)) return false;
                                    return $value;
                                }
                ],
                'sql' => [
                    'php' =>    function ($value) {
                                    return (bool) (intval($value) > 0);
                                }
                ],
                'php' => [
                    'sql' =>    function ($value) {
                                    return ($value)?'1':'0';                                                                        
                                }
                ]
                
            ],
            'float' => [
                'text'   => [
                    'php' =>    function ($value) {
                                    if(is_numeric($value)) {
                                        $value = floatval($value);
                                    }
                                    return $value;
                                }
                ]
            ]
        ];
    }
    
	private function &getMethod($from, $to, $type) {
        $method = function ($value) { return $value; };
        if(!in_array($from, ['text', 'php', 'sql'])) {
            // in case of unknown origin, fallback to raw text
            $from = 'text';
        }
        if( isset($this->config[$type][$from][$to]) ) {
            $method = $this->config[$type][$from][$to];
        }
		return $method;
	}
    
    /** 
     *
     * configuration might be update by external scripts or providers
     *
     *
     */
	public function setMethod($from, $to, $type, $method) {
        if(!is_callable($method)) {
            // warning QN_ERROR_INVALID_PARAM
        }
        else {
            // init related config if necessary
            if(!isset($this->config[$type])) {
                $this->config[$type] = [];
            }
            if(!isset($this->config[$type][$from])) {
                $this->config[$type][$from] = [];
            }        
            $this->config[$type][$from][$to] = $method;
        }
        return $this;
	}
    

	public function adapt($value, $type, $to='php', $from='text') {
        $method = &self::getMethod($from, $to, $type);
		return $method($value);
	}
    
}