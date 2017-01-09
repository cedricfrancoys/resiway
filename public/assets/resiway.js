'use strict';


// todo : uplad images (avatar)
// @see : http://stackoverflow.com/questions/13963022/angularjs-how-to-implement-a-simple-file-upload-with-multipart-form?answertab=votes#tab-top



// Instanciate resiway module
var resiway = angular.module('resiway', [
    // dependencies
    'ngRoute', 
    'ngSanitize',
    'ngCookies', 
    'ngAnimate', 
    'ui.bootstrap',    
    'oi.select',    
    'textAngular',
    'pascalprecht.translate'
])

.config(function(
                $provide,
                $translateProvider,
                $locationProvider, 
                $anchorScrollProvider, 
                $httpProvider,
                $httpParamSerializerJQLikeProvider) {
    // $locationProvider.html5Mode({enabled: true, requireBase: false, rewriteLinks: false}).hashPrefix('!');
    $locationProvider.html5Mode({enabled: false, requireBase: false, rewriteLinks: false});
    
    //$anchorScrollProvider.disableAutoScrolling();

    // we expect a file holding the translation var definition 
    // to be loaded in index.html
    if(typeof translations != 'undefined') {
        $translateProvider
          .translations('custom', translations)
          .preferredLanguage('custom')
          .useSanitizeValueStrategy('sanitize');          
    }

    
    // Provide fulscreen capability to textAngular editor
    $provide.decorator('taOptions', ['taRegisterTool', '$delegate', function(taRegisterTool, taOptions) { 
        // $delegate is the taOptions we are decorating
        taRegisterTool('fullScreen', {
            tooltiptext: 'Toogle full screen',
            iconclass: "fa fa-arrows-alt",
            activeState: function(){
                return this.$editor().fullScreen;
            },            
            action: function() {
                if(typeof this.$editor().fullScreen == 'undefined') {
                    this.$editor().fullScreen = false;
                }
                
                var $instance = this.$editor().displayElements.text.parent().parent();
                var $body = angular.element(document.querySelector('body'));
                var $toolbar = angular.element($instance.children()[0]);

                if(this.$editor().fullScreen) {
                    // restore size
                    $instance.css({
                                    'position': this.$editor().original_position, 
                                    'width': this.$editor().original_width, 
                                    'height': this.$editor().original_height
                                  });                    
                    // restore body children
                    $body.append(this.$editor().original_body_content);
                    // restore parent
                    this.$editor().original_parent.append($instance.detach());
                }
                else {
                    // save the minimized dimension
                    this.$editor().original_width = $instance.css('width');
                    this.$editor().original_height = $instance.css('height');
                    // save original parent
                    this.$editor().original_parent = $instance.parent();
                    this.$editor().original_position = $instance.css('position');
                    // save original body content
                    this.$editor().original_body_content = $body.children().detach();
                    // append editor as lone child of body
                    $body.append(
                        $instance
                        .detach()
                        .css({
                                'position': 'absolute', 
                                'width': '100%', 
                                'height': '100%', 
                                'z-index': '9999', 
                                'top': '0px', 
                                'left': '0px'
                            })
                    );
                }
                $instance.css('height', 'calc(100% - '+$toolbar[0].offsetHeight+'px)');
                // toggle fullscreen 
                this.$editor().fullScreen = !this.$editor().fullScreen;                
            }
        });
        taOptions.toolbar[1].push('fullScreen');
        return taOptions;
    }]);
    
    
    // Use x-www-form-urlencoded Content-Type
    $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';    
    $httpProvider.defaults.paramSerializer = '$httpParamSerializerJQLike';    
    $httpProvider.defaults.transformRequest.unshift($httpParamSerializerJQLikeProvider.$get());
})



