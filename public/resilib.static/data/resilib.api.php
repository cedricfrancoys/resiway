<?php
define('HOME_URL', str_replace(str_replace(DIRECTORY_SEPARATOR, '/', $_SERVER['DOCUMENT_ROOT']), '//'.$_SERVER['SERVER_NAME'].':'.$_SERVER['SERVER_PORT'].'/', dirname( str_replace(DIRECTORY_SEPARATOR, '/', __FILE__) )) );
define('HOME_DIR', realpath( dirname(__FILE__) ).DIRECTORY_SEPARATOR);


/**
* This method describes the calling script and its parameters. It also ensures that required parameters have been transmitted.
* And, if necessary, sets default values for missing optional params.
*
* Accepted types for parameters types are: int, bool, float, string, array
*
* @param	array	$announcement	array holding the description of the script and its parameters
* @return	array	parameters and their final values
*/
function announce($announcement) {		
    $result = array();

    // 1) check presence of all mandatory parameters
    // build mandatory fields array
    $mandatory_params = array();
    if(!isset($announcement['params'])) $announcement['params'] = array();
    foreach($announcement['params'] as $param => $description)
        if(isset($description['required']) && $description['required']) $mandatory_params[] = $param;
    // if at least one mandatory param is missing
    if(	count(array_intersect($mandatory_params, array_keys($_REQUEST))) != count($mandatory_params) 
        || 
        isset($_REQUEST['announce'])
    ) {
        // output json data telling what is expected
        echo json_encode(array('result'=>MISSING_PARAM,'announcement'=>$announcement), JSON_FORCE_OBJECT);
        // terminate script
        exit();
    }

    // 2) find any missing parameters
    $allowed_params = array_keys($announcement['params']);
    $missing_params = array_diff($allowed_params, array_intersect($allowed_params, array_keys($_REQUEST)));

    // 3) build result array and set default values for optional missing parameters
    foreach($announcement['params'] as $param => $description) {
        if(in_array($param, $missing_params) || empty($_REQUEST[$param])) {
            if(!isset($announcement['params'][$param]['default'])) $_REQUEST[$param] = null;
            else $_REQUEST[$param] = $announcement['params'][$param]['default'];
        }
        // prevent some js/php misunderstanding
        if(in_array($_REQUEST[$param], array('NULL', 'null'))) $_REQUEST[$param] = NULL;
        switch($announcement['params'][$param]['type']) {
            case 'bool':
            case 'boolean':
                if(in_array($_REQUEST[$param], array('TRUE', 'true', '1', 1))) $_REQUEST[$param] = true;						
                else $_REQUEST[$param] = false;								
                break;
            case 'array':
                if(!is_array($_REQUEST[$param])) {
                    if(empty($_REQUEST[$param])) $_REQUEST[$param] = array();
                    else $_REQUEST[$param] = explode(',', str_replace(array("'", '"'), '', $_REQUEST[$param]));
                }
                break;
        }
        $result[$param] = $_REQUEST[$param];
    }
    return $result;
}


/* Returns a collection of all documents
*/
function get_documents() {
    $documents = [];
    if ($handle = @opendir(HOME_DIR.'documents')) {
        while (false !== ($entry = readdir($handle))) {
            $filepath = HOME_DIR.'documents/'.$entry;
            if(!in_array($entry, ['.', '..']) && is_dir($filepath)) {
                $documents[] = $entry; 		
            }
        }
        closedir($handle);
    }
    return $documents;
}

/* Checks if a document exists, based on its unique id
*/
function document_exists($id) {
    $dir = HOME_DIR.'documents/'.$id;
    return ( file_exists($dir) && is_dir($dir) );
}

/* Returns meta data for a given document
*/
function get_document_meta($document) {
    $meta = parse_ini_file(HOME_DIR.'documents/'.$document.'/meta.ini');
    $meta['url-download'] =  HOME_URL.'/documents/'.$document.'/document.pdf';
    $meta['file-thumbnail'] =  HOME_URL.'/documents/'.$document.'/thumbnail.jpg';
    $meta['file-size'] = ceil( filesize(HOME_DIR.'documents/'.$document.'/document.pdf') / 1024).' Kb';
    return $meta;
}

