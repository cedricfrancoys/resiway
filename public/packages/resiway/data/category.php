<?php
/*
    This file is part of the Resipedia project <http://www.github.com/cedricfrancoys/resipedia>
    Some Rights Reserved, Cedric Francoys, 2018, Yegen
    Licensed under GNU GPL 3 license <http://www.gnu.org/licenses/>
*/
use config\QNLib;

use resiway\Category;

// announce script and fetch parameters values
list($params, $providers) = QNLib::announce([
    'description'	=>	"Returns a category object",
    'params' 		=>	[                                         
                        'id'    => [
                                    'description'   => 'Identifier of the category to retrieve.',
                                    'type'          => 'integer', 
                                    'min'           => 1,
                                    'required'      => true
                                    ]
                        ],
    'response'      =>  [
        'content-type'  => 'application/json',
        'charset'       => 'utf-8'
    ],                        
    'providers'     =>  ['context']
]);

  
// retrieve given category    
$category = Category::id($params['id'])
            ->read(['id', 'title', 'description', 'path', 'parent_id', 'parent_id' => ['title', 'path'], 'count_questions', 'count_documents', 'count_articles', 'count_items'])
            ->first();

// send response
$providers['context']->httpResponse()->body(['result' => $category])->send();