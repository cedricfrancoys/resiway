<?php
// Dispatcher (index.php) is in charge of setting the context and should include easyObject library
defined('__QN_LIB') or die(__FILE__.' cannot be executed directly.');
require_once('../resi.api.php');

use config\QNLib as QNLib;
use easyobject\orm\ObjectManager as ObjectManager;

// force silent mode (debug output would corrupt json data)
set_silent(true);

// announce script and fetch parameters values
$params = QNLib::announce(	
	array(	
    'description'	=>	"Returns a fully-loaded object",
    'params' 		=>	array(
                        'class'	        => array(
                                            'description'   => 'Pseudo class of the object to retrieve (article, document, question, answer, category, user).',
                                            'type'          => 'string', 
                                            'required'      => true
                                            ),        
                        'id'	        => array(
                                            'description'   => 'Identifier of the object to retrieve.',
                                            'type'          => 'integer', 
                                            'required'      => true
                                            ),
                        'download'	    => array(
                                            'description'   => 'Flag to force download',
                                            'type'          => 'boolean', 
                                            'default'       => false
                                            ),
                        'view'	        => array(
                                            'description'   => 'Flag to force online display',
                                            'type'          => 'boolean', 
                                            'default'       => true
                                            )
                        )
	)
);


list($result, $error_message_ids) = [true, []];

list($object_pseudo_class, $object_id) = [$params['class'], $params['id']];   

try {
    $om = &ObjectManager::getInstance();
    
    // resolve object class
    $object_class = ResiAPI::resolvePseudoClass($object_pseudo_class);
    if(!$object_class) throw new Exception('unknown class', QN_ERROR_INVALID_PARAM);
    
    // resovle action
    $actions_names = [ 
        'article'   => 'resilexi_article_download',
        'document'  => 'resilib_document_download',
        'question'  => 'resiexchange_question_download'
    ];
    if(!isset($actions_names[$object_pseudo_class])) throw new Exception('unknown action', QN_ERROR_INVALID_PARAM);
    $action_name = $actions_names[$object_pseudo_class];

    // read all required data at once
    $objects = $om->read($object_class, $object_id, ['count_downloads', 'title_url', 'content']);      
    $object = $objects[$object_id];
    
    // increment count-download
    if(ResiAPI::userId() == 0) {
        // (we don't call the performAction method since the user is unidentified
        $objects = $om->read($object_class, $object_id, ['count_downloads']);  
        // update document downloads count
        $om->write($object_class, $object_id, [
                    'count_downloads' => $objects[$object_id]['count_downloads']+1
                  ]);
    }
    else {            
        $result = ResiAPI::performAction(
            $action_name,                                               // $action_name
            $object_class,                                              // $object_class
            $object_id,                                                 // $object_id
            ['count_downloads'],                                        // $object_fields
            false,                                                      // $toggle
            function ($om, $user_id, $object_class, $object_id) {       // $do
                $objects = $om->read($object_class, $object_id, ['count_downloads']);  
                // update document downloads count
                $om->write($object_class, $object_id, [
                            'count_downloads' => $objects[$object_id]['count_downloads']+1
                          ]);                    
                return true;
            },
            function ($om, $user_id, $object_class, $object_id) {       // $undo
            }
        );
    }
    
    // retrieve PDF content
    $pdf_content = $object_class::toPDF($om, $object_id);
    
    // output headers according to URL params
    // force view
    if($params['view']) {        
        header("Content-Disposition: inline; filename=".$object['title_url'].".pdf;");    
        header("Content-Type: application/pdf");
        header("Content-Length: ".strlen($pdf_content));
    }
    // force download
    else {    
        // disable compression whatever default option is
        ini_set('zlib.output_compression','0');
        // tell the browser to download resource
        header("Content-Description: File Transfer");
        header("Content-Disposition: attachment; filename=".$object['title_url'].".pdf;");
        header("Content-Transfer-Encoding: binary");
        header("Pragma: public");
        header("Expires: 0");
        header("Cache-Control: must-revalidate, post-check=0, pre-check=0");
        header("Cache-Control: public");
        header("Content-Type: application/pdf");
        header("Content-Length: ".strlen($pdf_content));
    }
    // output PDF content
    print($pdf_content);    
}
catch(Exception $e) {
    $result = $e->getCode();
    $error_message_ids = array($e->getMessage());
    // send json result
    header('Content-type: application/json; charset=UTF-8');
    echo json_encode([
                        'result'            => $result, 
                        'error_message_ids' => $error_message_ids
                     ], 
                     JSON_PRETTY_PRINT);    
}