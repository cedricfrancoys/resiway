<?php
namespace resilexi;

use resiway\User;

use qinoa\text\TextTransformer;
use qinoa\html\HTMLToText;
use qinoa\pdf\DOMPDF;

class Article extends \easyobject\orm\Object {

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
            
            'title'				    => array('type' => 'string', 'onchange' => 'resilexi\Article::onchangeTitle'),
            
            /* title URL-formatted (for links) */
            'title_url'             => array(
                                        'type'              => 'function',
                                        'result_type'       => 'string',
                                        'store'             => true, 
                                        'function'          => 'resilexi\Article::getTitleURL'
                                       ),
            /* original author of the article, if any */                                       
            'source_author'         => array('type' => 'string'),
            /* original location of the article, if any */
            'source_url'            => array('type' => 'string'),
            /* licensing of the original article, if any */            
            'source_license'        => array('type' => 'string'),            
                      
            /* language into which the article is written */
            'lang'			        => array('type' => 'string'),
            
            /* channel of the current article ('default', 'help', 'meta', ...) */
            'channel_id'            => array('type' => 'many2one', 'foreign_object'=> 'resiway\Channel'),
                        
            /* complete content of the article */
            'content'			    => array('type' => 'html', 'onchange' => 'resilexi\Article::onchangeContent'),

            /* auto-generated article summary */
            'content_excerpt'       => array(
                                        'type'              => 'function',
                                        'result_type'       => 'short_text',
                                        'store'             => true, 
                                        'function'          => 'resilexi\Article::getContentExcerpt'
                                       ),                  

            'categories'    	    => array(
                                        'type'              => 'many2many', 
                                        'foreign_object'    => 'resiway\Category', 
                                        'foreign_field'     => 'articles_ids', 
                                        'rel_table'         => 'resilexi_rel_article_category', 
                                        'rel_foreign_key'   => 'category_id', 
                                        'rel_local_key'     => 'article_id'
                                       ),

            /* does current article need to be (re-)indexed */
            'indexed'               => array('type' => 'boolean'),

            /* number of times this article has been displayed */
            'count_views'			=> array('type' => 'integer'),

            /* number of times this article has been downloaded */
            'count_downloads'		=> array('type' => 'integer'),
           
            /* number of times this article has been voted (up and down) */
            'count_votes'			=> array('type' => 'integer'),

            /* number of times this article has been marked as favorite */
            'count_stars'			=> array('type' => 'integer'),
            
            /* number of times a flag has been raised for this article */
            'count_flags'			=> array('type' => 'integer'),

            /* number of articles pointing back to current article (reverse 'related_articles_ids') */
            'count_links'	        => array('type' => 'integer'),   
            
            /* resulting score based on vote_up and vote_down actions */            
            'score'			        => array('type' => 'integer'),

            /* identifiers of the comments for this article */                                        
            'comments'              => array(
                                        'type'		    => 'one2many', 
                                        'foreign_object'=> 'resilexi\ArticleComment', 
                                        'foreign_field'	=> 'article_id'
                                        ),

