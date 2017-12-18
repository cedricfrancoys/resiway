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
        
        
        ctrl.load = function() {
            if(ctrl.articles.currentPage != ctrl.articles.previousPage) {
                ctrl.articles.previousPage = ctrl.articles.currentPage;
                // reset objects list (triggers loader display)
                ctrl.articles.items = -1;
                $rootScope.search.criteria.start = (ctrl.articles.currentPage-1)*ctrl.articles.limit;
                
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

        $scope.getClassFromType = function(type) {
            switch(type) {
            case 'question': return {'fa-comment-o':true};
            case 'article':  return {'fa-file-text-o':true};
            case 'document': return {'fa-book':true};
            }
            return {};
        }
    }
]);