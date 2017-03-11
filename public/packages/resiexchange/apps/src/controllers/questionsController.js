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
        
                         
        
    }
]);