            /* list of keywords indexes related to this article */
            'indexes_ids'	        => array(
                                        'type' 			    => 'many2many', 
                                        'foreign_object'	=> 'resiway\Index', 
                                        'foreign_field'		=> 'articles_ids', 
                                        'rel_table'		    => 'resiway_rel_index_article', 
                                        'rel_foreign_key'	=> 'index_id', 
                                        'rel_local_key'		=> 'article_id'
                                       )
                                        
        );
    }

    public static function getConstraints() {
        return [];
    }
    
    public static function getDefaults() {
        return array(
             'indexed'          => function() { return false; },
             'lang'             => function() { return 'fr'; },
             'channel_id'       => function() { return 1; },
             'editor'           => function() { return 0; },
             'count_views'      => function() { return 0; },
             'count_votes'      => function() { return 0; },
             'count_stars'      => function() { return 0; },
             'count_flags'      => function() { return 0; },
             'count_links'      => function() { return 0; },
             'score'            => function() { return 0; },             
        );
    }

    public static function searchByIndexes() {
        
    }
    
    public static function onchangeContent($om, $oids, $lang) {
        // force re-compute content_excerpt
        $om->write(__CLASS__, $oids, ['content_excerpt' => null, 'indexed' => false], $lang);
    }

    // Returns excerpt of the content of max 200 chars cutting on a word-basis
    public static function getContentExcerpt($om, $oids, $lang) {
        $result = [];
        $res = $om->read(__CLASS__, $oids, ['content']);
        foreach($res as $oid => $odata) {
            $result[$oid] = TextTransformer::excerpt(HTMLToText::convert($odata['content'], false), RESILEXI_ARTICLE_CONTENT_EXCERPT_LENGTH_MAX);
        }
        return $result;        
    }    
   
    public static function onchangeTitle($om, $oids, $lang) {
        // force re-compute title_url and re-indexing the article
        $om->write(__CLASS__, $oids, ['title_url' => null, 'indexed' => false], $lang);
    }    
        
    public static function getTitleURL($om, $oids, $lang) {
        $result = [];
        $res = $om->read(__CLASS__, $oids, ['title']);
        foreach($res as $oid => $odata) {
            // note: final format will be: #/article/{id}/{title}
            $result[$oid] = TextTransformer::slugify($odata['title']);
        }
        return $result;        
    }
   
   
    /**
    * Converts a list of articles to a JSON structure matching JSON API RFC7159 specifications
    * content-type: application/vnd.api+json
    * 
    */    
    public static function toJSONAPI($om, $oids, $meta) {
        $result = [];
        $included = [];
        
        $articles = $om->read(__CLASS__, $oids, [
                                                    'creator'        => User::getPublicFields(), 
                                                    'categories'     => ['id', 'title', 'path', 'parent_path', 'description'],
                                                    'created', 
                                                    'title', 
                                                    'title_url', 
                                                    'content_excerpt', 
                                                    'score', 
                                                    'count_views', 
                                                    'count_votes'
                                                ]);
                  
        // build JSON object
        foreach($articles as $id => $article) {
            $author_id = $article['creator']['id'];
            unset($article['creator']['id']);
            if(!isset($included['creator_'.$author_id])) {
                $included['creator_'.$author_id] = ['type' => 'people', 'id' => $author_id, 'attributes' => (object) $article['creator']];
            }        
            foreach($article['categories'] as $category) {
                $category_id = $category['id'];
                unset($category['id']);
                if(!isset($included['category_'.$category_id])) {
                    $included['category_'.$category_id] = ['type' => 'category', 'id' => $category_id, 'attributes' => (object) $category];
                }        
            }
            $categories = array_values($article['categories']);
            unset($article['id']);        
            unset($article['creator']);        
            unset($article['categories']);
            $result[] = [
                'type'          => 'article', 
                'id'            => $id, 
                'attributes'    => (object) $article, 
                'relationships' => (object) [
                    'creator'       => (object)['data' => (object)['type' => 'people', 'id' => $author_id]],
                    'categories'    => (object)['data' => array_map(function($a) {return (object)['id'=>$a['id'], 'type'=>'category'];}, $categories)]
                ]
            ];       
        }
        ksort($included);
        return json_encode(array_merge(
            ['jsonapi'   => (object) ['version' => '1.0'] ],
            $meta,
            [
                'data'      => $result,
                'included'  => array_values($included)
            ]
        ), JSON_PRETTY_PRINT);
    }

    /** 
    * Serve a static HTML version of a single article object
    *
    */
// todo : include CSS styling / HTML templating    
    public static function toHTML($om, $oid) {
        $html = [];

        $articles = $om->read(__CLASS__, $oid, ['id', 'creator', 'created', 'editor', 'edited', 'modified', 'title', 'title_url', 'content', 'content_excerpt', 'count_views', 'count_votes', 'score', 'categories_ids.title']);
        if($articles > 0 && isset($articles[$oid])) {

            $odata = $articles[$oid];

            $html[] = '<!DOCTYPE html>'.PHP_EOL;
            $html[] = '<html lang="'.$odata['lang'].'">'.PHP_EOL;
            $html[] = '<head>'.PHP_EOL;    
            $html[] = '<meta charset="utf-8">'.PHP_EOL;
            $html[] = '<meta name="title" content="'.$odata['title'].' - ResiLexi - Tous les thèmes de la résilience">'.PHP_EOL;
            $html[] = '<meta name="description" content="'.$odata['content_excerpt'].'">'.PHP_EOL;
            $html[] = '</head>'.PHP_EOL;
            $html[] = '<body>'.PHP_EOL;
        
            $html[] = '<div class="article wrapper"';
            $html[] = '   itemscope=""';
            $html[] = '   itemtype="https://schema.org/Article">';

            $html[] = '<h1 itemprop="name">'.$odata['title'].'</h1>';
            $html[] = '<div itemprop="upvoteCount">'.$odata['score'].'</div>';
            $html[] = '<div itemprop="text">'.$odata['content'].'</div>';
            $html[] = '<div itemprop="dateCreated">'.$odata['created'].'</div>';        
            $html[] = '<div itemprop="dateModified">'.$odata['modified'].'</div>';                

            foreach($odata['categories_ids.title'] as $category) {
                $html[] = '<h2>'.$category.'</h2>';
            }
            

            $html[] = '</div>';
            $html[] = '</body>'.PHP_EOL;        
            $html[] = '</html>'.PHP_EOL;
        }
        return implode(PHP_EOL, $html);
    }
    
    /** 
    * Serve a PDF version of a single article object
    *
    */
    public static function toPDF($om, $oid) {
        $result = null;
        $html = self::toHTML($om, $oid);
        if(strlen($html) > 0) {
            $dompdf = new DOMPDF();
            $dompdf->load_html($html, 'UTF-8');
            $dompdf->set_paper("letter", 'portrait');
            $dompdf->render();	
            $result = $dompdf->output();
        }
        return $result;
    }   
    
}