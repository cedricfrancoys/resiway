angular.module('resiexchange')

.controller('questionsController', [
    'questions', 
    '$scope',
    '$rootScope',
    '$route',
    '$http',
    '$httpParamSerializerJQLike',
    '$window',
    function(questions, $scope, $rootScope, $route, $http, $httpParamSerializerJQLike, $window) {
        console.log('questions controller');

        var ctrl = this;

        // @data model
        angular.merge(ctrl, {
            questions: {
                items: questions,
                total: $rootScope.search.total,
                currentPage: 1,
                previousPage: -1,                
                limit: $rootScope.search.criteria.limit
            }
        });

        ctrl.load = function() {
            if(ctrl.questions.currentPage != ctrl.questions.previousPage) {
                ctrl.questions.previousPage = ctrl.questions.currentPage;
                // reset objects list (triggers loader display)
                ctrl.questions.items = -1;
                $rootScope.search.criteria.start = (ctrl.questions.currentPage-1)*ctrl.questions.limit;
                
                $http.get('index.php?get=resiexchange_question_list&'+$httpParamSerializerJQLike($rootScope.search.criteria))
                .then(
                    function successCallback(response) {
                        var data = response.data;
                        if(typeof data.result != 'object') {
                            ctrl.questions.items = [];
                        }
                        ctrl.questions.items = data.result;
                        $window.scrollTo(0, 0);
                    },
                    function errorCallback(response) {
                        // something went wrong server-side
                        return [];
                    }
                );
            }
        };            
        
    }
]);