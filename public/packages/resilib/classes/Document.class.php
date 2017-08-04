<?php
namespace resilib;
use qinoa\text\TextTransformer as TextTransformer;

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
                                       
            'author'			    => array('type' => 'string', 'onchange' => 'resilib\Document::onchangeAuthor'),
            

            /* due to UX strategy, this field is automatically set (user only gives author full name, or picks up among a selection) */
            'author_id'             => array('type' => 'many2one', 'foreign_object' => 'resiway\Author'),
            
            
            /* language into which the document is written */
            'lang'			        => array('type' => 'string'),
            
            /* channel of the current question ('default', 'help', 'meta', ...) */
            'channel_id'            => array('type' => 'many2one', 'foreign_object'=> 'resiway\Channel'),
            
            'last_update'		    => array('type' => 'date'),				
            
            'description'		    => array('type' => 'html', 'onchange' => 'resilib\Document::onchangeDescription'),

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
             'author_id'        => function() { return 0; },             
             'count_views'      => function() { return 0; },
             'count_votes'      => function() { return 0; },
             'count_stars'      => function() { return 0; },
             'count_flags'      => function() { return 0; },
             'count_links'      => function() { return 0; },
             'score'            => function() { return 0; },             
        );
    }
    
    public static function slugify($value) {
        // remove accentuated chars
        $value = htmlentities($value, ENT_QUOTES, 'UTF-8');
        $value = preg_replace('~&([a-z]{1,2})(acute|cedil|circ|grave|lig|orn|ring|slash|th|tilde|uml);~i', '$1', $value);
        $value = html_entity_decode($value, ENT_QUOTES, 'UTF-8');
        // remove all non-quote-space-alphanum-dash chars
        $value = preg_replace('/[^\'\s-a-z0-9]/i', '', $value);
        // replace spaces, dashes and quotes with dashes
        $value = preg_replace('/[\s-\']+/', '-', $value);           
        // trim the end of the string
        $value = trim($value, '.-_');
        return strtolower($value);
    }
    
    public static function onchangeContent($om, $oids, $lang) {
        if(isset($_FILES['content'])) {
            $om->write('resilib\Document', $oids, 
                array(
                        'original_filename'	=> $_FILES['content']['name'], 
                        'size'		        => $_FILES['content']['size'], 
                        'content_type'		=> $_FILES['content']['type']
                ), 
                $lang);
        }
    }

    public static function onchangeAuthor($om, $oids, $lang) {
        // fetch authors names
        $res = $om->read(__CLASS__, $oids, ['author']);
        foreach($res as $oid => $odata) {
            // resolve author id
            $author_name = TextTransformer::slugify($odata['author']);
            $ids = $om->search('resiway\Author', ['name_url', '=', "{$author_name}"], 'id', 'asc', 0, 1);
            // if found, set author_id
            if($ids > 0 && count($ids)) {
                $om->write(__CLASS__, $oid, ['author_id' => $ids[0]]);
                // force re-compute pages counter
                $om->write('resiway\Author', $ids[0], ['count_pages' => null]);
            }
            else {
                // create a new author
                $author_id = $om->create('resiway\Author', ['name' => $odata['author']]);
                $om->write(__CLASS__, $oid, ['author_id' => $author_id]);
            }
        }
        // force re-indexing the document
        $om->write(__CLASS__, $oids, ['indexed' => false]);
    }
    
    public static function onchangeTitle($om, $oids, $lang) {
        // force re-compute title_url and re-indexing the document
        $om->write(__CLASS__, $oids, ['title_url' => null, 'indexed' => false], $lang);
    }    
    
    public static function onchangeDescription($om, $oids, $lang) {
        // force re-indexing the document
        $om->write(__CLASS__, $oids, ['indexed' => false], $lang);                
    }
    
    public static function getTitleURL($om, $oids, $lang) {
        $result = [];
        $res = $om->read(__CLASS__, $oids, ['title']);
        foreach($res as $oid => $odata) {
            // note: final format will be: #/document/{id}/{title}
            $result[$oid] = self::slugify($odata['title'], 200);
        }
        return $result;        
    }   
    
}