<?php
/* main.php - default app for resiexchange platform.

    This file is part of the resiway program <http://www.github.com/cedricfrancoys/resiway>
    Copyright (C) ResiWay.org, 2017
    Some Right Reserved, GNU GPL 3 license <http://www.gnu.org/licenses/>
*/

// Dispatcher (index.php) is in charge of setting the context and should include easyObject library
defined('__QN_LIB') or die(__FILE__.' cannot be executed directly.');
use config\QNLib as QNLib;
use easyobject\orm\PersistentDataManager as PersistentDataManager;

require_once('../resi.api.php');

// force silent mode (debug output would corrupt json data)
set_silent(true);

// announce script and fetch parameters values
$params = QNLib::announce(	
	array(	
    'description'	=>	"Returns a list of log objects matching the received criteria",
    'params' 		=>	array(                                         
                        'lang'	=> array(
                                    'description'   => 'Language in which UI has to be displayed.',
                                    'type'          => 'string',
                                    'default'       => 'fr'
                                    ),
                        'channel'	=> array(
                                    'description'   => 'Channel from which to request data.',
                                    'type'          => 'integer',
                                    'default'       => 1
                                    )                                    
                        )
    )
);

$pdm = &PersistentDataManager::getInstance();
// assign specified language and channel to current session
$pdm->set('lang', $params['lang']);
$pdm->set('channel', $params['channel']);
        
if(isset($_COOKIE['username']) && isset($_COOKIE['password'])) {
    // ResiAPI::userSign(json_decode($_COOKIE['username']), json_decode($_COOKIE['password']));
    ResiAPI::userSign($_COOKIE['username'], $_COOKIE['password']);
}

