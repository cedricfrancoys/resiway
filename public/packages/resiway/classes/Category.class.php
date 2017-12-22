<?php
namespace resiway;
use qinoa\text\TextTransformer as TextTransformer;


class Category extends \easyobject\orm\Object {

    public static function getColumns() {
        return array(
            /* all objects must define a 'name' column (default is id) */
            'name'				=> array('type' => 'alias', 'alias' => 'title'),

            /* channel of the current question (1:'default', 2:'help', 3:'meta', ...) */
            'channel_id'        => array('type' => 'many2one', 'foreign_object'=> 'resiway\Channel'),
            
            'title'             => array('type' => 'string', 'multilang' => true, 'onchange' => 'resiway\Category::onchangeTitle'),

            /* title URL-formatted (for links) */
            'title_url'         => array(
                                    'type'              => 'function',
                                    'result_type'       => 'string',
                                    'store'             => true, 
                                    'function'          => 'resiway\Category::getTitleURL'
                                   ),
            
            'description'		=> array('type' => 'text', 'multilang' => true),
            
            'parent_id'			=> array(
                                    'type'              => 'many2one', 
                                    'foreign_object'    => 'resiway\Category', 
                                    'onchange'          => 'resiway\Category::onchangeParentId'
                                   ),
                                    
            'thumbnail'			=> array('type' => 'file'),

            /* amount of questions in this category and its subcategories */
            'count_questions'   => array(
                                    'type'              => 'function',
                                    'result_type'       => 'integer',
                                    'store'             => true, 
                                    'function'          => 'resiway\Category::getCountQuestions',
                                    'onchange'          => 'resiway\Category::onchangeCountQuestions'
                                   ),

            /* amount of documents in this category and its subcategories */
            'count_documents'   => array(
                                    'type'              => 'function',
                                    'result_type'       => 'integer',
                                    'store'             => true, 
                                    'function'          => 'resiway\Category::getCountDocuments',
                                    'onchange'          => 'resiway\Category::onchangeCountDocuments'
                                   ),

            /* amount of articles in this category and its subcategories */
            'count_articles'     => array(
                                    'type'              => 'function',
                                    'result_type'       => 'integer',
                                    'store'             => true, 
                                    'function'          => 'resiway\Category::getCountArticles',
                                    'onchange'          => 'resiway\Category::onchangeCountArticles'
                                   ),

            /* total items in this category and its subcategories */
            'count_items'       => array(
                                    'type'              => 'function',
                                    'result_type'       => 'integer',
                                    'store'             => false, 
                                    'function'          => 'resiway\Category::getCountItems'
                                   ),
                                   
            /* number of times this category has been marked as favorite */
            'count_stars'		=> array('type' => 'integer'),
            
            'path'				=> array(
                                    'type'              => 'function', 
                                    'store'             => true,
                                    'multilang'         => true,
                                    'result_type'       => 'string', 
                                    'function'          => 'resiway\Category::getPath'
                                    ),
                                    
            'parent_path'		=> array(
                                    'type'              => 'function', 
                                    'store'             => true,
                                    'multilang'         => true,
                                    'result_type'       => 'string', 
                                    'function'          => 'resiway\Category::getParentPath'
                                    ),
                                    
            'children_ids'		=> array(
                                    'type'              => 'one2many', 
                                    'foreign_object'    => 'resiway\Category', 
                                    'foreign_field'     => 'parent_id', 
                                    'order'             => 'title'
                                    ),

            
            'questions_ids'	    => array(
                                    'type' 			    => 'many2many', 
                                    'foreign_object'	=> 'resiexchange\Question', 
                                    'foreign_field'		=> 'tags_ids', 
                                    'rel_table'		    => 'resiexchange_rel_question_category', 
                                    'rel_foreign_key'	=> 'question_id', 
                                    'rel_local_key'		=> 'tag_id'
                                    ),
                                    
            'documents_ids'	    => array(
                                    'type' 			    => 'many2many', 
                                    'foreign_object'	=> 'resilib\Document', 
                                    'foreign_field'		=> 'categories_ids', 
                                    'rel_table'		    => 'resilib_rel_document_category', 
                                    'rel_foreign_key'	=> 'document_id', 
                                    'rel_local_key'		=> 'category_id'
                                    ),                                    
                                    
            'articles_ids'	    => array(
                                    'type' 			    => 'many2many', 
                                    'foreign_object'	=> 'resilexi\Article', 
                                    'foreign_field'		=> 'categories_ids', 
                                    'rel_table'		    => 'resilexi_rel_article_category', 
                                    'rel_foreign_key'	=> 'article_id', 
                                    'rel_local_key'		=> 'category_id'
                                    )                                   
        );
    }
    
