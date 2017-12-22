<?php
namespace resilib;

use resiway\User;

use qinoa\text\TextTransformer;
use qinoa\html\HTMLToText;

class Document extends \easyobject\orm\Object {

    public static function getColumns() {
        return array(
            /* all objects must define a 'name' column (default is id) */
            'name'				    => array('type' => 'alias', 'alias' => 'title'),

            /* override default creator field to make it explicitly point to resiway\User objects */
            'creator'				=> array('type' => 'many2one', 'foreign_object'=> 'resiway\User'),
            
            /* identifier of the last user to edit the document.
            (we need this field to make a distinction with ORM writes using special field 'modifier' */
            'editor'				=> array('type' => 'many2one', 'foreign_object'=> 'resiway\User'),

            /* last time document was edited.
            (we need this field to make a distinction with ORM writes using special field 'modified' */
            'edited'				=> array('type' => 'datetime'),
            
            'title'				    => array('type' => 'string', 'onchange' => 'resilib\Document::onchangeTitle'),
            
            /* title URL-formatted (for links) */
            'title_url'             => array(
                                        'type'              => 'function',
                                        'result_type'       => 'string',
                                        'store'             => true, 
                                        'function'          => 'resilib\Document::getTitleURL'
                                       ),
                                                  
            'authors_ids'	        => array(
                                        'type'              => 'many2many', 
                                        'foreign_object'    => 'resiway\Author', 
                                        'foreign_field'     => 'documents_ids', 
                                        'rel_table'         => 'resilib_rel_document_author', 
                                        'rel_foreign_key'   => 'author_id', 
                                        'rel_local_key'     => 'document_id',
                                        'onchange'          => 'resilib\Document::onchangeAuthorsIds'
                                       ),
            
            /* language into which the document is written */
            'lang'			        => array('type' => 'string'),
            
            /* channel of the current question ('default', 'help', 'meta', ...) */
            'channel_id'            => array('type' => 'many2one', 'foreign_object'=> 'resiway\Channel'),
            
            'last_update'		    => array('type' => 'date'),				
            
            'description'		    => array('type' => 'html', 'onchange' => 'resilib\Document::onchangeDescription'),

            'content_excerpt'       => array(
                                        'type'              => 'function',
                                        'result_type'       => 'text',
                                        'store'             => true, 
                                        'function'          => 'resilib\Document::getContentExcerpt'
                                       ),
            
            'thumbnail'			    => array('type' => 'file'),
            
            'pages'				    => array('type' => 'integer'),
                            
            'license'			    => array('type' => 'string'),
            
            /* original location of the document */
            'original_url'		    => array('type' => 'string'),
            
            'content'			    => array('type' => 'file', 'onchange' => 'resilib\Document::onchangeContent'),
            
            'content_type'		    => array('type' => 'string'),
            
            'size'				    => array('type' => 'integer'),
            
            'original_filename'     => array('type' => 'string'),            

            'categories_ids'	    => array(
                                        'type'              => 'many2many', 
                                        'foreign_object'    => 'resiway\Category', 
                                        'foreign_field'     => 'documents_ids', 
                                        'rel_table'         => 'resilib_rel_document_category', 
                                        'rel_foreign_key'   => 'category_id', 
                                        'rel_local_key'     => 'document_id'
                                       ),

            'categories'		    => array('type' => 'alias', 'alias' => 'categories_ids'),                                       

            /* does current document need to be (re-)indexed */
            'indexed'               => array('type' => 'boolean'),

            /* has resiway notice been already appened ? */
            'notice'                => array('type' => 'boolean'),
            
            /* number of times this document has been displayed */
            'count_views'			=> array('type' => 'integer'),

            /* number of times this document has been downloaded */
            'count_downloads'		=> array('type' => 'integer'),
            
            /* number of times this document has been voted (up and down) */
            'count_votes'			=> array('type' => 'integer'),

            /* number of times this document has been marked as favorite */
            'count_stars'			=> array('type' => 'integer'),
            
            /* number of times a flag has been raised for this document */
            'count_flags'			=> array('type' => 'integer'),

            /* number of documents pointing back to current document (reverse 'related_documents_ids') */
            'count_links'	        => array('type' => 'integer'),   
            
            /* resulting score based on vote_up and vote_down actions */            
            'score'			        => array('type' => 'integer'),

            /* identifiers of the comments for this document */                                        
            'comments_ids'          => array(
                                        'type'		    => 'one2many', 
                                        'foreign_object'=> 'resilib\DocumentComment', 
                                        'foreign_field'	=> 'document_id'
                                        ),

            /* list of keywords indexes related to this document */
            'indexes_ids'	        => array(
                                        'type' 			    => 'many2many', 
                                        'foreign_object'	=> 'resiway\Index', 
                                        'foreign_field'		=> 'documents_ids', 
                                        'rel_table'		    => 'resiway_rel_index_document', 
                                        'rel_foreign_key'	=> 'index_id', 
                                        'rel_local_key'		=> 'document_id'
                                       )
                                        
        );
    }

