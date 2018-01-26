<?php
namespace qinoa\orm;
use easyobject\orm\ObjectManager;

class Collection {

    private $om;
    private $class;
    private $objects;

    /**
     *
     * This method only serves to validate checks using is_callable on any static method name        
     */
    public static function __callStatic($name, $arguments) {}       
    
    
    public function __construct(ObjectManager $om, $class) {
        $this->objects = [];
        $this->om = $om;
        $this->class = $class;
        $this->instance = $this->om->getStatic($class);
        if($this->instance === false) {
            throw new \Exception($class, QN_ERROR_UNKNOWN_OBJECT);
        }
    }    
    
    

    /**
     * Returns the whole collection, or a segment specified by given ids array, under the form of an associative array
     *
     * @param   $ids    mixed (integer | array) The segment to retrieve, if none specified, the whole collection is returned
     * @return  array   Associative array mapping objects identifiers with their related maps of fields/values
     *
     */    
    public function get($map=true) {
        // retrieve current objects map
        $result = $this->objects;
        // if user requested an array of objects instead of a map
        if(!$map) {
            // create an array out of the values, ignoring keys
            $result = array_values($result);
        }        
        return $result;
    }

    /**
     * Filters a map of fields-values entries or an array of fields names and disgard those unknonwn to the current class
     *
     * @param $fields   array   a set of fields or a map of fields-values
     * @return array    filtered array containing known fields names only
     */
    public function filter(array $fields) {
        $result = [];
        if(count($fields)) {
            // retreve valid fields
            $allowed_fields = $this->instance->getFields();
            // filter $fields argument based on its structure 
            // (either a list of fields to read, or a map of fields and their values for writing)
            if(!is_numeric(key($fields))) {                
                $result = array_intersect_key($fields, array_flip($allowed_fields));
            }
            else {
                $result = array_intersect($field, $allowed_fields);
            }
        }
        return $result;
    }
    
    /**
     *
     * @param $fields   array   associative array holding values and their related fields as keys 
     *
     */
    public function validate(array $fields) {
        $validation = $this->om->validate($this->class, $fields);
        if($validation < 0 || count($validation)) {
            throw new \Exception(implode(',', array_keys($fields)), QN_ERROR_INVALID_PARAM);
        }
    }
    
    public function search(array $domain=[], $order='id', $sort='asc', $start=0, $limit=0, $lang=DEFAULT_LANG) {
// todo : validate domain and operands consistency (type validity)        
        $ids = $this->om->search($this->class, $domain, $order, $sort, $start, $limit, $lang);
        // $ids is an error code
        if($ids < 0) {           
            throw new \Exception(serialize($domain), $ids);
        }
        if(count($ids)) {
            // init keys of 'objects' member (for now, contain only an empty array)
            $this->objects = array_fill_keys($ids, []);
        }
        else {
            // reset objects map if not empty
            $this->objects = [];
        }
        return $this;
    }
    
    /**
     * Creates a new instance
     *
     * @return  object
     * @example $newObject = MyClass::create();
     *
     */
    public static function create() {
    }
    
    
    public function read($fields, $lang=DEFAULT_LANG) {       
        // force argument into an array (single field name is also accepted)
        $fields = (array) $fields;

        if(count($this->objects)) {
            // 1) drop invalid fields
            $allowed_fields = $this->instance->getFields();
            $invalid_fields = array_diff($fields, $allowed_fields);
            if(count($invalid_fields)) {
                // temporary array to retrieve numeric keys
                $flipped_fields = array_flip($fields);
                foreach($invalid_fields as $invalid_field) {
                    // silently drop invalid fields
                    unset($fields[$flipped_fields[$invalid_field]]);
                }
            }
            // 2) read values
            $res = $this->om->read($this->class, array_keys($this->objects), $fields, $lang);
            // $res is an error code, something prevented to fetch requested fields
            if($res < 0) throw new \Exception(implode(',', $fields), $res);
            $this->objects = $res;
        }
        return $this;
    }
    
    /**
     *
     * @throws  Exception   if some value could not ba validated against class contraints (see {class}::getConstraints method)
     *
     *
     */
    public function update(array $fields, $lang=DEFAULT_LANG) {
        // 1) silently drop invalid fields
        $fields = $this->filter($fields);
        // 2) validate
        $this->validate($fields);
        // 3) write
// todo = set modifier to current user        
        $res = $this->om->write($this->class, array_keys($this->objects), $fields, $lang);
        if($res <= 0) {
            throw new \Exception(implode(',', array_keys($fields)), $res);
        }
        return $this;
    }
    
    public function delete() {
    }
}