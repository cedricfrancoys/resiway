'use strict';


// todo : upload files
// @see : http://stackoverflow.com/questions/13963022/angularjs-how-to-implement-a-simple-file-upload-with-multipart-form?answertab=votes#tab-top

// todo : utility to convert SQL date to ISO

// Instanciate resiway module
var resiway = angular.module('resiexchange', [
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

        // Bind rootScope with feedbackService service (popover display)
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
        
        // search criteria (filters)
        $rootScope.search = {
            criteria: {
                q: '',              // query string (against question title)
                c: 0,               // category (result including subcategories)
                domain: [],         // todo: remove this
                order: 'title',
                sort: 'desc',
                start: 0,
                limit: 25
            },
            total: 0
        };
        
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

        rootCtrl.avatarURL = function(url, size) {
            var str = new String(url);
            return str.replace("@size", size);
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

.controller('homeController', ['$http', '$rootScope', '$location', function($http, $rootScope, $location) {
    var ctrl = this;

    console.log('home controller');  
    
    $http.get('index.php?get=resiexchange_stats')
    .then(
    function successCallback(response) {
        var data = response.data;
        if(typeof response.data.result == 'object') {
            ctrl.count_questions = data.result['resiexchange.count_questions'];
            ctrl.count_answers = data.result['resiexchange.count_answers'];
            ctrl.count_comments = data.result['resiexchange.count_comments'];
            ctrl.count_users = data.result['resiway.count_users'];            
        }
    },
    function errorCallback() {
        // something went wrong server-side
    }); 

    ctrl.search = function(criteria){
        // update global criteria
        $rootScope.search.criteria.domain = ['title', 'like', '%'+criteria+'%'];
        // go to questions list page
        if($location.path() == '/questions') $route.reload();
        else $location.path('/questions');
    };
    
}]);