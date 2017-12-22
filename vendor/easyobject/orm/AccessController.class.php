<?php
namespace easyobject\orm;

class AccessController {

	private $usersTable;
	private $groupsTable;
	private $permissionsTable;

	private function __construct($usersTable=[]) {
		$this->usersTable = $usersTable;
		$this->groupsTable = array();
		$this->permissionsTable = array();
	}

	public static function &getInstance()	{
		if (!isset($GLOBALS['AccessController_instance'])) {
			$usersTable = array();
            if(isset($_SESSION['AccessController_instance'])) {
                // we need to restore object this way because at the time we do so, class might not be fully loaded
                $incomplete_object = unserialize($_SESSION['AccessController_instance']);
                $usersTable = $incomplete_object->usersTable;
            }            
			$GLOBALS['AccessController_instance'] = new AccessController($usersTable);
		}
		return $GLOBALS['AccessController_instance'];
	}

	public function __destruct() {
		// to keep track of users data, we store them in the SESSION global array
		$_SESSION['AccessController_instance'] = serialize($this);
	}

	public function __sleep() {
		// we need to store usersTable into session array
		return array('usersTable');
	}
    
	private static function is_valid_login($login) {
		// login must be a valid email address
		return (bool) (preg_match('/^([_a-z0-9-]+)(\.[_a-z0-9-]+)*@([a-z0-9-]+)(\.[a-z0-9-]+)*(\.[a-z]{2,4})$/', $login, $matches));
	}

	private static function is_valid_password($password) {
		// password must be a valid MD5 value
		return (bool) (preg_match('/^[0-9|a-z]{32}$/', $password, $matches));
	}

	private static function unlock($key, $value) {
		if (self::is_valid_password($value)) {
			$hex_next = function ($val) {
				$next = hexdec($val) + 1;
				if($next == 16) $next = 0;
				return dechex($next);
			};
			for($i = 0; $i < 4; ++$i) {
				$pos = (int) substr($key, $i, 1);
				$hex_val = substr($value, $pos, 1);
				$value[$pos] = $hex_next($hex_val);
			}
		}
		return $value;
	}

	private function initializeSession($session_id) {
		$this->usersTable[$session_id] = array('user_id' => GUEST_USER_ID, 'lang' => GUEST_USER_LANG, 'login_key' => rand(1000, 9999));
	}

	private static function resolveUserId($login, $password) {
		$om = &ObjectManager::getInstance();
		$ids = $om->search('core\User', array(array(array('validated','=','1'), array('login','=',$login), array('password','=',$password))));
		if(count($ids)) return $ids[0];
		else return QN_ERROR_UNKNOWN_OBJECT;
	}

