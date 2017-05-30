<?php
// Dispatcher (index.php) is in charge of setting the context and should include easyObject library
defined('__QN_LIB') or die(__FILE__.' cannot be executed directly.');
require_once('../resi.api.php');

require_once('../../resilib/data/resilib.api.php');

use config\QNLib as QNLib;
use easyobject\orm\ObjectManager as ObjectManager;

set_silent(false);

$params = announce([
    'description'	=>	"Returns the categories values of the specified fields for the given objects ids.",
    'params' 		=>	[
            'root'	    =>  [
                        'description' => 'Root category to start from.',
                        'type' => 'string',
                        'default' => ''
                        ],
            'recurse'   =>  [
                        'description' => 'Recurse through all sub-categories.',
                        'type' => 'boolean',
                        'default' => true
                        ],
            'lang'		=>  [
                        'description' => 'Language in which to return categories titles.',
                        'type' => 'string', 
                        'default' => 'fr'
                        ]
    ]
]);



$con = mysqli_connect('localhost','root','','resiway');
mysqli_query($con, "SET NAMES 'utf8'");

$documents = get_documents();

$i = 1;

foreach($documents as $document) {

  
    $thumbnail_file = 'C:/DEV/wamp/www/resilib/data/documents/'.$document.'/thumbnail.jpg';
    $document_file = 'C:/DEV/wamp/www/resilib/data/documents/'.$document.'/document.pdf';    
    
    if(!file_exists($thumbnail_file)) {
        echo 'Error: file not found';
        ++$i;
        continue;
    }
    
    $content = file_get_contents($thumbnail_file);
    $pdf_content = file_get_contents($document_file);
    $doc_hash = md5($pdf_content).'.pdf';
    
    $filename = md5($content).'.jpg';

    copy($thumbnail_file, 'C:/DEV/wamp/www/resiway/bin/'.$filename);
    

    $query = "update `resilib_document` set `thumbnail` = '$filename' where content = '$doc_hash';";
    mysqli_query($con, $query);

    ++$i;
}

mysqli_close($con);