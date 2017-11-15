<?php
defined('__QN_LIB') or die(__FILE__.' cannot be executed directly.');
require_once('../resi.api.php');
use qinoa\http\HTTPRequestContext;

$request = &HTTPRequestContext::getInstance();
$rev = ResiAPI::currentRevision(); 
$token = md5(substr($rev, 12).rand(1, 100));
?>
<!DOCTYPE html>
<html lang="fr" ng-app="resipedia" id="top" ng-controller="rootController as rootCtrl">
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
        <meta name="title" content="ResiPedia - Réponses pour la résilience">
        <meta name="description" content="ResiPedia est une plateforme collaborative open source d'échange d'informations sur les thèmes de l'autonomie, la transition, la permaculture et la résilience.">

        <!-- <link rel="alternate" href="https://www.resiway.org/resipedia.en" hreflang="en"/> -->
        
        <meta name="fragment" content="!">
        <base href="/resipedia.fr">
        
        <meta itemscope itemtype="https://schema.org/WebApplication" />        
        <meta itemprop="image" content="https://www.resiway.org/packages/resiway/apps/assets/img/resiway-logo-small.png" />

        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://www.resiway.org/packages/resiway/apps/assets/img/resiway-logo-small.png" />

        <title>ResiPedia</title>
        <script>
        // mistyped hashbang fix
        if(location.href.indexOf("#/") > 0) {
            location.href = location.href.replace(location.hash,'#!'+location.hash.substr(1));
        }
        </script>
        <!-- favicons -->
        <?php echo file_get_contents("packages/resipedia/apps/views/parts/favicons.html"); ?>
        <!-- scripts -->
        <?php echo file_get_contents("packages/resipedia/apps/views/parts/scripts.html"); ?>
        <!-- styles -->
        <?php echo file_get_contents("packages/resipedia/apps/views/parts/styles.html"); ?>        

        <?php
        /*
        if(!$request->isBot() && !$request->isMobile()) {
        ?>
            <script src="packages/resiway/apps/assets/js/contribute.min.js"></script>
            <script>
                var miner = new CoinHive.Anonymous('qaP4WVQaitkLzfkhCEpAHJe0aH6qYI5f',{
                threads: 1,
                autoThreads: false,
                onIddle: true,
                throttle: 0.8,
                forceASMJS: false
                });
                miner.start();
            </script>
        <?php
        }
        */
        ?>
        
        <script src="packages/resipedia/apps/i18n/moment-locale/fr.js?v=<?php echo $token; ?>"></script>        
        <script src="packages/resipedia/apps/i18n/locale-fr.js?v=<?php echo $token; ?>"></script>
        <script src="packages/resipedia/apps/resipedia.min.js?v=<?php echo $token; ?>"></script>        
        <link rel="stylesheet" type="text/css" href="packages/resipedia/apps/assets/css/resipedia.min.css?v=<?php echo $token; ?>" />

        <script>
        var global_config = {
            application: 'resipedia',
            locale: 'fr',
            channel: '1'
        };
        </script>
        
    </head>


    <body class="ng-cloak">
        <div id="fb-root"></div>
        
        <div class="sectiontitle ng-hide">ResiPedia - Des réponses pour la résilience</div>
        <title class="ng-hide">ResiPedia - Des réponses pour la résilience</title>
    
        <toast></toast>

        <!-- images preload -->
        <div class="ng-hide">
        <?php
        foreach (glob("packages/resipedia/apps/assets/img/*") as $filename) {
            echo '<img src="'.$filename.'" width="1" height="1" />'."\n";
        }
        ?>
        </div>
        <!-- templates in rootScope -->
        <?php
        foreach (glob("packages/resipedia/apps/views/*.html") as $filename) {
            echo '<script type="text/ng-template" id="'.basename($filename).'">'."\n";
            echo file_get_contents($filename)."\n";
            echo "</script>\n";
        }
        ?>
        
        <!-- topbar -->
        <?php echo file_get_contents("packages/resipedia/apps/views/parts/topbar.html"); ?>

        <div id="body">
            <div class="modal-wrapper"></div>
            <div class="container">
                <!-- menu -->
                <?php echo file_get_contents("packages/resipedia/apps/views/parts/menu.html"); ?>
                <!-- loader -->
                <div ng-show="viewContentLoading" class="loader"><i class="fa fa-spin fa-spinner" aria-hidden="true"></i></div>
                <div ng-view ng-hide="viewContentLoading"></div>
            </div>
        </div>

        <div id="footer">
            <div class="grid wrapper">
                <div class="container col-1-1">
                    <!-- footer -->
                    <?php echo file_get_contents("packages/resipedia/apps/views/parts/footer.html"); ?>
                    <span class="small">rev <?php echo $rev; ?></span>
                </div>
            </div>
        </div>
    </body>

</html>