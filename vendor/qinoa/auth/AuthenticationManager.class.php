<?php
namespace qinoa\auth;

use qinoa\organic\Singleton;
use qinoa\php\Context;
use core\User;

class AuthenticationManager extends Singleton {

    private $context;
    
    /**
     * This method cannot be called directly (should be invoked through Singleton::getInstance)
     */
    protected function __construct(Context $context) {
        // initial configuration
        $this->context = $context;
        // current operation can be retrieved through $this->context->get('operation')
    }
    
    public static function constants() {
        return ['AUTH_SECRET_KEY'];
    }
    
    public function userId($jwt=null) {
        // requires : HTTP message (fallback to current HTTP request)

        $user_id = 0;
        // if no JWT token was provided, look in the request headers
        if(is_null($jwt)) {
            $request = $this->context->httpRequest();     

            $auth_header = $request->header('Authorization');
            if(!is_null($auth_header) && strpos($auth_header, 'Bearer ') !== false) {
                // retrieve token    
                list($jwt) = sscanf($auth_header, 'Bearer %s');
            }
        }
        
        // decode token
        $data = (array) JWT::decode($jwt, AUTH_SECRET_KEY);
        if(isset($data['id']) && $data['id'] > 0) {
            $user_id = $data['id'];
        }
        return $user_id;
    }
    
    public function authenticate($login, $password) {        
        User::validate(['login' => $login, 'password' => $password]);
        
        $users = User::search([['login', '=', $login], ['password', '=', $password]])
                 ->read(['id'])
                 ->get();
        
        if(!count($users)) throw new \Exception($login, QN_ERROR_INVALID_USER);           

        
        // generate access token (valid for 1 year)
        $token = JWT::encode([
            'id'    => array_shift($users)['id'],
            'exp'   => time()+60*60*24*365
        ], 
        AUTH_SECRET_KEY);

        return $token;
    }
}