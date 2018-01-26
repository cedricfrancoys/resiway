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
                'txt' => [
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
            'integer' => [
                'txt' => [
                    'php' =>    function ($value) {
                                    if(is_string($value)) {
                                        if(in_array($value, ['TRUE', 'true'])) $value = 1;
                                        else if(in_array($value, ['FALSE', 'false'])) $value = 0;
                                    }
                                    if(is_numeric($value)) {
                                        $value = intval($value);
                                    }
                                    return $value;
                                }
                ],
                'sql' => [
                    'php' =>    function ($value) {
// todo : handle arbitrary length numbers (> 10 digits)
                                    return intval($value);
                                }
                ]                
            ],            
            'double' => [
                'txt'   => [
                    'php' =>    function ($value) {
                                    if(is_numeric($value)) {
                                        $value = floatval($value);
                                    }
                                    return $value;
                                }
                ],
                'sql' => [
                    'php' =>    function ($value) {
                                    return floatval($value);
                                }
                ]                
                
            ],
            'string' => [
            ],
            // dates are handled as unix timestamp
            'date' => [
                // string dates are expected to be timestamps or ISO8601 formatted dates
                'txt'   => [
                    'php' =>    function ($value) {
                                    if(is_numeric($value)) {
                                        $value = intval($value);
                                    }
                                    else {
                                        $value = strtotime($value);
                                    }
                                    return $value;
                                }
                ],
                'php'   => [
                    'txt' =>    function ($value) {
                                    // return date as a ISO8601 formatted string
                                    return date("c", $value);
                                },
                    'sql' =>    function ($value) {
                                    return date('Y-m-d', $value);
                                }
                ],
                'sql'   => [
                    'php' =>    function ($value) {
                                    // return date as a timestamp
                                    list($year, $month, $day) = sscanf($value, "%d-%d-%d");
                                    return mktime(0, 0, 0, $month, $day, $year);
                                }
                ]                
            
            ],
            
            'array' => [
                'txt'   => [
                    'php' =>    function ($value) {
                                    if(!is_array($value)) {
                                        if(empty($value)) $value = array();
                                        // adapt raw CSV
                                        else $value = explode(',', $value);
                                    }
                                    return $value;
                                }
                ]                
            ]                                       
         
        ];
    }
    
	private function &getMethod($from, $to, $type) {
        $method = function ($value) { return $value; };
        if(!in_array($from, ['txt', 'php', 'sql'])) {
            // in case of unknown origin, fallback to raw text
            $from = 'txt';
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
    

	public function adapt($value, $type, $to='php', $from='txt') {
        if($type == 'float') $type = 'double';
        else if($type == 'int') $type = 'integer';
        else if($type == 'bool') $type = 'boolean';        
        $method = &self::getMethod($from, $to, $type);
		return $method($value);
	}
    
}