.run( function($document, $window, $timeout, $rootScope, $location, $anchorScroll, $cookieStore, authenticationService, actionService, feedbackService) {
    console.log('run method invoked');

    // bind rootScope with feedbackService service (popover display)
    $rootScope.popover = feedbackService;
    
    // @model   global data model
    
    const signPath = '/user/sign';
    
    $rootScope.viewContentLoading = true;   
        
    /* Currently pending action, if any
     * expected struct : { 
                            action:     string, 
                            data:       string of serialized values, 
                            next_path:  string,
                            scope:      scope
                            callback :  function(scope, data) 
                          }
    **/
    $rootScope.pendingAction = null;
    
    /**
    * Previous path 
    * Required in order to return to previous location when user goes to sign page (signin/signup)
    * This value is set when event $locationChangeSuccess occurs
    */
    $rootScope.previousPath = '/';
    $rootScope.currentPath  = null;
    
    /*
     * This value is set by the authentification service
     * note: 0 is value for guest user, and thus indicates user is not logged in
     **/
    $rootScope.user_id = 0;
    
    /*
     * This value is set by the authentification service
     * and is used in order to know if auto-restore of user session is complete
     *
     **/
    $rootScope.user = null;
 
    $rootScope.$on('$locationChangeStart', function(angularEvent) {
        // show loading spinner
        $rootScope.viewContentLoading = true;
    });

    $rootScope.$on('$locationChangeSuccess', function(angularEvent) {
        console.log('$locationChangeSuccess');

        if($rootScope.currentPath) {
            $rootScope.previousPath = $rootScope.currentPath;
        }
        $rootScope.currentPath = $location.path();

        console.log('previous path: '+$rootScope.previousPath);
        console.log('current path: '+$rootScope.currentPath);        
    });
    


    
    /**
    * This callback is invoked at each change of view
    * it is used to complete any pending action
    */
    $rootScope.$on('$viewContentLoaded', function(params) {
        console.log('$viewContentLoaded received');
        // hide loading spinner
        $rootScope.viewContentLoading = false;

        // wait next digest cycle and:
        // - check if we have to scroll
        // - perform pending action, if any
        $timeout(function() {
                
            if( $location.hash().length) {
                var elem = angular.element(document.querySelector( '#'+$location.hash() ))
                // scroll a bti higher than the element itself
                $window.scrollTo(0, elem[0].offsetTop-55);
            }
            else {
                // scroll to top
                $window.scrollTo(0, 0);
            }                

            if($rootScope.user_id == 0
            && $rootScope.previousPath.substring(0, signPath.length) == signPath
            && $rootScope.currentPath.substring(0, signPath.length) != signPath ) {
                // user jumped off login process
                // disgard pending action
                console.log('pending action disgarded');
                $rootScope.pendingAction = null;
            }
            // At this point, view has been loaded and controller is ready
            if($rootScope.pendingAction
            && $rootScope.currentPath.substring(0, signPath.length) != signPath) {
                // process pending action, if any                                    
                console.log('continuing ation');
                console.log($rootScope.pendingAction);
                $rootScope.pendingAction.scope = params.targetScope;
                actionService.perform($rootScope.pendingAction);
            }
        });
    });


    

   
    /*
    * auto-restore session or auto-login with cookie values    
    */

    // read values from cookie, if any
    var username = $cookieStore.get('username');
    var password = $cookieStore.get('password');            
    // set read values as current credentials 
    // (those will be removed if login is unsuccessful)        
    authenticationService.setCredentials(username, password);
    // try to authenticate or restore the session
    authenticationService.authenticate();
       

    // set some behaviour on DOM ready
    $document.ready(function () {
        console.log('document ready');
        
        // forward clicks on root scope to sub-scopes
        // this event will be catched by controllers or directives that need it
        $document.on('click', function(event) {
            $rootScope.$broadcast('documentClick', event);
        });
    });
})

.controller('rootController', function($rootScope, $scope, $location) {
    var rootCtrl = this;

    console.log('root controller');


    rootCtrl.makeLink = function(object_class, object_id) {
        switch(object_class) {    
        case 'resiexchange\\Question': return '#/question/'+object_id;
        case 'resiway\Category': return '#/category/'+object_id;
        }
    };
    
    rootCtrl.humanReadable = {
        
        date: function(value) {
            var res = '';
            var timestamp = Date.parse(value);
            if(timestamp != NaN) {
                var date = new Date(timestamp);
                res = date.toLocaleString('fr', { 
                            weekday:'long', 
                            year:   'numeric', 
                            month:  'short', 
                            day:    'numeric', 
                            hour:   'numeric', 
                            minute: 'numeric' 
                       });
            }
            return res;
        },
        
        dateInterval: function(value) {
            var res= '';
            var now = new Date();
            var timestamp = Date.parse(value);
            if(timestamp != NaN) {
                var once = new Date(timestamp);
                var diff = Math.floor( (now - once) / (1000 * 60 * 60 *24) );
                if(diff == 0) return 'today';

                if(diff < 7) {
                    if(diff == 1) return 'yesterday';
                    return diff + " days ago";
                }
                if(diff < 30) {
                    var diff_w = Math.floor(diff / 7);
                    if(diff_w == 1) return 'last week';
                    return diff_w + " weeks ago";
                }
                if(diff < 365) {
                    var diff_m = floor(diff / 30);
                    if($diff_m == 1) return 'last month';            
                    return diff_m + " months ago";
                }
                
                var diff_y = Math.floor(diff / 365);
                if(diff_y == 1) return 'last year';
                return diff_y + " years ago";                
            }
            return res;         
        },
        
        number: function(value) {
            if(typeof value == 'undefined' 
            || typeof parseInt(value) != 'number') return 0;
            if(value == 0) return 0;
            var sign = value/Math.abs(value);
            value = Math.abs(value);
            var s = ['', 'k', 'M', 'G'];
            var e = Math.floor(Math.log(value) / Math.log(1000));
            return (sign*((e <= 0)?value:(value / Math.pow(1000, e)).toFixed(1))) + s[e];   
        }
    };
    
    
    
})

.controller('homeController', function() {
    var ctrl = this;

    console.log('home controller');  
    
    this.ok = function() {
        console.log('ok');
    };    
  
})

