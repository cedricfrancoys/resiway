angular.module('resipedia')

.controller('articlesController', [
    'articles', 
    '$scope',
    '$rootScope',
    '$route',
    '$http',
    '$httpParamSerializerJQLike',
    '$window',
    function(articles, $scope, $rootScope, $route, $http, $httpParamSerializerJQLike, $window) {
        console.log('articles controller');

        var ctrl = this;

        // @data model
        angular.merge(ctrl, {
            articles: {
                items: articles,
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
                
                $http.get('index.php?get=resilexi_article_list&'+$httpParamSerializerJQLike($rootScope.search.criteria))
                .then(
                    function successCallback(response) {
                        var data = response.data;
                        if(typeof data.result != 'object') {
                            ctrl.articles.items = [];
                        }
                        ctrl.articles.items = data.result;
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
                $http.get('index.php?get=resiway_category_related-article&category_id='+category_id)
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
        $http.get('index.php?get=resiway_category_list&channel='+$rootScope.config.channel+'&limit=15&order=count_articles&sort=desc')
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