/* Get all categories to which belongs a given document
*/
function get_document_categories($document) {
    $categories = [];
    $filepath = HOME_DIR.'documents/'.$document.'/categories';
    if(is_file($filepath)) {
        $categories = file($filepath, FILE_IGNORE_NEW_LINES|FILE_SKIP_EMPTY_LINES);
    }
    return $categories;
}

/* Get meta data from a category
*/
function get_category_meta($category) {
    $meta = parse_ini_file(HOME_DIR.'categories/'.$category.'/meta.ini');  
    return $meta;
}

/* Get categories related to given level
* @return recursive array
*/
function get_categories($root='', $recurse=false) {
    global $params;
    $categories = [];
    if ($handle = @opendir(HOME_DIR.'categories/'.$root)) {
        while (false !== ($entry = readdir($handle))) {
            $filepath = HOME_DIR.'categories/'.$root.'/'.$entry;
            if(!in_array($entry, ['.', '..']) && is_dir($filepath)) {
                if(strlen($root)) $entry = $root.'/'.$entry; 	
                $cat_meta = get_category_meta($entry);
                $categories[$entry] = [ 'title' => $cat_meta['title'][$params['lang']] ];
                if($recurse) {
                    $sub_categories = get_categories($entry, true);
                    if(count($sub_categories)) $categories[$entry]['categories'] = $sub_categories;
                }
            }
        }
        closedir($handle);
    }
    // sort on title
    uasort($categories, function ($a, $b) { return strcmp($a['title'], $b['title']); });
    return $categories;
}

/* 
* Get all categories related to given level
* @return flat array
*/
function get_categories_flat($root='', $recurse=false) {
    $categories = [];
    if ($handle = @opendir(HOME_DIR.'categories/'.$root)) {
        while (false !== ($entry = readdir($handle))) {
            $filepath = HOME_DIR.'categories/'.$root.'/'.$entry;
            if(!in_array($entry, ['.', '..']) && is_dir($filepath)) {
                if(strlen($root)) $entry = $root.'/'.$entry;
                $categories[] = $entry;
                if($recurse) {
                    $categories = array_merge($categories, get_categories_flat($entry, true));
                }
            }
        }
        closedir($handle);
    }
    return $categories;
}

/* Returns a collection of document belonging to given category
*/
function get_category_documents($category, $recurse=true) {
    $documents = [];
    if($recurse) $categories = array_merge([$category], get_categories_flat($category, $recurse));
    else $categories = [$category];
    foreach($categories as $category) {
        $filepath = HOME_DIR.'categories/'.$category.'/documents';
        if(is_file($filepath)) {
            $documents = array_merge($documents, file($filepath, FILE_IGNORE_NEW_LINES|FILE_SKIP_EMPTY_LINES));
        }
    }
    return $documents;
}


/* Creates a colection of documents matching given criteria
*/
function search_documents($criteria, $recurse=true) {
    if(!isset($criteria['categories'])) $criteria['categories'] = [];
    if(!is_array($criteria['categories'])) $criteria['categories'] = (array) $criteria['categories'];

    $documents = [];
    
    if(isset($criteria['id']) && document_exists($criteria['id'])) {
        $documents[] = $criteria['id'];
    }
    else {
        if(empty($criteria['categories'])) {
            $documents = get_documents();
        }
        else {
            foreach($criteria['categories'] as $category) {
                $documents = array_merge($documents, get_category_documents($category, $recurse));
            }
            // some documents might be duplicates (if they belong to several sub-categories)
            $documents = array_unique($documents);
        }
    }
    // apply additional filters:
    foreach($documents as $key => $document) {
        // check author
        if(isset($criteria['author']) && stripos($document, $criteria['author']) === false) { 
            unset($documents[$key]);
            continue;
        }        

        // from now on, we need meta data
        $doc_meta = get_document_meta($document);

        // check title
        if(isset($criteria['title']) && stripos($doc_meta['title'], $criteria['title']) === false) { 
            unset($documents[$key]);
            continue;
        }

        // check language
        if(isset($criteria['language']) && in_array($doc_meta['language'], (array) $criteria['language']) === false) { 
            unset($documents[$key]);
            continue;
        }        
        
    }

    // sort results on title
    sort($documents, SORT_NATURAL | SORT_FLAG_CASE);
    
    return $documents;
}