?>
<!DOCTYPE html>
<html lang="<?php echo $params['lang']; ?>" ng-app="resiexchange" id="top" ng-controller="rootController as rootCtrl">
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
        <meta name="title" content="ResiExchange - Des réponses pour la résilience">
        <meta name="description" content="ResiExchange est une plateforme collaborative open source d'échange d'informations sur les thèmes de l'autonomie, la transition, la permaculture et la résilience.">    
        <link rel="apple-touch-icon" sizes="57x57" href="/packages/resiway/apps/assets/icons/apple-icon-57x57.png">
        <link rel="apple-touch-icon" sizes="60x60" href="/packages/resiway/apps/assets/icons/apple-icon-60x60.png">
        <link rel="apple-touch-icon" sizes="72x72" href="/packages/resiway/apps/assets/icons/apple-icon-72x72.png">
        <link rel="apple-touch-icon" sizes="76x76" href="/packages/resiway/apps/assets/icons/apple-icon-76x76.png">
        <link rel="apple-touch-icon" sizes="114x114" href="/packages/resiway/apps/assets/icons/apple-icon-114x114.png">
        <link rel="apple-touch-icon" sizes="120x120" href="/packages/resiway/apps/assets/icons/apple-icon-120x120.png">
        <link rel="apple-touch-icon" sizes="144x144" href="/packages/resiway/apps/assets/icons/apple-icon-144x144.png">
        <link rel="apple-touch-icon" sizes="152x152" href="/packages/resiway/apps/assets/icons/apple-icon-152x152.png">
        <link rel="apple-touch-icon" sizes="180x180" href="/packages/resiway/apps/assets/icons/apple-icon-180x180.png">
        <link rel="icon" type="image/png" sizes="192x192" href="/packages/resiway/apps/assets/icons/android-icon-192x192.png">
        <link rel="icon" type="image/png" sizes="32x32"   href="/packages/resiway/apps/assets/icons/favicon-32x32.png">
        <link rel="icon" type="image/png" sizes="96x96"   href="/packages/resiway/apps/assets/icons/favicon-96x96.png">
        <link rel="icon" type="image/png" sizes="16x16"   href="/packages/resiway/apps/assets/icons/favicon-16x16.png">
        <title>ResiExchange</title>

        <script src="packages/resiexchange/apps/assets/js/moment.min.js"></script>
        <script src="packages/resiexchange/apps/assets/js/md5.js"></script>
        
        <script src="packages/resiexchange/apps/assets/js/angular.min.js"></script>
        <script src="packages/resiexchange/apps/assets/js/angular-animate.min.js"></script>
        <script src="packages/resiexchange/apps/assets/js/angular-touch.min.js"></script>
        <script src="packages/resiexchange/apps/assets/js/angular-sanitize.js"></script>
        <script src="packages/resiexchange/apps/assets/js/angular-cookies.js"></script>
        <script src="packages/resiexchange/apps/assets/js/angular-route.min.js"></script>    
        <script src="packages/resiexchange/apps/assets/js/angular-translate.min.js"></script>
        <script src="packages/resiexchange/apps/assets/js/angular-moment.min.js"></script>        
        
        <script src="packages/resiexchange/apps/assets/js/ui-bootstrap-tpls-2.2.0.min.js"></script>    
        
        <script src='packages/resiexchange/apps/assets/js/textAngular-rangy.min.js'></script>
        <script src='packages/resiexchange/apps/assets/js/textAngular-sanitize.min.js'></script>
        <script src='packages/resiexchange/apps/assets/js/textAngular.min.js'></script>   
        
        <script src='packages/resiexchange/apps/assets/js/ngToast.min.js'></script>
        
        <script src='packages/resiexchange/apps/assets/js/select-tpls.min.js'></script>
        <?php if(file_exists("packages/resiexchange/apps/i18n/locale-{$params['lang']}.js")): ?>
        <script src="packages/resiexchange/apps/i18n/locale-<?php echo $params['lang'] ?>.js"></script>           
        <?php endif; ?>        
        <?php if(file_exists("packages/resiexchange/apps/i18n/moment-locale/{$params['lang']}.js")): ?>
        <script src="packages/resiexchange/apps/i18n/moment-locale/<?php echo $params['lang'] ?>.js"></script>   
        <?php endif; ?>
        
        <script src="packages/resiexchange/apps/resiexchange.js"></script>
        
        <link rel="stylesheet" type="text/css" href="packages/resiexchange/apps/assets/css/bootstrap.min.css" />
        <link rel="stylesheet" type="text/css" href="packages/resiexchange/apps/assets/css/font-awesome.min.css" />
        <link rel="stylesheet" type="text/css" href="packages/resiexchange/apps/assets/css/ngToast.min.css" />      
        <link rel="stylesheet" type="text/css" href="packages/resiexchange/apps/assets/css/ngToast-animations.min.css" />      
        <link rel="stylesheet" type="text/css" href="packages/resiexchange/apps/assets/css/resiexchange.min.css" />

        <script>
            var global_config = {
                    locale: '<?php echo $params['lang']; ?>',
                    channel: '<?php echo $params['channel']; ?>'
            };
        </script>
        <script>
          (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
          (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
          m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
          })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
          ga('create', 'UA-93932085-1', 'auto');
          ga('send', 'pageview');
        </script>        
    </head>


    <body class="ng-cloak">
        <toast></toast>
        <!-- templates in rootScope -->
        <?php
        foreach (glob("packages/resiexchange/apps/views/partials/*.html") as $filename) {
            echo file_get_contents($filename);
        }    
        ?>
        <!-- topbar -->
        <?php echo file_get_contents("packages/resiexchange/apps/views/topbar.html"); ?>

        <div id="body">   
            <div class="modal-wrapper"></div>
            <div class="container">
                <!-- menu -->
                <?php echo file_get_contents("packages/resiexchange/apps/views/menu.html"); ?>
                <div ng-show="viewContentLoading" class="loader"><i class="fa fa-spin fa-spinner" aria-hidden="true"></i></div>
                <div ng-view ng-hide="viewContentLoading"></div>
            </div>
        </div>

        <div id="footer">
            <div class="grid wrapper">
                <div class="container col-1-1">
                    <!-- footer -->
                    <?php echo file_get_contents("packages/resiexchange/apps/views/footer.html"); ?>
                    <span class="small">rev <?php echo ResiAPI::currentRevision(); ?></span>                    
                </div>
            </div>
        </div>    
    </body>
    
</html>