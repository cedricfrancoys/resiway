<?php
require_once('../resi.api.php');

use config\QNLib;
use qinoa\http\HttpRequest;
use qinoa\http\HttpUriHelper;

use resiway\Category;
use resilexi\Article;

set_silent(true);

list($params, $providers) = QNLib::announce([
    'description'   => 'Provides a id/title map of all ekopedia articles not imported yet',
    'params'        => [],
    'providers'     => ['qinoa\php\Context'] 
]);

list($context) = [ $providers['qinoa\php\Context'] ];

list($result, $error_message_ids) = [true, []];

$response = $context->httpResponse()
            ->contentType('application/json')
            ->charset('utf-8');
            
try {

    $request = new HttpRequest('GET https://www.ekopedia.fr/export_ids.php');
    $data = $request->send()->body();
    $available_articles = $data['result'];     
    
    $processed_articles = [];
    $res = Article::search(['source_author', '=', 'ekopedia'])
           ->read(['source_url'])
           ->get();

    foreach($res as $id => $article) {
        $processed_articles[] = basename(HttpUriHelper::getPath($article['source_url']));
    }
    
    $articles_ids = array_diff($available_articles, $processed_articles);
        
    $result = $articles_ids;
}
catch(Exception $e) {
    $result = $e->getCode();
    $error_message_ids = array($e->getMessage());
}

$response->body([
            'result'            => $result, 
            'error_message_ids' => $error_message_ids            
         ])
         ->send();