    public static function getConstraints() {
        return array(
            'original_url'		=> array(
                                    'error_message_id' => 'invalid_url',
                                    'function' => function ($url) {
                                        if(!strlen($url)) return true;
                                        // Diego Perini posted this version as a gist (https://gist.github.com/729294) :
                                        $url_regex = '_^(?:(?:https?|ftp)://)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\x{00a1}-\x{ffff}0-9]+-?)*[a-z\x{00a1}-\x{ffff}0-9]+)(?:\.(?:[a-z\x{00a1}-\x{ffff}0-9]+-?)*[a-z\x{00a1}-\x{ffff}0-9]+)*(?:\.(?:[a-z\x{00a1}-\x{ffff}]{2,})))(?::\d{2,5})?(?:/[^\s]*)?$_iuS';
                                        return (bool) (preg_match($url_regex, $url));
                                    }
                                ),
        );
    }
    
    public static function getDefaults() {
        return array(
             'indexed'          => function() { return false; },
             'notice'           => function() { return false; },             
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
    

    // Returns excerpt of the content of max 200 chars cutting on a word-basis
    public static function getContentExcerpt($om, $oids, $lang) {
        $result = [];
        $res = $om->read(__CLASS__, $oids, ['description']);
        foreach($res as $oid => $odata) {
            $result[$oid] = TextTransformer::excerpt(HTMLToText::convert($odata['description'], false), RESILIB_DOCUMENT_CONTENT_EXCERPT_LENGTH_MAX);
        }
        return $result;        
    }    
   
   
    public static function onchangeContent($om, $oids, $lang) {
        if(isset($_FILES['content'])) {
            $om->write('resilib\Document', $oids, 
                array(
                        'original_filename'	=> $_FILES['content']['name'], 
                        'size'		        => $_FILES['content']['size'], 
                        'content_type'		=> $_FILES['content']['type'],
                        'notice'            => false
                ), 
                $lang);
        }
    }

    public static function onchangeAuthorsIds($om, $oids, $lang) {
        // force re-indexing the document
        $om->write(__CLASS__, $oids, ['indexed' => false]);
        $res = $om->read(__CLASS__, $oids, ['authors_ids']);
        $authors_ids = [];
        foreach($res as $oid => $odata) {
            $authors_ids = array_merge($authors_ids, $odata['authors_ids']);
        }
        // force re-compute author count-pages
        $om->write('resiway\Author', $authors_ids, ['count_pages' => null]);
    }
    
    public static function onchangeTitle($om, $oids, $lang) {
        // force re-compute title_url and re-indexing the document
        $om->write(__CLASS__, $oids, ['title_url' => null, 'indexed' => false], $lang);
    }    
    
    public static function onchangeDescription($om, $oids, $lang) {
        // force re-indexing the document
        $om->write(__CLASS__, $oids, ['indexed' => false, 'content_excerpt' => null], $lang);                
    }
    
    public static function getTitleURL($om, $oids, $lang) {
        $result = [];
        $res = $om->read(__CLASS__, $oids, ['title']);
        foreach($res as $oid => $odata) {
            // note: final format will be: #/document/{id}/{title}
            $result[$oid] = TextTransformer::slugify($odata['title'], 200);
        }
        return $result;        
    }
    

    /**
    * Converts a list of documents to a JSON structure matching JSON API RFC7159 specifications
    * content-type: application/vnd.api+json
    * 
    */  
    public static function toJSONAPI($om, $oids, $meta) {
        $result = [];
        $included = [];
        
        $documents = $om->read(__CLASS__, $oids, [
                                                    'creator'  => User::getPublicFields(), 
                                                    'created', 
                                                    'title', 
                                                    'title_url',
                                                    'description',
                                                    'authors_ids',
                                                    'content_excerpt', 
                                                    'content_type',
                                                    'original_url',
                                                    'score', 
                                                    'count_views', 
                                                    'count_votes', 
                                                    'categories_ids' => ['id', 'title', 'path', 'parent_path', 'description']
                                                ]);

        // build JSON object
        foreach($documents as $id => $document) {
            $author_id = $document['creator']['id'];
            unset($document['creator']['id']);
            if(!isset($included['creator_'.$author_id])) {
                $included['creator_'.$author_id] = ['type' => 'people', 'id' => $author_id, 'attributes' => (object) $document['creator']];
            }        
            foreach($document['categories_ids'] as $category) {
                $category_id = $category['id'];
                unset($category['id']);
                if(!isset($included['category_'.$category_id])) {
                    $included['category_'.$category_id] = ['type' => 'category', 'id' => $category_id, 'attributes' => (object) $category];
                }        
            }
            $categories = array_values($document['categories_ids']);
            unset($document['id']);        
            unset($document['creator']);        
            unset($document['categories_ids']);
            $document['resilink'] = "http://resilink.io/document/{$id}/{$document['title_url']}";
            $result[] = [
                'type'          => 'document', 
                'id'            => $id, 
                'attributes'    => (object) $document, 
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
    * Serve a static HTML version of a single document object
    *
    */    
    public static function toHTML($om, $oid) {
        $html = [];

        $documents = $om->read(__CLASS__, $oid, ['id', 'lang', 'creator', 'created', 'editor', 'edited', 'modified', 'authors_ids.name', 'title', 'title_url', 'description', 'last_update', 'count_views', 'count_votes', 'score', 'categories_ids.title']);
        if($documents > 0 && isset($documents[$oid])) {
            $odata = $documents[$oid];

            $description = substr($odata['description'], 0, 200);
            $title = $odata['title'];
            $image = "https://www.resiway.org/index.php?get=resilib_document_thumbnail&id={$oid}";
            $url = "https://www.resiway.org/document/{$oid}/{$odata['title_url']}";
                
            $html[] = '<!DOCTYPE html>'.PHP_EOL;
            $html[] = '<html lang="'.$odata['lang'].'" prefix="og: http://ogp.me/ns#">'.PHP_EOL;
            $html[] = '<head>'.PHP_EOL;    
            $html[] = '<meta charset="utf-8">'.PHP_EOL;
            $html[] = '<meta name="title" content="'.$odata['title'].' - ResiLib - Des savoirs pratiques pour la résilience">'.PHP_EOL;
            $html[] = '<meta name="description" content="'.$description.'">'.PHP_EOL;
            $html[] = '<meta property="og:title" content="'.$odata['title'].'" />'.PHP_EOL;
            $html[] = '<meta property="og:type" content="article" />'.PHP_EOL;
            $html[] = '<meta property="og:url" content="'.$url.'" />'.PHP_EOL;
            $html[] = '<meta property="og:image" content="'.$image.'" />'.PHP_EOL;
            $html[] = '<meta property="og:description" content="'.$description.'" />'.PHP_EOL;
            $html[] = '<meta name="twitter:card" content="summary" />'.PHP_EOL;
            $html[] = '<meta name="twitter:title" content="'.$title.'" />'.PHP_EOL;
            $html[] = '<meta name="twitter:url" content="'.$url.'" />'.PHP_EOL;
            $html[] = '<meta name="twitter:description" content="'.$description.'" />'.PHP_EOL;
            $html[] = '<meta name="twitter:image" content="'.$image.'" />'.PHP_EOL;            
            $html[] = '</head>'.PHP_EOL;
            $html[] = '<body>'.PHP_EOL;        
            $html[] = '<div class="document wrapper"'.PHP_EOL;
            $html[] = '   itemscope=""'.PHP_EOL;
            $html[] = '   itemtype="https://schema.org/DigitalDocument">'.PHP_EOL;
            $html[] = '<h1 itemprop="name">'.$title.'</h1>'.PHP_EOL;
            $html[] = '<div itemprop="description">'.$description.'</div>'.PHP_EOL;        
            $html[] = '<div itemprop="dateCreated">'.$odata['last_update'].'</div>'.PHP_EOL;
            $html[] = '<div itemprop="author">'.implode(', ', $odata['authors_ids.name']).'</div>'.PHP_EOL;        
            $html[] = '<div itemprop="url">'.$url.'</div>'.PHP_EOL;                                
            $html[] = '</div>'.PHP_EOL;        
            $html[] = '</body>'.PHP_EOL;        
            $html[] = '</html>'.PHP_EOL;        
        }
        return implode(PHP_EOL, $html);
    }

    /** 
    * Serve a PDF version of a single document object
    *
    */    
    public static function toPDF($om, $oid) {
        $result = null;
        $documents = $om->read(__CLASS__, $oid, ['content']);
        if($documents > 0 && isset($documents[$oid])) {
            $result = $documents[$oid]['content'];
        }
        return $result;
    }
}