.controller('searchController', function($scope, $http) {
    console.log('search controller');

    var ctrl = this;

    // @data model
    $scope.questions = {};
    
    // @init
    (function () {

    
        $http.get('index.php?get=resiexchange_question_list')
        .success(function(data, status, headers, config) {
            // data should be an object 
            if(typeof data != 'object' || typeof data.result != 'object') throw new Error('Something went wrong while retrieving questions.');
            $scope.questions = data.result;
        })
        .error(function(data, status, headers, config) {
        });
    })();

})

.controller('categoriesController', function(categories, $scope) {
    console.log('categories controller');

    var ctrl = this;

    // @data model
    $scope.categories = categories;
    
})

.controller('editCategoryController', function(category, categories, feedbackService, $scope, $window, $location, actionService) {
    console.log('editCategory controller');
    
    var ctrl = this;   

    // @view
    $scope.categories = categories; 
    
    // @model
    $scope.category = category;

    // set initial parent 
    angular.forEach($scope.categories, function(category, index) {
        if(category.id == $scope.category.parent_id) {
            $scope.category.parent = category; 
        }
    });       
    
    // @events
    $scope.$watch('category.parent', function() {
        console.log($scope.category.parent);
        $scope.category.parent_id = $scope.category.parent.id;
        console.log($scope.category.parent_id);        
    });

    // @methods
    $scope.categoryPost = function($event) {
        var selector = feedbackService.selector(angular.element($event.target));                   
        actionService.perform({
            // valid name of the action to perform server-side
            action: 'resiway_category_edit',
            // string representing the data to submit to action handler (i.e.: serialized value of a form)
            data: {
                category_id: (angular.isUndefined($scope.category.id)?0:$scope.category.id),
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
                    feedbackService.popover(selector, msg);
                }
                else {
                    $location.path('/categories');
                }
            }        
        });
    };  
       
})


/**
 * Question controller
 *
 */
