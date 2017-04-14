<?php

require_once('resilib.api.php');


// announce script and fetch parameters values
$params = announce([
    'description'	=>	"Forces the browser to download the specified pdf document.",
    'params' 		=> [
            'id'    => [
                        'description' => 'Identifier of the document to download.',
                        'type' => 'string',
                        'required' => true
                    ],      
    ]
]);


document_exists($params['id']) or die("unexistent document");

$filepath = HOME_DIR.'documents/'.$params['id']."/document.pdf";
//$doc_meta = get_document_meta($params['id']);

// disable compression whatever default option is
ini_set('zlib.output_compression','0');

// tell the browser to download resource
header("Content-Description: File Transfer");
header("Content-Disposition: attachment; filename=".$params['id'].".pdf;");
header("Content-Transfer-Encoding: binary");

header("Pragma: public");
header("Expires: 0");
header("Cache-Control: must-revalidate, post-check=0, pre-check=0");
header("Cache-Control: public");
header("Content-Type: application/pdf");
header("Content-Length: ".filesize($filepath));

@readfile($filepath);