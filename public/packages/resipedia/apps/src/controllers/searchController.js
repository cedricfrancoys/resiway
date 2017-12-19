angular.module('resipedia')

.controller('searchController', [
    'search', 
    '$scope',
    '$rootScope',
    '$route',
    '$http',
    '$httpParamSerializerJQLike',
    '$window',
    function(search, $scope, $rootScope, $route, $http, $httpParamSerializerJQLike, $window) {
        console.log('search controller');

        
        $scope.getClassFromType = function(type) {
            switch(type) {
            case 'question': return {'fa-comment-o':true};
            case 'article':  return {'fa-file-text-o':true};
            case 'document': return {'fa-book':true};
            }
            return {};
        };
        
        // @init
        var ctrl = this;

        // @data model
        angular.merge(ctrl, {
            search: {
                items: search,
                total: $rootScope.search.total,
                currentPage: 1,
                previousPage: -1,                
                limit: $rootScope.search.criteria.limit
            }
        });        
        
        
        ctrl.load = function(criteria) {
            if(arguments.length && typeof criteria == 'object') {
                angular.extend($rootScope.search.criteria, criteria);
                angular.merge(ctrl, {
                    search: {
                        currentPage: 1,
                        previousPage: -1
                    }
                });                
            }
            if(ctrl.search.currentPage != ctrl.search.previousPage) {
                ctrl.search.previousPage = ctrl.search.currentPage;
                // reset objects list (triggers loader display)
                ctrl.search.items = -1;
                $rootScope.search.criteria.start = (ctrl.search.currentPage-1)*ctrl.search.limit;
                
                $http.get('index.php?get=resiway_search&'+$httpParamSerializerJQLike($rootScope.search.criteria))
                .then(
                    function successCallback(response) {
                        var data = response.data;
                        if(typeof data.result != 'object') {
                            ctrl.search.items = [];
                        }
                        ctrl.search.items = data.result;
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

        
        /*
        * async load and inject $scope.categories and $scope.related_categories
        */
        if(angular.isDefined($rootScope.category)) {            

            $http.get('index.php?get=resiway_category_related&category_id='+$rootScope.category['id'])
            .then(
                function successCallback(response) {
                    var data = response.data;
                    if(typeof data.result == 'object') {
                        $scope.related_categories = data.result;
                    }
                }
            );
            
        }
        
    }
]);