<?php
defined('__QN_LIB') or die(__FILE__.' cannot be executed directly.');

use config\QNlib as QNLib;
use easyobject\orm\ObjectManager as ObjectManager;
use html\HtmlTemplate as HtmlTemplate;




$params = [
    'code' => 'dGVzdGVyQGV4YW1wbGUuY29tOzAwMDAwMDAwYzU1OWMyNTA0N2JiNjk2OGMzYTE3NzQz',
    'increment' => '+5'
    ];
$template = '
<var id="subject" title="test"></var>
<p>
Bonjour <var id="username"></var>,<br />
<br />
<var if="false">always shown</var>
<var if="score &gt; 0">score greater than 0</var>
<var if="increment &lt; 0">increment lower than 0</var><var if="increment &gt; 0">increment greater than 0</var>
<br />
Ceci est un message automatique envoyé depuis resiway.org suite à une demande de réinitialisation de mot de passe.<br />
Si vous n\'êtes pas à l\'origine de cette requête, ignorez simplement ce message.<br />
<br />
Si vous souhaitez continuer et définir un nouveau mot de passe maintenant, veuillez cliquer sur le lien ci-dessous.<br /> 
</p>

';

$template = new HtmlTemplate($template, [
                                'subject'		=>	function ($params, $attributes) {
                                                        return $attributes['title'];
                                                    },
                                'score'		    =>	function ($params) {
                                                        return '+5';
                                                    },
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
    


print($body);