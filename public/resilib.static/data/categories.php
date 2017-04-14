<?php

require_once('resilib.api.php');

// announce script and fetch parameters values
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
                        'default' => false
                        ],
            'lang'		=>  [
                        'description' => 'Language in which to return categories titles.',
                        'type' => 'string', 
                        'default' => 'en'
                        ]
    ]
]);



$categories = get_categories($params['root'], $params['recurse']);

// output json result
header('Content-type: application/json; charset=UTF-8');
echo json_encode($categories, JSON_FORCE_OBJECT);