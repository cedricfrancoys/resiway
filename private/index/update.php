#!/usr/bin/env php
<?php
use easyobject\orm\ObjectManager;
use qinoa\text\TextTransformer;
use resiway\Index;
use config\QNlib;


// run this script as if it were located in the public folder
chdir('../../public');
set_time_limit(0);

// this utility script uses qinoa library
// and requires file config/config.inc.php
require_once('../qn.lib.php');



// announce script and fetch parameters values
$params = QNLib::announce(	
	array(	
    'description'	=>	"Tells indexer to update non-indexed objects",
    'params' 		=>	array(                                         
                        'size'		=> array(
                                            'description'   => 'Amount of objects to index for each batch',
                                            'type'          => 'integer',
                                            'default'       => 5
                                            ),
                        'flush'	    => array(
                                            'description'   => 'Token to search among the articles',
                                            'type'          => 'boolean',
                                            'default'       => false
                                            )                                            
                        )
	)
);

list($result, $error_message_ids) = [true, []];

set_silent(true);


try {
    
    $om = &ObjectManager::getInstance();
    // we have all words related to the question :
    $db = $om->getDBHandler();    
    
    // Define target fields and related content to index
    $batches = [
        'questions_ids'     => ['title', 'content', 'answers_ids.content', 'categories_ids.title'],
        'documents_ids'     => ['authors_ids.name', 'title', 'description', 'categories_ids.title'],
        'articles_ids'      => ['title', 'content', 'categories.title']        
    ];
    $schema = $om->getObjectSchema('resiway\Index');
    
    foreach($batches as $index_field => $object_fields) {
        // object_class used here are expected to have 'indexes_ids' and 'indexed' fields
        $object_class = $schema[$index_field]['foreign_object'];
        $object_table = $schema[$index_field]['rel_table'];
        $object_field = $schema[$index_field]['rel_foreign_key'];

        // request a batch of 5 non-indexed questions
        $objects_ids = $om->search($object_class, ['indexed', '=', 0], 'id', 'asc', 0, $params['size']);
        if($objects_ids > 0 && count($objects_ids)) {

            
            foreach($objects_ids as $object_id) {
                // 0) reset : empty index lines related to that object
                $db->sendQuery("DELETE FROM $object_table where `$object_field` = $object_id;");
             
                // 1) retrieve keywords from object
                $res = $om->read($object_class, $object_id, $object_fields);
                $words = [];
                foreach($res as $oids => $odata) {
                    foreach($odata as $field => $value) {
                        $words[$field] = [];
                        // handle all fields as arrays of strings
                        if(!is_array($value)) $value = (array) $value;
                        foreach($value as $key => $str) {
                            // $keywords = array_merge($keywords, extractKeywords($str));
                            $words[$field] = array_merge($words[$field], Index::extractKeywords($str));
                        }
                    }
                }
                
                // 2) index all words
                foreach($words as $field => $keywords) {
                    $indexes_ids = [];
                    // compose list of hash-codes to query the database
                    // make sure all words are in the index for related tuple (object, field)
                    foreach($keywords as $keyword) {
                        // get a 64-bits unsigned integer hash from keyword
                        $hash = TextTransformer::hash($keyword);
                        // we treat hash as a string in case PHP engine does not handle 20 digits numbers 
                        // we expect SQL to deal with the conversion
                        // $res = $om->search('resiway\Index', ['hash', '=', $hash]); // unexpected behavior !
                        $res = Index::searchByHash($om, $hash);
                        // skip index if already exists
                        if($res > 0 && count($res)) {
                            $index_id = $res[0];
                            $indexes_ids[$index_id] = (isset($indexes_ids[$index_id]))?$indexes_ids[$index_id]+1:1;
                            continue;
                        }
                        // create a new index entry
                        // $new_id = $om->create('resiway\Index', ['hash' => $hash, 'value' => $keyword]); // unexpected behavior !                        
                        $db->sendQuery("INSERT IGNORE INTO `resiway_index` (`created`, `modified`, `state`, `hash`, `value`) VALUES (NOW(), NOW(), 'instance', $hash, '$keyword');");
                        $new_id = $db->getLastId();
                        if($new_id > 0) {
                            $indexes_ids[$new_id] = 1;
                        }
                    }

                    // build query
                    $lines = [];
                    foreach($indexes_ids as $index_id => $count) {
                        $lines[] = "($index_id, $object_id, '$field', $count)";
                    }
                    if(count($lines)) {
                        $db->sendQuery("INSERT IGNORE INTO $object_table (`index_id`, `$object_field`, `field`, `count`) values ".implode(',', $lines).";");                    
                    }
                }
                
                // 3) mark object as indexed
                $om->write($object_class, $object_id, ['indexed' => true]);
            }
            
        }
    }
       
}
catch(Exception $e) {
    $result = $e->getCode();
    $error_message_ids = array($e->getMessage());
}

// send json result
echo json_encode([
        'result'            => $result, 
        'error_message_ids' => $error_message_ids
    ], 
    JSON_PRETTY_PRINT);