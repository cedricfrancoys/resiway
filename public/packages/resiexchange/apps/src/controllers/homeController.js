angular.module('resiexchange')

.controller('homeController', ['$http', '$rootScope', function($http, $rootScope) {
    var ctrl = this;

    console.log('home controller');  
    
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

    $http.get('index.php?get=resiexchange_question_list&order=count_answers&limit=5&sort=asc')
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
}]);