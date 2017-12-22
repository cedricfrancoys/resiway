angular.module('resipedia')

.controller('homeController', ['$http', '$scope', '$rootScope', '$location', 'authenticationService', function($http, $scope, $rootScope, $location, authenticationService) {
    console.log('home controller');  
    
    var ctrl = this;

    ctrl.active_questions = [];
    ctrl.poor_questions = [];  
    ctrl.last_documents = [];

    /*
    // redirect to questions list if already logged in ?
    if(global_config.application == 'resiexchange' && $rootScope.previousPath == '/') {
        authenticationService.userId().then(
        function(user_id) {
            $location.path('/questions');
        });
    }
    */
    
    // note : maintain item count with number of .row children in #home-carousel
    var slides = $scope.slides = [{}, {}, {}];
    
    $scope.recent_activity = { actions: [] };
    $http.get('index.php?get=resiway_actionlog_recent')
    .then(
    function success(response) {
        var data = response.data;
        if(typeof response.data.result == 'object') {
            $scope.recent_activity.actions = response.data.result;
        }
    },
    function error() {
        // something went wrong server-side
    });

    
    $http.get('index.php?get=resiway_stats')
    .then(
    function success(response) {
        var data = response.data;
        if(typeof response.data.result == 'object') {
            ctrl.count_questions = parseInt(data.result['resiexchange.count_questions']);
            ctrl.count_answers = parseInt(data.result['resiexchange.count_answers']);
            ctrl.count_comments = parseInt(data.result['resiexchange.count_comments']);
            ctrl.count_comments += parseInt(data.result['resilib.count_comments']);
            ctrl.count_comments += parseInt(data.result['resilexi.count_comments']);            
            ctrl.count_documents = parseInt(data.result['resilib.count_documents']);
            ctrl.count_articles = parseInt(data.result['resilib.count_documents']);            
            ctrl.count_posts = ctrl.count_questions + ctrl.count_answers + ctrl.count_articles + ctrl.count_comments;
            ctrl.count_users = parseInt(data.result['resiway.count_users']);
        }
    },
    function error() {
        // something went wrong server-side
    }); 

    
    $http.get('index.php?get=resiexchange_question_list&order=modified&limit=15&sort=desc')
    .then(
    function success(response) {
        var data = response.data;
        if(typeof response.data.result == 'object') {
            ctrl.active_questions = response.data.result;
        }
    },
    function error() {
        // something went wrong server-side
    });
    
    $http.get('index.php?get=resiexchange_question_list&order=count_answers&limit=15&sort=asc')
    .then(
    function success(response) {
        var data = response.data;
        if(typeof response.data.result == 'object') {
            ctrl.poor_questions = response.data.result;
        }
    },
    function error() {
        // something went wrong server-side
    });

    $http.get('index.php?get=resilib_document_list&order=count_stars&limit=10&sort=desc')
    .then(
    function success(response) {
        var data = response.data;
        if(typeof response.data.result == 'object') {
            ctrl.last_documents = response.data.result;
        }
    },
    function error() {
        // something went wrong server-side
    });
    
    $scope.amount = "5EUR/mois";
    
    $scope.$watch('amount', function (value){
        switch(value) {
            case '5EUR/mois': $scope.amount_dedication = "Aidez une famille à savoir comment manger sain et local";
            break;
            case '10EUR/mois': $scope.amount_dedication = "Offrez aux agriculteurs les moyens d'absorber du CO2 au lieu d'en émettre trop";
            break;
            case '25EUR/mois': $scope.amount_dedication = "Participez à la résilience de l'humain vivant en harmonie avec l'environnement dont il dépend";
            break;
            case '25EUR/an': $scope.amount_dedication = "Contribuez à ce que chacun puisse fabriquer ses produits d'entretien écologiques";
            break;
            case '50EUR/an': $scope.amount_dedication = "Permettez la diffusion de savoirs ancestraux et de nouvelles technologies écologiques";
            break;
        }
    });
}]);