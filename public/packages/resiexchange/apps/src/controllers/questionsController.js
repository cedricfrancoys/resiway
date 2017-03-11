angular.module('resiexchange')

.controller('questionsController', [
    'questions', 
    '$scope',
    '$rootScope',
    '$route',
    '$http',
    function(questions, $scope, $rootScope, $route, $http) {
        console.log('questions controller');

        var ctrl = this;

        // @data model
        ctrl.questions = questions;

        $scope.doSearch = function(criteria) {
            // update global criteria            
            angular.extend($rootScope.search.criteria, criteria);
            // go to questions list page
            $route.reload();           
        };
        
        $http.get('index.php?get=resiexchange_stats')
        .then(
        function successCallback(response) {
            var data = response.data;
            if(typeof response.data.result == 'object') {
                ctrl.count_questions = data.result['resiexchange.count_questions'];
                ctrl.count_answers = data.result['resiexchange.count_answers'];
                ctrl.count_comments = data.result['resiexchange.count_comments'];
            }
        },
        function errorCallback() {
            // something went wrong server-side
        });                  
        
    }
]);