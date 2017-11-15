<?php
defined('__QN_LIB') or die(__FILE__.' cannot be executed directly.');
require_once('../resi.api.php');

use maxmind\geoip\GeoIP as GeoIP;


// brussels
// $location = GeoIP::getLocationFromIP('194.78.133.196');
// Liège
// $location = GeoIP::getLocationFromIP('95.182.209.5');
// Saint-Étienne
$location = GeoIP::getLocationFromIP('213.56.68.197');


print_r($location);