    public static function getDefaults() {
        return array(
             'parent_id'           => function() { return 0; },             
             'count_stars'         => function() { return 0; },
             'channel_id'          => function() { return 1; }
        );
    }
    
   
    /*
    * Handler to be run either when title of the tag is changed or it is reassigned to another parent tag
    */
    public static function onchangeTitle($om, $oids, $lang) {
        // invalidate path (force re-compute)
        $om->write(__CLASS__, $oids, ['title_url' => null, 'path' => null, 'parent_path' => null], $lang);        
        // force values immediate re-computing 
        $om->read(__CLASS__, $oids, ['title_url', 'path', 'parent_path']);        
        // find children tags and force to re-compute path
        $categories_ids = $om->search(__CLASS__, ['parent_id', 'in', $oids]);
        if($categories_ids > 0 && count($categories_ids)) self::onchangeTitle($om, $categories_ids, $lang);
    }
    
    public static function onchangeCountQuestions($om, $oids, $lang) {
        // invalidate parent questions-counter (force re-compute)
        $res = $om->read(__CLASS__, $oids, ['parent_id']);
        $parents_ids = array_map(function($a) { return $a['parent_id']; }, $res);
        $om->write(__CLASS__, $parents_ids, ['count_questions' => null]);
        // we assume counter has been set to null, and force immediate recomputing
        $om->read(__CLASS__, $oids, ['count_questions']);
    }

    public static function onchangeCountDocuments($om, $oids, $lang) {
        // invalidate parent documents-counter (force re-compute)
        $res = $om->read(__CLASS__, $oids, ['parent_id']);
        $parents_ids = array_map(function($a) { return $a['parent_id']; }, $res);
        $om->write(__CLASS__, $parents_ids, ['count_documents' => null]);
        // we assume counter has been set to null, and force immediate recomputing
        $om->read(__CLASS__, $oids, ['count_documents']);
    }
    
    public static function onchangeCountArticles($om, $oids, $lang) {
        // invalidate parent documents-counter (force re-compute)
        $res = $om->read(__CLASS__, $oids, ['parent_id']);
        $parents_ids = array_map(function($a) { return $a['parent_id']; }, $res);
        $om->write(__CLASS__, $parents_ids, ['count_articles' => null]);
        // we assume counter has been set to null, and force immediate recomputing
        $om->read(__CLASS__, $oids, ['count_articles']);
    }    
    
    public static function onchangeParentId($om, $oids, $lang) {
        self::onchangeTitle($om, $oids, $lang);
        self::onchangeCountQuestions($om, $oids, $lang);
        self::onchangeCountDocuments($om, $oids, $lang);
        self::onchangeCountArticles($om, $oids, $lang);        
    }    

    public static function getRelatedQuestionsIds($om, $oids, $lang) {
        $result = [];
        // cyclic dependency: remember that this approach only works if all involved categories paths are set !       
        $res = $om->read(__CLASS__, $oids, ['questions_ids', 'children_ids']);
        foreach($oids as $oid) {
            $result[$oid] = [];
            if(isset($res[$oid])) {
                $result[$oid] = $res[$oid]['questions_ids'];
                if(count($res[$oid]['children_ids'])) {
                    $children_categories = self::getRelatedQuestionsIds($om, $res[$oid]['children_ids'], $lang);
                    foreach($children_categories as $child_id => $children_questions_ids) {
                        $result[$oid] = array_merge($result[$oid], $children_questions_ids);
                    }
                    $result[$oid] = array_unique($result[$oid]);
                }
            }
        }        
        return $result;
    }

