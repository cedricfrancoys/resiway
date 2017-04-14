<?php
defined('__QN_LIB') or die(__FILE__.' cannot be executed directly.');
require_once('../resi.api.php');

use config\QNlib as QNLib;
use easyobject\orm\ObjectManager as ObjectManager;
use html\HtmlTemplate as HtmlTemplate;


set_silent(false);

$om = &ObjectManager::getInstance();

$last_week = date("Y-m-d H:i:s", mktime( date("H"), date("i"), date("s"), date("n"), date("j")-7, date("Y") ));

$ids = $om->search('resiway\User', [['verified', '=', '0'], ['created', '<=', $last_week], ['last_login', '<=', $last_week]]);

if($ids > 0 && count($ids) > 0) {

    $objects = $om->read('resiway\User', $ids, ['firstname', 'login', 'password', 'language']);

        foreach($objects as $user_id => $user_data) {
            
            // subject of the email should be defined in the template, as a <var> tag holding a 'title' attribute
            $subject = '';
            // read template according to user prefered language
            $file = "packages/resiway/i18n/{$user_data['language']}/mail_user_confirm_reminder.html";
            if(!($html = @file_get_contents($file, FILE_TEXT))) throw new Exception("action_failed", QN_ERROR_UNKNOWN);
            $template = new HtmlTemplate($html, [
                                        'subject'		=>	function ($params, $attributes) {
                                                                global $subject;
                                                                $subject = $attributes['title'];
                                                                return '';
                                                            },
                                        'username'		=>	function ($params, $attributes) {
                                                                return $params['firstname'];
                                                            },
                                        'confirm_url'	=>	function ($params, $attributes) {
                                                                $code = ResiAPI::credentialsEncode($params['login'],$params['password']);
                                                                $url = "https://www.resiway.org/resiexchange.fr"."#/user/confirm/{$code}";
                                                                return "<a href=\"$url\">{$attributes['title']}</a>";
                                                            }
                                        ], 
                                        $user_data);
            // parse template as html
            $body = $template->getHtml();
                        
                        echo $subject;
                        echo $body;
                        echo "<br />\n";
                        
            // send email


            // store last_login                        
            //$om->write('resiway\User', $user_id, ['last_login' => date('Y-m-d H:i:s')]);
        }
}
else echo 'no match';
