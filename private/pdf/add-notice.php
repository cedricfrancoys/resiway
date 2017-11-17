#!/usr/bin/env php
<?php
/**
 Adds a notice prepending newly uploaded documents
*/

use easyobject\orm\ObjectManager as ObjectManager;


// run this script as if it were located in the public folder
chdir('../../public');
set_time_limit(0);

// define Apache user (new pdf pre-pended with notice will have that user as owner)
define('APACHE_USER', 'www-data');

// this utility script uses qinoa library
// and requires file config/config.inc.php
require_once('../qn.lib.php');
require_once('../resi.api.php');
require_once("../vendor/pdf/dompdf/dompdf_config.inc.php");
config\export_config();

set_silent(true);

list($result, $error_message_ids) = [true, []];

try {
    $om = &ObjectManager::getInstance();
    $template = file_get_contents('../private/pdf/notice_template.html');
    
    $ids = $om->search('resilib\Document', ['notice', '=', '0']);
    
    if($ids > 0 && count($ids) > 0) {
        $documents = $om->read('resilib\Document', $ids, ['id', 'lang', 'authors_ids.name', 'title', 'title_url', 'original_url']);
        foreach($documents as $document) {
            // $filename = sprintf("../bin/resilib/Document/content/%011d.%s", $document['id'], $document['lang']);
            $filename = sprintf("../bin/resilib/Document/content/%011d.%s", $document['id'], 'fr');

            // parse template and store result in a temporary file
            $url = "http://resilink.io/document/{$document['id']}/{$document['title_url']}";
            $resilink = "<a href=\"$url\">$url</a>";
            $html = str_replace(
            ['{{author}}', '{{title}}', '{{url-origin}}', '{{resilink}}'],
            [implode(', ', $document['authors_ids.name']), $document['title'], $document['original_url'], $resilink]
            , $template);
            $dompdf = new DOMPDF();
            $dompdf->load_html($html, 'UTF-8');
            $dompdf->set_paper("letter", 'portrait');
            $dompdf->render();

            // remove .orig if it already exists
            if(file_exists($filename.'.orig')) {
                unlink($filename.'.orig');
            }
            
            // rename original file
            rename($filename, $filename.'.orig');
            file_put_contents($filename.'.tmp', $dompdf->output());

            $output = '';
            exec("pdftk \"{$filename}.tmp\" \"{$filename}.orig\" cat output \"{$filename}\" 2>&1", $output);
            chgrp($filename , APACHE_USER);
            chown($filename, APACHE_USER);
            chmod($filename, 0664);

            // delete temporary file
            unlink($filename.'.tmp');
            
            // update document status if no error occured
            if(empty($output)) {
                $om->write('resilib\Document', $document['id'], ['notice' => true]);
            }
        }
    }    
    else {
        $error_message_ids = ['no match'];
    }  
}
catch(Exception $e) {
    $result = $e->getCode();
    $error_message_ids = array($e->getMessage());
}

header('Content-type: application/json; charset=UTF-8');
echo json_encode([
        'result'            => $result, 
        'error_message_ids' => $error_message_ids
    ], 
    JSON_PRETTY_PRINT);