<?php
// Dispatcher (index.php) is in charge of setting the context and should include easyObject library
defined('__QN_LIB') or die(__FILE__.' cannot be executed directly.');
require_once('../resi.api.php');

require_once('../../resilib/data/resilib.api.php');

use config\QNLib as QNLib;
use easyobject\orm\ObjectManager as ObjectManager;

set_silent(false);

$params = announce([
    'description'	=>	"Returns the categories values of the specified fields for the given objects ids.",
    'params' 		=>	[
            'root'	    =>  [
                        'description' => 'Root category to start from.',
                        'type' => 'string',
                        'default' => ''
                        ],
            'recurse'   =>  [
                        'description' => 'Recurse through all sub-categories.',
                        'type' => 'boolean',
                        'default' => true
                        ],
            'lang'		=>  [
                        'description' => 'Language in which to return categories titles.',
                        'type' => 'string', 
                        'default' => 'fr'
                        ]
    ]
]);

function slugify($value) {
    // remove accentuated chars
    $value = htmlentities($value, ENT_QUOTES, 'UTF-8');
    $value = preg_replace('~&([a-z]{1,2})(acute|cedil|circ|grave|lig|orn|ring|slash|th|tilde|uml);~i', '$1', $value);
    $value = html_entity_decode($value, ENT_QUOTES, 'UTF-8');
    // remove all non-quote-space-alphanum-dash chars
    $value = preg_replace('/[^\'\s-a-z0-9]/i', '', $value);
    // replace spaces, dashes and quotes with dashes
    $value = preg_replace('/[\s-\']+/', '-', $value);           
    // trim the end of the string
    $value = trim($value, '.-_');
    return strtolower($value);
}

function get_include_contents($filename) {
	ob_start();	
	include($filename); // assuming  parameters required by the script being called are present in the current URL 
	return ob_get_clean();
}


// conversion array
$convert = [];

try {
    $con = mysqli_connect('localhost','root','','resiway');
    mysqli_query($con, "SET NAMES 'utf8'");
      
    $query = "select * from `resiway_category`;";
    $handle = mysqli_query($con, $query);

    $rw_categories = [];    
    while($row = mysqli_fetch_array($handle)) {
        $rw_categories[$row['id']] = slugify($row['title']);
    }

    mysqli_close($con);

    $categories = get_categories_flat('', true);

    foreach($categories as $category) {
        $cat_meta = get_category_meta($category);
        $cat_name = slugify($cat_meta['title'][$params['lang']]);

        $selected_id = -1;
        foreach($rw_categories as $rw_id => $rw_cat ) {
            if(strpos($cat_name, $rw_cat) === 0) {
                if($selected_id > 0) {
                    if( abs(strlen($rw_categories[$selected_id]) - strlen($cat_name)) > abs(strlen($rw_cat) - strlen($cat_name)) ) {
                        $selected_id = $rw_id;
                    }
                }
                else $selected_id = $rw_id;
            }
        }
        if($selected_id < 0) {
            $first = explode('-', $cat_name)[0];
            foreach($rw_categories as $rw_id => $rw_cat ) {
                $rw_first = explode('-', $rw_cat)[0];
                if(strpos($rw_first, $first) === 0) {            
                    $selected_id = $rw_id;
                    break;
                }
            }
        }
        
        if($selected_id > 0) $rw_name = $rw_categories[$selected_id];

        $convert[$category] = $selected_id;
    }
}
catch(Exception $e) {
    die('error loading categories');
}



$documents = get_documents();

foreach($documents as $document) {

    $meta = get_document_meta($document);
    $categories = get_document_categories($document);
    $rw_categories = [];
    foreach($categories as $category) {
        if($convert[$category] > 0) $rw_categories[] = $convert[$category];
    }
   
    if(!file_exists('C:/DEV/wamp/www/resilib/data/documents/'.$document.'/document.pdf')) echo 'Error: file not found';

    copy('C:/DEV/wamp/www/resilib/data/documents/'.$document.'/document.pdf', 'C:\DEV\wamp\tmp\filetemp.tmp');
    
    $content = [
        'name' => $document.'.pdf',
        'type' => 'application/pdf',
        'tmp_name' => 'C:\DEV\wamp\tmp\filetemp.tmp',
        'error' => 0,
        'size' => filesize('C:/DEV/wamp/www/resilib/data/documents/'.$document.'/document.pdf')
    ];
    
    if($meta['license'] == 'Non spécifié') $meta['license'] = 'CC-by-nc-sa';
    
    $values = [
            'document_id'	    => 0,    
            'title'	            => $meta['title'],
            'author'            => $meta['author'],
            'last_update'		=> $meta['version'],
            'original_url'		=> $meta['url-origin'],
            'description'       => $meta['description'],
            'licence'           => $meta['license'],                            
            'lang'              => $meta['language'],
            'pages'             => $meta['file-pages'],                                                        
            'content'	        => $content,
            'categories_ids'    => $rw_categories,
            'orig_categories_ids'    => $categories            
            ];    

    $_FILES['content'] = $content;
    
    foreach($values as $key => $value) {
        $_REQUEST[$key] = $value;
    }

    $result = get_include_contents('packages/resilib/actions/document/edit.php');   

    echo $result;    
        
}











    
    
