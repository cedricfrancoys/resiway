<?php
namespace resiway\auth;

use qinoa\organic\Service;
use qinoa\auth\JWT;


class AuthenticationManager extends \qinoa\auth\AuthenticationManager {
       
    public function authenticate($login, $password) {
        $orm = $this->container->get('orm');
        
        $errors = $orm->validate('resiway\User', ['login' => $login, 'password' => $password]);
        if(count($errors)) throw new \Exception($login, QN_ERROR_INVALID_USER);
        
        $ids = $orm->search('resiway\User', [['login', '=', $login], ['password', '=', $password]]);        
        if(!count($ids)) throw new \Exception($login, QN_ERROR_INVALID_USER);

        // remember current user identifier
        $this->user_id = $ids[0];

        return $this;
    }
}