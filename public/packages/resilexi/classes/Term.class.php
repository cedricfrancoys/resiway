<?php
namespace resilexi;

use resiway\User;

use qinoa\text\TextTransformer;

class Term extends \easyobject\orm\Object {

    public static function getColumns() {
        return array(
            /* all objects must define a 'name' column (default is id) */
            'name'				    => array('type' => 'alias', 'alias' => 'title'),

            /* override default creator field to make it explicitly point to resiway\User objects */
            'creator'				=> array('type' => 'many2one', 'foreign_object'=> 'resiway\User'),
            
            /* identifier of the last user to edit the article.
            (we need this field to make a distinction with ORM writes using special field 'modifier' */
            'editor'				=> array('type' => 'many2one', 'foreign_object'=> 'resiway\User'),

            /* last time article was edited.
            (we need this field to make a distinction with ORM writes using special field 'modified' */
            'edited'				=> array('type' => 'datetime'),
            
            'title'				    => array('type' => 'string', 'onchange' => 'resilexi\Term::onchangeTitle'),
            
            /* title URL-formatted (for links) */
            'title_url'             => array(
                                        'type'              => 'function',
                                        'result_type'       => 'string',
                                        'store'             => true, 
                                        'function'          => 'resilexi\Term::getTitleURL'
                                       ),
                      
            /* language of the term */
            'lang'			        => array('type' => 'string'),
            
            'count_articles'        => array(
                                        'type'          => 'function',                                    
                                        'result_type'   => 'integer',
                                        'store'         => true, 
                                        'function'      => 'resilexi\Term::getCountArticles'                                    
                                       ),

            'articles'  	        => array(
                                        'type'              => 'one2many', 
                                        'foreign_object'    => 'resilexi\Article',
                                        'foreign_field'     => 'term'
                                       )

            

                                        
        );
    }

    public static function getConstraints() {
        return [
				'title'		    => array(
									'error_message_id' => 'invalid_length_title',
									'function' => function ($title) {
                                            $len = strlen($title);
											return (bool) ($len >= RESILEXI_ARTICLE_TITLE_LENGTH_MIN && $len <= RESILEXI_ARTICLE_TITLE_LENGTH_MAX);
										}
									)
			];        
    }
    
    public static function getDefaults() {
        return array(
             'lang'             => function() { return 'fr'; },
             'editor'           => function() { return 0; },
             'count_articles'   => function() { return 0; }
        );
    }

   
    public static function onchangeTitle($om, $oids, $lang) {
        // force re-compute title_url and re-indexing the article
        $om->write(__CLASS__, $oids, ['title_url' => null], $lang);
        $articles_ids = [];        
        $res = $om->read(__CLASS__, $oids, ['articles'], $lang);
        foreach($res as $oid => $odata) {
            $articles_ids = array_merge($articles_ids, $odata['articles']);
        }
        Article::onchangeTerm($om, $articles_ids, $lang);
        // recompute title_url and all related articles
        $om->read(__CLASS__, $oids, ['title_url', 'articles' => ['title', 'title_url']], $lang);
    }    
        
    public static function getTitleURL($om, $oids, $lang) {
        $result = [];
        $res = $om->read(__CLASS__, $oids, ['title']);
        foreach($res as $oid => $odata) {
            // note: final format will be: #/article/{title}
            $result[$oid] = TextTransformer::slugify($odata['title']);
        }
        return $result;        
    }
    
    public static function getCountArticles($om, $oids, $lang) {
        $result = [];
        $res = $om->read(__CLASS__, $oids, ['articles']);
        foreach($res as $oid => $odata) {
            $result[$oid] = count($odata['articles']);
        }
        return $result;
    }    
    
}