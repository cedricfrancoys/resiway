angular.module('resipedia')

.controller('categoryEditController', [
    'category', 
    '$scope', 
    '$rootScope',
    '$window', 
    '$location', 
    'feedbackService', 
    'actionService',
    '$http',
    '$httpParamSerializerJQLike',
    'Upload',    
    function(category, $scope, $rootScope, $window, $location, feedbackService, actionService, $http, $httpParamSerializerJQLike, Upload) {
        console.log('categoryEdit controller');
        
        var ctrl = this;   
       
        // @model
        $scope.category = angular.merge({
                            id: 0,
                            title: '',
                            description: '',
                            parent_id: 0,
                            parent: { id: category.parent_id, title: category['parent_id.title'], path: category['parent_id.path']}
                          }, 
                          category);        

        
        $scope.loadMatches = function(query) {
            if(query.length < 2) return [];
            
            return $http.get('index.php?get=resiway_category_list&channel='+$rootScope.config.channel+'&order=title&'+$httpParamSerializerJQLike({channel: global_config.channel, domain: ['title', 'ilike', '%'+query+'%']}))
            .then(
                function successCallback(response) {
                    var data = response.data;
                    if(typeof data.result != 'object') return [];
                    return data.result;
                },
                function errorCallback(response) {
                    // something went wrong server-side
                    return [];
                }
            );                
        };
        
        // @events
        $scope.$watch('category.parent', function() {
            $scope.category.parent_id = $scope.category.parent.id;   
        });

                
        // @methods
        $scope.categoryPost = function($event) {
            Upload.upload({
                url: 'index.php?do=resiway_category_edit', 
                method: 'POST',                
                data: {
                    channel: $rootScope.config.channel,
                    id: $scope.category.id,
                    title: $scope.category.title,            
                    description: $scope.category.description,
                    parent_id: $scope.category.parent_id, 
                    thumbnail: $scope.category.thumbnail
                }
            });
            
            return;            
            /*
            var selector = feedbackService.selector(angular.element($event.target));                   
            actionService.perform({
                // valid name of the action to perform server-side
                action: 'resiway_category_edit',
                // string representing the data to submit to action handler (i.e.: serialized value of a form)
                data: {
                    channel: $rootScope.config.channel,
                    id: $scope.category.id,
                    title: $scope.category.title,
                    description: $scope.category.description,
                    parent_id: $scope.category.parent_id
                },
                // scope in wich callback function will apply 
                scope: $scope,
                // callback function to run after action completion (to handle error cases, ...)
                callback: function($scope, data) {
                    // we need to do it this way because current controller might be destroyed in the meantime
                    // (if route is changed to signin form)
                    if(typeof data.result != 'object') {
                        // result is an error code
                        var error_id = data.error_message_ids[0];                    
                        // todo : get error_id translation
                        var msg = error_id;
                        if(msg.substr(0, 8) == 'missing_') {
                            msg = 'category_'+msg;
                        }                        
                        feedbackService.popover(selector, msg);
                    }
                    else {
                        $location.path('/categories');
                    }
                }        
            });
            */
        };  
           
    }
]);