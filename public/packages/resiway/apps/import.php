<?php
defined('__QN_LIB') or die(__FILE__.' cannot be executed directly.');
require_once('../resi.api.php');

use config\QNLib as QNLib;
use easyobject\orm\ObjectManager as ObjectManager;

set_silent(false);



$om = &ObjectManager::getInstance();

$tags = [];


/**
 Script for converting ResiWay categories from JSON format to easyobject 
*/

$json = file_get_contents('categories.json');
$data = json_decode($json, true);

foreach($data as $path => $names) {
    // fetch all parts of the path
    $parts = explode('/', $path);
    // reset 'parent_id' value
    $values['parent_id'] = 0;

    // try to retrieve parent
    if(count($parts)) {
        // pop last item from 'parts' array
        $tag = array_pop($parts);        
        $parent = implode('/', $parts);
        if(isset($tags[$parent])) $values['parent_id'] = $tags[$parent];
    }
    
    $values['title'] = $names['fr'];
    $values['description'] = $names['fr'];    
    $tag_id = $om->create('resiway\Tag', $values, 'fr');
    
    $values['title'] = $names['en'];
    $values['description'] = $names['en'];        
    $om->write('resiway\Tag', $tag_id, $values, 'en');

    $values['title'] = $names['es'];
    $values['description'] = $names['es'];        
    $om->write('resiway\Tag', $tag_id, $values, 'es');
    
    $tags[$path] = $tag_id;
}

