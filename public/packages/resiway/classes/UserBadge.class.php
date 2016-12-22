<?php
namespace resiway;

class UserBadge extends \easyobject\orm\Object {

    /*
        This is a special case of many2many relation.
        We define it as an object instead of a simple table, because we need to
        attach a field (status) storing the current computed value of how far 
        the user has achieved requirements to obtain related badge.
    */
    public static function getColumns() {
        return array(
            'user_id'			=> array('type' => 'many2one', 'foreign_object' => 'resiway\User'),
            'badge_id'			=> array('type' => 'many2one', 'foreign_object' => 'resiway\Badge'),
            
            /*
            flag that indicates if the badge has been awarded to the user
            (Once it has been awarded a badge cannot be withdrawn, even if conditions are not met anymore.)
            */
            'awarded'			=> array('type' => 'boolean'),
            
            'status'		    => array('type' => 'function', 'result_type' => 'float', 'store' => true, 'function' => 'resiway\UserBadge::getStatus'),
        );
    }
  
    public static function getStatus($om, $ids, $lang) {
        $res = [];
        // get selected UserBadge objects
        $objects = $om->read(__CLASS__, $ids, ['badge_id.name', 'user_id']);
        foreach($objects as $oid => $object) {
            $res[$oid] = Badge::computeBadge($object['badge_id.name'], $object['user_id']);
        }
        return $res;
    }

}