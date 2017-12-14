'use strict';


// todo : upload files
// @see : http://stackoverflow.com/questions/13963022/angularjs-how-to-implement-a-simple-file-upload-with-multipart-form?answertab=votes#tab-top

// todo : utility to convert SQL date to ISO

// Instanciate resiway module
var resiway = angular.module('resipedia', [
    // dependencies
    'ngRoute', 
    'ngSanitize',
    'ngCookies', 
    'ngAnimate',
    'ngFileUpload',
    'ui.bootstrap',
    'ui.tinymce',    
    'oi.select',
    'pascalprecht.translate',
    'btford.markdown',
    'angularMoment',
    'ngToast',
    'ngHello'
])


/**
* Configure ngToast animations
*
*/
.config(['ngToastProvider', function(ngToastProvider) { 
    // Built-in ngToast animations include slide & fade
    ngToastProvider.configure({ animation: 'fade' }); 
}]) 

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
            console.log('translations loaded');
            $translateProvider
            .translations(global_config.locale, translations)
            .preferredLanguage(global_config.locale)
            .useSanitizeValueStrategy(['sanitizeParameters']);
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
        // $locationProvider.html5Mode(false);
        //$locationProvider.hashPrefix('!');
        $locationProvider.html5Mode({enabled: true, requireBase: true, rewriteLinks: true}).hashPrefix('!');
    }
])

.config([
    'helloProvider',
    function (helloProvider) {
        helloProvider.init(
            {
                // RW public keys
                facebook: '1786954014889199',
                google: '900821912326-epas7m1sp2a85p02v8d1i21kcktp7grl.apps.googleusercontent.com',
                twitter: '6MV5s7IYX2Uqi3tD33s9VSEKb'
            }, 
            {
                scope: 'basic, email',
                redirect_uri: 'oauth2callback',
                oauth_proxy: 'https://auth-server.herokuapp.com/proxy'
            }
        );
    }
])

