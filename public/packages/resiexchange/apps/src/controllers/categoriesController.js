angular.module('resiexchange')

.controller('categoriesController', [
    '$scope',
    '$rootScope',    
    '$http',
    function($scope, $rootScope, $http) {
        console.log('categories controller');

        var ctrl = this;
        
        // @data model
        ctrl.config = {
            items: [],
            total: -1,
            currentPage: 1,
            previousPage: -1,
            limit: 30,
            domain: [],
            loading: true
        };

        switch($rootScope.config.application) {
        case 'resiexchange':
            ctrl.config.domain = ['count_questions', '>', '0'];
            break;
        case 'resilib':
            ctrl.config.domain = ['count_documents', '>', '0'];            
            break;
        }
        
        ctrl.load = function(config) {
            if(config.currentPage != config.previousPage) {
                config.previousPage = config.currentPage;
                // trigger loader display
                if(config.total > 0) {
                    config.loading = true;
                }
                $http.post('index.php?get=resiway_category_list&channel='+$rootScope.config.channel, {
                    domain: config.domain,
                    start: (config.currentPage-1)*config.limit,
                    limit: config.limit,
                    total: config.total
                }).then(
                function successCallback(response) {
                    var data = response.data;
                    config.items = data.result;
                    config.total = data.total;
                    config.loading = false;
                },
                function errorCallback() {
                    // something went wrong server-side
                });
            }
        };
        
        
        // @init
        ctrl.load(ctrl.config);
        
    }
]);