<?php
use easyobject\orm\ObjectManager as ObjectManager;
use easyobject\orm\PersistentDataManager as PersistentDataManager;
include_once('../qn.lib.php');

include_once('../resi.api.php');

set_silent(true);

// var_dump(resiway::is_allowed('test'));

$pdm = &PersistentDataManager::getInstance();

$login = 'cedricfrancoys@gmail.com';
$password = 'e60875ae233ae64bcaf970f84cf0b3f7';


function login($login, $password) {
    $user_id = 0;
    $om = &ObjectManager::getInstance();
    $user_class = $om->getStatic('resiway\User');
    $constraints = $user_class::getConstraints();    
    if($constraints['login']['function']($login) && $constraints['password']['function']($password)) {
        $pdm = &PersistentDataManager::getInstance();
        $ids = $om->search('resiway\User', [['login', '=', $login], ['password', '=', $password]]);
        if(count($ids)) $user_id = $ids[0];
        $pdm->register('user_id', $user_id);
    }
    return $user_id;
}

function logout() {
    // destroy persistent data
    $pdm = &PersistentDataManager::getInstance();
    $pdm->reset();
    foreach ($_COOKIE as $name => $value) setcookie($name, null);
    setcookie(session_name(), '');
    session_regenerate_id(true);
}

var_dump( $pdm->retrieve('user_id') );
logout();
var_dump( $pdm->retrieve('user_id') );
var_dump( $user_id = login($login, $password) );
// echo $pdm->retrieve('user_id');
