angular.module('resipedia')

.controller('categoriesController', [
    '$scope',
    '$rootScope',    
    '$http',
    'actionService',
    'feedbackService',
    function($scope, $rootScope, $http, actionService, feedbackService) {
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
        
        // @methods
        $scope.begin = function (commit, previous) {
            $scope.committed = false;
            // make a copy of previous state
            $scope.previous = angular.merge({}, previous);
            // commit transaction (can be rolled back to previous state if something goes wrong)
            commit($scope);
            // prevent further commits (commit functions are in charge of checking this var)
            $scope.committed = true;
        };
        
        $scope.rollback = function () {
            if(angular.isDefined($scope.previous) && typeof $scope.previous == 'object') {
                angular.merge($scope.question, $scope.previous);
            }
        };
        
        $scope.categoryStar = function ($event, index) {

            // normalize : make sure impacted properties are set
            if(!angular.isDefined(ctrl.config.items[index].history)) {
                ctrl.config.items[index].history = {};
            }            
            if(!angular.isDefined(ctrl.config.items[index].history['resiway_category_star'])) {
                ctrl.config.items[index].history['resiway_category_star'] = false;
            }
            // define transaction
            var commit = function ($scope) {
                // prevent action if it has already been committed
                if(!angular.isDefined($scope.committed) || !$scope.committed) {

                    // update current state to new values
                    if(ctrl.config.items[index].history['resiway_category_star'] === true) {
                        ctrl.config.items[index].history['resiway_category_star'] = false;
                        ctrl.config.items[index].count_stars--;
                    }
                    else {
                        ctrl.config.items[index].history['resiway_category_star'] = true;
                        ctrl.config.items[index].count_stars++;
                    }
                }
            };

            // set previous state and begin transaction
            $scope.begin(commit, 
                         { 
                            history: {
                                resiway_category_star: ctrl.config.items[index].history['resiway_category_star']
                            },
                            count_stars: ctrl.config.items[index].count_stars            
                         });    
            
            // remember selector for popover location
            var selector = feedbackService.selector($event.target);
            
            actionService.perform({
                // valid name of the action to perform server-side
                action: 'resiway_category_star',
                // string representing the data to submit to action handler (i.e.: serialized value of a form)
                data: {category_id: ctrl.config.items[index].id},
                // scope in wich callback function will apply 
                scope: $scope,
                // callback function to run after action completion (to handle error cases, ...)
                callback: function($scope, data) {
                    // we need to do it this way because current controller might be destroyed in the meantime
                    // toggle related entries in current history
                    if(data.result < 0) {
                        // rollback
                        $scope.rollback();
                        
                        // result is an error code
                        var error_id = data.error_message_ids[0];                    
                        // todo : get error_id translation
                        var msg = error_id;
                        feedbackService.popover(selector, msg);                    
                    }                
                    else {
                        // commit if it hasn't been done already
                        commit($scope);
                    }
                }        
            });
        }; 
        
        // @init
        ctrl.load(ctrl.config);
        
    }
]);