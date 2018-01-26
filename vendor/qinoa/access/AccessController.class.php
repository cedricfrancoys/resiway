<?php
namespace qinoa\access;

use qinoa\organic\Singleton;

class AccessManager extends Singleton {
    

    /**
     * This method cannot be called directly (should be invoked through Singleton::getInstance)
     * the value will be returned unchanged if:
     * - a conversion is not explicitely defined
     * - a conversion cannot be made
     */
    protected function __construct(/* no dependency */) {
        // initial configuration
    }
    
    /**  
     *
     * constraints is an array holding constraints description specific to the given value 
     * it is an array of validation rules, each rule consist of a kind
     * - type (boolean, integer, double, string, array)
     * - 'min', 'max', 'in', 'not in'
     * - regex
     * - (custom) function (any callable accepting one parameter and returning a boolean)
     *
     * and the description of the rule itself
     *
     * examples:
     * [ ['kind' => 'function', 'rule' => function() {return true;}],
     *   ['kind' => 'min', 'rule' => 0 ],      
     *   ['kind' => 'in', 'rule' => [1, 2, 3] ]     
     * ]
     *
     */
    public function validate($value, $constraints) {        
        if(!is_array($constraints) || empty($constraints)) return true;
        foreach($constraints as $id => $constraint) {
            if(!isset($constraint['kind']) || !isset($constraint['rule'])) {
                // raise error
                continue;
            }
            switch($constraint['kind']) {
            case 'type':
                // value's type should be amongst elementary PHP types
                if(!in_array($constraint['rule'], ['boolean', 'integer', 'double', 'string', 'array'])) {
                    // raise error
                    continue;
                }
                if(gettype($value) != $constraint['rule']) return false;
                break;
            case 'regex':
                if(!preg_match("/^\/.+\/[a-z]*$/i", $constraint['rule'])) {
                    // "error in constraints parameter : invalid regex for constraint $id"
                    continue;
                }
                if(!preg_match($constraint['rule'], $value)) return false;
                break;                
            case 'function':            
                if(!is_callable($constraint['rule'])) {
                    // "error in constraints parameter : function for constraint $id cannot be called"
                    continue;
                }
                if(call_user_func($constraint['rule'], $value) !== true) return false;
                break;
            case 'min':
                if(!is_numeric($constraint['rule'])) {
                    // error : 'min' constraint has to be numeric
                    continue;
                }
                switch(gettype($value)) {
                case 'string':
                    if(strlen($value) < $constraint['rule']) return false;
                    break;                        
                case 'integer':
                case 'double':                    
                    if($value < $constraint['rule']) return false;
                    break;
                case 'array': 
                    if(count($value) < $constraint['rule']) return false;
                    break;
                default:
                    // error : unhandled value type for contraint 'min'
                    break;
                }
                break;
            case 'max':
                if(!is_numeric($constraint['rule'])) {
                    // error : 'max' constraint has to be numeric
                    continue;
                }
                switch(gettype($value)) {
                case 'string':
                    if(strlen($value) > $constraint['rule']) return false;
                    break;                        
                case 'integer':
                case 'double':                    
                    if($value > $constraint['rule']) return false;
                    break;
                case 'array': 
                    if(count($value) > $constraint['rule']) return false;
                    break;
                default:
                    // error : unhandled value type for contraint 'max'
                    break;
                }
                break;
            case 'in':
            case 'not in':            
                if(!is_array($constraint['rule'])) {
                    // warning : 'in' and 'not in' constraint has to be array
                    // try to force conversion to array
                    $constraint['rule'] = [$constraint['rule']];                    
                }
                $type = gettype($value);
                if($type == 'string') {
                    foreach($constraint['rule'] as $index => $accept) {
                        if(!is_string($accept)) {
                            // error : while checking a string 'in' constraint has to hold string values
                            unset($constraint['rule'][$index]);
                        }
                    }
                }
                else if ($type == 'integer') {
                    foreach($constraint['rule'] as $index => $accept) {
                        if(!is_integer($accept)) {
                            // error : while checking an integer 'in' constraint has to hold integer values
                            unset($constraint['rule'][$index]);
                        }
                    }
                }
                else if ($type == 'double') {
                    foreach($constraint['rule'] as $index => $accept) {
                        if(!is_integer($accept) && !is_double($accept)) {
                            // error : while checking a float/double 'in' constraint has to hold float values
                            unset($constraint['rule'][$index]);
                        }
                    }                
                }
                else {                
                    // error : unhandled value type for contraint 'max'
                    continue;
                }
                if(in_array($value, $constraint['rule'])) {
                    if($constraint['kind'] == 'not in') return false;
                }
                else if($constraint['kind'] == 'in') return false;
                break;
            default:
                // warning : unhandled constraint type {$constraint['kind']}
                break;                        
            }
        }
        return true;
    }
}