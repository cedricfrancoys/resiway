<?php
/*
    This file is part of the Resipedia project <http://www.github.com/cedricfrancoys/resipedia>
    Some Rights Reserved, Cedric Francoys, 2018, Yegen
    Licensed under GNU GPL 3 license <http://www.gnu.org/licenses/>
*/
use config\QNLib;
use resilib\Document;
use resilib\DocumentComment;
use resiway\User;

list($params, $providers) = QNLib::announce([
    'description'   => 'Returns a fully-loaded document object along with current user history (actions performed on document and comments)',
    'params'        => [
        'id' => [
            'description'   => "Identifier of the document to retrieve.",
            'type'          => 'integer',
            'required'      => true
        ]
    ],
    'response'      => [
        'content-type'  => 'application/json',
        'charset'       => 'utf-8'
    ],
    'providers'     => ['context', 'orm', 'api' => 'resiway\Api'] 
]);

list($context, $orm, $api) = [$providers['context'], $providers['orm'], $providers['api']];


/*
    Overload schemas of targeted classes with a virtual field:
    history array   names of actions already performed by current user on current document
*/
Document::extend('history', [
    'type'          => 'function',
    'result_type'   => 'array',                                        
    'function'      => function($om, $oids, $lang) use($api) { return $api->history('resilib\Document', $oids); }
]);

DocumentComment::extend('history', [
    'type'          => 'function',
    'result_type'   => 'array',                                        
    'function'      => function($om, $oids, $lang) use($api) { return $api->history('resilib\DocumentComment', $oids); }
]);

$document = Document::id($params['id'])
            ->read([
                'id', 'created', 'edited', 'modified', 'title', 'title_url', 'last_update', 'license', 'description', 'pages', 'original_url', 'count_stars', 'count_views', 'count_votes', 'count_downloads', 'score', 
                'creator'           => User::getPublicFields(),                  
                'editor'            => User::getPublicFields(),                
                'categories'        => ['id', 'title', 'title_url', 'description', 'path', 'parent_path'], 
                'authors'           => ['id', 'name', 'name_url'], 
                'comments'          => ['id', 'creator' => User::getPublicFields(), 'created', 'content', 'score', 'history'],
                'history'
            ])
            ->adapt('txt')
            ->first();

// increment views counter by one
$orm->write('resilib\Document', $params['id'], ['count_views' => $document['count_views'] + 1]);

$context->httpResponse()->body(['result' => $document])->send();