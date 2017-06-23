<?php
// Dispatcher (index.php) is in charge of setting the context and should include easyObject library
defined('__QN_LIB') or die(__FILE__.' cannot be executed directly.');
require_once('../resi.api.php');

use config\QNLib as QNLib;
use easyobject\orm\ObjectManager as ObjectManager;



// force silent mode (debug output would corrupt json data)
set_silent(false);



header('Location: '.'http://www.resiway.gdn/resiway.fr#/test');


