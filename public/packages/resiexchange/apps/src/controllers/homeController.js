angular.module('resiexchange')

.controller('homeController', ['$http', '$scope', '$rootScope', function($http, $scope, $rootScope) {
    console.log('home controller');  
    
    var ctrl = this;

    ctrl.questions = [];
    
    $http.get('index.php?get=resiexchange_stats')
    .then(
    function successCallback(response) {
        var data = response.data;
        if(typeof response.data.result == 'object') {
            ctrl.count_questions = data.result['resiexchange.count_questions'];
            ctrl.count_answers = data.result['resiexchange.count_answers'];
            ctrl.count_comments = data.result['resiexchange.count_comments'];
            ctrl.count_users = data.result['resiway.count_users'];            
        }
    },
    function errorCallback() {
        // something went wrong server-side
    }); 

    $http.get('index.php?get=resiexchange_question_list&order=score&limit=7&sort=desc')
    .then(
    function successCallback(response) {
        var data = response.data;
        if(typeof response.data.result == 'object') {
            ctrl.questions = response.data.result;
        }
    },
    function errorCallback() {
        // something went wrong server-side
    });
    
    $scope.amount = "5EUR/mois";
    
    $scope.$watch('amount', function (value){
        console.log(value);
        switch(value) {
            case '5EUR/mois': $scope.amount_dedication = "Contribuez à ce que chacun puisse fabriquer ses produits d'entretien écologiques";
            break;
            case '10EUR/mois': $scope.amount_dedication = "Offrez aux agriculteurs le moyen de savoir absorber du CO2 au lieu d'en émettre trop";
            break;
            case '25EUR/mois': $scope.amount_dedication = "Participez à la résilience de l'humain vivant en harmonie avec l'environnement dont il dépend";
            break;
            case '25EUR/an': $scope.amount_dedication = "Aidez une famille à savoir comment manger sain et local";
            break;
            case '50EUR/an': $scope.amount_dedication = "Permettez la diffusion de savoirs ancestraux et de nouvelles technologies écologiques";
            break;
            
        }
    });
}]);