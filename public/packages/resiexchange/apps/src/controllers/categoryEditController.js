angular.module('resiexchange')

.controller('categoryEditController', [
    'category', 
    'categories', 
    '$scope', 
    '$window', 
    '$location', 
    'feedbackService', 
    'actionService',
    function(category, categories, $scope, $window, $location, feedbackService, actionService) {
        console.log('categoryEdit controller');
        
        var ctrl = this;   
       
        // @model
        $scope.category = category;
        $scope.categories = categories;
        
        // set initial parent 
        angular.forEach(categories, function(cat, index) {
            if(cat.id == $scope.category.parent_id) {
                $scope.category.parent = cat; 
            }
        });       
        
        // @events
        $scope.$watch('category.parent', function() {
            $scope.category.parent_id = $scope.category.parent.id;   
        });

        // @methods
        $scope.categoryPost = function($event) {
            var selector = feedbackService.selector(angular.element($event.target));                   
            actionService.perform({
                // valid name of the action to perform server-side
                action: 'resiway_category_edit',
                // string representing the data to submit to action handler (i.e.: serialized value of a form)
                data: {
                    category_id: $scope.category.id,
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
        };  
           
    }
]);