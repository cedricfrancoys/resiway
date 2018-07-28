<?php
/*
    This file is part of the Resipedia project <http://www.github.com/cedricfrancoys/resipedia>
    Some Rights Reserved, Cedric Francoys, 2018, Yegen
    Licensed under GNU GPL 3 license <http://www.gnu.org/licenses/>
*/
use config\QNLib;
use resiway\User;

list($params, $providers) = QNLib::announce([
    'description'   => 'Returns a fully-loaded question object along with current user history (actions performed on question, answers and comments)',
    'params'        => [
        'id' => [
            'description'   => "Identifier of the question to retrieve.",
            'type'          => 'integer'
        ],
        'domain' => [
            'description'   => 'Criterias that results have to match (serie of conjunctions)',
            'type'          => 'array',
            'default'       => []
        ],
        'order' => [
            'description'   => 'Column to use for sorting results.',
            'type'          => 'string',
            'default'       => 'id'
        ],
        'sort' => [
            'description'   => 'The direction  (i.e. \'asc\' or \'desc\').',
            'type'          => 'string',
            'default'       => 'desc'
        ],
        'start' => [
            'description'   => 'The row from which results have to start.',
            'type'          => 'integer',
            'default'       => 0
        ],
        'limit' => [
            'description'   => 'The maximum number of results.',
            'type'          => 'integer',
            'min'           => 5,
            'max'           => 100,
            'default'       => 25
        ]
    ],
    'response'      => [
        'content-type'  => 'application/json',
        'charset'       => 'utf-8'
    ],
    'providers'     => ['context', 'api' => 'resiway\Api'] 
]);

list($context, $api) = [$providers['context'], $providers['api']];

if(isset($params['id'])) {
    $result = User::id($params['id'])
              ->read(User::getPublicFields())
              ->adapt('txt')
              ->first();
}
else {
    $collection = User::search($params['domain'], [ 'sort' => [ $params['order'] => $params['sort']] ]);

    $total = count($collection->ids());
    
    // retrieve list
    $result = $collection
              ->shift($params['start'])
              ->limit($params['limit'])
              ->read(User::getPublicFields())
              ->adapt('txt')
              ->get(true);
}

$context->httpResponse()
        ->header('Access-Control-Allow-Origin', '*')
        ->header('Access-Control-Expose-Headers', '*')
        ->header('X-Total-Count', $total)
        ->body($result)
        ->send();