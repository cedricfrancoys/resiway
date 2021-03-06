#!/usr/bin/env php
<?php
/**
 Force spool to send all pending emails
*/
use easyobject\orm\ObjectManager as ObjectManager;
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

$messages_folder = '../spool';

list($result, $error_message_ids) = [true, []];

set_silent(false);

try {
    $files = scandir($messages_folder);
        
    // first pass: group messages by user_id (to send all notifications since last flush at once)
    $spool = [];
    
    foreach($files as $file) {
        if(in_array($file, ['.', '..'])) continue;
        
        // extract user identifier
        $user_id = intval(explode('.', $file)[0]);
        
        // wrong file format
        if($user_id == 0) continue;
        
        // retrieve file full path
        $filename = $messages_folder.'/'.$file;
        
        if(!isset($spool[$user_id])) $spool[$user_id] = [];
        $spool[$user_id][] = $filename;
    }

    $now = time();
    foreach($spool as $user_id => $filenames) { 
        // retrieve user data
        $user_data = ResiAPI::loadUserPrivate($user_id);
        if($user_data < 0) throw new Exception(sprintf("user_unidentified (%d, %s)", $user_id, $file), QN_ERROR_NOT_ALLOWED);   
        
        // skip users for whom we haven't reached custom delay since last sending
        if( ($now - strtotime($user_data['last_notice'])) < ($user_data['notice_delay'] * 24 * 60 * 60) ) continue;
        
        // group content from all files        
        $subject = '';
        $content = '';
        $count_notifications = count($filenames);
        if($count_notifications > 1) {
            $subject = 'ResiWay - activité sur ton compte';
        }        
        // build content
        foreach($filenames as $filename) {
            // read file content
            if( !($json = @file_get_contents($filename, FILE_TEXT)) ) continue;
            $params = json_decode($json, true);

            if(!isset($params['subject']) || !isset($params['body'])) {
                unlink($filename); 
                continue;
            }
            
            if($count_notifications > 1) {
                $content .= '<b>'.$params['subject']."</b><br />\n";
                $content .= $params['body']."<br /><br />\n";
            }
            else {
                $subject = 'ResiWay - '.$params['subject'];
                $content = $params['body'];
            }
        }       
        
        // append a notice to all mails sent by resiway
        $email_notice = ResiAPI::getUserNotification('mail_notice', $user_data['language'], ['user'=>$user_data]);
        $content .= $email_notice['body'];

        $transport = Swift_SmtpTransport::newInstance(EMAIL_SMTP_HOST, EMAIL_SMTP_PORT, "ssl")
                    ->setUsername(EMAIL_SMTP_ACCOUNT_USERNAME)
                    ->setPassword(EMAIL_SMTP_ACCOUNT_PASSWORD);

        $message = Swift_Message::newInstance($subject)
                    ->setFrom(array(EMAIL_SMTP_ACCOUNT_USERNAME => 'ResiWay'))
                    ->setTo(array($user_data['login']))
                    // some webmail require a text/plain part as default content
                    ->setBody($content)
                    // in most cases, if a text/html part is found it will be displayed by default
                    ->addPart($content, 'text/html');
                    
        $mailer = Swift_Mailer::newInstance($transport);

        $mailer->send($message);
        
        // update user last_notice field
        $om = &ObjectManager::getInstance();  
        $om->write('resiway\User', $user_id, [ 'last_notice' => date("Y-m-d H:i:s") ]);
        
        // append info to activity log
        $log = sprintf("%s @ %s, mail sent to user %011d (%s) : %s\n", date('Y-m-d'), date('H:i:s'), $user_id, $user_data['login'], $params['subject']);
        file_put_contents(QN_LOG_STORAGE_DIR.'/mail.log', $log, FILE_APPEND);        
        
        // remove processed files   
        foreach($filenames as $filename) {                        
            unlink($filename);    
        }
    }
}
catch(Exception $e) {
    $result = $e->getCode();
    $error_message_ids = array($e->getMessage());
}

// send json result
echo json_encode([
        'result'            => $result, 
        'error_message_ids' => $error_message_ids
    ], 
    JSON_PRETTY_PRINT);