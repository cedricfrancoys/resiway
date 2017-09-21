<?php
defined('__QN_LIB') or die(__FILE__.' cannot be executed directly.');
require_once('../resi.api.php');
$rev = ResiAPI::currentRevision(); 
$token = md5(substr($rev, 12).rand(1, 100));
?>
<!DOCTYPE html>
<html lang="fr" ng-app="resiexchange" id="top" ng-controller="rootController as rootCtrl">
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
        <meta name="title" content="ResiLib - La Biblio résiliente">
        <meta name="description" content="ResiLib bibliothèque collaborative de documents open source pour la diffusion et la réappropriation des savoirs-faires.">

        <link rel="alternate" href="https://www.resiway.org/resilib.fr" hreflang="fr"/>

        <meta name="fragment" content="!">
        <base href="/resilib.fr">
        
        <meta itemscope itemtype="https://schema.org/WebApplication" />        
        <meta itemprop="image" content="https://www.resiway.org/packages/resiway/apps/assets/img/resiway-logo-small.png" />

        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://www.resiway.org/packages/resiway/apps/assets/img/resiway-logo-small.png" />

        <title>ResiLib</title>
        <script>
        if(location.href.indexOf("#/") > 0) {
            location.href = location.href.replace(location.hash,'#!'+location.hash.substr(1));
        }
        </script>
        <!-- favicons -->
        <?php echo file_get_contents("packages/resiexchange/apps/views/parts/favicons.html"); ?>
        <!-- scripts -->
        <?php echo file_get_contents("packages/resiexchange/apps/views/parts/scripts.html"); ?>
        <!-- styles -->
        <?php echo file_get_contents("packages/resiexchange/apps/views/parts/styles.html"); ?>        

        <script src="packages/resiexchange/apps/i18n/moment-locale/fr.js?v=<?php echo $token; ?>"></script>        
        <script src="packages/resiexchange/apps/i18n/locale-fr.js?v=<?php echo $token; ?>"></script>
        <script src="packages/resiexchange/apps/resiexchange.min.js?v=<?php echo $token; ?>"></script>        
        <link rel="stylesheet" type="text/css" href="packages/resiexchange/apps/assets/css/resiexchange.min.css?v=<?php echo $token; ?>" />


        <script>
        var global_config = {
            application: 'resilib',
            locale: 'fr',
            channel: '1'
        };
        </script>
        
    </head>


    <body class="ng-cloak">
        <div id="fb-root"></div>
        
        <div class="sectiontitle ng-hide">ResiLib - La Biblio résiliente</div>
        <title class="ng-hide">ResiLib - La Biblio résiliente</title>
    
        <toast></toast>

        <!-- images preload -->
        <div class="ng-hide">
        <?php
        foreach (glob("packages/resiexchange/apps/assets/img/*") as $filename) {
            echo '<img src="'.$filename.'" width="1" height="1" />'."\n";
        }
        ?>
        </div>
        <!-- common templates in rootScope -->
        <?php
        foreach (glob("packages/resilib/apps/views/*.html") as $filename) {
            echo '<script type="text/ng-template" id="'.basename($filename).'">'."\n";
            echo file_get_contents($filename)."\n";
            echo "</script>\n";
        }
        ?>
        
        <!-- topbar -->
        <?php echo file_get_contents("packages/resiexchange/apps/views/parts/topbar.html"); ?>

        <div id="body">
            <div class="modal-wrapper"></div>
            <div class="container">
                <!-- menu -->
                <?php echo file_get_contents("packages/resilib/apps/views/parts/menu.html"); ?>
                <!-- loader -->
                <div ng-show="viewContentLoading" class="loader"><i class="fa fa-spin fa-spinner" aria-hidden="true"></i></div>
                <div ng-view ng-hide="viewContentLoading"></div>
            </div>
        </div>

        <div id="footer">
            <div class="grid wrapper">
                <div class="container col-1-1">
                    <!-- footer -->
                    <?php echo file_get_contents("packages/resiexchange/apps/views/parts/footer.html"); ?>
                    <span class="small">rev <?php echo $rev; ?></span>
                </div>
            </div>
        </div>
    </body>

</html>