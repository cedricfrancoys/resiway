<?php
namespace qinoa\http;


class HttpHeaderHelper {
    use HttpHeaderHelperTrait {
        getCharsets as private getCharsetsTrait;
        getCharset as private getCharsetTrait;
        getLanguages as private getLanguagesTrait;
        getLanguage as private getLanguageTrait;        
        getIpAddresses as private getIpAddressesTrait;                
        getIpAddress as private getIpAddressTrait;
        getContentType as private getContentTypeTrait;
    }

    private static $instance;

    private static function &getInstance() {
        if (!(self::$instance instanceof self)) {
            self::$instance = new self();
        }
        return self::$instance;        
    }
    public static function getCharsets($headers) {
        $instance = self::getInstance();
        $instance->setHeaders($headers);        
        return $instance->getCharsetsTrait();
    }    
    public static function getCharset($headers) {
        $instance = self::getInstance();
        $instance->setHeaders($headers);        
        return $instance->getCharsetTrait();
    }
    public static function getLanguages($headers) {
        $instance = self::getInstance();
        $instance->setHeaders($headers);
        return $instance->getLanguagesTrait();
    }
    public static function getLanguage($headers) {
        $instance = self::getInstance();
        $instance->setHeaders($headers);        
        return $instance->getLanguageTrait();
    }
    public static function getIpAddresses($headers) {
        $instance = self::getInstance();
        $instance->setHeaders($headers);        
        return $instance->getIpAddressesTrait();
    }
    public static function getIpAddress($headers) {
        $instance = self::getInstance();
        $instance->setHeaders($headers);        
        return $instance->getIpAddressTrait();
    }
    public static function getContentType($headers) {
        $instance = self::getInstance();
        $instance->setHeaders($headers);        
        return $instance->getContentTypeTrait();
    }        
}