.controller('questionController', function(question, feedbackService, $scope, $window, $location, $sce, $uibModal, actionService, $timeout, textAngularManager) {
    console.log('question controller');
    
    var ctrl = this;

    // @model
    $scope.question = question;

// todo : move this to root controller
    ctrl.open = function (title_id, header_id, content) {
        return $uibModal.open({
            animation: true,
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            templateUrl: 'modal-custom.html',
            controller: function ($uibModalInstance, items) {
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
            },
            controllerAs: 'ctrl', 
            size: 'md',
            appendTo: angular.element(document.querySelector(".modal-wrapper")),
            resolve: {
                items: function () {
                  return ctrl.items;
                }
            }
        }).result;
    };    
       

    // @methods
    $scope.questionComment = function($event) {
        var selector = feedbackService.selector($event.target);
        actionService.perform({
            // valid name of the action to perform server-side
            action: 'resiexchange_question_comment',
            // string representing the data to submit to action handler (i.e.: serialized value of a form)
            data: {
                question_id: $scope.question.id,
                content: $scope.question.newCommentContent
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
                    $scope.question.comments.push(data.result);
                    $scope.question.newCommentShow = false;
                    $scope.question.newCommentContent = '';
                    // wait for next digest cycle
                    $timeout(function() {
                        // scroll to newly created comment
                        feedbackService.popover('#comment-'+comment_id, '');
                    });
                }
            }        
        });
    };

    $scope.questionFlag = function ($event) {
        var selector = feedbackService.selector($event.target);           
        actionService.perform({
            // valid name of the action to perform server-side
            action: 'resiexchange_question_flag',
            // string representing the data to submit to action handler (i.e.: serialized value of a form)
            data: {
                    question_id: $scope.question.id
            },
            // scope in wich callback function will apply 
            scope: $scope,
            // callback function to run after action completion (to handle error cases, ...)
            callback: function($scope, data) {
                // we need to do it this way because current controller might be destroyed in the meantime
                // toggle related entries in current history
                if(data.result < 0) {
                    // result is an error code
                    var error_id = data.error_message_ids[0];                    
                    // todo : get error_id translation
                    var msg = error_id;
                    feedbackService.popover(selector, msg);                    
                }                
                else {
                    $scope.question.history['resiexchange_question_flag'] = data.result;
                }
            }        
        });
    };

    $scope.questionAnswer = function($event) {
        var selector = feedbackService.selector($event.target);                   
        actionService.perform({
            // valid name of the action to perform server-side
            action: 'resiexchange_question_answer',
            // string representing the data to submit to action handler (i.e.: serialized value of a form)
            data: {
                question_id: $scope.question.id,
                content: $scope.question.newAnswerContent
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
                    var answer_id = data.result.id;
                    // mark html as safe
                    data.result.content = $sce.trustAsHtml(data.result.content);
                    
                    // add special fields
                    data.result.commentsLimit = 5;
                    data.result.newCommentShow = false;
                    data.result.newCommentContent = '';
                    
                    // add new answer to the list
                    $scope.question.answers.push(data.result);
                    // hide user-answer block
                    $scope.question.history['resiexchange_question_answer'] = true;
                    // wait for next digest cycle
                    $timeout(function() {
                        // scroll to newly created answer
                        feedbackService.popover('#answer-'+answer_id, '');
                    });                    
                }
            }        
        });
    };  
    
    $scope.questionVoteUp = function ($event) {
        var selector = feedbackService.selector($event.target);
        actionService.perform({
            // valid name of the action to perform server-side
            action: 'resiexchange_question_voteup',
            // string representing the data to submit to action handler (i.e.: serialized value of a form)
            data: {question_id: $scope.question.id},
            // scope in wich callback function will apply 
            scope: $scope,
            // callback function to run after action completion (to handle error cases, ...)
            callback: function($scope, data) {
                // we need to do it this way because current controller might be destroyed in the meantime
                // (if route is changed to signin form)
                if(data.result === true) {                  
                    $scope.question.history['resiexchange_question_voteup'] = true;
                    $scope.question.score++;
                }
                else if(data.result === false) {
                    $scope.question.history['resiexchange_question_votedown'] = false;
                    $scope.question.score++;
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
    };
    
    $scope.questionVoteDown = function ($event) {
        var selector = feedbackService.selector($event.target);
        actionService.perform({
            // valid name of the action to perform server-side
            action: 'resiexchange_question_votedown',
            // string representing the data to submit to action handler (i.e.: serialized value of a form)
            data: {question_id: $scope.question.id},
            // scope in wich callback function will apply 
            scope: $scope,
            // callback function to run after action completion (to handle error cases, ...)
            callback: function($scope, data) {
                // we need to do it this way because current controller might be destroyed in the meantime
                // toggle related entries in current history
                if(data.result === true) {
                    $scope.question.history['resiexchange_question_votedown'] = true;
                    $scope.question.score--;
                }
                else if(data.result === false) {
                    $scope.question.history['resiexchange_question_voteup'] = false;
                    $scope.question.score--;                
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
    };    

    $scope.questionStar = function ($event) {
        var selector = feedbackService.selector($event.target);
        actionService.perform({
            // valid name of the action to perform server-side
            action: 'resiexchange_question_star',
            // string representing the data to submit to action handler (i.e.: serialized value of a form)
            data: {question_id: $scope.question.id},
            // scope in wich callback function will apply 
            scope: $scope,
            // callback function to run after action completion (to handle error cases, ...)
            callback: function($scope, data) {
                // we need to do it this way because current controller might be destroyed in the meantime
                // toggle related entries in current history
                if(data.result < 0) {
                    // result is an error code
                    var error_id = data.error_message_ids[0];                    
                    // todo : get error_id translation
                    var msg = error_id;
                    feedbackService.popover(selector, msg);                    
                }                
                else {
                    $scope.question.history['resiexchange_question_star'] = data.result;
                    if(data.result === true) {
                        $scope.question.count_stars++;
                    }
                    else {
                        $scope.question.count_stars--;
                    }
                }
            }        
        });
    };      

    $scope.questionCommentVoteUp = function ($event, index) {
        var selector = feedbackService.selector($event.target);    
        actionService.perform({
            // valid name of the action to perform server-side
            action: 'resiexchange_questioncomment_voteup',
            // string representing the data to submit to action handler (i.e.: serialized value of a form)
            data: {
                    comment_id: $scope.question.comments[index].id
            },
            // scope in wich callback function will apply 
            scope: $scope,
            // callback function to run after action completion (to handle error cases, ...)
            callback: function($scope, data) {
                // we need to do it this way because current controller might be destroyed in the meantime
                // toggle related entries in current history
                if(data.result < 0) {
                    // result is an error code
                    var error_id = data.error_message_ids[0];                    
                    // todo : get error_id translation
                    var msg = error_id;
                    feedbackService.popover(selector, msg);                    
                }                
                else {
                    $scope.question.comments[index].history['resiexchange_questioncomment_voteup'] = data.result;
                    if(data.result === true) {
                        $scope.question.comments[index].score++;
                    }
                    else {
                        $scope.question.comments[index].score--;
                    }
                }
            }        
        });
    };
    
    $scope.questionDelete = function ($event) {
        ctrl.open('MODAL_QUESTION_DELETE_TITLE', 'MODAL_QUESTION_DELETE_HEADER', $scope.question.title).then(
            function () {
                var selector = feedbackService.selector($event.target);                  
                actionService.perform({
                    // valid name of the action to perform server-side
                    action: 'resiexchange_question_delete',
                    // string representing the data to submit to action handler (i.e.: serialized value of a form)
                    data: {question_id: $scope.question.id},
                    // scope in wich callback function will apply 
                    scope: $scope,
                    // callback function to run after action completion (to handle error cases, ...)
                    callback: function($scope, data) {
                        // we need to do it this way because current controller might be destroyed in the meantime
                        // (if route is changed to signin form)
                        if(data.result === true) {                  
                            // go back to questions list
                            $location.path('/questions');
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
            }, 
            function () {
                // dismissed
            }
        );     
    };
    
    $scope.answerVoteUp = function ($event, index) {
        var selector = feedbackService.selector($event.target);           
        actionService.perform({
            // valid name of the action to perform server-side
            action: 'resiexchange_answer_voteup',
            // string representing the data to submit to action handler (i.e.: serialized value of a form)
            data: {answer_id: $scope.question.answers[index].id},
            // scope in wich callback function will apply 
            scope: $scope,
            // callback function to run after action completion (to handle error cases, ...)
            callback: function($scope, data) {
                // we need to do it this way because current controller might be destroyed in the meantime
                // (if route is changed to signin form)
                if(data.result === true) {                  
                    $scope.question.answers[index].history['resiexchange_answer_voteup'] = true;
                    $scope.question.answers[index].score++;
                }
                else if(data.result === false) {
                    $scope.question.answers[index].history['resiexchange_answer_votedown'] = false;
                    $scope.question.answers[index].score++;
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
    };
    
    $scope.answerVoteDown = function ($event, index) {
        var selector = feedbackService.selector($event.target);        
        actionService.perform({
            // valid name of the action to perform server-side
            action: 'resiexchange_answer_votedown',
            // string representing the data to submit to action handler (i.e.: serialized value of a form)
            data: {answer_id: $scope.question.answers[index].id},
            // scope in wich callback function will apply 
            scope: $scope,
            // callback function to run after action completion (to handle error cases, ...)
            callback: function($scope, data) {
                // we need to do it this way because current controller might be destroyed in the meantime
                // toggle related entries in current history
                if(data.result === true) {
                    $scope.question.answers[index].history['resiexchange_answer_votedown'] = true;
                    $scope.question.answers[index].score--;
                }
                else if(data.result === false) {
                    $scope.question.answers[index].history['resiexchange_answer_voteup'] = false;
                    $scope.question.answers[index].score--;                
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
    };      
    
    $scope.answerFlag = function ($event, index) {
        var selector = feedbackService.selector($event.target);           
        actionService.perform({
            // valid name of the action to perform server-side
            action: 'resiexchange_answer_flag',
            // string representing the data to submit to action handler (i.e.: serialized value of a form)
            data: {
                    answer_id: $scope.question.answers[index].id
            },
            // scope in wich callback function will apply 
            scope: $scope,
            // callback function to run after action completion (to handle error cases, ...)
            callback: function($scope, data) {
                // we need to do it this way because current controller might be destroyed in the meantime
                // toggle related entries in current history
                if(data.result < 0) {
                    // result is an error code
                    var error_id = data.error_message_ids[0];                    
                    // todo : get error_id translation
                    var msg = error_id;
                    feedbackService.popover(selector, msg);                    
                }                
                else {
                    $scope.question.answers[index].history['resiexchange_answer_flag'] = data.result;
                }
            }        
        });
    };
    
    $scope.answerComment = function($event, index) {
        var selector = feedbackService.selector($event.target);
        actionService.perform({
            // valid name of the action to perform server-side
            action: 'resiexchange_answer_comment',
            // string representing the data to submit to action handler (i.e.: serialized value of a form)
            data: {
                answer_id: $scope.question.answers[index].id,
                content: $scope.question.answers[index].newCommentContent
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
                    var answer_id = $scope.question.answers[index].id;
                    var comment_id = data.result.id;
                    // add new comment to the list
                    $scope.question.answers[index].comments.push(data.result);
                    $scope.question.answers[index].newCommentShow = false;
                    $scope.question.answers[index].newCommentContent = '';
                    // wait for next digest cycle
                    $timeout(function() {
                        // scroll to newly created comment
                        feedbackService.popover('#comment-'+answer_id+'-'+comment_id, '');
                    });
                }
            }        
        });
    };    
        
    $scope.answerCommentVoteUp = function ($event, answer_index, index) {
        var selector = feedbackService.selector($event.target);           
        actionService.perform({
            // valid name of the action to perform server-side
            action: 'resiexchange_answercomment_voteup',
            // string representing the data to submit to action handler (i.e.: serialized value of a form)
            data: {
                    comment_id: $scope.question.answers[answer_index].comments[index].id
            },
            // scope in wich callback function will apply 
            scope: $scope,
            // callback function to run after action completion (to handle error cases, ...)
            callback: function($scope, data) {
                // we need to do it this way because current controller might be destroyed in the meantime
                // toggle related entries in current history
                if(data.result < 0) {
                    // result is an error code
                    var error_id = data.error_message_ids[0];                    
                    // todo : get error_id translation
                    var msg = error_id;
                    feedbackService.popover(selector, msg);                    
                }                
                else {
                    $scope.question.answers[answer_index].comments[index].history['resiexchange_answercomment_voteup'] = data.result;
                    if(data.result === true) {
                        $scope.question.answers[answer_index].comments[index].score++;
                    }
                    else {
                        $scope.question.answers[answer_index].comments[index].score--;
                    }
                }
            }        
        });
    };

    $scope.answerCommentFlag = function ($event, answer_index, index) {
        var selector = feedbackService.selector($event.target);           
        actionService.perform({
            // valid name of the action to perform server-side
            action: 'resiexchange_answercomment_flag',
            // string representing the data to submit to action handler (i.e.: serialized value of a form)
            data: {
                    comment_id: $scope.question.answers[answer_index].comments[index].id
            },
            // scope in wich callback function will apply 
            scope: $scope,
            // callback function to run after action completion (to handle error cases, ...)
            callback: function($scope, data) {
                // we need to do it this way because current controller might be destroyed in the meantime
                // toggle related entries in current history
                if(data.result < 0) {
                    // result is an error code
                    var error_id = data.error_message_ids[0];                    
                    // todo : get error_id translation
                    var msg = error_id;
                    feedbackService.popover(selector, msg);                    
                }                
                else {
                    $scope.question.answers[answer_index].comments[index].history['resiexchange_answercomment_flag'] = data.result;
                }
            }        
        });
    };

    $scope.answerDelete = function ($event, index) {
        ctrl.open('MODAL_ANSWER_DELETE_TITLE', 'MODAL_ANSWER_DELETE_HEADER', $scope.question.answers[index].content_excerpt).then(
            function () {
                var selector = feedbackService.selector($event.target);                  
                actionService.perform({
                    // valid name of the action to perform server-side
                    action: 'resiexchange_answer_delete',
                    // string representing the data to submit to action handler (i.e.: serialized value of a form)
                    data: {answer_id: $scope.question.answers[index].id},
                    // scope in wich callback function will apply 
                    scope: $scope,
                    // callback function to run after action completion (to handle error cases, ...)
                    callback: function($scope, data) {
                        // we need to do it this way because current controller might be destroyed in the meantime
                        // (if route is changed to signin form)
                        if(data.result === true) {                  
                            $scope.question.answers.splice(index, 1);
                            // show user-answer block
                            $scope.question.history['resiexchange_question_answer'] = false;                    
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
            }, 
            function () {
                // dismissed
            }
        );     
    };
    
})


.controller('editAnswerController', function(answer, feedbackService, $scope, $window, $location, $sce, actionService, textAngularManager) {
    console.log('editAnswer controller');
    
    var ctrl = this;   
  
    // @model
    $scope.answer = answer;
    
    // @methods
    $scope.answerPost = function($event) {
        var selector = feedbackService.selector($event.target);
        actionService.perform({
            // valid name of the action to perform server-side
            action: 'resiexchange_answer_edit',
            // string representing the data to submit to action handler (i.e.: serialized value of a form)
            data: {
                answer_id: $scope.answer.id,
                content: $scope.answer.content
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
                    var question_id = data.result.question_id;
                    $location.path('/question/'+question_id);
                }
            }        
        });
    };     
})

/**
* Display given question with all details
*
*/
.controller('editQuestionController', function(question, categories, feedbackService, $scope, $window, $location, $sce, actionService, textAngularManager) {
    console.log('editQuestion controller');
    
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
       
})
/**
* display select widget with selected items
*/
.filter('resiSearchFilter', function($sce) {
    return function(label, query, item, options, element) {
        var closeIcon = '<span class="close select-search-list-item_selection-remove">×</span>';
        return $sce.trustAsHtml(item.title + closeIcon);
    };
})
.filter('resiDropdownFilter', ['$sce', 'oiSelectEscape', function($sce, oiSelectEscape) {
    return function(label, query, item) {
        var html;
        if (query.length > 0 || angular.isNumber(query)) {
            label = item.title.toString();
            query = oiSelectEscape(query);
            html = label.replace(new RegExp(query, 'gi'), '<strong>$&</strong>');
        } 
        else {
            html = item.title;
        }

        return $sce.trustAsHtml(html);
    };
}])
.filter('resiListFilter', ['oiSelectEscape', function(oiSelectEscape) {
    function ascSort(input, query, getLabel, options) {
        var i, j, isFound, output, output1 = [], output2 = [], output3 = [], output4 = [];

        if (query) {
            query = oiSelectEscape(query).toLowerASCII();
            for (i = 0, isFound = false; i < input.length; i++) {
                isFound = getLabel(input[i]).toLowerASCII().match(new RegExp(query));

                if (!isFound && options && (options.length || options.fields)) {
                    for (j = 0; j < options.length; j++) {
                        if (isFound) break;
                        isFound = String(input[i][options[j]]).toLowerASCII().match(new RegExp(query));
                    }
                }
                if (isFound) {
                    output1.push(input[i]);
                }
            }
            for (i = 0; i < output1.length; i++) {
                if (getLabel(output1[i]).toLowerASCII().match(new RegExp('^' + query))) {
                    output2.push(output1[i]);
                } 
                else {
                    output3.push(output1[i]);
                }
            }
            output = output2.concat(output3);

            if (options && (options === true || options.all)) {
                inputLabel: for (i = 0; i < input.length; i++) {
                    for (j = 0; j < output.length; j++) {
                        if (input[i] === output[j]) {
                            continue inputLabel;
                        }
                    }
                    output4.push(input[i]);
                }
                output = output.concat(output4);
            }
        } 
        else {
            output = [].concat(input);
        }
        return output;
    }
    return ascSort;
}])

/**
* Display given user public profile
*
*/
.controller('editUserController', function(user, $scope) {
    console.log('editUser controller');    
    
    var ctrl = this;

    $scope.user = user;    
    $scope.publicity_mode = null;

// todo: translate    
    ctrl.modes = [ {id: 1, text: 'Fullname'}, {id: 2, text: 'Firstname + Lastname inital'}, {id: 3, text: 'Firstname only'}]
    
    // @init
    angular.forEach(ctrl.modes, function(mode) {
        if(mode.id == $scope.user.publicity_mode) {
            $scope.publicity_mode = {id: mode.id, text: mode.text};                
        }
    });
    
    $scope.$watch('publicity_mode', function() {
        $scope.user.publicity_mode = $scope.publicity_mode.id;
        console.log($scope.user.publicity_mode);
    });


})

.controller('userProfileController', ['user', '$scope', '$http', function(user, $scope, $http) {
    console.log('userProfile controller');
    
    var ctrl = this;
    
    ctrl.user = user;
    ctrl.actions = -1;    
    ctrl.answers = -1;
    ctrl.favorites = -1;    

    var defaults = {
        total: -1,
        currentPage: 1,
    };

    ctrl.load = function(config) {
        // reset questions list (triggers loader display)
        config.items = -1;          
        $http.post('index.php?get='+config.provider, {
            domain: config.domain,
            start: (config.currentPage-1)*config.limit,
            limit: config.limit,
            total: config.total
        }).then(
        function successCallback(response) {
            var data = response.data;
            config.items = data.result;
            config.total = data.total;
        },
        function errorCallback() {
            // something went wrong server-side
        });
    };   
    
    angular.merge(ctrl, {
        actions: {
            items: -1,
            total: -1,
            currentPage: 1,
            limit: 5,
            domain: [['user_id', '=', ctrl.user.id],['reputation_increment','<>', 0]],
            provider: 'resiway_actionlog_list'
        },
        questions: {
            items: -1,
            total: -1,
            currentPage: 1,
            limit: 5,
            domain: ['creator', '=', ctrl.user.id],
            provider: 'resiexchange_question_list'
        },
        answers: {
            items: -1,
            total: -1,
            currentPage: 1,
            limit: 5,
            domain: ['creator', '=', ctrl.user.id],
            provider: 'resiexchange_answer_list'
        },
        favorites: {
            items: -1,
            total: -1,
            currentPage: 1,
            limit: 5,
            // 'resiexchange_question_star' == action (id=4)
            domain: [['user_id', '=', ctrl.user.id], ['action_id','=','4']],
            provider: 'resiway_actionlog_list'
        }        
    });

    
   
}])


.controller('userNotificationsController', function($scope, $rootScope, actionService, feedbackService) {
    console.log('userNotifications controller');
    
    var ctrl = this;
    
    ctrl.dismiss = function($event, index) {
        var selector = feedbackService.selector($event.target);         
        actionService.perform({
            // valid name of the action to perform server-side
            action: 'resiway_notification_dismiss',
            // string representing the data to submit to action handler (i.e.: serialized value of a form)
            data: {
                notification_id: $rootScope.user.notifications[index].id
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
                    $rootScope.user.notifications.splice(index, 1); 
                }
            }        
        });        
    };
})

/**
* 
* Once successfully identified, this controller will redirect to previously stored location, if any
*/
.controller('signController', function($scope, $rootScope, authenticationService, $location, $routeParams) {
    
    /*
    this controller displays a form for collecting user credentials
    if global var return
    */
    console.log('sign controller');
    var ctrl = this;
    
    // set default mode to blank
    ctrl.mode = ''; 
    
    // asign mode from URL if it matches one of the allowed modes
    switch($routeParams.mode) {
        case 'recover':
        case 'in': 
        case 'up': 
        ctrl.mode = $routeParams.mode;
    }


    // @model             
    $scope.remember = false;
    $scope.username = '';
    $scope.password = '';
    $scope.email = '';    
    $scope.signInAlerts = [];
    $scope.signUpAlerts = [];    
    $scope.recoverAlerts = [];
    // alerts format : { type: 'danger|warning|success', msg: 'Alert message.' }
    
    
    ctrl.closeSignInAlert = function(index) {
        $scope.signInAlerts.splice(index, 1);
    };

    ctrl.closeSignUpAlert = function(index) {
        $scope.signUpAlerts.splice(index, 1);
    };
    
    ctrl.closeRecoverAlert = function(index) {
        $scope.recoverAlerts.splice(index, 1);
    };
        
    ctrl.signIn = function () {       
        if($scope.username.length == 0 || $scope.password.length == 0) {
            if($scope.username.length == 0) {
                $scope.signInAlerts.push({ type: 'warning', msg: 'Please, provide your email as identifier.' });                
            }
            if($scope.password.length == 0) {
                $scope.signInAlerts.push({ type: 'warning', msg: 'Please, provide your password.' });                
            }
        }
        else {
            // form is complete
            authenticationService.setCredentials($scope.username, md5($scope.password), $scope.remember);

            // attempt to log the user in
            authenticationService.authenticate().then(
            function successHandler(data) {
                // if some action is pending, return to URL where it occured
                if($rootScope.pendingAction
                && typeof $rootScope.pendingAction.next_path != 'undefined') {
                   $location.path($rootScope.pendingAction.next_path);
                }
                else {
                    $location.path($rootScope.previousPath);
                }
            },
            function errorHandler() {
                authenticationService.clearCredentials();
                $scope.signInAlerts = [{ type: 'danger', msg: 'Email or password mismatch.' }];
            });        
        }
    };
    
    ctrl.signUp = function() {
        if($scope.username.length == 0 || $scope.firstname.length == 0) {
            if($scope.username.length == 0) {
                $scope.signUpAlerts.push({ type: 'warning', msg: 'Please, provide your email as username.' });                
            }
            if($scope.firstname.length == 0) {
                $scope.signUpAlerts.push({ type: 'warning', msg: 'Please, indicate your firstname.' });                
            }
        }
        else {
            authenticationService.register($scope.username, $scope.firstname).then(
            function successHandler(data) {
                authenticationService.authenticate().then(
                function successHandler(data) {
                    // if some action is pending, return to URL where it occured
                    if($rootScope.pendingAction
                    && typeof $rootScope.pendingAction.next_path != 'undefined') {
                       $location.path($rootScope.pendingAction.next_path);
                    }
                    else {
                        $location.path($rootScope.previousPath);
                    }
                },
                function errorHandler() {
                    authenticationService.clearCredentials();
                    $scope.signUpAlerts = [{ type: 'danger', msg: 'Email or password mismatch.' }];
                });  
            },
            function errorHandler(data) {
                // server fault, email already registered, ...
                $scope.signUpAlerts = [{ type: 'danger', msg: 'Email address invalid or already registered.' }];
            });             

        }
    };

    ctrl.recover = function () {
    // todo
        if($scope.email.length == 0) {
            $scope.recoverAlerts.push({ type: 'warning', msg: 'Please, provide your email.' });
        }
    };    
    
})

/**
* Top Bar Controller
* reads user_id an user from rootScope
* 
*/
.controller('topBarCtrl', function(
                            $scope, 
                            $rootScope, 
                            $location, 
                            $timeout,
                            actionService,
                            authenticationService) {
        console.log('topbar controller');
        
        // @model
        $rootScope.showPlatformDropdown = false;
        $rootScope.showUserDropdown = false;
        $rootScope.showNotifyDropdown = false;        

        
        //events       
        $scope.$on('documentClick', function (ngEvent, DOMevent) {
            var $targetScope = angular.element(DOMevent.target).scope();
            while($targetScope) {               
                if($scope.$id == $targetScope.$id) return false;
                $targetScope = $targetScope.$parent;
            }
            // evalAsync
            $scope.$apply(function() {
                $rootScope.showPlatformDropdown = false;
                $rootScope.showUserDropdown = false;
                $rootScope.showNotifyDropdown = false; 
            });
        });

        $scope.updateLoginButton = function() {
            var $elem = angular.element(document.querySelector('#login-btn'));
            if($rootScope.user && !$rootScope.user_id) {
                $elem.removeClass('ng-hide');
            }
            else {
                $elem.addClass('ng-hide');
            }
        };
        
        $rootScope.$watch('user', $scope.updateLoginButton);
        $rootScope.$watch('user_id', $scope.updateLoginButton);              
        
        $scope.togglePlatformDropdown = function() {
            if(!$rootScope.showPlatformDropdown) {
                $rootScope.showUserDropdown = false;
                $rootScope.showNotifyDropdown = false; 
            }
            $rootScope.showPlatformDropdown = !$rootScope.showPlatformDropdown;
        };
        
        $scope.toggleUserDropdown = function() {
            if(!$rootScope.showUserDropdown) {
                $rootScope.showPlatformDropdown = false;
                $rootScope.showNotifyDropdown = false; 
            }
            $rootScope.showUserDropdown = !$rootScope.showUserDropdown;
        };

        $scope.toggleNotifyDropdown = function() {
            if(!$rootScope.showNotifyDropdown) {
                $rootScope.showUserDropdown = false;
                $rootScope.showPlatformDropdown = false; 
            }   
            $rootScope.showNotifyDropdown = !$rootScope.showNotifyDropdown; 
        };
                
        
        
        $scope.signIn = function() {
            console.log('connection');
            $location.path('/user/sign/in');
        };

        $scope.signUp = function() {
            console.log('registration');
            $location.path('/user/sign/up');
        };
        
        $scope.signOut = function(){
            actionService.perform({
                action: 'resiway_user_signout',
                next_path: '/',
                callback: function($scope, data) {
                    authenticationService.clearCredentials();
                    $rootScope.showUserDropdown = false;
                }
            });
        };
    }
)


.controller('DropdownCtrl', function ($scope, $log) {
  $scope.items = [
    {txt: 'Les plus récentes', icon: 'fa-plus-circle'},
    {txt: 'Les plus vues', icon: 'fa-eye'},
    {txt: 'Les plus répondues', icon: 'fa-comment-o'}
  ];

  $scope.status = {
    isopen: false
  };

  $scope.toggled = function(open) {
    $log.log('Dropdown is now: ', open);
  };

  $scope.toggleDropdown = function($event) {
    $event.preventDefault();
    $event.stopPropagation();
    $scope.status.isopen = !$scope.status.isopen;
  };
});