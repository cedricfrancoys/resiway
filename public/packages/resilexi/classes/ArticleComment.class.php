<?php
namespace resilexi;

class ArticleComment extends \easyobject\orm\Object {

    public static function getColumns() {
        return array(
            /* all objects must define a 'name' column (default is id) */
            'name'				=> array(
                                        'type'              => 'function',
                                        'result_type'       => 'string', 
                                        'store'             => false,
                                        'function'          => 'resilexi\ArticleComment::getName'
                                        ),  

            /* override default creator field to make it explicitly point to resiway\User objects */
            'creator'			=> array('type' => 'many2one', 'foreign_object'=> 'resiway\User'),
                                        
            /* text of the comment */
            'content'			=> array('type' => 'text'),
            
            'article_id'        => array('type' => 'many2one', 'foreign_object' => 'resilexi\Article'),
            
            'score'             => array('type' => 'integer'),
            
            'count_flags'       => array('type' => 'integer')            
        );
    }
    
    public static function getDefaults() {
        return array(        
             'score'            => function() { return 0; },
             'count_flags'      => function() { return 0; },             
        );
    }

    public static function getName($om, $oids, $lang) {
        $result = [];
        $res = $om->read(__CLASS__, $oids, ['article_id']);
        $articles_ids = array_map(function($a){return $a['article_id'];}, $res);
        $articles = $om->read('resilexi\Article', $articles_ids, ['title']);
        foreach($res as $oid => $odata) {
            $result[$oid] = $articles[$odata['article_id']]['title'];
        }
        return $result;        
    }
    
}