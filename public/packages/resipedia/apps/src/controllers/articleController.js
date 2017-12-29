angular.module('resipedia')

/**
 * article controller
 *
 */
.controller('articleController', [
    'article', 
    '$scope', 
    '$window',
    '$location',
    '$http',    
    '$sce', 
    '$timeout', 
    '$uibModal', 
    'actionService', 
    'feedbackService', 
    function(article, $scope, $window, $location, $http, $sce, $timeout, $uibModal, actionService, feedbackService) {
        console.log('article controller');
        
        var ctrl = this;

        // @model
        if(angular.isDefined(article.articles)) {
            $scope.term = article;
            $scope.article = article.articles[0];
        }
        else {
            $scope.term = {
                id: null,
                title: article.title,
                title_url: article.title_url,
                articles: [ article ]
            };
            $scope.article = article;
        }
        

        
        /*
        * async load and inject $scope.related_articles
        */
        $scope.related_articles = [];
        $http.get('index.php?get=resilexi_article_related&article_id='+$scope.article.id)
        .then(
            function (response) {
                $scope.related_articles = response.data.result;
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
                angular.merge($scope.term, $scope.previous);
            }
        };
        
        $scope.articleComment = function($event, index) {

            // remember selector for popover location 
            var selector = feedbackService.selector($event.target);
            
            actionService.perform({
                // valid name of the action to perform server-side
                action: 'resilexi_article_comment',
                // string representing the data to submit to action handler (i.e.: serialized value of a form)
                data: {
                    article_id: $scope.term.articles[index].id,
                    content: $scope.term.articles[index].newCommentContent
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
                        $scope.term.articles[index].comments.push(data.result);
                        $scope.term.articles[index].newCommentShow = false;
                        $scope.term.articles[index].newCommentContent = '';
                        // wait for next digest cycle
                        $timeout(function() {
                            // scroll to newly created comment
                            feedbackService.popover('#comment-'+$scope.term.articles[index].id+'-'+comment_id, '');
                        });
                    }
                }        
            });
        };

        $scope.articleFlag = function ($event, index) {

            // define transaction
            var commit = function ($scope) {
                // prevent action if it has already been committed
                if(!angular.isDefined($scope.committed) || !$scope.committed) {
                    // make sure impacted properties are set
                    if(!angular.isDefined($scope.term.articles[index].history['resilexi_article_flag'])) {
                        $scope.term.articles[index].history['resilexi_article_flag'] = false;
                    }
                    // update current state to new values
                    if($scope.term.articles[index].history['resilexi_article_flag'] === true) {
                        $scope.term.articles[index].history['resilexi_article_flag'] = false;
                    }
                    else {
                        $scope.term.articles[index].history['resilexi_article_flag'] = true;
                    }
                }
            };

            // set previous state and begin transaction
            $scope.begin(commit, { articles: $scope.term.articles });   
            
            // remember selector for popover location        
            var selector = feedbackService.selector($event.target);
            
            actionService.perform({
                // valid name of the action to perform server-side
                action: 'resilexi_article_flag',
                // string representing the data to submit to action handler (i.e.: serialized value of a form)
                data: {
                        article_id: $scope.term.articles[index].id
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

         
        
        $scope.articleVoteUp = function ($event, index) {            

            // normalize : make sure impacted properties are set
            if(!angular.isDefined($scope.term.articles[index].history['resilexi_article_votedown'])) {
                $scope.term.articles[index].history['resilexi_article_votedown'] = false;
            }
            if(!angular.isDefined($scope.term.articles[index].history['resilexi_article_voteup'])) {
                $scope.term.articles[index].history['resilexi_article_voteup'] = false;
            }           
            // define transaction
            var commit = function ($scope) {
                // prevent action if it has already been committed
                if(!angular.isDefined($scope.committed) || !$scope.committed) {                 
                    // update current state to new values
                    if($scope.term.articles[index].history['resilexi_article_voteup'] === true) {
                        // toggle voteup
                        $scope.term.articles[index].history['resilexi_article_voteup'] = false;
                        $scope.term.articles[index].score--;
                    }
                    else {
                        // undo votedown
                        if($scope.term.articles[index].history['resilexi_article_votedown'] === true) {
                            $scope.term.articles[index].history['resilexi_article_votedown'] = false;
                            $scope.term.articles[index].score++;
                        }
                        // voteup
                        $scope.term.articles[index].history['resilexi_article_voteup'] = true;
                        $scope.term.articles[index].score++;
                    }
                }
            };

            // set previous state and begin transaction
            $scope.begin(commit, { articles: $scope.term.articles });
                         
            // remember selector for popover location    
            var selector = feedbackService.selector($event.target);
            
            actionService.perform({
                // valid name of the action to perform server-side
                action: 'resilexi_article_voteup',
                // string representing the data to submit to action handler (i.e.: serialized value of a form)
                data: {article_id: $scope.term.articles[index].id},
                // scope in wich callback function will apply 
                scope: $scope,
                // callback function to run after action completion (to handle error cases, ...)
                callback: function($scope, data) {
                    // we need to do it this way because current controller might be destroyed in the meantime
                    // (if route is changed to signin form)
                    if(data.result >= 0) {
                        // commit if it hasn't been done already
                        commit($scope);
                        if(data.result === true) feedbackService.popover(selector, 'ARTICLE_ACTIONS_VOTEUP_OK', 'info', true);
                        // $scope.term.articles[index].history['resilexi_article_voteup'] = true;
                        // $scope.term.articles[index].score++;
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
        
        $scope.articleVoteDown = function ($event, index) {

            // normalize : make sure impacted properties are set
            if(!angular.isDefined($scope.term.articles[index].history['resilexi_article_votedown'])) {
                $scope.term.articles[index].history['resilexi_article_votedown'] = false;
            }
            if(!angular.isDefined($scope.term.articles[index].history['resilexi_article_voteup'])) {
                $scope.term.articles[index].history['resilexi_article_voteup'] = false;
            }           
            // define transaction
            var commit = function ($scope) {
                // prevent action if it has already been committed
                if(!angular.isDefined($scope.committed) || !$scope.committed) {                                 
                    // update current state to new values
                    if($scope.term.articles[index].history['resilexi_article_votedown'] === true) {
                        // toggle votedown
                        $scope.term.articles[index].history['resilexi_article_votedown'] = false;
                        $scope.term.articles[index].score++;
                    }
                    else {
                        // undo voteup
                        if($scope.term.articles[index].history['resilexi_article_voteup'] === true) {
                            $scope.term.articles[index].history['resilexi_article_voteup'] = false;
                            $scope.term.articles[index].score--;
                        }
                        // votedown
                        $scope.term.articles[index].history['resilexi_article_votedown'] = true;
                        $scope.term.articles[index].score--;
                    }
                }
            };

            // set previous state and begin transaction
            $scope.begin(commit, { articles: $scope.term.articles });
                         
            // remember selector for popover location
            var selector = feedbackService.selector($event.target);
            
            actionService.perform({
                // valid name of the action to perform server-side
                action: 'resilexi_article_votedown',
                // string representing the data to submit to action handler (i.e.: serialized value of a form)
                data: {article_id: $scope.term.articles[index].id},
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

        $scope.articleStar = function ($event, index) {

            // normalize : make sure impacted properties are set
            if(!angular.isDefined($scope.term.articles[index].history['resilexi_article_star'])) {
                $scope.term.articles[index].history['resilexi_article_star'] = false;
            }
            // define transaction
            var commit = function ($scope) {
                // prevent action if it has already been committed
                if(!angular.isDefined($scope.committed) || !$scope.committed) {

                    // update current state to new values
                    if($scope.term.articles[index].history['resilexi_article_star'] === true) {
                        $scope.term.articles[index].history['resilexi_article_star'] = false;
                        $scope.term.articles[index].count_stars--;
                    }
                    else {
                        $scope.term.articles[index].history['resilexi_article_star'] = true;
                        $scope.term.articles[index].count_stars++;
                    }
                }
            };

            // set previous state and begin transaction
            $scope.begin(commit, { articles: $scope.term.articles });  
            
            // remember selector for popover location
            var selector = feedbackService.selector($event.target);
            
            actionService.perform({
                // valid name of the action to perform server-side
                action: 'resilexi_article_star',
                // string representing the data to submit to action handler (i.e.: serialized value of a form)
                data: {article_id: $scope.term.articles[index].id},
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

        $scope.articleCommentVoteUp = function ($event, article_index, index) {
            // normalize : make sure impacted properties are set
            if(!angular.isDefined($scope.term.articles[article_index].comments[index].history['resilexi_articlecomment_voteup'])) {
                $scope.term.articles[article_index].comments[index].history['resilexi_articlecomment_voteup'] = false;
            }    
            // define transaction
            var commit = function ($scope) {
                // prevent action if it has already been committed
                if(!angular.isDefined($scope.committed) || !$scope.committed) {                                   
                    // update current state to new values
                    if($scope.term.articles[article_index].comments[index].history['resilexi_articlecomment_voteup'] === true) {
                        $scope.term.articles[article_index].comments[index].history['resilexi_articlecomment_voteup'] = false;
                        $scope.term.articles[article_index].comments[index].score--;
                    }
                    else {
                        $scope.term.articles[article_index].comments[index].history['resilexi_articlecomment_voteup'] = true;
                        $scope.term.articles[article_index].comments[index].score++;
                    }
                }
            };
            
            // set previous state and begin transaction
            $scope.begin(commit, { articles: $scope.term.articles });
            
            // remember selector for popover location            
            var selector = feedbackService.selector($event.target);
            
            actionService.perform({
                // valid name of the action to perform server-side
                action: 'resilexi_articlecomment_voteup',
                // string representing the data to submit to action handler (i.e.: serialized value of a form)
                data: {
                        comment_id: $scope.term.articles[article_index].comments[index].id
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

        $scope.articleCommentFlag = function ($event, article_index, index) {
            // normalize : make sure impacted properties are set
            if(!angular.isDefined($scope.term.articles[article_index].comments[index].history['resilexi_articlecomment_flag'])) {
                $scope.term.articles[article_index].comments[index].history['resilexi_articlecomment_flag'] = false;
            }  
                    
            // define transaction
            var commit = function ($scope) {
                // prevent action if it has already been committed
                if(!angular.isDefined($scope.committed) || !$scope.committed) {                    
                  
                    // update current state to new values (toggle flag)
                    if($scope.term.articles[article_index].comments[index].history['resilexi_articlecomment_flag'] === true) {
                        $scope.term.articles[article_index].comments[index].history['resilexi_articlecomment_flag'] = false;
                    }
                    else {
                        $scope.term.articles[article_index].comments[index].history['resilexi_articlecomment_flag'] = true;
                    }
                }
            };
            
            // set previous state and begin transaction
            $scope.begin(commit, { articles: $scope.term.articles });
            
            // remember selector for popover location             
            var selector = feedbackService.selector($event.target);
            
            actionService.perform({
                // valid name of the action to perform server-side
                action: 'resilexi_articlecomment_flag',
                // string representing the data to submit to action handler (i.e.: serialized value of a form)
                data: {
                        comment_id: $scope.term.articles[article_index].comments[index].id
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

        $scope.articleCommentEdit = function ($event, article_index, index) {
                       
            // remember selector for popover location 
            var selector = feedbackService.selector($event.target);

            actionService.perform({
                // valid name of the action to perform server-side
                action: 'resilexi_articlecomment_edit',
                // string representing the data to submit to action handler (i.e.: serialized value of a form)
                data: {
                        comment_id: $scope.term.articles[article_index].comments[index].id,
                        content: $scope.term.articles[article_index].comments[index].content
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
                        $scope.term.articles[article_index].comments[index].editMode = false;
                    }
                }        
            });
        };


        $scope.articleCommentDelete = function ($event, article_index, index) {
            
            // remember selector for popover location 
            var selector = feedbackService.selector($event.target);
            
            ctrl.openModal('MODAL_COMMENT_DELETE_TITLE', 'MODAL_COMMENT_DELETE_HEADER', $scope.term.articles[article_index].comments[index].content)
            .then(
                function () {
                    actionService.perform({
                        // valid name of the action to perform server-side
                        action: 'resilexi_articlecomment_delete',
                        // string representing the data to submit to action handler (i.e.: serialized value of a form)
                        data: {comment_id: $scope.term.articles[article_index].comments[index].id},
                        // scope in wich callback function will apply 
                        scope: $scope,
                        // callback function to run after action completion (to handle error cases, ...)
                        callback: function($scope, data) {
                            // we need to do it this way because current controller might be destroyed in the meantime
                            // (if route is changed to signin form)
                            if(data.result === true) {                  
                                // update view
                                $scope.term.articles[article_index].comments.splice(index, 1);
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

        
        $scope.articleDelete = function ($event, index) {
            
            // remember selector for popover location 
            var selector = feedbackService.selector($event.target);
            
            ctrl.openModal('MODAL_ARTICLE_DELETE_TITLE', 'MODAL_ARTICLE_DELETE_HEADER', $scope.term.articles[index].title)
            .then(
                function () {
                    actionService.perform({
                        // valid name of the action to perform server-side
                        action: 'resilexi_article_delete',
                        // string representing the data to submit to action handler (i.e.: serialized value of a form)
                        data: {article_id: $scope.term.articles[index].id},
                        // scope in wich callback function will apply 
                        scope: $scope,
                        // callback function to run after action completion (to handle error cases, ...)
                        callback: function($scope, data) {
                            // we need to do it this way because current controller might be destroyed in the meantime
                            // (if route is changed to signin form)
                            if(data.result === true) {                  
                                // go back to articles list
                                $location.path('/articles');
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

        
        $scope.showShareModal = function(index) {

            return $uibModal.open({
                animation: true,
                ariaLabelledBy: 'modal-title',
                ariaDescribedBy: 'modal-body',
                templateUrl: 'articleShareModal.html',
                controller: ['$uibModalInstance', function ($uibModalInstance, items) {
                    var ctrl = this;
                    ctrl.title_id = 'Partager';

                    $uibModalInstance.article = $scope.term.articles[index];
                    
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