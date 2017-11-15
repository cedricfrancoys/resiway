angular.module('resipedia')

.controller('documentsController', [
    'documents', 
    '$scope',
    '$rootScope',
    '$route',
    '$http',
    '$httpParamSerializerJQLike',
    '$window',
    function(documents, $scope, $rootScope, $route, $http, $httpParamSerializerJQLike, $window) {
        console.log('documents controller');

        var ctrl = this;

        // @data model
        angular.merge(ctrl, {
            documents: {
                items: documents,
                total: $rootScope.search.total,
                currentPage: 1,
                previousPage: -1,                
                limit: $rootScope.search.criteria.limit
            }
        });

        ctrl.load = function() {
            if(ctrl.documents.currentPage != ctrl.documents.previousPage) {
                ctrl.documents.previousPage = ctrl.documents.currentPage;
                // reset objects list (triggers loader display)
                ctrl.documents.items = -1;
                $rootScope.search.criteria.start = (ctrl.documents.currentPage-1)*ctrl.documents.limit;
                
                $http.get('index.php?get=resilib_document_list&'+$httpParamSerializerJQLike($rootScope.search.criteria))
                .then(
                    function successCallback(response) {
                        var data = response.data;
                        if(typeof data.result != 'object') {
                            ctrl.documents.items = [];
                        }
                        ctrl.documents.items = data.result;
                        $window.scrollTo(0, 0);
                    },
                    function errorCallback(response) {
                        // something went wrong server-side
                        return [];
                    }
                );
            }
        };            

        // @async loads
        ctrl.categories = [];
        
        // store categories list in controller, if any
        angular.forEach($rootScope.search.criteria.domain, function(clause, i) {
            if(clause[0] == 'categories_ids') {
                $scope.related_categories = [];
                if(typeof clause[2] != 'object') {
                    clause[2] = [clause[2]];
                }
                ctrl.categories = clause[2];
            }
        });
        
        /*
        * async load and inject $scope.categories and $scope.related_categories
        */
        if(ctrl.categories.length > 0) {
            $http.get('index.php?get=resiway_category_list&channel='+$rootScope.config.channel+'&'+$httpParamSerializerJQLike({domain: ['id', 'in', ctrl.categories]}))
            .then(
                function successCallback(response) {
                    var data = response.data;
                    if(typeof data.result == 'object') {
                        $scope.categories = data.result;
                    }
                }
            );
            angular.forEach(ctrl.categories, function(category_id, j) {
                $http.get('index.php?get=resiway_category_related-document&category_id='+category_id)
                .then(
                    function successCallback(response) {
                        var data = response.data;
                        if(typeof data.result == 'object') {
                            $scope.related_categories = data.result;
                        }
                    }
                );
                
            });
        }
        
        /*
        * async load and inject $scope.categories and $scope.featured_categories
        */
        $http.get('index.php?get=resiway_category_list&channel='+$rootScope.config.channel+'&limit=15&order=count_documents&sort=desc')
        .then(
            function successCallback(response) {
                var data = response.data;
                if(typeof data.result == 'object') {
                    $scope.featured_categories = data.result;
                }
            }
        );
        
    }
]);