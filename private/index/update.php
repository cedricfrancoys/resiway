#!/usr/bin/env php
<?php
/**
 Tells indexer to update non-indexed questions
*/
use easyobject\orm\ObjectManager as ObjectManager;
use html\HtmlToText as HtmlToText;
use qinoa\text\TextTransformer as TextTransformer;

// run this script as if it were located in the public folder
chdir('../../public');
set_time_limit(0);

// this utility script uses qinoa library
// and requires file config/config.inc.php
require_once('../qn.lib.php');



list($result, $error_message_ids) = [true, []];

set_silent(true);


function extractKeywords($string) {
    $string = HtmlToText::convert($string, false);
    $string = TextTransformer::normalize($string);
    $parts = explode(' ', $string);
    $result = [];
    foreach($parts as $part) {
        // index keywords from 3 chars and on
        if(strlen($part) >= 3) $result[] = substr(TextTransformer::axiomize($part), 0, 32);
    }
    return $result;
}
    

try {
    $om = &ObjectManager::getInstance();
    /*
        object_class used here are expected to have 'indexes_ids' and 'indexed' fields
    */
    $batches = [
        'resiexchange\Question'     => ['title', 'content', 'answers_ids.content', 'categories_ids.title'],
        'resilib\Document'          => ['author', 'title', 'description', 'categories_ids.title']
    ];
    
    foreach($batches as $object_class => $object_fields) {
        // request a batch of 5 non-indexed questions
        $objects_ids = $om->search($object_class, ['indexed', '=', 0], 'id', 'asc', 0, 5);
        if($objects_ids > 0 && count($objects_ids)) {
            foreach($objects_ids as $object_id) {
                // retrieve keywords from question
                $res = $om->read($object_class, $object_id, $object_fields);
                $keywords = [];
                foreach($res as $oids => $odata) {
                    foreach($odata as $name => $value) {
                        // handle all fields as arrays of strings
                        if(!is_array($value)) $value = (array) $value;
                        foreach($value as $key => $str) {
                            $keywords = array_merge($keywords, extractKeywords($str));
                        }
                    }
                }
             
                // compose list of hash-codes to query the database
                $hash_list = [];
                $indexes_ids = [];
                // we have all words related to the question :
                $db = $om->getDBHandler();
                // make sure all words are in the index
                foreach($keywords as $keyword) {
                    // get a 64-bits unsigned integer hash from keyword
                    $hash = TextTransformer::hash($keyword);
                    if(in_array($hash, $hash_list)) continue;
                    $hash_list[] = $hash;
                    // we treat hash as a string in case PHP engine does not handle 20 digits numbers 
                    // we expect SQL to deal with the conversion
                    $res = $om->search('resiway\Index', ['hash', 'like', $hash]);
                    // skip index if already exists
                    if($res > 0 && count($res) > 0) {
                        $indexes_ids[] = $res[0];
                        continue;
                    }
                    $new_id = $om->create('resiway\Index', ['hash' => $hash, 'value' => $keyword]);
                    if($new_id > 0) {
                        $indexes_ids[] = $new_id;
                    }
                }
                
                // add related indexes to the given object and mark it as  question indexed 
                $om->write($object_class, $object_id, ['indexes_ids' => $indexes_ids, 'indexed' => true]);
            }
        }
    }
    

    /*
    // request a batch of 5 non-indexed documents
    $documents_ids = $om->search('resilib\Document', ['indexed', '=', 0], 'id', 'asc', 0, 5);
    if($documents_ids > 0 && count($documents_ids)) {
        foreach($documents_ids as $id) {
            // retrieve keywords from document
            $res = $om->read('resilib\Document', $id, ['author', 'title', 'description', 'categories_ids.title']);
            $keywords = [];
            foreach($res as $oids => $odata) {
                foreach($odata as $name => $value) {
                    if(!is_array($value)) $value = (array) $value;
                    foreach($value as $key => $str) {
                        $keywords = array_merge($keywords, extractKeywords($str));
                    }
                }
            }
         
            // compose list of hash-codes to query the database
            $hash_list = [];
            // we have all words related to the document :
            $db = $om->getDBHandler();
            // make sure all words are in the index
            foreach($keywords as $keyword) {
                // get a 64-bits unsigned integer hash from keyword
                $hash = TextTransformer::hash($keyword);
                if(in_array($hash, $hash_list)) continue;
                $hash_list[] = $hash;
                // $db->addRecords('resiway_index', ['hash', 'value'], [[$hash, $keyword]]);
                $db->sendQuery( 
                    "INSERT INTO `resiway_index` (`hash`, `value`) SELECT $hash, '$keyword' FROM DUAL
                    WHERE NOT EXISTS(SELECT `hash`, `value` FROM `resiway_index` WHERE `hash` = $hash AND `value` = '$keyword');"
                    );
            }
            
            // obtain related ids of index entries to add to document
            $res = $db->sendQuery("SELECT id FROM `resiway_index` WHERE hash in ('".implode("','", $hash_list)."');");
            $index_ids = [];
            while($row = $db->fetchArray($res)) {
                $index_ids[] = $row['id'];
            }

            // add them to the index for given question
            $index_values = array_map(function ($a) use($id) { return [$id, $a]; }, $index_ids);  
            $db->addRecords('resiway_rel_index_document', ['document_id', 'index_id'], $index_values);
            
            // update question indexed status
            $om->write('resilib\Document', $id, ['indexed' => true]);  
        }
    }
*/    
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