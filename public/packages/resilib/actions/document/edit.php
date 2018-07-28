<?php
/*
    This file is part of the Resipedia project <http://www.github.com/cedricfrancoys/resipedia>
    Some Rights Reserved, Cedric Francoys, 2018, Yegen
    Licensed under GNU GPL 3 license <http://www.gnu.org/licenses/>
*/
use config\QNLib;

use resilib\Document;
use resiway\Author;
use resiway\User;
use resiway\Category;

list($params, $providers) = QNLib::announce([
    'description'   => 'Edit a document or submit a new one',
    'params'        => [
        'id' => [
            'description'   => "Identifier of the document being edited.",
            'type'          => 'integer',
            'min'           => 0,
            'required'      => true
        ],
        'content'   => [
            'description'   => 'Content of the submitted document (either base64 encoded or multipart/form-data).',
            'type'          => 'file', 
            'default'       => ''
        ],
        'thumbnail'	=> [
            'description'   => 'Thumbnail picture fot the submitted document.',
            'type'          => 'file', 
            'default'       => ''
        ],
        'title' => [
            'description'   => 'Title of the submitted document.',
            'type'          => 'string', 
            'required'      => true
        ],
        'authors_ids' => [
            'description'   => 'List of names of the authors of the document.',
            'type'          => 'array',
            'required'      => true
        ],                            
        'last_update' => [
            'description'   => 'Publication date of the submitted document.',
            'type'          => 'date',
            'required'      => true
        ],
        'original_url' => [
            'description'   => 'Original location of the submitted document.',
            'type'          => 'string',
            'default'       => ''
        ],
        'description' => [
            'description'   => 'Description of the submitted document.',
            'type'          => 'string', 
            'default'       => ''
        ],
        'license' => [
            'description'   => 'Licence under which is published the submitted document.',
            'type'          => 'string', 
            'default'       => 'CC-by-nc-sa' 
        ],
        'lang' => [
            'description'   => 'Language of the submitted document.',
            'type'          => 'string', 
            'default'       => 'fr'
        ],
        'pages' => [
            'description'   => 'Number of pages of the submitted document.',
            'type'          => 'integer', 
            'required'       => true
        ],
        'categories_ids' => [
            'description'   => 'List of tags assigned to the document.',
            'type'          => 'array',
            'required'      => true
        ]
        
    ],
    'response'      => [
        'content-type'  => 'application/json',
        'charset'       => 'utf-8'
    ],
    'providers'     => ['context', 'api' => 'resiway\Api'] 
]);

list($context, $api) = [$providers['context'], $providers['api']];

list($action_name, $object_class, $object_id) = [ 
    'resilib_document_edit',
    'resilib\Document',
    $params['id']
];


if($object_id == 0) {
    $action_name = 'resilib_document_post';
    unset($params['id']);
}
else {
    // prevent deleting binary content when patching
    if(empty($params['content'])) {
        unset($params['content']);
    }
    if(empty($params['thumbnail'])) {
        unset($params['thumbnail']);
    }    
}



$result = $api->performAction(
    $action_name,                                             // $action_name
    $object_class,                                            // $object_class
    $object_id,                                               // $object_id
    [],                                                       // $object_fields
    false,                                                    // $toggle
    function ($om, $user_id, $object_class, $object_id)       // $do
    use ($api, $params) {    

        // check authors_ids consistency (we might have received a request for new authors)            
        foreach($params['authors_ids'] as $key => $value) {
            if(intval($value) == 0 && strlen($value) > 0) {
                // check if an author by that name already exists                    
                $authors_ids = Author::search(['name', 'ilike', $value])->limit(1)->ids();
                if(!count($authors_ids)) {
                    // create a new category + write given value
                    $authors_ids = Author::create([ 
                                       'creator'   => $user_id,     
                                       'name'      => $value
                                   ])
                                   ->ids();
                }
                // update entry
                $params['authors_ids'][$key] = sprintf("+%d", $authors_ids[0]);
            }
        }
        
        // check categories_ids consistency (we might have received a request for new categories)
        foreach($params['categories_ids'] as $key => $value) {
            if(intval($value) == 0 && strlen($value) > 0) {
                // check if a category by that name already exists
                $cats_ids = Category::search(['title', 'ilike', $value])->limit(1)->ids();
                if(!count($cats_ids)) {
                    // create a new category + write given value
                    $cats_ids = Category::create([ 
                                    'creator'           => $user_id,     
                                    'title'             => $value,
                                    'description'       => '',
                                    'parent_id'         => 0
                                ])
                                ->ids();
                }
                // update entry
                $params['categories_ids'][$key] = sprintf("+%d", $cats_ids[0]);
            }
        }        
        
        if($object_id == 0) {        
            // create a new document + write given value
            $document = Document::create(array_merge(['creator' => $user_id], $params))->adapt('txt')->first();
           
            // update user count_documents
            $collection = User::id($user_id)->read(['count_documents']);            
            $user = $collection->first();
            $collection->update([ 'count_documents'=> $user['count_documents']+1 ]);

            // update categories count_documents
            Category::ids($params['categories_ids'])->update(['count_documents' => null]);
            
            // update global counters
            $api->increment('resilib.count_documents');
            $api->increment('resilib.count_pages', $params['pages']);
        }
        else {
            /*
             note : expected notation of categories_ids involve a sign 
             '+': relation to be added
             '-': relation to be removed
            */

            $document = Document::id($object_id)->update(array_merge(['editor' => $user_id, 'edited' => time()], $params))->adapt('txt')->first();

            // update categories count_documents
            $categories_ids = array_map(function($i) { return abs(intval($i)); }, $params['categories_ids']);
            Category::ids($categories_ids)->update(['count_documents' => null]);            
        }

        return ['id' => $document['id']];
    },
    null,                                                      // $undo
    [                                                          // $limitations
        function ($om, $user_id, $action_id, $object_class, $object_id) 
        use ($params) {
            if(strlen($params['title']) < RESILIB_DOCUMENT_TITLE_LENGTH_MIN
            || strlen($params['title']) > RESILIB_DOCUMENT_TITLE_LENGTH_MAX) {
                throw new Exception("document_title_length_invalid", QN_ERROR_INVALID_PARAM); 
            }
            $count_tags = 0;
            foreach($params['categories_ids'] as $tag_id) {
                if(intval($tag_id) > 0) ++$count_tags;
                else if(intval($tag_id) == 0 && strlen($tag_id) > 0) ++$count_tags;
            }
            if($count_tags < RESILIB_DOCUMENT_CATEGORIES_COUNT_MIN
            || $count_tags > RESILIB_DOCUMENT_CATEGORIES_COUNT_MAX) {
                throw new Exception("document_tags_count_invalid", QN_ERROR_INVALID_PARAM); 
            }
            
        },
        // user cannot perform given action more than daily maximum
        function ($om, $user_id, $action_id, $object_class, $object_id) {
            $res = $om->search('resiway\ActionLog', [
                        ['user_id',     '=',  $user_id], 
                        ['action_id',   '=',  $action_id], 
                        ['object_class','=',  $object_class], 
                        ['created',     '>=', date("Y-m-d")]
                   ]);
            if($res > 0 && count($res) > RESILIB_DOCUMENT_DAILY_MAX) {
                throw new Exception("action_max_reached", QN_ERROR_NOT_ALLOWED);
            }        
        }
    ]
);
 

$context->httpResponse()->body(['result' => $result])->send();