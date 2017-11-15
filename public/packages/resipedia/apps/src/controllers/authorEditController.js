angular.module('resipedia')
/**
* Display given author for edition
*
*/
.controller('authorEditController', [
    'author',
    '$scope',
    '$rootScope',
    '$window', 
    '$location', 
    '$sce', 
    'feedbackService', 
    'actionService', 
    '$http',
    '$httpParamSerializerJQLike',
    function(author, $scope, $rootScope, $window, $location, $sce, feedbackService, actionService, $http, $httpParamSerializerJQLike) {
        console.log('authorEdit controller');
        
        var ctrl = this;        
        
        // @model
        // content is inside a textarea and do not need sanitize check
        author.description = $sce.valueOf(author.description);
        
        $scope.author = angular.merge({
                            id: 0,
                            name: '',
                            description: ''
                          }, 
                          author);                          

        // @methods
        $scope.authorPost = function($event) {
            ctrl.running = true;
            var selector = feedbackService.selector(angular.element($event.target));                   
            actionService.perform({
                // valid name of the action to perform server-side
                action: 'resiway_author_edit',
                // string representing the data to submit to action handler (i.e.: serialized value of a form)
                data: {
                    channel: $rootScope.config.channel,
                    id: $scope.author.id,
                    name: $scope.author.name,
                    url: $scope.author.url,                    
                    description: $scope.author.description
                },
                // scope in wich callback function will apply 
                scope: $scope,
                // callback function to run after action completion (to handle error cases, ...)
                callback: function($scope, data) {
                    ctrl.running = false;
                    // we need to do it this way because current controller might be destroyed in the meantime
                    // (if route is changed to signin form)
                    if(typeof data.result != 'object') {
                        // result is an error code
                        var error_id = data.error_message_ids[0];                    
                        // todo : get error_id translation
                        var msg = error_id;
                        // in case a field is missing, adapt the generic 'missing_*' message
                        if(msg.substr(0, 8) == 'missing_') {
                            msg = 'author_'+msg;
                        }
                        feedbackService.popover(selector, msg);
                    }
                    else {
                        var author_id = data.result.id;
                        var author_name = data.result['name_url'];
                        $location.path('/author/'+author_id+'/'+author_name);
                    }
                }        
            });
        };  
           
    }
]);