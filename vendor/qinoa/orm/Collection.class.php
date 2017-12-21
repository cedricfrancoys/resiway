<?php
namespace qinoa\orm;
use easyobject\orm\ObjectManager;

class Collection {

    private $om;
    private $class;
    private $objects;

    public static function __callStatic($name, $arguments) {            
        // this method is only defined to validate checks using is_callable on any static method name        
    }       
    
    public function __construct(ObjectManager $om, $class) {
        $this->objects = [];
        $this->om = $om;
        $this->class = $class;
    }    
    
    
    /**
     * Creates a new instance
     *
     * @return  object
     * @example     $newObject = MyClass::create();
     *
     */
    public static function create() {
    }
    
    /**
     * Returns the whole collection, or a segment specified by given ids array, under the form of an associative array
     *
     * @param   $ids    mixed (integer | array) the segment we wan to retrieve, if none specified, the wole collection is returned
     * @return  array   Associative array mapping objects ids with related maps of fields/values
     *
     */    
    public function get($ids=[]) {
        if(is_numeric($ids)) {
            // force argument into an array
            $ids = (array) $ids;
        }
        if(empty($ids)) {
            // return the whole collection
            return $this->objects;
        }
        // make sure we request only existing keys
        $ids = array_intersect(array_keys($this->objects), $ids);
        // limit result to the specified segment
        return array_intersect_key($this->objects, array_flip($ids));
    }
    
    public function search($domain=[], $order='id', $sort='asc', $start=0, $limit=0, $lang=DEFAULT_LANG) {
        $ids = $this->om->search($this->class, $domain, $order, $sort, $start, $limit, $lang);
        if($ids < 0) {
            // $ids is an error code
            throw new \Exception('unable to get search result', $ids);
        }
        if(count($ids)) {
            // init keys of 'objects' member (for now, contain only an empty array)
            $this->objects = array_fill_keys($ids, []);
        }
        return $this;
    }
    
    public function read($fields) {       
        if(!is_array($fields)) {
            // force argument into an array
            $fields = (array) $fields;
        }
        if(count($this->objects)) {
            $res = $this->om->read($this->class, array_keys($this->objects), $fields);
            if($res < 0) {
                // $res is an error code
                throw new \Exception('unable to get requested fields', $res);
            }
            $this->objects = $res;
        }
        return $this;
    }
    
    public function update($fields) {
    }
    
    public function delete() {
    }
}