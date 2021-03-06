<?php
// This code looks up the city of requesting IP,
// using the GeoLiteCity database and geonames online service for translation
// This code includes and relies on GeoLite data created by MaxMind, available at <http://www.maxmind.com>
namespace maxmind\geoip;

use html\phpQuery as phpQuery;

include(dirname(__FILE__).'/geoipcity.inc');
include(dirname(__FILE__).'/geoipregionvars.php');

define('GEOIP_DB_PATH', dirname(__FILE__).'/GeoLiteCity.dat');


class GeoIP {
    /* Fetch translation of the specified name for given language
    */
    public static function geoNames($name, $lang='fr', $country_code='', $charset='UTF-8') {
        // set default (if not found) to non-translated value
        $result = $name;
        try {
            if(strlen($name) <= 0) throw new \Exception('no name given');
            // build URL
            $url = 'http://www.geonames.org/search.html?lang='.$lang.'&charset='.$charset.'&q='.urlencode($name);
            // append country code, if given
            if(strlen($country_code) > 0) {
                $url .= '&country='.$country_code;
            }
            // request translation
            $html = file_get_contents($url);
            if(stripos($http_response_header[0], 'OK') === false) throw new \Exception('HTTP error');
            // set error level
            $internalErrors = libxml_use_internal_errors(true);
            // parse HTML doc
            $doc = phpQuery::newDocumentHTML($html);
            // restore error level
            libxml_use_internal_errors($internalErrors);            
            // fetch target DOM node (@see http://www.geonames.org/search.html?q=BE for HTML response schema)
            // (table with class 'restable', first row, second column, first link inner text)
            $nodes = $doc->find('table.restable > tr:eq(2) > td:eq(1)')->find('a');
            foreach ($nodes as $node)  {
                $translation = pq($node)->text();
                if(strlen($translation) > 0) {                    
                    $result = $translation;
                    break;
                }
            }
        }
        catch(\Exception $e) {
            // abort execution and continue with default value
        }
        return $result;
    }

    /* Convert IP address to geo location
    */
    public static function getLocationFromIP($ip) {
        $gi = geoip_open(GEOIP_DB_PATH, GEOIP_STANDARD);
        $location = GeoIP_record_by_addr($gi, $ip);
        // normalize $location : make sure $location is an object and set default values to empty string instead of NULL
        if( !($location instanceof \geoiprecord) ) $location = new \geoiprecord();
        if(is_null($location->country_name)) $location->country_name = '';
        if(is_null($location->country_code)) $location->country_code = '';
        if(is_null($location->city)) $location->city = '';
        // some cities are not translated to english and GeoLiteCity.dat uses ANSI encoding
        $location->city = mb_convert_encoding($location->city, 'UTF-8');
        // translate country name
        $location->country_name = self::geoNames($location->country_name, 'fr');
        // translate city name, if given
        $location->city = self::geoNames($location->city, 'fr', $location->country_code);
        geoip_close($gi);    
        return $location;
    }
    
}