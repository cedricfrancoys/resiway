<?php
defined('__QN_LIB') or die(__FILE__.' cannot be executed directly.');
require_once('../resi.api.php');
$rev = ResiAPI::currentRevision(); 
$token = md5($rev.rand(1, 100));
?>
<!DOCTYPE html>
<html lang="fr" ng-app="resiexchange" id="top" ng-controller="rootController as rootCtrl">
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
        <meta name="title" content="ResiWay - La plateforme pour la résilience">        
        <meta name="description" content="L'AISBL ResiWay propose des outils collaboratifs libres pour la résilience">    

        <link rel="alternate" href="https://www.resiway.org/resiway.fr" hreflang="fr"/>
        
        <meta itemscope itemtype="https://schema.org/WebApplication" />        
        <meta itemprop="image" content="https://www.resiway.org/packages/resiway/apps/assets/img/resiway-logo-small.png" />

        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://www.resiway.org/packages/resiway/apps/assets/img/resiway-logo-small.png" />
        
        <title>ResiWay</title>

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
            application: 'resiway',
            locale: 'fr',
            channel: '1'
        };
        </script>
      
    </head>


    <body class="ng-cloak">
        <div id="fb-root"></div>
        
        <!-- templates in rootScope -->
        <?php
        foreach (glob("packages/resiway/apps/views/*.html") as $filename) {
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
                <?php //echo file_get_contents("packages/resiway/apps/views/parts/menu.html"); ?>
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