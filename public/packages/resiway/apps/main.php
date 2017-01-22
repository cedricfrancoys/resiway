<?php
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
                                    )
                        )
    )
);

$pdm = &PersistentDataManager::getInstance();
// assign specified language to current session
$pdm->set('lang', $params['lang']);    
        
if(isset($_COOKIE['username']) && isset($_COOKIE['password'])) {
    ResiAPI::userSign(json_decode($_COOKIE['username']), json_decode($_COOKIE['password']));
}

?>
<!DOCTYPE html>
<html lang="<?php echo $params['lang']; ?>" ng-app="resiway" id="top" ng-controller="rootController as rootCtrl">
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
        <meta name="description" content="">    
        <link rel="icon" href="assets/favicon.ico" />
        <title>ResiWay</title>

        <script src="packages/resiway/apps/assets/js/moment.min.js"></script>
        <script src="packages/resiway/apps/assets/js/md5.js"></script>
        
        <script src="packages/resiway/apps/assets/js/angular.min.js"></script>
        <script src="packages/resiway/apps/assets/js/angular-animate.min.js"></script>
        <script src="packages/resiway/apps/assets/js/angular-touch.min.js"></script>
        <script src="packages/resiway/apps/assets/js/angular-sanitize.js"></script>
        <script src="packages/resiway/apps/assets/js/angular-cookies.js"></script>
        <script src="packages/resiway/apps/assets/js/angular-route.min.js"></script>    
        <script src="packages/resiway/apps/assets/js/angular-translate.min.js"></script>
        <script src="packages/resiway/apps/assets/js/angular-moment.min.js"></script>        
        
        <script src="packages/resiway/apps/assets/js/ui-bootstrap-tpls-2.2.0.min.js"></script>    
        
        <script src='packages/resiway/apps/assets/js/textAngular-rangy.min.js'></script>
        <script src='packages/resiway/apps/assets/js/textAngular-sanitize.min.js'></script>
        <script src='packages/resiway/apps/assets/js/textAngular.min.js'></script>   
        
        <script src='packages/resiway/apps/assets/js/select-tpls.min.js'></script>
        <?php if(file_exists("packages/resiway/apps/i18n/locale-{$params['lang']}.js")): ?>
        <script src="packages/resiway/apps/i18n/locale-<?php echo $params['lang'] ?>.js"></script>           
        <?php endif; ?>        
        <?php if(file_exists("packages/resiway/apps/i18n/moment-locale/{$params['lang']}.js")): ?>
        <script src="packages/resiway/apps/i18n/moment-locale/<?php echo $params['lang'] ?>.js"></script>   
        <?php endif; ?>
        
        <script src="packages/resiway/apps/resiway.min.js"></script>
        
        <link rel="stylesheet" type="text/css" href="packages/resiway/apps/assets/css/bootstrap.min.css" />
        <link rel="stylesheet" type="text/css" href="packages/resiway/apps/assets/css/font-awesome.min.css" />
        <link rel="stylesheet" type="text/css" href="packages/resiway/apps/assets/css/resiway.min.css" />

        <script>
            var global_config = {
                    locale: '<?php echo $params['lang']; ?>'
            };
        </script>
    </head>


    <body class="ng-cloak">
        <!-- templates in rootScope -->
        <?php
        foreach (glob("packages/resiway/apps/views/partials/*.html") as $filename) {
            echo file_get_contents($filename);
        }    
        ?>
        <!-- topbar -->
        <?php echo file_get_contents("packages/resiway/apps/views/topbar.html"); ?>

        <div id="body">   
            <div class="modal-wrapper"></div>
            <div class="container">
                <!-- menu -->
                <?php echo file_get_contents("packages/resiway/apps/views/menu.html"); ?>
                <div ng-show="viewContentLoading" class="loader"><i class="fa fa-spin fa-spinner" aria-hidden="true"></i></div>
                <div ng-view ng-hide="viewContentLoading"></div>
            </div>
        </div>

        <div id="footer">
            <div class="grid wrapper">
                <div class="container col-1-1">
                    <!-- footer -->
                    <?php echo file_get_contents("packages/resiway/apps/views/footer.html"); ?>
                </div>
            </div>
        </div>    
    </body>
    
</html>