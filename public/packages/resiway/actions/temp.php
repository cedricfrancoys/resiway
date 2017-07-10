<?php
// Dispatcher (index.php) is in charge of setting the context and should include easyObject library
defined('__QN_LIB') or die(__FILE__.' cannot be executed directly.');


// use html\phpQuery as phpQuery;
use mikehaertl\pdftk\Pdf as Pdf;

// force silent mode (debug output would corrupt json data)
set_silent(false);


echo '<pre>';

foreach( glob('C:\Users\User\Desktop\RL - contenu à importer\nouveaux docs resilib\*') as $dir) {
    echo $dir.PHP_EOL;
    if(!is_dir($dir)) continue;
    if(strpos($dir, '+ ajoutés')) continue;    
    foreach( glob($dir.'/*.pdf') as $pdf) {
        $dest = dirname($pdf).'/thumbnail.jpg';
        $src = basename($pdf);

        chdir($dir);
        if(!file_exists('thumbnail.jpg')) {
            $command = 'convert "'.$src.'"[0] thumbnail.jpg';
            $res = exec($command);
            echo 'src: '.$pdf.' => '.$dest.PHP_EOL;        
            echo $command.PHP_EOL;
            echo $res.PHP_EOL;
            echo PHP_EOL;
        }
        if(true or !file_exists('meta.ini')) {  

            // Get data
            $pdfData = new Pdf($pdf);
            $data = $pdfData->getData();
            $data = explode(PHP_EOL, $data);

            $meta = [];
            $current_key = '';
            foreach($data as $id => $value) {
                $list = explode(': ', $value);
                if(isset($list[0])) {
                    $type = $list[0];
                    if(isset($list[1])) $str = $list[1];
                }
                if($type == 'InfoBegin') continue;
                else if($type == 'InfoKey') {
                    $current_key = $str;
                }
                else if($type == 'InfoValue') {
                    $meta[$current_key] = $str;
                }
                else {
                    $meta[$type] = $str;
                }
                
            }

            $params = [];
                        
            $meta['NumberOfPages'] = (isset($meta['NumberOfPages']))?$meta['NumberOfPages']:'1';
            $meta['CreationDate'] = (isset($meta['CreationDate']))?$meta['CreationDate']:'D:19700101';
            $dateTime = DateTime::createFromFormat('Ymd', substr($meta['CreationDate'], 2, 8));

            // $params['title'] = $meta['Title'];
            $params['title'] = basename($dir);
            $params['author'] = (isset($meta['Author']))?$meta['Author']:'';
            $params['version'] = is_a($dateTime, 'DateTime')?date('d/m/Y', $dateTime->getTimestamp()):'01/01/1970';
            $params['file-pages'] = $meta['NumberOfPages'];
            $params['language']="fr";
            $params['license']="CC-by-nc-sa";
            $params['description']="";

            $content = '';
            foreach($params as $param => $value) {
                $content .= "{$param}=\"{$value}\"\r\n";
            }
            file_put_contents($dir.'/meta.ini', $content);
        }
    }

}






// 
// $docs = [];
// $urls = []; 

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

/*
$urls = explode(PHP_EOL, file_get_contents('resID.txt'));





// $start = 3301;
// $start = 3501;
$start = 3701;

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

*/
