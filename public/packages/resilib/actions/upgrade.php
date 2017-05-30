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


try {
    $con = mysqli_connect('localhost','root','','resiway');
    mysqli_query($con, "SET NAMES 'utf8'");
      
    $query = "select * from `resilib_document`;";
    $handle = mysqli_query($con, $query);

    while($row = mysqli_fetch_array($handle)) {
        if($row['id'] == 112) continue;
        $file_content = $row['content'];
        $file_thumbnail = $row['thumbnail'];


        $file = sprintf("%011d.%s", $row['id'], 'fr');                       

        
        $content = file_get_contents(FILE_STORAGE_DIR.'/'.$file_content);
        $path = 'resilib/document/content';                
        $filename = md5($content).'.pdf';
        rename(FILE_STORAGE_DIR.'/'.$filename, FILE_STORAGE_DIR.'/'.$path.'/'.$file);

        $query = "update `resilib_document` set `content` = '{$path}/{$file}' where `id` = '{$row['id']}';";
        mysqli_query($con, $query);

        
        $thumbnail = file_get_contents(FILE_STORAGE_DIR.'/'.$file_thumbnail);
        $path = 'resilib/document/thumbnail';                
        $filename = md5($thumbnail).'.jpg';
        rename(FILE_STORAGE_DIR.'/'.$filename, FILE_STORAGE_DIR.'/'.$path.'/'.$file);
        
        $query = "update `resilib_document` set `thumbnail` = '{$path}/{$file}' where `id` = '{$row['id']}';";
        mysqli_query($con, $query);
        
    }

    mysqli_close($con);

}
catch(Exception $e) {
    die('error loading categories');
}













    
    
