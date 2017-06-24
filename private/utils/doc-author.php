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

set_silent(false);


function extractKeywords($string) {
    $string = HtmlToText::convert($string, false);
    $string = TextTransformer::normalize($string);
    $parts = explode(' ', $string);
    $result = [];
    foreach($parts as $part) {
        if(strlen($part) >= 3) $result[] = substr(TextTransformer::axiomize($part), 0, 32);
    }
    return $result;
}
    

try {
    $om = &ObjectManager::getInstance();
    
    /*
    $authors_ids = $om->search('resiway\Author');    
    $om->read('resiway\Author', $authors_ids, ['name_url']);
    */
    
    // request a batch of 5 non-treateed documents
    // $documents_ids = $om->search('resilib\Document', ['author_id', '=', 0], 'id', 'asc', 0, 5);
    $documents_ids = $om->search('resilib\Document', ['author_id', '=', 0]);    
    if($documents_ids > 0 && count($documents_ids)) {
            resilib\Document::onchangeAuthor($om, $documents_ids, null);
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