.run( [
    '$window', 
    '$timeout', 
    '$rootScope', 
    '$location',
    '$cookies',
    '$http',
    'authenticationService', 
    'actionService', 
    'feedbackService',
    'hello',
    function($window, $timeout, $rootScope, $location, $cookies, $http, authenticationService, actionService, feedbackService, hello) {
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
            default: {
                q: '',                  // query string (against question title)
                domain: [],
                order: 'created',       // show newest first
                sort: 'desc',
                start: 0,
                limit: 25,
                total: -1
            },
            criteria: {}
        };
        
        angular.merge($rootScope.search.criteria, $rootScope.search.default);

        /**
        * Global config
        * make global configuration accessible through rootScope
        */
        $rootScope.config = angular.extend({
                                        application: 'resiway', 
                                        locale:      'fr', 
                                        channel:     1        // default values
                                    }, 
                                    global_config);
        
        /**
        * Object of signed in user (if authenticated)
        * This value is set by the authentification service
        * It is used to know if session auto-restore is complete
        * and allows access to current user data across all views
        */
        $rootScope.user = {id: 0};
     
        // @events
        
        // when requesting another location (user click some link)
        $rootScope.$on('$locationChangeStart', function(angularEvent) {
            // mark content as being loaded (show loading spinner)
            $rootScope.viewContentLoading = true;
        });

        // when location has just been changed, remember previous path
        $rootScope.$on('$locationChangeSuccess', function(angularEvent) {
            console.log('$locationChangeSuccess');

            // remember previsousPath if different from user/sign (and subs)
            if($rootScope.currentPath && $rootScope.currentPath.substring(0, signPath.length) != signPath) {                
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
/*
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
*/
                console.log('scroll to top');
                // scroll to top
                $window.scrollTo(0, 0);

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
        authenticationService.setCredentials($cookies.get('username'), $cookies.get('password'));
        // try to authenticate or restore the session
        authenticationService.authenticate();

        /* 
        * relay hello.js login notifications
        */
        hello.on("auth.login", function (auth) {
            console.log('auth notification received in rootscope');
            console.log(auth);
            if(angular.isDefined(auth.authResponse) && angular.isDefined(auth.authResponse.network) && angular.isDefined(auth.authResponse.access_token)) {
                // relay auth data to the server
                $http.get('index.php?do=resiway_user_auth&network_name='+auth.authResponse.network+'&network_token='+auth.authResponse.access_token)
                .then(
                    function success(response) {
                        var data = response.data;
                        // now we should be able to authenticate
                        authenticationService.authenticate()
                        .then(
                            function success(data) {
                                $rootScope.$broadcast('auth.signed'); 
                            },
                            function error(data) {
                                // unexpected error
                                console.log(data);
                            }
                         );  
                    },
                    function error(response) {
                        var error_id = data.error_message_ids[0];     
                        // server fault, user not verified, ...
                        // todo
                        console.log(response);
                    }
                );
            }
        });
    }
])

/**
*
* we take advantage of the rootController to define globaly accessible utility methods
*/
.controller('rootController', [
    '$rootScope', 
    '$scope',
    '$location',
    '$route',
    '$http',
    function($rootScope, $scope, $location, $route, $http) {
        console.log('root controller');

        var rootCtrl = this;

        rootCtrl.tinymceOptions = {
            inline: false,
            plugins : 'wordcount charcount advlist autolink link image lists charmap fullscreen preview table paste code',
            skin: 'lightgray',
            theme : 'modern',
            content_css: 'packages/resipedia/apps/assets/css/bootstrap.min.css',
            elementpath: false,
            block_formats: 
                    'Paragraph=p;' +
                    'Heading 1=h3;' +
                    'Heading 2=h4;' +
                    'Heading 3=h5;',
            formats: {
                bold : {inline : 'b' },  
                italic : {inline : 'i' },
                underline : {inline : 'u'}
            },                    
            menu : {
                edit: {title: 'Edit', items: 'undo redo | cut copy paste pastetext | selectall'},
                format: {title: 'Format', items: 'bold italic underline strikethrough superscript subscript | charmap | removeformat'}
            },
            menubar: false,
            toolbar: "fullscreen code | undo redo | bold italic | headings formatselect | blockquote bullist numlist outdent indent | link image | table",
            toggle_fullscreen: false,
            setup: function(editor) {
                editor.on("init", function() {
                    angular.element(editor.editorContainer).addClass('form-control');
                });
                editor.on("focus", function() {
                    angular.element(editor.editorContainer).addClass('focused');
                });
                editor.on("blur", function() {
                    angular.element(editor.editorContainer).removeClass('focused');
                });
                editor.on('FullscreenStateChanged', function () {
                    console.log('fs');
                    rootCtrl.tinymceOptions.toggle_fullscreen = !rootCtrl.tinymceOptions.toggle_fullscreen;
                    if(rootCtrl.tinymceOptions.toggle_fullscreen) {
                        angular.element(editor.editorContainer).addClass('mt-2');
                    }
                    else {
                        angular.element(editor.editorContainer).removeClass('mt-2');
                    }
                });                
            }            
        };        
        
        rootCtrl.search = function(values) {
            var criteria = angular.extend({}, $rootScope.search.default, values || {});
            angular.copy(criteria, $rootScope.search.criteria);

            var list_page = '';
            switch($rootScope.config.application) {
                case 'resiway':
                case 'resiexchange':
                    list_page = '/questions';
                    break;
                case 'resilib':
                    list_page = '/documents';
                    break;
                case 'resilexi':
                    list_page = '/articles';
                    break;
                    
            }
            // go to list page
            if($location.path() == list_page) { 
                $rootScope.$broadcast('$locationChangeStart');
                $route.reload();
            }
            else $location.path(list_page);
        };
        
        
        rootCtrl.makeLink = function(object_class, object_id) {
            switch(object_class) {    
            case 'resiway\\Author': return '#!/author/'+object_id;            
            case 'resiway\\Category': return '#!/category/'+object_id;
            case 'resiexchange\\Question': return '/question/'+object_id;
            case 'resiexchange\\Answer': return '/answer/'+object_id;
            case 'resiexchange\\QuestionComment': return '/questionComment/'+object_id;               
            case 'resiexchange\\AnswerComment': return '/answerComment/'+object_id;
            case 'resilib\\Document': return '/document/'+object_id;            
            case 'resilexi\\Article': return '/article/'+object_id;                        
            }
        };

        rootCtrl.avatarURL = function(url, size) {
            var str = new String(url);
            return str.replace(/@size/g, size);
        };
            
        rootCtrl.htmlToTxt = function(html) {
            var str = new String(html);
            return str.replace(/<[^>]*>/g, '').replace(/\./, ".\n");
        };

        rootCtrl.htmlToURL = function(html) {
            var str = new String(html);
            // remove all html tags and URI encode 
            return encodeURIComponent(str.replace(/<[^>]*>/g, '').replace(/\./, ".\n"));
        };
        
        rootCtrl.humanReadable = {
            
            month: function(value) {
                var res = '';
                var timestamp = Date.parse(value);
                if(timestamp != NaN) {
                    var date = new Date(timestamp);
                    res = date.toLocaleString('fr', { 
                                year:   'numeric', 
                                month:  'long'
                           });
                }
                return res;
            },

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
        
        $scope.selectMatch = function($item, $model, $label, $event) {           
            rootCtrl.search({q: $label});
        };
        
        $scope.getKeywords = function(val) {
            return $http.get('index.php?get=resiway_index_list', {
                    params: {
                        q: val
                    }
                }).then(function(response){
                    return response.data.result;
                });
        };        
        
    }
]);