    public static function getRelatedDocumentsIds($om, $oids, $lang) {
        $result = [];
        // cyclic dependency: remember that this approach only works if all involved categories paths are set !       
        $res = $om->read(__CLASS__, $oids, ['documents_ids', 'children_ids']);
        foreach($oids as $oid) {
            $result[$oid] = [];
            if(isset($res[$oid])) {
                $result[$oid] = $res[$oid]['documents_ids'];
                if(count($res[$oid]['children_ids'])) {
                    $children_categories = self::getRelatedDocumentsIds($om, $res[$oid]['children_ids'], $lang);
                    foreach($children_categories as $child_id => $children_documents_ids) {
                        $result[$oid] = array_merge($result[$oid], $children_documents_ids);
                    }
                    $result[$oid] = array_unique($result[$oid]);
                }
            }
        }        
        return $result;
    }

    public static function getRelatedArticlesIds($om, $oids, $lang) {
        $result = [];
        // cyclic dependency: remember that this approach only works if all involved categories paths are set !       
        $res = $om->read(__CLASS__, $oids, ['articles_ids', 'children_ids']);
        foreach($oids as $oid) {
            $result[$oid] = [];
            if(isset($res[$oid])) {
                $result[$oid] = $res[$oid]['articles_ids'];
                if(count($res[$oid]['children_ids'])) {
                    $children_categories = self::getRelatedArticlesIds($om, $res[$oid]['children_ids'], $lang);
                    foreach($children_categories as $child_id => $children_articles_ids) {
                        $result[$oid] = array_merge($result[$oid], $children_articles_ids);
                    }
                    $result[$oid] = array_unique($result[$oid]);
                }
            }
        }        
        return $result;
    }
    
    public static function getCountItems($om, $oids, $lang) {
        $result = [];
        $res = $om->read(__CLASS__, $oids, ['count_questions', 'count_documents', 'count_articles']);
        foreach($oids as $oid) {
            $result[$oid] = 0;
            $result[$oid] += $res[$oid]['count_questions'];
            $result[$oid] += $res[$oid]['count_documents'];
            $result[$oid] += $res[$oid]['count_articles'];
        }
        return $result;
    }
    
    public static function getCountQuestions($om, $oids, $lang) {
        $result = [];
        $res = self::getRelatedQuestionsIds($om, $oids, $lang);
        foreach($oids as $oid) {
            $result[$oid] = 0;
            if(isset($res[$oid])) {
                $result[$oid] = count($res[$oid]);
            }
        }        
        return $result;
    }
    
    public static function getCountDocuments($om, $oids, $lang) {
        $result = [];
        $res = self::getRelatedDocumentsIds($om, $oids, $lang);
        foreach($oids as $oid) {
            $result[$oid] = 0;
            if(isset($res[$oid])) {
                $result[$oid] = count($res[$oid]);
            }
        }        
        return $result;
    }

    public static function getCountArticles($om, $oids, $lang) {
        $result = [];
        $res = self::getRelatedArticlesIds($om, $oids, $lang);
        foreach($oids as $oid) {
            $result[$oid] = 0;
            if(isset($res[$oid])) {
                $result[$oid] = count($res[$oid]);
            }
        }        
        return $result;
    }
    
    public static function getPath($om, $oids, $lang) {
        $result = [];
        $res = $om->read(__CLASS__, $oids, ['title', 'parent_id', 'parent_id.path'], $lang);        
        foreach($oids as $oid) {
            $result[$oid] = '';
            if(isset($res[$oid])) {
                $object_data = $res[$oid];
                if(isset($object_data['parent_id']) && $object_data['parent_id'] > 0) {
                    $result[$oid] = $object_data['parent_id.path'].'/'.TextTransformer::slugify($object_data['title']);
                }
                else $result[$oid] = TextTransformer::slugify($object_data['title']);
            }
        }
        return $result;        
    }  

    public static function getParentPath($om, $oids, $lang) {
        $result = [];
        $res = $om->read(__CLASS__, $oids, ['parent_id.path'], $lang);
        foreach($oids as $oid) {
            $result[$oid] = '';
            if(isset($res[$oid]) && isset($res[$oid]['parent_id.path'])) { 
                $result[$oid] = $res[$oid]['parent_id.path'];
            }
        }
        return $result;        
    }
    
    public static function getTitleURL($om, $oids, $lang) {
        $result = [];
        $res = $om->read(__CLASS__, $oids, ['title']);
        foreach($res as $oid => $odata) {
            // note: final format will be: #/question/{id}/{title}
            $result[$oid] = TextTransformer::slugify($odata['title'], 200);
        }
        return $result;        
    }    
}