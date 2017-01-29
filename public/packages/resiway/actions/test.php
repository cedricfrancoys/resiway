<?php
defined('__QN_LIB') or die(__FILE__.' cannot be executed directly.');

use config\QNlib as QNLib;
use easyobject\orm\ObjectManager as ObjectManager;
use html\HtmlTemplate as HtmlTemplate;
use mail\Swift_SmtpTransport as Swift_SmtpTransport;
use mail\Swift_Mailer as Swift_Mailer;
use mail\Swift_Message as Swift_Message;

define('MAIL_SMTP_HOST', 'smtp.ovh.net');
define('MAIL_SMTP_PORT', '446');
define('MAIL_USERNAME', 'cedricfrancoys@gmail.com');
define('MAIL_PASSWORD', '');

$params = ['code' => 'dGVzdGVyQGV4YW1wbGUuY29tOzAwMDAwMDAwYzU1OWMyNTA0N2JiNjk2OGMzYTE3NzQz'];
$template = '
<p>
Bonjour <var id="username"></var>,<br />
<br />
Ceci est un message automatique envoyé depuis resiway.org suite à une demande de réinitialisation de mot de passe.<br />
Si vous n\'êtes pas à l\'origine de cette requête, ignorez simplement ce message.<br />
<br />
Si vous souhaitez continuer et définir un nouveau mot de passe maintenant, veuillez cliquer sur le lien ci-dessous.<br /> 
</p>

';

$template = new HtmlTemplate($template, [
                                'username'		=>	function ($params) {
                                                        return 'cedric';
                                                    },
                                'confirm_url'	=>	function ($params) {
                                                        return "<a href=\"http://resiway.gdn/resiexchange.fr#/user/confirm/{$params['code']}\">Valider mon adresse email</a>";
                                                        return "<a href=\"http://resiway.gdn/resiexchange.fr#/user/password/{$params['code']}\">Modifier mon mot de passe</a>";
                                                    }
                            ], 
                            $params);
                            
$body = $template->getHtml();
    
$to = 'cedricfrancoys@gmail.com';
$subject = '';

try {
    $transport = Swift_SmtpTransport::newInstance(MAIL_SMTP_HOST, MAIL_SMTP_PORT, "ssl")
                ->setUsername(MAIL_USERNAME)
                ->setPassword(MAIL_PASSWORD);
                
    $mailer = Swift_Mailer::newInstance($transport);

    $message = Swift_Message::newInstance($subject)
                ->setFrom(array(MAIL_USERNAME => 'ResiExchange'))
                ->setTo(array($to))
                ->setBody($body);

    if($result = $mailer->send($message)) {
        
    }
}
catch(Exception $e) {
}

print($body);