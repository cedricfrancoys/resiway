<?php
/*
    This file is part of the qinoa framework <http://www.github.com/cedricfrancoys/qinoa>
    Some Rights Reserved, Cedric Francoys, 2018, Yegen
    Licensed under GNU GPL 3 license <http://www.gnu.org/licenses/>
*/
use config\QNLib;

list($params, $providers) = QNLib::announce([
    'description'   => "Returns the schema of given class (model)",
    'params'        => [
                        'package' => [
                            'description'   => 'Name of the package for which the schema is requested',
                            'type'          => 'string',
                            'required'      => true
                        ],
                        'xml' => [
                            'description'   => 'Updated XML of the schema for given package',
                            'type'          => 'string',
                            'required'      => true
                        ],                        
    ],
    'response'      => [
        'content-type'      => 'application/json',
        'charset'           => 'utf-8',
        'accept-origin'     => '*'
    ],
    'providers'     => ['context'] 
]);


list($context) = [$providers['context']];

file_put_contents("../cache/sqldesign_{$params['package']}.xml", $params['xml']);

$context->httpResponse()
        ->status(204)
        ->body('')
        ->send();