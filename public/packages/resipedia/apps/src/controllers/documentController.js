angular.module('resipedia')

/**
 * document controller
 *
 */
.controller('documentController', [
    'document', 
    '$scope', 
    '$window',
    '$location',
    '$http',    
    '$sce', 
    '$timeout', 
    '$uibModal', 
    'actionService', 
    'feedbackService', 
    function(document, $scope, $window, $location, $http, $sce, $timeout, $uibModal, actionService, feedbackService) {
        console.log('document controller');
        
        var ctrl = this;

        // @model
        $scope.document = document;

        
        /*
        * async load and inject $scope.related_documents
        */
        $scope.related_documents = [];
        $http.get('index.php?get=resilib_document_related&document_id='+document.id)
        .then(
            function (response) {
                $scope.related_documents = response.data.result;
            }
        );

        ctrl.toURL = function (str) {
            var output = new String(str);
            return output.toURL();
        };
        
        ctrl.openModal = function (title_id, header_id, content, template) {
            return $uibModal.open({
                animation: true,
                ariaLabelledBy: 'modal-title',
                ariaDescribedBy: 'modal-body',
                templateUrl: template || 'modalCustom.html',
                controller: ['$uibModalInstance', function ($uibModalInstance, items) {
                    var ctrl = this;
                    ctrl.title_id = title_id;
                    ctrl.header_id = header_id;
                    ctrl.body = content;
                    
                    ctrl.ok = function () {
                        $uibModalInstance.close();
                    };
                    ctrl.cancel = function () {
                        $uibModalInstance.dismiss();
                    };
                }],
                controllerAs: 'ctrl', 
                size: 'md',
                appendTo: angular.element($window.document.querySelector(".modal-wrapper")),
                resolve: {
                    items: function () {
                      return ctrl.items;
                    }
                }
            }).result;
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
                angular.merge($scope.document, $scope.previous);
            }
        };
        
        $scope.documentComment = function($event) {

            // remember selector for popover location 
            var selector = feedbackService.selector($event.target);
            
            actionService.perform({
                // valid name of the action to perform server-side
                action: 'resilib_document_comment',
                // string representing the data to submit to action handler (i.e.: serialized value of a form)
                data: {
                    document_id: $scope.document.id,
                    content: $scope.document.newCommentContent
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
                        var comment_id = data.result.id;
                        // add new comment to the list
                        $scope.document.comments.push(data.result);
                        $scope.document.newCommentShow = false;
                        $scope.document.newCommentContent = '';
                        // wait for next digest cycle
                        $timeout(function() {
                            // scroll to newly created comment
                            feedbackService.popover('#comment-'+comment_id, '');
                        });
                    }
                }        
            });
        };

        $scope.documentFlag = function ($event) {

            // define transaction
            var commit = function ($scope) {
                // prevent action if it has already been committed
                if(!angular.isDefined($scope.committed) || !$scope.committed) {
                    // make sure impacted properties are set
                    if(!angular.isDefined($scope.document.history['resilib_document_flag'])) {
                        $scope.document.history['resilib_document_flag'] = false;
                    }
                    // update current state to new values
                    if($scope.document.history['resilib_document_flag'] === true) {
                        $scope.document.history['resilib_document_flag'] = false;
                    }
                    else {
                        $scope.document.history['resilib_document_flag'] = true;
                    }
                }
            };

            // set previous state and begin transaction
            $scope.begin(commit, 
                         { 
                            history: {
                                resilib_document_flag: $scope.document.history['resilib_document_flag'] 
                            }
                         });     
            
            // remember selector for popover location        
            var selector = feedbackService.selector($event.target);
            
            actionService.perform({
                // valid name of the action to perform server-side
                action: 'resilib_document_flag',
                // string representing the data to submit to action handler (i.e.: serialized value of a form)
                data: {
                        document_id: $scope.document.id
                },
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
                        commit($scope);
                    }
                }        
            });
        };

         
        
        $scope.documentVoteUp = function ($event) {            

            // normalize : make sure impacted properties are set
            if(!angular.isDefined($scope.document.history['resilib_document_votedown'])) {
                $scope.document.history['resilib_document_votedown'] = false;
            }
            if(!angular.isDefined($scope.document.history['resilib_document_voteup'])) {
                $scope.document.history['resilib_document_voteup'] = false;
            }           
            // define transaction
            var commit = function ($scope) {
                // prevent action if it has already been committed
                if(!angular.isDefined($scope.committed) || !$scope.committed) {                 
                    // update current state to new values
                    if($scope.document.history['resilib_document_voteup'] === true) {
                        // toggle voteup
                        $scope.document.history['resilib_document_voteup'] = false;
                        $scope.document.score--;
                    }
                    else {
                        // undo votedown
                        if($scope.document.history['resilib_document_votedown'] === true) {
                            $scope.document.history['resilib_document_votedown'] = false;
                            $scope.document.score++;
                        }
                        // voteup
                        $scope.document.history['resilib_document_voteup'] = true;
                        $scope.document.score++;
                    }
                }
            };

            // set previous state and begin transaction
            $scope.begin(commit, 
                         {
                            history: {
                                resilib_document_votedown: $scope.document.history['resilib_document_votedown'],
                                resilib_document_voteup:   $scope.document.history['resilib_document_voteup']                        
                            },
                            score: $scope.document.score
                         });
                         
            // remember selector for popover location    
            var selector = feedbackService.selector($event.target);
            
            actionService.perform({
                // valid name of the action to perform server-side
                action: 'resilib_document_voteup',
                // string representing the data to submit to action handler (i.e.: serialized value of a form)
                data: {document_id: $scope.document.id},
                // scope in wich callback function will apply 
                scope: $scope,
                // callback function to run after action completion (to handle error cases, ...)
                callback: function($scope, data) {
                    // we need to do it this way because current controller might be destroyed in the meantime
                    // (if route is changed to signin form)
                    if(data.result >= 0) {
                        // commit if it hasn't been done already
                        commit($scope);
                        if(data.result === true) feedbackService.popover(selector, 'DOCUMENT_ACTIONS_VOTEUP_OK', 'info', true);
                        // $scope.document.history['resilib_document_voteup'] = true;
                        // $scope.document.score++;
                    }
                    else {
                        // rollback
                        $scope.rollback();
                        
                        // result is an error code
                        var error_id = data.error_message_ids[0];                    
                        // todo : get error_id translation
                        var msg = error_id;
                        
                        feedbackService.popover(selector, msg);

                    }
                }        
            });
        };
        
        $scope.documentVoteDown = function ($event) {

            // normalize : make sure impacted properties are set
            if(!angular.isDefined($scope.document.history['resilib_document_votedown'])) {
                $scope.document.history['resilib_document_votedown'] = false;
            }
            if(!angular.isDefined($scope.document.history['resilib_document_voteup'])) {
                $scope.document.history['resilib_document_voteup'] = false;
            }           
            // define transaction
            var commit = function ($scope) {
                // prevent action if it has already been committed
                if(!angular.isDefined($scope.committed) || !$scope.committed) {                                 
                    // update current state to new values
                    if($scope.document.history['resilib_document_votedown'] === true) {
                        // toggle votedown
                        $scope.document.history['resilib_document_votedown'] = false;
                        $scope.document.score++;
                    }
                    else {
                        // undo voteup
                        if($scope.document.history['resilib_document_voteup'] === true) {
                            $scope.document.history['resilib_document_voteup'] = false;
                            $scope.document.score--;
                        }
                        // votedown
                        $scope.document.history['resilib_document_votedown'] = true;
                        $scope.document.score--;
                    }
                }
            };

            // set previous state and begin transaction
            $scope.begin(commit, 
                         {
                            history: {
                                resilib_document_votedown: $scope.document.history['resilib_document_votedown'],
                                resilib_document_voteup:   $scope.document.history['resilib_document_voteup']                        
                            },
                            score: $scope.document.score
                         });
                         
            // remember selector for popover location
            var selector = feedbackService.selector($event.target);
            
            actionService.perform({
                // valid name of the action to perform server-side
                action: 'resilib_document_votedown',
                // string representing the data to submit to action handler (i.e.: serialized value of a form)
                data: {document_id: $scope.document.id},
                // scope in wich callback function will apply 
                scope: $scope,
                // callback function to run after action completion (to handle error cases, ...)
                callback: function($scope, data) {
                    // we need to do it this way because current controller might be destroyed in the meantime
                    // toggle related entries in current history
                    if(data.result >= 0) {
                        // commit if it hasn't been done already
                        commit($scope);
                    }
                    else {
                        // rollback
                        $scope.rollback();
                        
                        // result is an error code
                        var error_id = data.error_message_ids[0];                    
                        // todo : get error_id translation
                        var msg = error_id;
                        feedbackService.popover(selector, msg);                    
                    }
                }        
            });
        };    

        $scope.documentStar = function ($event) {

            // normalize : make sure impacted properties are set
            if(!angular.isDefined($scope.document.history['resilib_document_star'])) {
                $scope.document.history['resilib_document_star'] = false;
            }
            // define transaction
            var commit = function ($scope) {
                // prevent action if it has already been committed
                if(!angular.isDefined($scope.committed) || !$scope.committed) {

                    // update current state to new values
                    if($scope.document.history['resilib_document_star'] === true) {
                        $scope.document.history['resilib_document_star'] = false;
                        $scope.document.count_stars--;
                    }
                    else {
                        $scope.document.history['resilib_document_star'] = true;
                        $scope.document.count_stars++;
                    }
                }
            };

            // set previous state and begin transaction
            $scope.begin(commit, 
                         { 
                            history: {
                                resilib_document_star: $scope.document.history['resilib_document_star']
                            },
                            count_stars: $scope.document.count_stars            
                         });    
            
            // remember selector for popover location
            var selector = feedbackService.selector($event.target);
            
            actionService.perform({
                // valid name of the action to perform server-side
                action: 'resilib_document_star',
                // string representing the data to submit to action handler (i.e.: serialized value of a form)
                data: {document_id: $scope.document.id},
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

        $scope.documentCommentVoteUp = function ($event, index) {
            // normalize : make sure impacted properties are set
            if(!angular.isDefined($scope.document.comments[index].history['resilib_documentcomment_voteup'])) {
                $scope.document.comments[index].history['resilib_documentcomment_voteup'] = false;
            }    
            // define transaction
            var commit = function ($scope) {
                // prevent action if it has already been committed
                if(!angular.isDefined($scope.committed) || !$scope.committed) {                                   
                    // update current state to new values
                    if($scope.document.comments[index].history['resilib_documentcomment_voteup'] === true) {
                        $scope.document.comments[index].history['resilib_documentcomment_voteup'] = false;
                        $scope.document.comments[index].score--;
                    }
                    else {
                        $scope.document.comments[index].history['resilib_documentcomment_voteup'] = true;
                        $scope.document.comments[index].score++;
                    }
                }
            };
            
            // set previous state and begin transaction
            $scope.begin(commit, { comments: $scope.document.comments });
            
            // remember selector for popover location            
            var selector = feedbackService.selector($event.target);
            
            actionService.perform({
                // valid name of the action to perform server-side
                action: 'resilib_documentcomment_voteup',
                // string representing the data to submit to action handler (i.e.: serialized value of a form)
                data: {
                        comment_id: $scope.document.comments[index].id
                },
                // scope in wich callback function will apply 
                scope: $scope,
                // callback function to run after action completion (to handle error cases, ...)
                callback: function($scope, data) {
                    // we need to do it this way because current controller might be destroyed in the meantime
                    // toggle related entries in current history
                    if(data.result < 0) {
                        // rollback transaction
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

        $scope.documentCommentFlag = function ($event, index) {
            // normalize : make sure impacted properties are set
            if(!angular.isDefined($scope.document.comments[index].history['resilib_documentcomment_flag'])) {
                $scope.document.comments[index].history['resilib_documentcomment_flag'] = false;
            }  
                    
            // define transaction
            var commit = function ($scope) {
                // prevent action if it has already been committed
                if(!angular.isDefined($scope.committed) || !$scope.committed) {                    
                  
                    // update current state to new values (toggle flag)
                    if($scope.document.comments[index].history['resilib_documentcomment_flag'] === true) {
                        $scope.document.comments[index].history['resilib_documentcomment_flag'] = false;
                    }
                    else {
                        $scope.document.comments[index].history['resilib_documentcomment_flag'] = true;
                    }
                }
            };
            
            // set previous state and begin transaction
            $scope.begin(commit, { comments: $scope.document.comments });
            
            // remember selector for popover location             
            var selector = feedbackService.selector($event.target);
            
            actionService.perform({
                // valid name of the action to perform server-side
                action: 'resilib_documentcomment_flag',
                // string representing the data to submit to action handler (i.e.: serialized value of a form)
                data: {
                        comment_id: $scope.document.comments[index].id
                },
                // scope in wich callback function will apply 
                scope: $scope,
                // callback function to run after action completion (to handle error cases, ...)
                callback: function($scope, data) {
                    // we need to do it this way because current controller might be destroyed in the meantime
                    // toggle related entries in current history
                    if(data.result < 0) {
                        // rollback transaction
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

        $scope.documentCommentEdit = function ($event, index) {
                       
            // remember selector for popover location 
            var selector = feedbackService.selector($event.target);

            actionService.perform({
                // valid name of the action to perform server-side
                action: 'resilib_documentcomment_edit',
                // string representing the data to submit to action handler (i.e.: serialized value of a form)
                data: {
                        comment_id: $scope.document.comments[index].id,
                        content: $scope.document.comments[index].content
                },
                // scope in wich callback function will apply 
                scope: $scope,
                // callback function to run after action completion (to handle error cases, ...)
                callback: function($scope, data) {
                    // we need to do it this way because current controller might be destroyed in the meantime
                    // toggle related entries in current history
                    if(data.result < 0) {
                        // rollback transaction
                        $scope.rollback();
                        
                        // result is an error code
                        var error_id = data.error_message_ids[0];                    
                        // todo : get error_id translation
                        var msg = error_id;
                        feedbackService.popover(selector, msg);                    
                    }                
                    else {
                        $scope.document.comments[index].editMode = false;
                    }
                }        
            });
        };


        $scope.documentCommentDelete = function ($event, index) {
            
            // remember selector for popover location 
            var selector = feedbackService.selector($event.target);
            
            ctrl.openModal('MODAL_COMMENT_DELETE_TITLE', 'MODAL_COMMENT_DELETE_HEADER', $scope.document.comments[index].content)
            .then(
                function () {
                    actionService.perform({
                        // valid name of the action to perform server-side
                        action: 'resilib_documentcomment_delete',
                        // string representing the data to submit to action handler (i.e.: serialized value of a form)
                        data: {comment_id: $scope.document.comments[index].id},
                        // scope in wich callback function will apply 
                        scope: $scope,
                        // callback function to run after action completion (to handle error cases, ...)
                        callback: function($scope, data) {
                            // we need to do it this way because current controller might be destroyed in the meantime
                            // (if route is changed to signin form)
                            if(data.result === true) {                  
                                // update view
                                $scope.document.comments.splice(index, 1);
                            }
                            else if(data.result === false) { 
                                // deletion toggle : we shouldn't reach this point with this controller
                            }
                            else {
                                // result is an error code
                                var error_id = data.error_message_ids[0];                    
                                // todo : get error_id translation
                                var msg = error_id;
                                feedbackService.popover(selector, msg);
                            }
                        }        
                    });
                }
            );     
        };

        
        $scope.documentDelete = function ($event) {
            
            // remember selector for popover location 
            var selector = feedbackService.selector($event.target);
            
            ctrl.openModal('MODAL_DOCUMENT_DELETE_TITLE', 'MODAL_DOCUMENT_DELETE_HEADER', $scope.document.title)
            .then(
                function () {
                    actionService.perform({
                        // valid name of the action to perform server-side
                        action: 'resilib_document_delete',
                        // string representing the data to submit to action handler (i.e.: serialized value of a form)
                        data: {document_id: $scope.document.id},
                        // scope in wich callback function will apply 
                        scope: $scope,
                        // callback function to run after action completion (to handle error cases, ...)
                        callback: function($scope, data) {
                            // we need to do it this way because current controller might be destroyed in the meantime
                            // (if route is changed to signin form)
                            if(data.result === true) {                  
                                // go back to documents list
                                $location.path('/documents');
                            }
                            else if(data.result === false) { 
                                // deletion toggle : we shouldn't reach this point with this controller
                            }
                            else {
                                // result is an error code
                                var error_id = data.error_message_ids[0];                    
                                // todo : get error_id translation
                                var msg = error_id;
                                feedbackService.popover(selector, msg);
                            }
                        }        
                    });
                }
            );     
        };

        
        $scope.showShareModal = function() {

            return $uibModal.open({
                animation: true,
                ariaLabelledBy: 'modal-title',
                ariaDescribedBy: 'modal-body',
                templateUrl: 'documentShareModal.html',
                controller: ['$uibModalInstance', function ($uibModalInstance, items) {
                    var ctrl = this;
                    ctrl.title_id = 'Partager';

                    $uibModalInstance.document = $scope.document;
                    
                    ctrl.ok = function () {
                        $uibModalInstance.close();
                    };
                    ctrl.cancel = function () {
                        $uibModalInstance.dismiss();
                    };
                }],
                controllerAs: 'ctrl', 
                scope: $scope,
                size: 'md',
                appendTo: angular.element($window.document.querySelector(".modal-wrapper"))
            }).result;

        };
        
    }
]);