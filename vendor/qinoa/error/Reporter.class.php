<?php
/* 
    This file is part of the qinoa framework <http://www.github.com/cedricfrancoys/qinoa>
    Some Rights Reserved, Cedric Francoys, 2017, Yegen
    Licensed under GNU GPL 3 license <http://www.gnu.org/licenses/>
*/
namespace qinoa\error;

use qinoa\organic\Singleton;
use qinoa\php\Context;


class Reporter extends Singleton {
	
    // current process id for backward identification
    private $context;
    
    /**
    * Contructor defines which methods have to be called when errors and uncaught exceptions occur
    *
    */
	public function __construct(Context $context) {
        $this->context = $context;             
		set_error_handler(__NAMESPACE__."\Reporter::errorHandler");
		set_exception_handler(__NAMESPACE__."\Reporter::uncaughtExceptionHandler");
	}

    /**
     * Static list of constants required by current provider
     *
     */
    public static function constants() {
        return ['LOG_STORAGE_DIR', 'QN_REPORT_FATAL', 'QN_REPORT_ERROR', 'QN_REPORT_WARNING', 'QN_REPORT_DEBUG'];
    }
    
    public function getThreadId() {
        // assign a unique thread ID (using apache pid, current unix time, and invoked script with operation, if any)
        $operation = $this->context->get('operation');
        $data = getmypid().';'.time().';'.$_SERVER['SCRIPT_NAME'].(($operation)?" ($operation)":'');
        // return a base64 URL-safe encoded identifier
        return strtr(base64_encode($data), '+/', '-_');
    }
    
 	/**
     * Handles uncaught exceptions, which include deliberately triggered fatal-error 
	 * In all cases, these are critical errors that cannot be recovered and need an immediate stop (fatal error)
     */
    public static function uncaughtExceptionHandler($exception) {
        $code = $exception->getCode();
        $msg = $e->getMessage();
        if($code != QN_REPORT_FATAL) {
            $msg = '[uncaught exception]-'.$msg;
        }
        // retrieve instance and log error
        $instance = self::getInstance();
        $instance->log($code, $msg, self::getTrace(1));
        die();
	}

	/**
    * Main method for error handling.
    * This is invoked either in scripts using trigger_error calls or when a internal PHP eror is raised.
	*
	* @param mixed $errno
	* @param mixed $errmsg
	* @param mixed $errfile
	* @param mixed $errline
	* @param mixed $errcontext
	*/
	public static function errorHandler($errno, $errmsg, $errfile, $errline, $errcontext) {      
        // adapt error code
        $code = $errno;
        $depth = 1;
        switch($errno) {
            case E_ERROR:
            case E_CORE_ERROR:
            case E_COMPILE_ERROR:
            case E_PARSE:
                $code = QN_REPORT_FATAL;
                $depth = 0;                
                break;
            case E_RECOVERABLE_ERROR:
                $code = QN_REPORT_ERROR;
                $depth = 0;                
                break;
            case E_NOTICE:
            case E_STRICT:
            case E_DEPRECATED:
            case E_WARNING:
            case E_CORE_WARNING:
            case E_COMPILE_WARNING:
            case E_USER_DEPRECATED:
                $code = QN_REPORT_WARNING;
                $depth = 0;
                break;
        }
        // retrieve instance and log error
        $instance = self::getInstance();
        $instance->log($code, $errmsg, self::getTrace($depth));
	}
    
    private function log($code, $msg, $trace) {
        // check reporting level 
        if($code <= error_reporting()) {
            // handle debug messages
            if($code == QN_REPORT_DEBUG) {                
                // default to arbitrary '1' mask debug info 
                $source = '1';
                $parts = explode('::', $msg, 2);
                if(count($parts) > 1) {
                    $source = $parts[0];
                    $msg = $parts[1];
                }
                if(!is_numeric($source)) {
                    $mask = constant($source);
                }
                else {
                    $mask = (int) $source;
                }
                if(!(DEBUG_MODE & $mask)) return;
            }

            // build error message
            $origin = '{main}()';
            if(isset($trace['function'])) {
                if(isset($trace['class'])) $origin = $trace['class'].'::'.$trace['function'].'()';
                else $origin = $trace['function'].'()';
            }

            $error =  $this->getThreadId().';'.microtime(true).';'.$code.';'.$origin.';'.$trace['file'].';'.$trace['line'].';'.$msg.PHP_EOL;
            
            // append backtrace if required (fatal errors)
            if($code == QN_REPORT_FATAL) {
                $backtrace = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS);
                $n = count($backtrace);
                if($n > 2) {
                    for($i = 2; $i < $n; ++$i) {
                        $trace = $backtrace[$i];
                        $origin = '';                    
                        if(isset($trace['class'])) $origin = $trace['class'].'::'.$trace['function'].'()';
                        else if(isset($trace['function'])) $origin = $trace['function'].'()';
                        $error .= "# $origin @ [{$trace['file']}:{$trace['line']}]".PHP_EOL;                
                    }
                }
            }
            // append error message to log file
            file_put_contents(LOG_STORAGE_DIR.'/qn_error.log', $error, FILE_APPEND);                        
        }
    }
    
    private static function getTrace($depth=0) {
        // we need to go up of 3 levels (minimum)
        $limit = 3+$depth;
        $n = $limit-1;
        $backtrace = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, $limit);
        // retrieve info from where the error was actually raised 
        $trace = $backtrace[$n-1];
        // unset unwanted values, if present
        if(isset($trace['function'])) unset($trace['function']);
        if(isset($trace['class'])) unset($trace['class']);            
        if(isset($trace['type'])) unset($trace['type']);                        

        // if there is additional information about the class/object where the error was raised, use it
        if( count($backtrace) > $n && (!isset($backtrace[$n]['type']) || in_array($backtrace[$n]['type'], ['::', '->'])) ) {
            // we're not interested in inclusions calls
            if(!isset($backtrace[$n]['function']) || !in_array($backtrace[$n]['function'], ['include', 'require', 'include_once', 'require_once'])) {
                if(isset($backtrace[$n]['file'])) unset($backtrace[$n]['file']);
                if(isset($backtrace[$n]['line'])) unset($backtrace[$n]['line']);
                $trace = array_merge($trace, $backtrace[$n]);
            }
        }
        return $trace;        
    }

    public function fatal($msg) {
        $this->log(QN_REPORT_FATAL, $msg, self::getTrace());
        die();
    }
    
    public function error($msg) {
        $this->log(QN_REPORT_ERROR, $msg, self::getTrace());        
    }
    
    public function warning($msg) {
        $this->log(QN_REPORT_WARNING, $msg, self::getTrace());        
    }
    
    public function debug($source, $msg) {
        $this->log(QN_REPORT_DEBUG, $source.'::'.$msg, self::getTrace());
    }   
    
}