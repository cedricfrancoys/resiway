<!DOCTYPE html>
<html lang="fr" ng-app="resiexchange" id="top" ng-controller="rootController as rootCtrl">
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
        <meta name="title" content="Ekopedia - L'encyclo écolo">
        <meta name="description" content="Ékopédia est une encyclopédie pratique gratuite pour intégrer l'écologie à son quotidien.">

        <link rel="alternate" href="https://www.resiway.org/ekopedia.fr" hreflang="fr"/>
        <meta name="fragment" content="!">
        <base href="/ekopedia.fr">
        
        <meta itemscope itemtype="https://schema.org/WebApplication" />        
        <meta itemprop="image" content="https://www.ekopedia.fr/resources/assets/wiki.png?17a3b" />

        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://www.ekopedia.fr/resources/assets/wiki.png?17a3b" />
        
        <title>EkoPedia</title>

        <!-- favicons -->
        <?php echo file_get_contents("packages/resiexchange/apps/views/parts/favicons.html"); ?>
        <!-- scripts -->
        <?php echo file_get_contents("packages/resiexchange/apps/views/parts/scripts.html"); ?>
        <!-- styles -->
        <?php echo file_get_contents("packages/resiexchange/apps/views/parts/styles.html"); ?>        

        <script src="packages/resiexchange/apps/i18n/moment-locale/fr.js"></script>        
        <script src="packages/resiexchange/apps/i18n/locale-fr.js"></script>
        <script src="packages/resiexchange/apps/resiexchange.min.js"></script>        
        <link rel="stylesheet" type="text/css" href="packages/resiexchange/apps/assets/css/resiexchange.min.css" />


        <script>
        var global_config = {
            application: 'ekopedia',
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

        <iframe id="main_iframe" src="https://www.ekopedia.fr/wiki/Accueil"></iframe>

    </body>
</html>