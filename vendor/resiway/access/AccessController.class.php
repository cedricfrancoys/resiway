<?php
namespace resiway\access;

use qinoa\organic\Service;

class AccessController extends Service {
      
    /**
     * This method cannot be called directly (should be invoked through Singleton::getInstance)
     */
    protected function __construct() {
    
    }

    public static function constants() {
        return ['R_CREATE', 'R_READ', 'R_WRITE', 'R_DELETE', 'R_MANAGE', 'DEFAULT_RIGHTS', 'DEFAULT_GROUP_ID', 'ROOT_USER_ID', 'GUEST_USER_ID'];
    }
    

    private function getUserGroups($user_id) {}
    
    private function getUserRights($user_id, $object_class) {}

    private function setUserRights($right, $user_id, $object_class) {}
    
    public function grant($operation, $object_class='*', $object_fields=[], $object_ids=[]) {}
    
    public function revoke($operation, $object_class='*', $object_fields=[], $object_ids=[]) {}
    
    public function isAllowed($operation, $object_class, $object_fields=[], $object_ids=[]) {

        if(in_array($operation, [R_READ, R_CREATE])) return true;
        
        list($om, $auth) = $this->container->get(['orm', 'auth']);
        
        $user_id = $auth->userId();

        // read user data
        $res = $om->read('resiway\User', $user_id, ['reputation', 'role']);
        if($res < 0 || !isset($res[$user_id])) return false;
        $user_data = $res[$user_id];        
        
        // all operations are granted to admin users
        if($user_data['role'] == 'a' || $user_data['role'] == 'm') return true; 

        // since we're here, user is authenticated and (s)he has been granted current RW action
        switch($object_class) {
            // all users can update common objects
            case 'resiway\Category': 
            case 'resiway\Author':             
            return true;
        }
        
        // retrieve objects data 
        $res = $om->read($object_class, $object_ids, ['id', 'creator']);
        if($res < 0) return false;

        // check if user is the creator of all specified objects
        $is_creator = true;
        $is_own = ($object_class == 'resiway\User');
        foreach($object_ids as $object_id) {            
            if($user_id != $res[$object_id]['creator']) $is_creator = false;
            if($user_id != $object_id) $is_own = false;
        }
        // unless specified in action limitations, all actions are granted to object owner            
        if($is_creator) return true;            
        // users have full access on their own profile
        if($is_own) return true;

        return false;
    }
}