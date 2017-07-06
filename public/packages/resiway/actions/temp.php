<?php
// Dispatcher (index.php) is in charge of setting the context and should include easyObject library
defined('__QN_LIB') or die(__FILE__.' cannot be executed directly.');

use html\phpQuery as phpQuery;


// force silent mode (debug output would corrupt json data)
set_silent(false);


$docs = [];

$urls = []; 

/*
foreach (glob("resID/*") as $filename) {
    
   
    if( in_array($filename, ['.', '..']) ) continue;
    $html = file_get_contents($filename);
    $doc = phpQuery::newDocumentHTML($html, 'UTF-8');
    foreach(pq('a') as $node) {
        $href = pq($ )->attr('href');
        if(strpos($href, '/outils-pedagogiques/fiche.php') !== false) {
            $href = str_replace('..', 'http://www.reseau-idee.com', $href);
            $urls[] = $href;
        }        
    }

}
print_r($urls);

*/

$urls = explode(PHP_EOL, file_get_contents('resID.txt'));


$start = 701;
//$start = 901;
//$start = 1101;

for($i = 0; $i < $start; ++$i) {
    unset($urls[$i]);
}

$i = 0;
foreach($urls as $url) {    
    if($i > 200) break;
    $html = file_get_contents($url);
    $doc = phpQuery::newDocumentHTML($html, 'UTF-8');
    foreach(pq('dd.support_link') as $node) {
        foreach(pq($node)->find('a') as $a) {
            $href = pq($a)->attr('href');
            file_put_contents('resID_links.txt', $href."\n", FILE_APPEND);
            $docs[] = $href;
        }
    }
    ++$i;
}



print_r($docs);
