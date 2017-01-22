'use strict';


// todo : upload files
// @see : http://stackoverflow.com/questions/13963022/angularjs-how-to-implement-a-simple-file-upload-with-multipart-form?answertab=votes#tab-top

// todo : utility to convert SQL date to ISO

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
    'pascalprecht.translate',
    'angularMoment'    
])


/**
* Provide fulscreen capability to textAngular editor
*
*/
.config([
    '$provide', 
    function($provide) {
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
    }
])

/**
* moment.js : customization
*
*/
.config(function() {
    moment.updateLocale(global_config.locale, {
        calendar : {
            sameElse: 'LLL'
        }
    });

})

/**
* angular-translate: register translation data
*
*/
.config([
    '$translateProvider', 
    function($translateProvider) {
        // we expect a file holding the 'translations' var definition 
        // to be loaded in index.html
        if(typeof translations != 'undefined') {
            $translateProvider
            .translations(global_config.locale, translations)
            .preferredLanguage(global_config.locale)
            .useSanitizeValueStrategy('sanitize');
        }    
    }
])

/**
* Set HTTP POST format to URLENCODED (instead of JSON)
*
*/
.config([
    '$httpProvider', 
    '$httpParamSerializerJQLikeProvider', 
    function($httpProvider, $httpParamSerializerJQLikeProvider) {
        // Use x-www-form-urlencoded Content-Type
        $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';    
        $httpProvider.defaults.paramSerializer = '$httpParamSerializerJQLike';    
        $httpProvider.defaults.transformRequest.unshift($httpParamSerializerJQLikeProvider.$get());
    }
])

/**
* Disable HTML5 mode
*
*/
.config([
    '$locationProvider', 
    function($locationProvider) {
        // ensure we're in Hashbang mode
        $locationProvider.html5Mode(false);
        // $locationProvider.html5Mode({enabled: true, requireBase: false, rewriteLinks: false}).hashPrefix('!');
    }
])



