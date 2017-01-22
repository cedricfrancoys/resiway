angular.module('resiway')
/**
* Display given question for edition
*
*/
.controller('questionEditController', [
    'question', 
    'categories', 
    '$scope', 
    '$window', 
    '$location', 
    '$sce', 
    'feedbackService', 
    'actionService', 
    'textAngularManager',
    function(question, categories, $scope, $window, $location, $sce, feedbackService, actionService, textAngularManager) {
        console.log('questionEdit controller');
        
        var ctrl = this;   

        // @view
        $scope.categories = categories; 
        
        // @model
        $scope.question = question;
        
        /**
        * tags_ids is a many2many field, so as initial setting we mark all ids to be removed
        */
        // save initial tags_ids
        $scope.initial_tags_ids = [];
        angular.forEach($scope.question.tags, function(tag, index) {
            $scope.initial_tags_ids.push('-'+tag.id);
        });
        
        // @events
        $scope.$watch('question.tags', function() {
            // reset selection
            $scope.question.tags_ids = angular.copy($scope.initial_tags_ids);
            angular.forEach($scope.question.tags, function(tag, index) {
                $scope.question.tags_ids.push('+'+tag.id);
            });
        });

        // @methods
        $scope.questionPost = function($event) {
            var selector = feedbackService.selector(angular.element($event.target));                   
            actionService.perform({
                // valid name of the action to perform server-side
                action: 'resiexchange_question_edit',
                // string representing the data to submit to action handler (i.e.: serialized value of a form)
                data: {
                    question_id: (angular.isUndefined($scope.question.id)?0:$scope.question.id),
                    title: $scope.question.title,
                    content: $scope.question.content,
                    tags_ids: $scope.question.tags_ids
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
                        feedbackService.popover(selector, msg);
                    }
                    else {
                        var question_id = data.result.id;
                        $location.path('/question/'+question_id);
                    }
                }        
            });
        };  
           
    }
]);