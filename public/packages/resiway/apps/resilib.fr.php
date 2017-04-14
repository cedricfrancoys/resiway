<!DOCTYPE html>
<html lang="fr" ng-app="resiexchange" id="top" ng-controller="rootController as rootCtrl">
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
        <meta name="title" content="ResiExchange - Des réponses pour la résilience">
        <meta name="description" content="ResiExchange est une plateforme collaborative open source d'échange d'informations sur les thèmes de l'autonomie, la transition, la permaculture et la résilience.">

        <link rel="alternate" href="https://www.resiway.org/resilib.fr" hreflang="fr"/>
        
        <meta itemscope itemtype="https://schema.org/WebApplication" />        
        <meta itemprop="image" content="https://www.resiway.org/packages/resiway/apps/assets/img/resiway-logo-small.png" />

        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://www.resiway.org/packages/resiway/apps/assets/img/resiway-logo-small.png" />

        
        <title>ResiLib</title>


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
        
        <style>
        #main_iframe {
            position: fixed;
            border: 0;
            top: 33px;;
            left: 0;
            width: 100%;
            height: calc(100% - 32px);  
            z-index: 1;
        }        
        </style>
    </head>
        
    <body class="ng-cloak">
        <!-- topbar -->
        <?php echo file_get_contents("packages/resiexchange/apps/views/parts/topbar.html"); ?>

        <script type="text/ng-template" id="home.html"></script>
        
        <iframe id="main_iframe" src="/resilib.static"></iframe>

    </body>
</html>