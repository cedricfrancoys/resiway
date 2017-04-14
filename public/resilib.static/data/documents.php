<?php

require_once('resilib.api.php');
error_reporting(0);

// announce script and fetch parameters values
$params = announce([
    'description'	=>	"Returns the documents matching the given criteria.",
    'params' 		=> [
    
        'categories'=> [
                        'description' => 'Categories to look within.',
                        'type' => 'array',
                        'default' => null
                    ],
        'id'     => [
                        'description' => 'Identifier of an unique document.',
                        'type' => 'string',
                        'default' => null
                    ],                          
        'title'     => [
                        'description' => 'Needle to look for in the title.',
                        'type' => 'string',
                        'default' => null
                    ],                        
        'author'    => [
                        'description' => 'Needle for the author name.',
                        'type' => 'string',
                        'default' => null
                    ],
        'language'  => [
                        'description' => 'Language of the documents to search.',
                        'type' => 'string', 
                        'default' => null
                    ],
        'ui'        => [
                        'description' => 'Language in which display categories names.',
                        'type' => 'string', 
                        'default' => 'en'
                    ],                    
        'recurse'   => [
                        'description' => 'Search for documents in sub-categories.',
                        'type' => 'bool', 
                        'default' => true
                    ],                        
        'start'     => [
                        'description' => 'Position in the result set we want to start at.',
                        'type' => 'integer', 
                        'default' => '0'          
                    ],
        'limit'     => [
                        'description' => 'Number of records to return.',
                        'type' => 'integer', 
                        'default' => null          
                    ]         
    ]
]);

$result = [];
$documents = search_documents($params, $params['recurse']);

// remember the total count 
$total = count($documents);

// handle start an limit parameters
$documents = array_slice($documents, $params['start'], $params['limit']);

foreach($documents as $document) {
    $doc_meta = get_document_meta($document);
    $result[$document] = $doc_meta;
    $result[$document]['categories'] = [];
    $categories = get_document_categories($document);
    foreach($categories as $category) {
        $cat_meta = get_category_meta($category);
        $result[$document]['categories'][$category]['title'] = $cat_meta['title'][$params['ui']];
    }
     
}

// output json result
header('Content-type: application/json; charset=UTF-8');
echo json_encode(array('total'=>$total, 'result'=>$result), JSON_FORCE_OBJECT);