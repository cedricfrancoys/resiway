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
    'params'        => [
                            'article_id'	=> [
                                'description'   => 'Identifier of the ekopedia article.',
                                'type'          => 'integer', 
                                'required'      => true
                            ]    
                        ],
    'providers'     => ['qinoa\php\Context'] 
]);

list($context) = [ $providers['qinoa\php\Context'] ];

list($result, $error_message_ids) = [true, []];

$response = $context->httpResponse()
            ->contentType('application/json')
            ->charset('utf-8');
            
try {

    $request = new HttpRequest('GET https://www.ekopedia.fr/export_article.php?id='.$params['article_id']);
    $data = $request->send()->body();
    
    if(isset($data['result']) && isset($data['result']['categories'])) {
        
        $eko_categories = $data['result']['categories'];

        $rw_categories = Category::search()->read(['id', 'title', 'title_url', 'path', 'parent_path'])->get();

        $result_categories = [];
        foreach($eko_categories as $eko_category) {    
            foreach($rw_categories as $rw_category_id => $rw_category) {
                $title =  mb_strtolower((string) $rw_category['title']);
                $len = (int) max(strlen($eko_category), strlen($title));
                $dist = (int) levenshtein($title, $eko_category);

                if($dist >= 0 && $dist < 2) {
                    // $result_categories_ids[$eko_category] = $rw_category;
                    $result_categories[] = $rw_category;
                    break;
                }
            }
        }
        $data['result']['categories'] = $result_categories;
    }    
        
    $result = $data['result'];
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