.run( [
    '$window', 
    '$timeout', 
    '$rootScope', 
    '$location', 
    'authenticationService', 
    'actionService', 
    'feedbackService',
    function($window, $timeout, $rootScope, $location, authenticationService, actionService, feedbackService) {
        console.log('run method invoked');

        // bind rootScope with feedbackService service (popover display)
        // in orer to have access to feedbackService from templates (popoverCustom.html)
        $rootScope.popover = feedbackService;
        
        // @model   global data model
        
        const signPath = '/user/sign';
        
        // flag indicating that some content is being loaded
        $rootScope.viewContentLoading = true;   
            
        // Currently pending action, if any (see actionService for struct description)
        $rootScope.pendingAction = null;
        
        /**
        * Previous path 
        * Required in order to return to previous location when user goes to sign page (signin/signup)
        * This value is set when event $locationChangeSuccess occurs
        */
        $rootScope.previousPath = '/';
        $rootScope.currentPath  = null;
        
       
        /**
        * Object of signed in user (if authenticated)
        * This value is set by the authentification service
        * and is used to know if session auto-restore is complete
        *
        */
        $rootScope.user = {id: 0};
     
        // when requesting another location (user click some link)
        $rootScope.$on('$locationChangeStart', function(angularEvent) {
            // mark content as being loaded (show loading spinner)
            $rootScope.viewContentLoading = true;
            console.log(angularEvent);
        });

        // when location has just been changed, remember previous path
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

            // wait for next digest cycle, and:
            // - check if we have to scroll
            // - perform pending action, if any
            $timeout(function() {
                if( $location.hash().length) {
                    console.log('scroll to element');
                    var elem = angular.element(document.querySelector( '#'+$location.hash() ))
                    // scroll a bti higher than the element itself
                    $window.scrollTo(0, elem[0].offsetTop-55);
                }
                else {
                    console.log('scroll to top');
                    // scroll to top
                    $window.scrollTo(0, 0);
                }                

                if($rootScope.user.id == 0
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

        // try to authenticate or restore the session
        authenticationService.authenticate();
    }
])

/**
*
* we take advantage of the rootController to define globaly accessible utility methods
*/
.controller('rootController', [
    '$rootScope', 
    '$scope',
    function($rootScope, $scope) {
        console.log('root controller');

        var rootCtrl = this;

        rootCtrl.makeLink = function(object_class, object_id) {
            switch(object_class) {    
            case 'resiexchange\\Question': return '#/question/'+object_id;
            case 'resiway\\Category': return '#/category/'+object_id;
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
                                day:    'numeric'
                           });
                }
                return res;
            },

            datetime: function(value) {
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
                        var diff_m = Math.floor(diff / 30);
                        if(diff_m == 1) return 'last month';            
                        return diff_m + " months ago";
                    }
                    
                    var diff_y = Math.floor(diff / 365);
                    if(diff_y == 1) return 'last year';
                    return diff_y + " years ago";                
                }
                return res;         
            },

            timeElapsed: function(value) {
                var res= '';
                var now = new Date();
                var timestamp = Date.parse(value);
                if(timestamp != NaN) {
                    var once = new Date(timestamp);
                    var diff = Math.floor( (now - once) / (1000 * 60 * 60 *24) );
                    if(diff == 0) return 'today';

                    if(diff < 7) {
                        return diff + " days";
                    }
                    if(diff < 30) {
                        var diff_w = Math.floor(diff / 7);
                        return diff_w + " weeks";
                    }
                    if(diff < 365) {
                        var diff_m = Math.floor(diff / 30);
                        return diff_m + " months";
                    }
                    
                    var diff_y = Math.floor(diff / 365);
                    return diff_y + " years";
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
        
        
        
    }
])

.controller('homeController', function() {
    var ctrl = this;

    console.log('home controller');  
    
    this.ok = function() {
        console.log('ok');
    };    
  
});

angular.module('resiway')

.service('routeObjectProvider', [
    '$http', 
    '$route', 
    '$q',
    function ($http, $route, $q) {
        return {
            provide: function (provider) {
                var deferred = $q.defer();
                // set an empty object as default result
                deferred.resolve({});

                if(typeof $route.current.params.id == 'undefined' 
                || $route.current.params.id == 0) return deferred.promise;
                
                return $http.get('index.php?get='+provider+'&id='+$route.current.params.id)
                .then(
                    function successCallback(response) {
                        var data = response.data;
                        if(typeof data.result != 'object') return {};
                        return data.result;
                    },
                    function errorCallback(response) {
                        // something went wrong server-side
                        return deferred.promise;
                    }
                );
            }
        };
    }
])      

.service('routeCategoryProvider', [
    'routeObjectProvider', 
    function(routeObjectProvider) {
        this.load = function() {
            return routeObjectProvider.provide('resiway_category');
        };
    }
])

.service('routeCategoriesProvider', ['$http', function($http) {
    this.load = function() {
        return $http.get('index.php?get=resiway_category_list&order=title')
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
}])

.service('routeQuestionsProvider', ['$http', function($http) {
    this.load = function() {
        return $http.get('index.php?get=resiexchange_question_list&order=title')
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
}])

.service('routeQuestionProvider', ['routeObjectProvider', '$sce', function(routeObjectProvider, $sce) {
    this.load = function() {
        return routeObjectProvider.provide('resiexchange_question')
        .then(function(result) {
            // adapt result to view requirements
            var attributes = {
                commentsLimit: 5,
                newCommentShow: false,
                newCommentContent: '',
                newAnswerContent: ''                               
            }
            // add meta info attributes
            angular.extend(result, attributes);            
            // mark html as safe
            result.content = $sce.trustAsHtml(result.content);
            // process each answer
            angular.forEach(result.answers, function(value, index) {
                // mark html as safe
                result.answers[index].content = $sce.trustAsHtml(result.answers[index].content);
                // add meta info attributes
                angular.extend(result.answers[index], attributes);
            });       
            return result;
        });
    };
}])

.service('routeAnswerProvider', ['routeObjectProvider', '$sce', function(routeObjectProvider, $sce) {
    this.load = function() {
        return routeObjectProvider.provide('resiexchange_answer')
        .then(function(result) {        
            // mark html as safe
            result.content = $sce.trustAsHtml(result.content);
            return result;
        });
    };
}])

.service('routeUserProvider', ['routeObjectProvider', function(routeObjectProvider) {
    this.load = function() {
        return routeObjectProvider.provide('resiway_user');
    };
}])

/**
*
*/
.service('authenticationService', [
    '$rootScope', 
    '$http', 
    '$q', 
    '$cookieStore',
    function($rootScope, $http, $q, $cookieStore) {
        var $auth = this;
        

        // @init
        $auth.username = '';
        $auth.password = '';
        
        // @private
        this.userId = function() {
            var deferred = $q.defer();
            // attempt to log the user in
            $http.get('index.php?get=resiway_user_id').then(
            function successCallback(response) {
                if(typeof response.data.result != 'undefined'
                && response.data.result > 0) {
                    deferred.resolve(response.data.result);
                } 
                else {
                    deferred.reject(); 
                }
            },
            function errorCallback(response) {
                deferred.reject();
            });
            return deferred.promise;            
        };
            
        // @private
        this.userData = function(user_id) {
            var deferred = $q.defer();
            // attempt to retrieve user data
            $http.get('index.php?get=resiway_user&id='+user_id)
            .success(function(data, status, headers, config) {
                if(typeof data == 'object' 
                && typeof data.result == 'object'
                && data.result.id == user_id) {
                    deferred.resolve(data.result);
                }
                else {
                    deferred.reject();
                }
            })
            .error(function(data, status, headers, config) {
                deferred.reject();
            });    
            return deferred.promise;            
        };


        /**
        *
        * This method is called:
        *  at runtime (run method), if a cookie is retrieved
        *  in the sign controller
        *  in the register controller
        *
        * @public
        */
        this.setCredentials = function (username, password, store) {
            $auth.username = username;
            $auth.password = password;
            // store crendentials in the cookie
            if(store) {
                $cookieStore.put('username', username);
                $cookieStore.put('password', password);
            }             
        };
        
        // @public
        this.clearCredentials = function () {
            $auth.username = '';
            $auth.password = '';        
            $rootScope.user = {id: 0};
            $cookieStore.remove('username');
            $cookieStore.remove('password'); 
        };    
        

        // @private
        this.signin = function() {
            var deferred = $q.defer();
            if(typeof $auth.username == 'undefined'
            || typeof $auth.password == 'undefined'
            || !$auth.username.length 
            || !$auth.password.length) {
                $auth.clearCredentials();
                // reject with 'missing_param' error code
                deferred.reject({'result': -2});
            }
            else {
                $http.get('index.php?do=resiway_user_signin&login='+$auth.username+'&password='+$auth.password)
                .then(
                function successCallback(response) {
                    if(typeof response.data.result == 'undefined') {
                        // something went wrong server-side
                        return deferred.reject({'result': -1});
                    }
                    if(response.data.result < 0) {
                        // given values not accepted
                        $auth.clearCredentials();
                        return deferred.reject(response.data);
                    }
                    return deferred.resolve(response.data.result);
                },
                function errorCallback(response) {
                    // something went wrong server-side
                    return deferred.reject({'result': -1});
                }
                );
            }
            return deferred.promise;
        };

        this.register = function(login, firstname) {
            return $http.get('index.php?do=resiway_user_signup&login='+login+'&firstname='+firstname);        
        };
        
        // @public
        // this method works in best-effort to ensure user identification
        // tries to recover if a session is already set server-side
        // otherwise it uses current credentials to log user in and read related data
        //
        this.authenticate = function() {
            var deferred = $q.defer();
            
            // if the user is already logged in
            if($rootScope.user.id > 0) {        
                deferred.resolve($rootScope.user);
            }
            // user is still unidentified
            else {
                // request user_id (checks if seesion is set server-side)
                $auth.userId().then(
                // session is already set
                function(user_id) {
                    // fetch related data
                    $auth.userData(user_id).then(
                    function(data) {
                        $rootScope.user = data;
                        deferred.resolve(data);
                    },
                    function() {
                        // something went wrong server-side
                        deferred.reject(); 
                    });                    
                },
                // user is not identified yet
                function() {                    
                    // try to sign in with current credentials                    
                    $auth.signin().then(
                    function(user_id) {
                        $auth.userData(user_id)
                        .then(
                            function successHandler(data) {
                                $rootScope.user = data;
                                deferred.resolve(data);
                            },
                            function errorHandler() {
                                // something went wrong server-side
                                deferred.reject();                                
                            }
                        );                            
                    },
                    function(data) {
                        // given values were not accepted 
                        // or something went wrong server-side
                        deferred.reject();  
                    });
                });
            }
            return deferred.promise;
        };
    }
])



.service('actionService', [
    '$rootScope', 
    '$http', 
    '$location', 
    'authenticationService',
    function($rootScope, $http, $location, authenticationService) {
    
        this.perform = function(action) {
            var defaults = {
                // valid name of the action to perform server-side
                action: '',
                // string representing the data to submit to action handler (i.e.: serialized value of a form)
                data: '',
                // path to return to once user is identified
                next_path: $location.path(),
                // scope in wich callback function will apply
                scope: null,
                // callback function to run after action completion (to handle error cases, ...)
                callback: function(scope, data) {}
            };
            
            var task = angular.extend({}, defaults, action);
            
            authenticationService.authenticate().then(
            // user is authentified and can perform the action
            function() {
                // pending action has been processed : reset it from global scope
                $rootScope.pendingAction = null;
                // submit action to the server, if any
                if(typeof task.action != 'undefined'
                && task.action.length > 0) {
                    $http.post('index.php?do='+task.action, task.data).then(
                    function successCallback(response) {
                        if(typeof response.data.notifications != 'undefined' && response.data.notifications.length > 0) {
                            $rootScope.user.notifications = $rootScope.user.notifications.concat(response.data.notifications);
                        }
                        if(typeof task.callback == 'function') {
                            task.callback(task.scope, response.data);
                        }
                    },
                    function errorCallback() {
                        // something went wrong server-side
                    });
                }
            },
            // user is still unidentified
            function() {
                // store pending action for completion after identification
                $rootScope.pendingAction = task;
                // display signin / signup form
                $location.hash('');
                $location.path('/user/sign');
            });
        };
        
    }
])


/**
* This service aims to display / hide a popover giving some feedback when an action is denied or goes wrong.
* there can only be one popover at the same time on the whole page
* to display a popover, we need an anchor : a node having an id and a uid-popover-template attribute
* an event can be triggered by a A node or any of its sub-nodes
*/
.service('feedbackService', ['$window', function($window) {
    var popover = {
        content: '',
        elem: null
    };
    return {
        /**
        * Getter for popover content
        *
        */
        content: function() {
            return popover.content;
        },
        
        /**
        * Scrolls to target element and
        * if msg is not empty, displays popover 
        */           
        popover: function (selector, msg) {
            // popover has been previously assign
            closePopover();

            // retrieve element
            var elem = angular.element(document.querySelector( selector ));
            
            // save target content and element
            popover.content = msg;
            popover.elem = elem;

            // scroll to element, if outside viewport
            var elemYOffset = elem[0].offsetTop;

            if(elemYOffset < $window.pageYOffset 
            || elemYOffset > ($window.pageYOffset + $window.innerHeight)) {
                $window.scrollTo(0, elemYOffset-($window.innerHeight/4));
            }
            
            if(msg.length > 0) {
                // trigger popover display (toggle)
                elem.triggerHandler('toggle-popover');
            }            
        },
        
        /**
        * Close current popover, if any
        * 
        */           
        close: function() {
            closePopover();
        },
        
        /**
        * Retrieves the node holding the uib-popover* attribute
        * returns the selector allowing to retrieve this node in the document
        *
        */
        selector: function(domElement) {
            return selectorFromElement(domElement);
        }
        
    };

    // @private methods
    function closePopover() {
        if(popover.elem) {
            popover.elem.triggerHandler('toggle-popover');
            popover.elem = null; 
        }        
    }
    
    function selectorFromElement(domElement) {
        var element = angular.element(domElement);
        while(typeof element.attr('id') == 'undefined'
           || typeof element.attr('uib-popover-template') == 'undefined') {
            element = element.parent();
        }
        return '#' + element.attr('id');          
    }

}]);
angular.module('resiway')

.config([
    '$routeProvider', 
    '$routeParamsProvider', 
    '$httpProvider',
    function($routeProvider, $routeParamsProvider, $httpProvider) {
        
        var templatePath = 'packages/resiway/apps/views/';
        /**
        * Routes definition
        * This call associates handled URL with their related views and controllers
        * 
        * As a convention, a 'ctrl' member is always defined inside a controller as itself
        * so it can be manipulated the same way in view and in controller
        */
        $routeProvider
        /**
        * Category related routes
        */
        .when('/categories', {
            templateUrl : templatePath+'categories.html',
            controller  : 'categoriesController as ctrl',
            resolve     : {
                categories: ['routeCategoriesProvider', function (provider) {
                    return provider.load();
                }]
            }
        })
       
        .when('/category/edit/:id', {
            templateUrl : templatePath+'categoryEdit.html',
            controller  : 'categoryEditController as ctrl',
            resolve     : {
                // request object data
                category: ['routeCategoryProvider', function (provider) {
                    return provider.load();
                }],
                // list of categories is required as well for selecting parent category
                categories: ['routeCategoriesProvider', function (provider) {
                    return provider.load();
                }]
            }        
        })
        .when('/category/:id', {
            templateUrl : templatePath+'category.html',
            controller  : 'categoryController as ctrl',
            resolve     : {
                category: ['routeCategoryProvider', function (provider) {
                    return provider.load();
                }]
            }        
        })      
        /**
        * Question related routes
        */
        .when('/questions', {
            templateUrl : templatePath+'questions.html',
            controller  : 'questionsController as ctrl',
            resolve     : {
                // list of categories is required as well for selecting parent category
                questions: ['routeQuestionsProvider', function (provider) {
                    return provider.load();
                }]
            }                
        })
        .when('/question/edit/:id', {
            templateUrl : templatePath+'questionEdit.html',
            controller  : 'questionEditController as ctrl',
            resolve     : {
                question: ['routeQuestionProvider', function (provider) {
                    return provider.load();
                }],            
                categories: ['routeCategoriesProvider', function (provider) {
                    return provider.load();
                }]
            }        
        })    
        .when('/question/:id/:title?', {
            templateUrl : templatePath+'question.html',
            controller  : 'questionController as ctrl',
            resolve     : {
                question: ['routeQuestionProvider', function (provider) {
                    return provider.load();
                }]
            }
        })
        .when('/answer/edit/:id', {
            templateUrl : templatePath+'answerEdit.html',
            controller  : 'answerEditController as ctrl',
            resolve     : {
                answer: ['routeAnswerProvider', function (provider) {
                    return provider.load();
                }]
            }        
        })     
        /**
        * User related routes
        */
        .when('/user/edit/:id', {
            templateUrl : templatePath+'userEdit.html',
            controller  : 'userEditController as ctrl',
            resolve     : {
                user: ['routeUserProvider', function (provider) {
                    return provider.load();
                }]
            }        
        })
        .when('/user/profile/:id', {
            templateUrl : templatePath+'userProfile.html',
            controller  : 'userProfileController as ctrl',
            resolve     : {
                user:  ['routeUserProvider', function (provider) {
                    return provider.load();
                }]
            }             
        })
        .when('/user/password', {
            templateUrl : templatePath+'userPassword.html',
            controller  : 'userPasswordController as ctrl'          
        })        
        .when('/user/confirm/:code', {
            templateUrl : templatePath+'userConfirm.html',
            controller  : 'userConfirmController as ctrl'
        })            
        .when('/user/notifications/:id', {
            templateUrl : templatePath+'userNotifications.html',
            controller  : 'userNotificationsController as ctrl'
        })
        .when('/user/sign/:mode?', {
            templateUrl : templatePath+'userSign.html',
            controller  : 'userSignController as ctrl',
            reloadOnSearch: false
        })
        /**
        * Default route
        */    
        .otherwise({
            templateUrl : templatePath+'home.html',
            controller  : 'homeController as ctrl'
        });
        
    }
]);
angular.module('resiway')

.filter("nl2br", function() {
 return function(data) {
   if (!data) return data;
   return data.replace(/\n\r?/g, '<br />');
 };
})

.filter("humanizeCount", function() {
    return function(value) {
        if(typeof value == 'undefined' 
        || typeof parseInt(value) != 'number') return 0;
        if(value == 0) return 0;
        var sign = value/Math.abs(value);
        value = Math.abs(value);
        var s = ['', 'k', 'M', 'G'];
        var e = Math.floor(Math.log(value) / Math.log(1000));
        return (sign*((e <= 0)?value:(value / Math.pow(1000, e)).toFixed(1))) + s[e];
    };
})

/**
* display select widget with selected items
*/
.filter('customSearchFilter', ['$sce', function($sce) {
    return function(label, query, item, options, element) {
        var closeIcon = '<span class="close select-search-list-item_selection-remove">×</span>';
        return $sce.trustAsHtml(item.title + closeIcon);
    };
}])

.filter('customDropdownFilter', ['$sce', 'oiSelectEscape', function($sce, oiSelectEscape) {
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

.filter('customListFilter', ['oiSelectEscape', function(oiSelectEscape) {
    /**
    * Converts to lower case and strips accents
    * this method is used in myListFilter, a custom filter for dsiplaying categories list
    * using the oi-select angular plugin
    *
    * note : this is not valid for non-latin charsets !
    */
    String.prototype.toLowerASCII = function () {
        var str = this.toLocaleLowerCase();
        var result = '';
        var convert = {
            192:'a', 193:'a', 194:'a', 195:'a', 196:'a', 197:'a',
            224:'a', 225:'a', 226:'a', 227:'a', 228:'a', 229:'a',
            200:'e', 201:'e', 202:'e', 203:'e',
            232:'e', 233:'e', 234:'e', 235:'e',
            204:'i', 205:'i', 206:'i', 207:'i',
            236:'i', 237:'i', 238:'i', 239:'i',
            210:'o', 211:'o', 212:'o', 213:'o', 214:'o', 216:'o',
            240:'o', 242:'o', 243:'o', 244:'o', 245:'o', 246:'o',
            217:'u', 218:'u', 219:'u', 220:'u',      
            249:'u', 250:'u', 251:'u', 252:'u'
        };
        for (var i = 0, code; i < str.length; i++) {
            code = str.charCodeAt(i);
            if(code < 128) {
                result = result + str.charAt(i);
            }
            else {
                if(typeof convert[code] != 'undefined') {
                    result = result + convert[code];   
                }
            }
        }
        return result;
    }
    
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
}]);
angular.module('resiway')

.controller('answerEditController', [
    'answer', 
    '$scope', 
    '$window', 
    '$location', 
    '$sce', 
    'feedbackService', 
    'actionService', 
    'textAngularManager',
    function(answer, $scope, $window, $location, $sce, feedbackService, actionService, textAngularManager) {
        console.log('answerEdit controller');
        
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
    }
]);
angular.module('resiway')

.controller('categoriesController', [
    'categories', 
    '$scope',
    function(categories, $scope) {
        console.log('categories controller');

        var ctrl = this;

        // @data model
        $scope.categories = categories;
    
    }
]);
angular.module('resiway')

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
           
    }
]);
angular.module('resiway')

/**
 * Question controller
 *
 */
.controller('questionController', [
    'question', 
    '$scope', 
    '$window', 
    '$location', 
    '$sce', 
    '$timeout', 
    '$uibModal', 
    'actionService', 
    'feedbackService', 
    'textAngularManager',
    function(question, $scope, $window, $location, $sce, $timeout, $uibModal, actionService, feedbackService, textAngularManager) {
        console.log('question controller');
        
        var ctrl = this;

        // @model
        $scope.question = question;

    // todo : move this to rootScope
        ctrl.open = function (title_id, header_id, content) {
            return $uibModal.open({
                animation: true,
                ariaLabelledBy: 'modal-title',
                ariaDescribedBy: 'modal-body',
                templateUrl: 'modalCustom.html',
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
        
    }
]);
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
angular.module('resiway')

.controller('questionsController', [
    'questions', 
    '$scope',
    function(questions, $scope) {
        console.log('questions controller');

        var ctrl = this;

        // @data model
        ctrl.questions = questions;
    
    }
]);
angular.module('resiway')

/**
* Top Bar Controller
* 
* 
*/
.controller('topBarCtrl', [
    '$scope', 
    '$document',
    'actionService',
    'authenticationService',
    function($scope, $document, action, authentication) {
        console.log('topbar controller');
        
        var ctrl = this;
        
        // @model
        ctrl.platformDropdown = false;
        ctrl.userDropdown = false;
        ctrl.notifyDropdown = false;
     
        function hideAll() {
            ctrl.platformDropdown = false;
            ctrl.userDropdown = false;
            ctrl.notifyDropdown = false;            
        }

        angular.element(document.querySelectorAll('#topBar a')).on('click', function() {
            hideAll();
        });
        
        function documentClickBind(event) {
            if(event) {
                var $targetScope = angular.element(event.target).scope();
                while($targetScope) {               
                    if($scope.$id == $targetScope.$id) {
                        return false;
                    }
                    $targetScope = $targetScope.$parent;
                }            
            }
            $scope.$apply(function() {
                hideAll();
                $document.off('click', documentClickBind);
            });            
        }
        
        $scope.togglePlatformDropdown = function() {
            var flag = ctrl.platformDropdown;
            hideAll();     
            if(!flag) $document.on('click', documentClickBind);   
            else $document.off('click', documentClickBind);
            ctrl.platformDropdown = !flag;                        
        };
        
        $scope.toggleUserDropdown = function() {
            var flag = ctrl.userDropdown;
            hideAll();
            if(!flag) $document.on('click', documentClickBind);   
            else $document.off('click', documentClickBind);
            ctrl.userDropdown = !flag;
        };

        $scope.toggleNotifyDropdown = function() {
            var flag = ctrl.notifyDropdown;            
            hideAll();
            if(!flag) $document.on('click', documentClickBind);   
            else $document.off('click', documentClickBind);
            ctrl.notifyDropdown = !flag;
        };
                       
        $scope.signOut = function(){          
            action.perform({
                action: 'resiway_user_signout',
                next_path: '/',
                callback: function($scope, data) {
                    authentication.clearCredentials();
                }
            });
        };
    }
]);
angular.module('resiway')

.controller('userConfirmController', [
    '$scope',
    '$routeParams',
    '$http',
    'authenticationService',
    function($scope, $routeParams, $http, authenticationService) {
        console.log('userConfirm controller');

        var ctrl = this;

        ctrl.code = $routeParams.code;
        ctrl.verified = false;
        ctrl.password_updated = false;        
        ctrl.closeAlerts = function() {
            $scope.alerts = [];
        };
        
        $scope.password = '';
        $scope.confirm = '';    
        $scope.alerts = [];

        
        $http.get('index.php?do=resiway_user_confirm&code='+ctrl.code)
        .then(
        function successCallback(response) {
            var data = response.data;
            if(typeof response.data.result != 'undefined'
            && response.data.result === true) {
                ctrl.verified = data.result;
                // we should now be able to authenticate 
                authenticationService.authenticate();                
            }
        },
        function errorCallback() {
            // something went wrong server-side
        });
        
        ctrl.passwordReset = function() {
            $scope.alerts = [];
            if($scope.password.length == 0 || $scope.password != $scope.confirm) {
                if($scope.password.length == 0) {
                    $scope.alerts.push({ type: 'warning', msg: 'Please, provide a new password.' });                
                }
                else if($scope.confirm.length == 0) {
                    $scope.alerts.push({ type: 'warning', msg: 'Please, re-type your new password.' });                
                }
                else if($scope.password != $scope.confirm) {
                    $scope.alerts.push({ type: 'warning', msg: 'Confirmation does not match the specified password.' });                
                }                
            }
            else {
                $http.get('index.php?do=resiway_user_passwordreset&password='+md5($scope.password)+'&confirm='+md5($scope.confirm))
                .then(
                function successCallback(response) {
                    var data = response.data;
                    if(typeof response.data.result != 'undefined'
                    && response.data.result === true) {
                        ctrl.password_updated = data.result;
                    }
                },
                function errorCallback() {
                    // something went wrong server-side
                });                
            }
        };
        
    }
]);
angular.module('resiway')
/**
* Display given user public profile for edition
*
*/
.controller('userEditController', [
    'user',
    '$scope',
    '$window',
    '$filter',
    'feedbackService',
    'actionService',
    function(user, $scope, $window, $filter, feedback, action) {
    console.log('userEdit controller');    
    
    var ctrl = this;

    ctrl.user = user;    
    ctrl.publicity_mode = {id: 1, text: 'Fullname'};

// todo: translate    
    ctrl.modes = [ 
        {id: 1, text: 'Fullname'}, 
        {id: 2, text: 'Firstname + Lastname inital'}, 
        {id: 3, text: 'Firstname only'}
    ];
    
    // @init
    angular.forEach(ctrl.modes, function(mode) {
        if(mode.id == ctrl.user.publicity_mode) {
            ctrl.publicity_mode = {id: mode.id, text: mode.text};                
        }
    });
    
    $scope.$watchGroup([
            function(){return ctrl.publicity_mode;},
            function(){return ctrl.user.firstname;},
            function(){return ctrl.user.lastname;}
        ], function() {
        ctrl.user.publicity_mode = ctrl.publicity_mode.id;
        switch(ctrl.user.publicity_mode) {
        case 1:
            ctrl.user.display_name = ctrl.user.firstname+' '+ctrl.user.lastname;
            break;
        case 2:
            var lastname = '';
            if(ctrl.user.lastname.length) {
                lastname = ctrl.user.lastname.substr(0, 1)+'.';
            }
            ctrl.user.display_name = ctrl.user.firstname+' '+lastname;
            break;
        case 3:
            ctrl.user.display_name = ctrl.user.firstname;
            break;
        }                
    });

    ctrl.userPost = function($event) {
        var selector = feedback.selector(angular.element($event.target));                   
        action.perform({
            // valid name of the action to perform server-side
            action: 'resiway_user_edit',
            // string representing the data to submit to action handler (i.e.: serialized value of a form)
            data: {
                id: ctrl.user.id,
                firstname: ctrl.user.firstname,
                lastname: ctrl.user.lastname,
                publicity_mode: ctrl.user.publicity_mode,
                language: ctrl.user.language,
                country: ctrl.user.country,
                location: ctrl.user.location,
                about: ctrl.user.about   
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
                    feedback.popover(selector, msg);
                }
                else {
                    // scroll to top
                    $window.scrollTo(0, 0);
                    $scope.showMessage = true;
                }
            }        
        });
    };  
}]);
angular.module('resiway')

.controller('userNotificationsController', [ 
    '$scope', 
    '$rootScope', 
    'actionService', 
    'feedbackService', 
    function($scope, $rootScope, action, feedback) {
    console.log('userNotifications controller');
    
    var ctrl = this;
    
    ctrl.dismiss = function($event, index) {
        var selector = feedback.selector($event.target);         
        action.perform({
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
                if(data.result === true) {
                    $rootScope.user.notifications.splice(index, 1); 
                }
                else {
                    // result is an error code
                    var error_id = data.error_message_ids[0];                    
                    // todo : get error_id translation
                    var msg = error_id;
                    feedback.popover(selector, msg);                    
                }
            }        
        });        
    };
}]);
angular.module('resiway')

/**
* 
* 
* 
*/
.controller('userPasswordController', [
    '$scope',
    '$http',
    function($scope, $http) {
        console.log('userPassword controller');
        
        var ctrl = this;

        // @model             
        $scope.password = '';
        $scope.confirm = '';    
        $scope.alerts = [];
        // alerts format : { type: 'danger|warning|success', msg: 'Alert message.' }
        
        ctrl.password_updated = false;   
        ctrl.closeAlerts = function() {
            $scope.alerts = [];
        };
        
        ctrl.passwordReset = function() {
            $scope.alerts = [];            
            if($scope.password.length == 0 || $scope.password != $scope.confirm) {
                if($scope.password.length == 0) {
                    $scope.alerts.push({ type: 'warning', msg: 'Please, provide a new password.' });                
                }
                else if($scope.confirm.length == 0) {
                    $scope.alerts.push({ type: 'warning', msg: 'Please, re-type your new password.' });                
                }
                else if($scope.password != $scope.confirm) {
                    $scope.alerts.push({ type: 'warning', msg: 'Confirmation does not match the specified password.' });                
                }                
            }
            else {
                $http.get('index.php?do=resiway_user_passwordreset&password='+md5($scope.password)+'&confirm='+md5($scope.confirm))
                .then(
                function successCallback(response) {
                    var data = response.data;
                    if(typeof response.data.result != 'undefined'
                    && response.data.result === true) {
                        ctrl.password_updated = data.result;
                    }
                },
                function errorCallback() {
                    // something went wrong server-side
                });                
            }
        };

    }
]);
angular.module('resiway')

.controller('userProfileController', [
    'user', 
    '$scope', 
    '$http', 
    function(user, $scope, $http) {
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
            // reset objects list (triggers loader display)
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
            updates: {
                items: -1,
                total: -1,
                currentPage: 1,
                limit: 5,
                domain: [[['user_id', '=', ctrl.user.id],['user_increment','<>', 0]],[['author_id', '=', ctrl.user.id],['author_increment','<>', 0]]],
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
            },
            actions: {
                items: -1,
                total: -1,
                currentPage: 1,
                limit: 5,
                domain: [['user_id', '=', ctrl.user.id]],
                provider: 'resiway_actionlog_list'
            },        
        });   
    }
]);
angular.module('resiway')

/**
* 
* Once successfully identified, this controller will redirect to previously stored location, if any
* this controller displays a form for collecting user credentials
*/
.controller('userSignController', [
    '$scope', 
    '$rootScope', 
    '$location', 
    '$routeParams', 
    '$http',
    'authenticationService',
    function($scope, $rootScope, $location, $routeParams, $http, authenticationService) {
        console.log('userSign controller');
        
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
        
        ctrl.recovery_sent = false;
        
        ctrl.closeSignInAlerts = function() {
            $scope.signInAlerts = [];
        };
        
        ctrl.closeSignInAlert = function(index) {
            $scope.signInAlerts.splice(index, 1);
        };

        ctrl.closeSignUpAlerts = function() {
            $scope.signUpAlerts = [];
        };
        
        ctrl.closeSignUpAlert = function(index) {
            $scope.signUpAlerts.splice(index, 1);
        };

        ctrl.closeRecoverAlerts = function() {
            $scope.recoverAlerts = [];
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
                    ctrl.closeSignInAlerts();
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
                        ctrl.closeSignUpAlerts();
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
            if($scope.email.length == 0) {
                $scope.recoverAlerts.push({ type: 'warning', msg: 'Please, provide your email.' });
            }
            else {
                $http.get('index.php?do=resiway_user_passwordrecover&email='+$scope.email)
                .then(
                function successCallback(response) {
                    var data = response.data;
                    if(typeof response.data.result != 'undefined'
                    && response.data.result === true) {
                        ctrl.recovery_sent = data.result;
                    }
                },
                function errorCallback() {
                    // something went wrong server-side
                });                  
            }
        };    
    }
]);