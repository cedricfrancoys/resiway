<?php
/*
    This file is part of the Resipedia project <http://www.github.com/cedricfrancoys/resipedia>
    Some Rights Reserved, Cedric Francoys, 2018, Yegen
    Licensed under GNU GPL 3 license <http://www.gnu.org/licenses/>
*/
use config\QNLib;
use resiexchange\Question;
use resiexchange\QuestionComment;
use resiexchange\Answer;
use resiexchange\AnswerComment;
use resiway\User;

list($params, $providers) = QNLib::announce([
    'description'   => 'Returns a fully-loaded question object along with current user history (actions performed on question, answers and comments)',
    'params'        => [
        'id' => [
            'description'   => "Identifier of the question to retrieve.",
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
Question::extend('history', [
    'type'          => 'function',
    'result_type'   => 'array',                                        
    'function'      => function($om, $oids, $lang) use($api) { return $api->history('resiexchange\Question', $oids); }
]);

QuestionComment::extend('history', [
    'type'          => 'function',
    'result_type'   => 'array',                                        
    'function'      => function($om, $oids, $lang) use($api) { return $api->history('resiexchange\QuestionComment', $oids); }
]);

Answer::extend('history', [
    'type'          => 'function',
    'result_type'   => 'array',                                        
    'function'      => function($om, $oids, $lang) use($api) { return $api->history('resiexchange\Answer', $oids); }
]);

AnswerComment::extend('history', [
    'type'          => 'function',
    'result_type'   => 'array',                                        
    'function'      => function($om, $oids, $lang) use($api) { return $api->history('resiexchange\AnswerComment', $oids); }
]);

$question = Question::id($params['id'])
            ->read([
                'id', 'created', 'edited', 'modified', 'title', 'title_url', 'content', 'count_stars', 'count_views', 'count_votes', 'score', 
                'creator'           => User::getPublicFields(),                  
                'editor'            => User::getPublicFields(),                
                'categories'        => ['id', 'title', 'title_url', 'description', 'path', 'parent_path'], 
                'answers'           => [
                                            'id', 'created', 'edited', 'content', 'content_excerpt', 'source_author', 'source_license', 'source_url', 'score', 
                                            'creator'       => User::getPublicFields(), 
                                            'editor'        => User::getPublicFields(),                                             
                                            'comments'      => [
                                                                    'id', 'answer_id', 'created', 'content', 'score',
                                                                    'creator' => User::getPublicFields(),
                                                                    'history'
                                                               ],
                                            'history'
                                       ], 
                'comments'           => ['id', 'creator' => User::getPublicFields(), 'created', 'content', 'score', 'history'],
                'history'
            ])
            ->adapt('txt')
            ->first();

// increment views counter by one
$orm->write('resiexchange\Question', $params['id'], ['count_views' => $question['count_views'] + 1]);

$context->httpResponse()->body(['result' => $question])->send();