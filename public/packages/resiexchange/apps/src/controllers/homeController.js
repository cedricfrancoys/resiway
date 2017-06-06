angular.module('resiexchange')

.controller('homeController', ['$http', '$scope', '$rootScope', '$location', 'authenticationService', function($http, $scope, $rootScope, $location, authenticationService) {
    console.log('home controller');  
    
    var ctrl = this;

    ctrl.active_questions = [];
    ctrl.poor_questions = [];  
    ctrl.last_documents = [];

    if(global_config.application == 'resiexchange' && $rootScope.previousPath == '/') {
        authenticationService.userId().then(
        function(user_id) {
            $location.path('/questions');
        });
    }

    
    $http.get('index.php?get=resiway_stats')
    .then(
    function successCallback(response) {
        var data = response.data;
        if(typeof response.data.result == 'object') {
            ctrl.count_questions = parseInt(data.result['resiexchange.count_questions']);
            ctrl.count_answers = parseInt(data.result['resiexchange.count_answers']);
            ctrl.count_comments = parseInt(data.result['resiexchange.count_comments']);
            ctrl.count_documents = data.result['resilib.count_documents'];                                    
            ctrl.count_posts = ctrl.count_questions + ctrl.count_answers + ctrl.count_comments;
            ctrl.count_users = data.result['resiway.count_users'];            
        }
    },
    function errorCallback() {
        // something went wrong server-side
    }); 

    
    $http.get('index.php?get=resiexchange_question_list&order=modified&limit=15&sort=desc')
    .then(
    function successCallback(response) {
        var data = response.data;
        if(typeof response.data.result == 'object') {
            ctrl.active_questions = response.data.result;
        }
    },
    function errorCallback() {
        // something went wrong server-side
    });
    
    $http.get('index.php?get=resiexchange_question_list&order=count_answers&limit=15&sort=asc')
    .then(
    function successCallback(response) {
        var data = response.data;
        if(typeof response.data.result == 'object') {
            ctrl.poor_questions = response.data.result;
        }
    },
    function errorCallback() {
        // something went wrong server-side
    });

    $http.get('index.php?get=resilib_document_list&order=created&limit=10&sort=desc')
    .then(
    function successCallback(response) {
        var data = response.data;
        if(typeof response.data.result == 'object') {
            ctrl.last_documents = response.data.result;
        }
    },
    function errorCallback() {
        // something went wrong server-side
    });
    
    $scope.amount = "5EUR/mois";
    
    $scope.$watch('amount', function (value){
        switch(value) {
            case '5EUR/mois': $scope.amount_dedication = "Aidez une famille à savoir comment manger sain et local";
            break;
            case '10EUR/mois': $scope.amount_dedication = "Offrez aux agriculteurs le moyen de savoir absorber du CO2 au lieu d'en émettre trop";
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