    private function getUserPermissions($user_id, $object_class, $object_id=NULL) {
		// all users are at least granted the default permissions
		$user_rights = DEFAULT_RIGHTS;
   		// user always has R_READ permission on its own object
		if(strcasecmp($object_class, 'core\User') == 0 && $object_id == $user_id) $user_rights = R_READ;

		// if the control level is based on classes, we don't need the object identifier
        if(CONTROL_LEVEL == 'class') $object_id = 0;

        // if we did already compute user rights then we're done!
		if(isset($this->permissionsTable[$user_id][$object_class][$object_id])) $user_rights = $this->permissionsTable[$user_id][$object_class][$object_id];
		else {
			try {
				// root user always has full rights
				if($user_id == ROOT_USER_ID) $user_rights = R_CREATE | R_READ | R_WRITE | R_DELETE | R_MANAGE;
                else if($user_id == GUEST_USER_ID) $user_rights = DEFAULT_RIGHTS;
				else {
                    $om = &ObjectManager::getInstance();
                    
					// get user groups                                        
					if(!isset($this->groupsTable[$user_id])) {
                        $values = $om->read('core\User', array($user_id), array('groups_ids'));
                        $this->groupsTable[$user_id] = array_merge(array(DEFAULT_GROUP_ID), $values[$user_id]['groups_ids']);
                    }

                    $object_package = $om->getObjectPackageName($object_class);
					// check if permissions are defined for the current object class
					$acl_ids = $om->search('core\Permission', [
                                        [ ['class_name', '=', $object_class], ['group_id', 'in', $this->groupsTable[$user_id]] ],
                                        [ ['class_name', '=', $object_package.'\*'], ['group_id', 'in', $this->groupsTable[$user_id]] ],
                                    ]);
                    if(count($acl_ids)) {
                        // get the user permissions
                        $values = $om->read('core\Permission', $acl_ids, array('rights'));
                        foreach($values as $acl_id => $row) $user_rights |= $row['rights'];
                    }
                    
                    
					if(!isset($this->permissionsTable[$user_id])) $this->permissionsTable[$user_id] = array();
					if(!isset($this->permissionsTable[$user_id][$object_class])) $this->permissionsTable[$user_id][$object_class] = array();
					// first element of the class-related array is used to store the user permissions for the whole class
					$this->permissionsTable[$user_id][$object_class][0] = $user_rights;
				}                
			}
			catch(Exception $e) {
				EventListener::ExceptionHandler($e, __FILE__.', '.__METHOD__);
				throw new Exception('unable to check user rights', QN_ERROR_UNKNOWN);
			}
		}

        // control level based on objects: add rights granted to this user for that specific object, if any
        if(CONTROL_LEVEL == 'object') {
// todo: validate this code
// todo: adapt core_permission table in order to allow rights management at object-level
			// creator of an object always has write permission on it
			$om = &ObjectManager::getInstance();
			// we have to fetch data directly from database since we cannot call the Objet Manager
			// (otherwise access would results in infinite loops of permissions check)
			$db = &DBConnection::getInstance();
			$object_table = $om->getObjectTableName($object_class);
			$result = $db->getRecords(array($object_table), array('creator'), array($object_id));
			if($db->getAffectedRows() && ($row = $db->fetchArray($result)) && $row['creator'] == $user_id) $user_rights |= R_WRITE;
		}

		return $user_rights;
	}


	public function user_key($session_id) {
		if(!isset($this->usersTable[$session_id])) $this->initializeSession($session_id);
		return $this->usersTable[$session_id]['login_key'];
	}

	public function user_id($session_id) {
		if(!isset($this->usersTable[$session_id])) $this->initializeSession($session_id);
    	return $this->usersTable[$session_id]['user_id'];
	}

	public function user_lang($session_id) {
		$user_id = $this->user_id($session_id);
		if($user_id == GUEST_USER_ID) $lang = GUEST_USER_LANG;
		else {
			$lang = DEFAULT_LANG;
			$om = &ObjectManager::getInstance();
			$values = $om->read('core\User', array($user_id), array('language'));
			if(!empty($values[$user_id]['language'])) $lang = $values[$user_id]['language'];
		}
		return $lang;
	}

	// We garantee password privacy:
	// Only MD5 values of the password are sent from client to server. So real user's password stays unknown from the system.
	public function login($session_id, $login, $password) {
        $user_id = 0;
		if(self::is_valid_login($login) && self::is_valid_password($password)) {
            // deprecated
			// $password = self::unlock($this->user_key($session_id), $password);
			if(($user_id = self::resolveUserId($login, $password)) > 0) {
				$this->usersTable[$session_id]['user_id'] = $user_id;
			}
		}
		return $user_id;
	}

	/**
	*
	*	methods related to rights management
	*	************************************
	*/

	public static function hasRight($user_id, $object_class, $objects_ids, $right_flags) {
 		$ac = &self::getInstance();
		$user_rights = DEFAULT_RIGHTS;
        if(!is_array($objects_ids)) $objects_ids = array($objects_ids);
		// we return the most restrictive permission on the given group of object
        if(CONTROL_LEVEL == 'class') {
            $user_rights |= $ac->getUserPermissions($user_id, $object_class);
        }
        else if(CONTROL_LEVEL == 'object') {
            foreach($objects_ids as $object_id) {
                $user_rights &= $ac->getUserPermissions($user_id, $object_class, $object_id);
            }
        }
		return (bool) ($user_rights & $right_flags);
	}
}
