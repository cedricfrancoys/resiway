<?php
/*
    This file is part of the Resipedia project <http://www.github.com/cedricfrancoys/resipedia>
    Some Rights Reserved, Cedric Francoys, 2018, Yegen
    Licensed under GNU GPL 3 license <http://www.gnu.org/licenses/>
*/
use config\QNLib;
use resiway\User;

list($params, $providers) = QNLib::announce([
    'description'   => 'Returns the list of participants',
    'params'        => [
        'start'		=> [
            'description'   => 'The row from which results have to start.',
            'type'          => 'integer',
            'default'       => 0
        ],
        'limit'		=> [
            'description'   => 'The maximum number of results.',
            'type'          => 'integer',
            'min'           => 5,
            'max'           => 100,
            'default'       => 25
        ],
        'total'		=> [
            'description'   => 'Total of record (if known).',
            'type'          => 'integer',
            'default'       => -1
        ]
    ],
    'response'      => [
        'content-type'  => 'application/json',
        'charset'       => 'utf-8'
    ],
    'providers'     => ['context', 'orm', 'api' => 'resiway\Api'] 
]);

list($context, $orm, $api) = [$providers['context'], $providers['orm'], $providers['api']];


if($params['total'] < 0) {
    $ids = $orm->search('resiway\User');
    if($ids < 0) throw new Exception("request_failed", QN_ERROR_UNKNOWN);
    $params['total'] = count($ids);
}

$users = User::search(
                ['verified', '=', '1'], 
                [
                    'sort' => ['about' => 'desc', 'reputation' => 'desc'], 
                    'start' => $params['start'],
                    'limit' => $params['limit']
                ]
            )
            ->read(User::getPublicFields())
            ->adapt('txt')
            ->get();

            
$context->httpResponse()
        ->header('X-Total-Count', $params['total'])
        ->body(['result' => $users, 'total' => $params['total']])
        ->send();