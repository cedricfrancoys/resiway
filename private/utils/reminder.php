#!/usr/bin/env php
<?php
/**
 Send a reminder message for users who haven't yet validated their account
*/
use easyobject\orm\ObjectManager as ObjectManager;
use html\HtmlTemplate as HtmlTemplate;
use mail\Swift_SmtpTransport as Swift_SmtpTransport;
use mail\Swift_Mailer as Swift_Mailer;
use mail\Swift_Message as Swift_Message;

// run this script as if it were located in the public folder
chdir('../../public');
set_time_limit(0);

// this utility script uses qinoa library
// and requires file config/config.inc.php
require_once('../qn.lib.php');
require_once('../resi.api.php');
config\export_config();

set_silent(true);

list($result, $error_message_ids) = [true, []];

try {
    $om = &ObjectManager::getInstance();

    $last_week = date("Y-m-d H:i:s", mktime( date("H"), date("i"), date("s"), date("n"), date("j")-7, date("Y") ));

    $ids = $om->search('resiway\User', [['verified', '=', '0'], ['created', '<=', $last_week], ['last_login', '=', '0000-00-00 00:00:00']]);

    if($ids > 0 && count($ids) > 0) {

        $objects = $om->read('resiway\User', $ids, ['firstname', 'login', 'password', 'language']);

        foreach($objects as $user_id => $user_data) {
            
            // subject of the email should be defined in the template, as a <var> tag holding a 'title' attribute
            $subject = '';
            // read template according to user prefered language
            $file = "packages/resiway/i18n/{$user_data['language']}/mail_user_confirm_reminder.html";
            if(!($html = @file_get_contents($file, FILE_TEXT))) throw new Exception("action_failed", QN_ERROR_UNKNOWN);
            $template = new HtmlTemplate($html, [
                                        'subject'		=>	function ($params, $attributes) use(&$subject) {
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
                                            
            // send email
            $transport = Swift_SmtpTransport::newInstance(EMAIL_SMTP_HOST, EMAIL_SMTP_PORT, "ssl")
                        ->setUsername(EMAIL_SMTP_ACCOUNT_USERNAME)
                        ->setPassword(EMAIL_SMTP_ACCOUNT_PASSWORD);

            $message = Swift_Message::newInstance($subject)
                        ->setFrom(array(EMAIL_SMTP_ACCOUNT_USERNAME => 'ResiWay'))
                        ->setTo(array($user_data['login']))
                        // some webmail require a text/plain part as default content
                        ->setBody($body)
                        // in most cases, if a text/html part is found it will be displayed by default
                        ->addPart($body, 'text/html');
                        
            $mailer = Swift_Mailer::newInstance($transport);

            $mailer->send($message);

            // store sending date into last_login                        
            $om->write('resiway\User', $user_id, ['last_login' => date('Y-m-d H:i:s')]);
        }
    }
    else $error_message_ids = ['no match'];
}
catch(Exception $e) {
    $result = $e->getCode();
    $error_message_ids = array($e->getMessage());
}

header('Content-type: application/json; charset=UTF-8');
echo json_encode([
        'result'            => $result, 
        'error_message_ids' => $error_message_ids
    ], 
    JSON_PRETTY_PRINT);