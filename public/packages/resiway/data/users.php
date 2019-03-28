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

    ],
    'response'      => [
        'content-type'  => 'application/json',
        'charset'       => 'utf-8'
    ],
    'providers'     => ['context', 'orm', 'api' => 'resiway\Api'] 
]);

list($context, $orm, $api) = [$providers['context'], $providers['orm'], $providers['api']];


$ids = $orm->search('resiway\User');
if($ids < 0) throw new Exception("request_failed", QN_ERROR_UNKNOWN);
$total = count($ids);

$users = User::search(['varified', '=', '1'])
            ->read(User::userPublicFields())
            ->adapt('txt');

            
$context->httpResponse()->header('X-Total-Count', $total)->body(['result' => $users, 'total' => $total])->send();