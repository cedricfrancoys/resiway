<?php
/**
*    This file is part of the easyObject project.
*    http://www.cedricfrancoys.be/easyobject
*
*    Copyright (C) 2012  Cedric Francoys
*
*    This program is free software: you can redistribute it and/or modify
*    it under the terms of the GNU General Public License as published by
*    the Free Software Foundation, either version 3 of the License, or
*    (at your option) any later version.
*
*    This program is distributed in the hope that it will be useful,
*    but WITHOUT ANY WARRANTY; without even the implied warranty of
*    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*    GNU General Public License for more details.

*    You should have received a copy of the GNU General Public License
*    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
namespace easyobject\orm;


/**
	This class holds the description of an object (and not the object itself)
*/
class Object {

	private $id;
	
	/**
	 * Complete object schema, containing all columns (including special ones as object id)
	 *
	 * @var array
	 * @access private
	 */
	private $schema;

	/**
	 * Constructor
	 *
	 * @access public
	 * @param  integer $id
	 */
	public final function __construct($id=0) {
		$this->id = $id;
		$this->schema = array_merge(Object::getSpecialColumns(), $this->getColumns());
		$this->setDefaults();
	}

	private final function setDefaults() {
		if(method_exists($this, 'getDefaults')) {
			$defaults = $this->getDefaults();
			// get default values, set fields for default language, and mark fields as modified
			foreach($defaults as $field => $default_value) if(isset($this->schema[$field]) && is_callable($default_value)) $fields_values[$field] = call_user_func($default_value);
			// we use the 0 as user id so that the modifier field is left to 0
			// (which is necessary to make the distinction between objects being created/drafts and objects actually created)
			$this->setValues(0, $fields_values);
    	}
	}

	public final static function getSpecialColumns() {
		static $special_columns = array(
			'id'		=> array('type' => 'integer'),
			'creator'	=> array('type' => 'integer'),            
			'created'	=> array('type' => 'datetime'),
			'modifier'	=> array('type' => 'integer'),
			'modified'	=> array('type' => 'datetime'),
			'deleted'	=> array('type' => 'boolean'),		
			'state'		=> array('type' => 'string'),			
		);
		return $special_columns;
	}

	/**
	 * Gets object schema
	 *
	 * @access public
	 * @return array
	 */
	public final function getSchema() {
		return $this->schema;
	}

	/**
	* Returns the user-defined part of the schema (i.e. fields list with types and other attributes)
	* This method must be overridden by children classes.
	*
	* @access public
	*/
	public static function getColumns() {
		return array();
	}

	/**
	* Returns the name of the database table related to this object
	* This method may be overridden by children classes
	*
	* @access public
	*/
	public function getTable() {
		return strtolower(str_replace('\\', '_', get_class($this)));
	}

	/**
	* Returns the name of the field to be used as 'name'
	* This method may be overridden by children classes
	*
	* @access public
	*/
	public function getName() {
		$fields = $this->getColumns();
		if(isset($fields['name'])) return 'name';		
		return array_keys($fields)[0];
	}

	/**
	* Gets object id
	*
	* @access public
	* @return integer The unique identifier of the current object (unicity scope is the object class)
	*/
	public final function getId() {
		return $this->id;
	}


	/**
	* Returns the fields names of the specified types
	*
	* @param array $types_list allows to restrict the result to specified types (the method willl only return fields from which type is present in the list)
	*/
	public final function getFieldsNames($types_list=NULL) {
		$result_array = array();
		if(!is_array($types_list) || is_null($types_list))	$result_array = array_keys($this->schema);
		else {
			foreach($this->schema as $field_name => $field_description) {
				if(in_array($field_description['type'], $types_list)) $result_array[] = $field_name;
			}
		}
		return $result_array;
	}



	/**
	* Magic method for handling dynamic getters and setters
	*
	* @param string $name
	* @param array $arguments
	*/
	public function __call($name, $arguments) {
		// get the parts of the virtual method invoked
		$method	= strtolower(substr($name, 0, 3));
		$field	= strtolower(substr($name, 3));
		// check that the specified field does exist
		if(in_array($field, array_keys(array_change_key_case($this->schema, CASE_LOWER)))) {
			switch($method) {
				case 'get':
// todo : in case of  relational fields we could return an object instead of an id
					$values = $this->getValues(array($field));
					return $values[$field];
					break;
				case 'set':
					// we use the global method 'update' in order to retrieve the user id associated with the current session

					update(get_class($this), array($this->getId()), array($field=>$arguments[0]));
					break;
			}
		}
	}

}
