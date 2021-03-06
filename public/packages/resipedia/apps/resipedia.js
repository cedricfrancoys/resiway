'use strict';
/**
* Converts to lower case and strips accents
* this method is used by:
*  - myListFilter, a custom filter for displaying categories list using the oi-select angular plugin
*  - URL creation based on a string
*
* note : this is not valid for non-latin charsets !
*/
String.prototype.toASCII = function () {
    var str = this.toLocaleLowerCase();
    var result = '';
    var convert = {
        192:'A', 193:'A', 194:'A', 195:'A', 196:'A', 197:'A',
        224:'a', 225:'a', 226:'a', 227:'a', 228:'a', 229:'a',
        200:'E', 201:'E', 202:'E', 203:'E',
        232:'e', 233:'e', 234:'e', 235:'e',
        204:'I', 205:'I', 206:'I', 207:'I',
        236:'i', 237:'i', 238:'i', 239:'i',
        210:'O', 211:'O', 212:'O', 213:'O', 214:'O', 216:'O',
        240:'o', 242:'o', 243:'o', 244:'o', 245:'o', 246:'o',
        217:'U', 218:'U', 219:'U', 220:'U',
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
};

String.prototype.toURL = function () {
    var str = this.toASCII();
    return str
        // remove all non-quote-space-alphanum-dash chars
        .replace(/[^a-z\'\s-]/ig, '')
        // replace spaces, dashes and quotes with dashes
        .replace(/[\s-\']+/g, '-')
        // trim the end of the string
        .replace(/-*$/, '');
};

/**
* Encode / Decode a string to base64url
*
*
*/
String.prototype.base64EncodeUrl = function () {
	var str = this;
    str = window.btoa(unescape(encodeURIComponent( str )));
    return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/\=+$/, '');
};

String.prototype.base64DecodeUrl = function () {
	var str = this, str_pad = (str + '===');
    str = str_pad.slice(0, str.length + (str.length % 4));
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    return decodeURIComponent(escape(window.atob( str )));
};


// todo: deprecate
(function() {
    var BASE64_PADDING = '=';

    var BASE64_BINTABLE = [
      -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
      -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63,
      52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1,  0, -1, -1,
      -1,  0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14,
      15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1,
      -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
      41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1
    ];    
    
    var BASE64_CHARTABLE =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'.split('');


    String.prototype.base64_decode = function () {
        var result = '';
        var object = this;
        var leftbits = 0; // number of bits decoded, but yet to be appended
        var leftdata = 0; // bits decoded, but yet to be appended

        // Convert one by one.
        for (var i = 0; i < object.length; i += 1) {
            var code = object.charCodeAt(i);
            var value = BASE64_BINTABLE[code & 0x7F];
            // Skip LF(NL) || CR
            if (0x0A == code || 0x0D == code) continue;
            // Fail on illegal characters
            if (-1 === value) return null;
            // Collect data into leftdata, update bitcount
            leftdata = (leftdata << 6) | value;
            leftbits += 6;
            // If we have 8 or more bits, append 8 bits to the result
            if (leftbits >= 8) {
                leftbits -= 8;
                // Append if not padding.
                if (BASE64_PADDING !== object.charAt(i)) {
                  result += String.fromCharCode((leftdata >> leftbits) & 0xFF);
                }
                leftdata &= (1 << leftbits) - 1;
            }
        }
        // If there are any bits left, the base64 string was corrupted
        if (leftbits) return null;
        return result;
    };


    String.prototype.base64_encode = function () {
        var result = '', index, length, rest;
        var object = this;
        
        if(object.length < 3) return null;
        // Convert every three bytes to 4 ASCII characters.
        for (index = 0, length = object.length - 2; index < length; index += 3) {
            var char1 = object.charCodeAt(index), char2 = object.charCodeAt(index+1), char3 = object.charCodeAt(index+2);
            result += BASE64_CHARTABLE[char1 >> 2];
            result += BASE64_CHARTABLE[((char1 & 0x03) << 4) + (char2 >> 4)];
            result += BASE64_CHARTABLE[((char2 & 0x0F) << 2) + (char3 >> 6)];
            result += BASE64_CHARTABLE[char3 & 0x3F];
        }

        rest = object.length % 3;

        // Convert the remaining 1 or 2 bytes, padding out to 4 characters.
        if (0 !== rest) {
            index = object.length - rest;
            result += BASE64_CHARTABLE[object[index + 0] >> 2];
            var char1 = object.charCodeAt(index), char2 = object.charCodeAt(index+1);
            if (2 === rest) {
                result += BASE64_CHARTABLE[((char1 & 0x03) << 4) + (char2 >> 4)];
                result += BASE64_CHARTABLE[(char2 & 0x0F) << 2];
                result += BASE64_PADDING;
            } 
            else {
                result += BASE64_CHARTABLE[(char1 & 0x03) << 4];
                result += BASE64_PADDING + BASE64_PADDING;
            }
        }

        return result;
    };
    
})();
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
                twitter: '6MV5s7IYX2Uqi3tD33s9VSEKb',
                lescommuns: 'resiway.org'
            }, 
            {
                scope: 'basic, email',
                redirect_uri: 'oauth2callback',
                oauth_proxy: 'https://auth-server.herokuapp.com/proxy'
            }
        );
    }
])

.factory('httpRequestInterceptor', [
    '$cookies',    
    function ($cookies) {
        return {
            request: function (config) {
                config.headers['Authorization'] = 'Bearer ' + $cookies.get('access_token');
                return config;
            }
        };
    }
])

.config(['$httpProvider', function ($httpProvider) {
  $httpProvider.interceptors.push('httpRequestInterceptor');
}])

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
                order: 'created',
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
        // authenticationService.setCredentials($cookies.get('username'), $cookies.get('password'));
        // try to authenticate or restore the session
        authenticationService.authenticate();

        /* 
        * Add custom OAuth servers
        */
        hello.init({
            'lescommuns': {
                oauth: {
                    version: '2',
                    auth: 'https://login.lescommuns.org/auth/realms/master/protocol/openid-connect/auth',
                    grant: 'https://login.lescommuns.org/auth/realms/master/protocol/openid-connect/token'
                },
                scope: {
                    basic: 'openid email'
                },
                response_type: 'token id_token',
                login: function(p) {
                    p.qs.nonce = '' + Math.floor((Math.random() * 100000) + 1);;
                }                
            }
        });        

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

        rootCtrl.searchByCategory = function(category) {
            $rootScope.category = category;
            rootCtrl.search({q: '['+category.title_url+']'});
        };
        
        rootCtrl.search = function(values) {
            var criteria = angular.extend({}, $rootScope.search.default, values || {});
            angular.copy(criteria, $rootScope.search.criteria);

// todo : handle translations             
            var list_page = '/search';
            /*
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
            */
            // go to list page
            if($location.path() == list_page) { 
                $rootScope.$broadcast('$locationChangeStart');
                $route.reload();
            }
            else $location.path(list_page);
        };
        
        
        rootCtrl.makeLink = function(object_class, object_id, object_title) {
            if(arguments.length < 3) object_title = '';
            switch(object_class) {    
            case 'resiway\\Author': return '#!/author/'+object_id+'/'+object_title;
            case 'resiway\\Category': return '#!/category/'+object_id+'/'+object_title;
            case 'resiexchange\\Question': return '/question/'+object_id+'/'+object_title;
            case 'resiexchange\\Answer': return '/answer/'+object_id+'/'+object_title;
            case 'resiexchange\\QuestionComment': return '/questionComment/'+object_id+'/'+object_title;
            case 'resiexchange\\AnswerComment': return '/answerComment/'+object_id+'/'+object_title;
            case 'resilib\\Document': return '/document/'+object_id+'/'+object_title;
            // case 'resilexi\\Article': return '/article/'+object_id+'/'+object_title;
            case 'resilexi\\Article': return '/article/'+object_title;
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
                value = +value;
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

angular.module('resipedia')

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

.service('routeCategoriesProvider', ['$http', '$rootScope', function($http, $rootScope) {
    this.load = function() {
        return $http.get('index.php?get=resiway_category_list&channel='+$rootScope.config.channel)
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

.service('routeArticlesProvider', ['$http', '$rootScope', '$httpParamSerializerJQLike', function($http, $rootScope, $httpParamSerializerJQLike) {
    this.load = function() {
        return $http.get('index.php?get=resilexi_article_list&'+$httpParamSerializerJQLike($rootScope.search.criteria)+'&channel='+$rootScope.config.channel)
        .then(
            function successCallback(response) {
                var data = response.data;
                if(typeof data.result != 'object') {
                    $rootScope.search.criteria.total = 0;
                    return [];
                }
                $rootScope.search.criteria.total = data.total;
                return data.result;
            },
            function errorCallback(response) {
                // something went wrong server-side
                $rootScope.search.criteria.total = 0;
                return [];
            }
        );
    };
}])

.service('routeArticleProvider', ['routeObjectProvider', '$sce', function(routeObjectProvider, $sce) {
    this.load = function() {
        return routeObjectProvider.provide('resilexi_article')
        .then(function(result) {
            // adapt result to view requirements
            var attributes = {
                commentsLimit: 5,
                newCommentShow: false,
                newCommentContent: ''
            }            
            // might receive an article or a term
            if(angular.isDefined(result.articles)) {
                // this is a term
                // process each article
                angular.forEach(result.articles, function(value, index) {
                    // mark html as safe
                    result.articles[index].content = $sce.trustAsHtml(result.articles[index].content);
                    // add meta info attributes
                    angular.extend(result.articles[index], attributes);
                });                
            }
            else {
                // add meta info attributes
                angular.extend(result, attributes);
                // mark html as safe
                result.content = $sce.trustAsHtml(result.content);
            }
            return result;
        });
    };
}])

.service('routeDocumentsProvider', ['$http', '$rootScope', '$httpParamSerializerJQLike', function($http, $rootScope, $httpParamSerializerJQLike) {
    this.load = function() {
        return $http.get('index.php?get=resilib_document_list&'+$httpParamSerializerJQLike($rootScope.search.criteria)+'&channel='+$rootScope.config.channel)
        .then(
            function success(response) {
                var data = response.data;
                if(typeof data.result != 'object') {
                    $rootScope.search.criteria.total = 0;
                    return [];
                }
                $rootScope.search.criteria.total = data.total;
                return data.result;
            },
            function error(response) {
                // something went wrong server-side
                $rootScope.search.criteria.total = 0;
                return [];
            }
        );
    };
}])

.service('routeDocumentProvider', ['routeObjectProvider', '$sce', function(routeObjectProvider, $sce) {
    this.load = function() {
        return routeObjectProvider.provide('resilib_document')
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
            result.description = $sce.trustAsHtml(result.description);
            return result;
        });
    };
}])

.service('routeQuestionsProvider', ['$http', '$rootScope', '$httpParamSerializerJQLike', function($http, $rootScope, $httpParamSerializerJQLike) {
    this.load = function() {
        return $http.get('index.php?get=resiexchange_question_list&'+$httpParamSerializerJQLike($rootScope.search.criteria)+'&channel='+$rootScope.config.channel)
        .then(
            function success(response) {
                var data = response.data;
                if(typeof data.result != 'object') {
                    $rootScope.search.criteria.total = 0;
                    return [];
                }
                $rootScope.search.criteria.total = data.total;
                return data.result;
            },
            function error(response) {
                // something went wrong server-side
                $rootScope.search.criteria.total = 0;
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

.service('routeUsersProvider', ['$http', '$rootScope', function($http, $rootScope) {
    this.load = function() {
        return $http.get('index.php?get=resiway_user_list&order=reputation')
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

.service('routeUserProvider', ['routeObjectProvider', function(routeObjectProvider) {
    this.load = function() {
        return routeObjectProvider.provide('resiway_user');
    };
}])
.service('routeAuthorProvider', ['routeObjectProvider', function(routeObjectProvider) {
    this.load = function() {
        return routeObjectProvider.provide('resiway_author');
    };
}])
.service('routeAuthorByNameProvider', ['$http', '$route', '$q', function($http, $route, $q) {
    this.load = function() {
        var deferred = $q.defer();
        // set an empty object as default result
        deferred.resolve({});
        
        var name = new String($route.current.params.name);
        if(typeof $route.current.params.name == 'undefined'
        || name.length == 0) return deferred.promise;

        return $http.get('index.php?get=resiway_author&name='+name)
        .then(
            function successCallback(response) {
                var data = response.data;
                return data.result;
            },
            function errorCallback(response) {
                // something went wrong server-side
                return [];
            }
        );
    };
}])

.service('routeHelpTopicProvider', ['routeObjectProvider', '$sce', function(routeObjectProvider, $sce) {
    this.load = function() {
        return routeObjectProvider.provide('resiexchange_help_topic')
        .then(function(result) {
            // mark html as safe
            result.content = $sce.trustAsHtml(result.content);
            return result;
        });
    };
}])

.service('routeHelpCategoryProvider', ['routeObjectProvider', function(routeObjectProvider) {
    this.load = function() {
        return routeObjectProvider.provide('resiexchange_help_category');
    };
}])

.service('routeHelpCategoriesProvider', ['routeObjectProvider', '$http', function(routeObjectProvider, $http) {
    this.load = function() {
        return $http.get('index.php?get=resiexchange_help_category_list&order=title')
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

.service('routeBadgesProvider', ['routeObjectProvider', '$http', function(routeObjectProvider, $http) {
    this.load = function() {
        return $http.get('index.php?get=resiway_badge_list&order=name')
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

.service('routeBadgeCategoriesProvider', ['routeObjectProvider', '$http', function(routeObjectProvider, $http) {
    this.load = function() {
        return $http.get('index.php?get=resiway_badgecategory_list&order=name')
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

.service('routeSearchProvider', ['$http', '$rootScope', '$httpParamSerializerJQLike', function($http, $rootScope, $httpParamSerializerJQLike) {
    this.load = function() {
        return $http.get('index.php?get=resiway_search&'+$httpParamSerializerJQLike($rootScope.search.criteria)+'&channel='+$rootScope.config.channel)
        .then(
            function successCallback(response) {
                var data = response.data;
                if(typeof data.result != 'object') {
                    $rootScope.search.criteria.total = 0;
                    return [];
                }
                $rootScope.search.criteria.total = data.total;
                return data.result;
            },
            function errorCallback(response) {
                // something went wrong server-side
                $rootScope.search.criteria.total = 0;
                return [];
            }
        );
    };
}])


/**
*
*/
.service('authenticationService', [
    '$rootScope',
    '$http',
    '$q',
    '$cookies',
    function($rootScope, $http, $q, $cookies) {
        var $auth = this;

        // @init
        // $auth.username = '';
        // $auth.password = '';
        // $auth.access_token = '';
        
        $auth.last_auth_time = 0;
        $auth.max_auth_delay = 1000 * 60 * 5;      // 5 minutes

        /* retrieve user_id if set server-side
        */
        this.userId = function() {
            var deferred = $q.defer();
            // attempt to log the user in
            $http.get('index.php?get=resiway_user_id').then(
            function successCallback(response) {
                if(typeof response.data.result != 'undefined'
                && response.data.result > 0) {
                    $auth.last_auth_time = new Date().getTime();
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

        /* request user data (if id matches current user, we receive private data as well)
        */
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

/*
* @eprecated : acces_token is automatically stored in cookies/localStorage when receiving response from server
        this.setAccessToken = function(jwt_access_token) {
            $auth.access_token = jwt_access_token;
            var now = new Date();
            var exp = new Date(now.getFullYear()+1, now.getMonth(), now.getDate());            
            $cookies.put('access_token', $auth.access_token, {expires: exp});
        };
*/
        
        /**
        *
        * This method is called:
        *  at runtime (run method), if a cookie is retrieved
        *  in the sign controller
        *  in the register controller
        *
        */
        this.setCredentials = function (username, password, store) {
// todo: deprecate            
            /*
            $auth.username = username;
            $auth.password = password;
            // store crendentials in the cookie
            if(store) {
                var now = new Date();
                var exp = new Date(now.getFullYear()+1, now.getMonth(), now.getDate());
                $cookies.put('username', username, {expires: exp});
                $cookies.put('password', password, {expires: exp});
            }
            */
        };

// todo: deprecate
        this.clearCredentials = function () {
            console.log('clearing credentials');
            /*
            $auth.username = '';
            $auth.password = '';
            $rootScope.user = {id: 0};
            //$cookies.remove('username');
            //$cookies.remove('password');
            // $cookies.remove('access_token');
            if(localStorage){
                localStorage.removeItem('hello');
            }
            */
        };

        this.signout = function() {
            $rootScope.user = {id: 0};
            $cookies.remove('access_token');
            if(localStorage){
                localStorage.removeItem('hello');
            }            
        }
    
        this.signin = function(username, password) {
            var deferred = $q.defer();

            $http.get('index.php?do=resiway_user_signin&login='+username+'&password='+password)
            .then(
                function success(response) {
                    if(typeof response.data.result == 'undefined') {
                        // something went wrong server-side
                        return deferred.reject({'result': -1});
                    }
                    if(response.data.result < 0) {
                        // given values not accepted
                        // $auth.clearCredentials();
                        return deferred.reject(response.data);
                    }
                    // result is the user identifier (number)
                    $auth.last_auth_time = new Date().getTime();
                    // we should have receive a cookie along with this response
                    console.log($cookies.put('access_token'));
                    return $auth.userData(response.data.result).then(
                        function success(data) {
                            $rootScope.user = data;
                            return deferred.resolve(data);
                        },
                        function error(data) {
                            // something went wrong server-side
                            console.log('something went wrong server-side');
                            return deferred.reject(data);
                        }
                    );                    
                },
                function error(response) {
                    // something went wrong server-side
                    return deferred.reject({'result': -1});
                }
            );
            
            return deferred.promise;
        };

        this.register = function(login, firstname) {
            var deferred = $q.defer();
            $http.get('index.php?do=resiway_user_signup&login='+login+'&firstname='+firstname)
            .then(
            function success(response) {
                if(response.data.result < 0) {
                    return deferred.reject(response.data);
                }
                return deferred.resolve(response.data.result);
            },
            function error(response) {
                // something went wrong server-side
                return deferred.reject({'result': -1});
            }
            );
            return deferred.promise;
        };

        /*
        * Checks if current user is authenticated and, if not, tries to login
        * This method tries to recover if a session is already set server-side,
        * otherwise it uses current credentials to log user in and read related data
        *
        * @public
        */
        this.authenticate = function() {
            var deferred = $q.defer();        

            // request user_id (checks if access_token has been set)
            $auth.userId()
            .then(
                // already set
                function success(user_id) {
                    // we already have user data
                    if($rootScope.user.id > 0) {
                        deferred.resolve($rootScope.user);
                    }
                    // we still need user data
                    else {
                        // retrieve user data
                        $auth.userData(user_id).then(
                            function success(data) {
                                $rootScope.user = data;
                                deferred.resolve(data);
                            },
                            function error(data) {
                                // something went wrong server-side
                                console.log('something went wrong server-side');
                                deferred.reject(data);
                            }
                        );
                    }
                },
                // user is not identified 
                function error() {
                    // not identified or something went wrong server-side
                    deferred.reject();
                    // from here we should be re-directed to the signin/signup page
                }
            );

            return deferred.promise;
        };
    }
])



.service('actionService', [
    '$rootScope',
    '$http',
    '$location',
    'authenticationService',
    'ngToast',
    function($rootScope, $http, $location, authenticationService, ngToast) {

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
            function success() {
                // pending action has been processed : reset it from global scope
                $rootScope.pendingAction = null;
                // submit action to the server, if any
                if(typeof task.action != 'undefined'
                && task.action.length > 0) {

                    $http.post('index.php?do='+task.action, task.data).then(
                    function success(response) {

                        if(typeof task.callback == 'function') {
                            task.callback(task.scope, response.data);
                        }

                        $http.get('index.php?do=resiway_user_badges_update').then(
                            function successCallback(response) {
                                $http.get('index.php?get=resiway_user_notifications').then(
                                    function successCallback(response) {
                                        var data = response.data;
                                        if(typeof data.result == 'object' && $rootScope.user.id > 0) {
                                            $rootScope.user.notifications = $rootScope.user.notifications.concat(data.result);

                                            angular.forEach(data.result, function(notification, index) {
                                                ngToast.create({
                                                    content: notification.content,
                                                    className: 'success',
                                                    dismissOnTimeout: true,
                                                    timeout: 7000,
                                                    dismissButton: true,
                                                    dismissButtonHtml: '&times',
                                                    dismissOnClick: false,
                                                    compileContent: false
                                                });
                                            });
                                        }
                                    }
                                );
                            }
                        );

                    },
                    function error() {
                        // something went wrong server-side
                    });
                }
            },
            // user is still unidentified
            function error() {
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
.service('feedbackService', ['$window', '$timeout', function($window, $timeout) {
    var popover = {
        content: '',
        elem: null,
        classname: null,
        id: null
    };
    return {
        /**
        * Getter for popover content
        *
        */
        content: function() {
            return popover.content;
        },

        classname: function() {
            // quick workaround to set popover background according to classname (could be done with custom directive)
            var domElem = document.querySelector('#'+popover.id);
            if(domElem && typeof(domElem) != 'undefined') {
                var parent_elem = angular.element(domElem);
                parent_elem.parent().parent().parent().addClass(popover.classname);
            }
            return popover.classname;
        },

        id: function() {
            return popover.id;
        },

        /**
        * Scrolls to target element and
        * if msg is not empty, displays popover
        */
        popover: function (selector, msg, classname, autoclose, autoclose_delay) {
            // popover has been previously assign
            closePopover();

            // retrieve element
            var elem = angular.element(document.querySelector( selector ));

            // save target content and element
            popover.content = msg;
            popover.elem = elem;
            popover.id = 'popover-'+elem.attr('id');
            popover.classname = 'popover-' + (classname || 'danger');

// todo : move this elsewhere            
            function offset(el) {
                var rect = el.getBoundingClientRect(),
                scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
                scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                return { top: rect.top + scrollTop, left: rect.left + scrollLeft }
            }
            
            // scroll to element, if outside viewport
            var elemYOffset = offset(elem[0]).top;            

            if(elemYOffset < $window.pageYOffset
            || elemYOffset > ($window.pageYOffset + $window.innerHeight)) {
                $window.scrollTo(0, elemYOffset-($window.innerHeight/5));
            }

            if(msg.length > 0) {
                // trigger popover display (toggle)
                elem.triggerHandler('toggle-popover');
                popover.is_open = true;
                if(autoclose) {
                    $timeout(function () {
                        closePopover();
                    }, autoclose_delay || 3000);
                }
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
            closePopover();
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
        var body = angular.element(document.body);
        while(typeof element.attr('id') == 'undefined'
           || typeof element.attr('uib-popover-template') == 'undefined') {
            element = element.parent();
            if(element == body) break;
        }
        return '#' + element.attr('id');
    }

}]);
angular.module('resipedia')

.config([
    '$routeProvider', 
    '$routeParamsProvider', 
    '$httpProvider',
    function($routeProvider, $routeParamsProvider, $httpProvider) {
        
        // templates should be pre-loaded (included in main html or dynamically)
        var templatePath = '';
        // var templatePath = 'packages/resipedia/apps/views/';
        
        /**
        * Routes definition
        * This call associates handled URL with their related views and controllers
        * 
        * As a convention, a 'ctrl' member is always defined inside a controller as itself
        * so it can be manipulated the same way in view and in controller
        */
        
// todo : this var should be define in a i18n file
        var paths = {
            '/help/categories': '/aide/categories',
            '/help/category/edit/:id': '/aide/categorie/edition/:id',
            '/help/category/:id/:title?': '/aide/categorie/:id/:title?',
            '/help/topic/edit/:id': '/aide/sujet/edition/:id',
            '/help/topic/:id/:title?': '/aide/sujet/:id/:title?',
            '/category/edit/:id': '/categorie/edition/:id',
            '/category/:id/:title?': '/categorie/:id/:title?',
            '/categories': '/categories',
            '/badges': '/badges',
            '/search': '/recherche',
            '/article/edit/:id': '/article/edition/:id',
            '/article/:id/:title?': '/article/:id/:title?',
            '/articles': '/articles',            
            '/document/edit/:id': '/document/edition/:id',
            '/document/:id/:title?': '/document/:id/:title?',
            '/documents': '/documents',            
            '/questions': '/questions',
            '/question/edit/:id': '/question/edition/:id',
            '/question/:id/:title?': '/question/:id/:title?',
            '/answer/edit/:id': '/reponse/edition/:id',
            '/answer/:id': '/reponse/:id',
            '/questionComment/:id': '/commentaireQuestion/:id',
            '/answerComment/:id': '/commentaireResponse/:id',
            '/users': '/participants',
            '/user/current/profile': '/participant/courant/profil',
            '/user/current/edit': '/participant/courant/edition',
            '/user/password/:code?': '/participant/password/:code?',
            '/user/confirm/:code': '/participant/confirmation/:code',
            '/user/notifications/:id': '/participant/notifications/:id',
// translating sign page means non-unique id and therefore makes it difficult to manage pending actions process
            // '/user/sign/:mode?': '/participant/sign/:mode?',
            '/user/edit/:id': '/participant/edition/:id',
            '/user/:id/:name?': '/participant/:id/:name?',                        
            // '/author/:name': '/auteur/:name',
            '/author/edit/:id': '/auteur/edition/:id',
            '/author/:id/:name?': '/auteur/:id/:name?',
            '/association/soutenir': '/association/soutenir',
            '/association/contact': '/association/contact',
            '/association/participer': '/association/participer',
            '/association/mentions-legales': '/association/mentions-legales',
            '/association/ils-nous-soutiennent': '/association/ils-nous-soutiennent',
            '/association': '/association'      
        };

        // routes definition
        var routes = {
        /**
        * Help related routes
        */            
        '/help/categories': {
                    templateUrl : templatePath+'helpCategories.html',
                    controller  : 'helpCategoriesController as ctrl',
                    resolve     : {
                        categories: ['routeHelpCategoriesProvider', function (provider) {
                            return provider.load();
                        }]
                    }
        },
        '/help/category/edit/:id': {
                    templateUrl : templatePath+'helpCategoryEdit.html',
                    controller  : 'helpCategoryEditController as ctrl',
                    resolve     : {
                        // request object data
                        category: ['routeHelpCategoryProvider', function (provider) {
                            return provider.load();
                        }]
                    }        
        }, 
        '/help/category/:id/:title?': {
                    templateUrl : templatePath+'helpCategory.html',
                    controller  : 'helpCategoryController as ctrl',
                    resolve     : {
                        // request object data
                        category: ['routeHelpCategoryProvider', function (provider) {
                            return provider.load();
                        }]
                    }        
        },
        '/help/topic/edit/:id': {
                    templateUrl : templatePath+'helpTopicEdit.html',
                    controller  : 'helpTopicEditController as ctrl',
                    resolve     : {
                        // request object data
                        topic: ['routeHelpTopicProvider', function (provider) {
                            return provider.load();
                        }],
                        // list of categories is required as well for selecting parent category
                        categories: ['routeHelpCategoriesProvider', function (provider) {
                            return provider.load();
                        }]
                    } 
        },     
        // display a topic with breadcrumb
        '/help/topic/:id/:title?': {
                    templateUrl : templatePath+'helpTopic.html',
                    controller  : 'helpTopicController as ctrl',
                    resolve     : {
                        topic: ['routeHelpTopicProvider', function (provider) {
                            return provider.load();
                        }],
                        // list of categories is required as well for displahing TOC
                        categories: ['routeHelpCategoriesProvider', function (provider) {
                            return provider.load();
                        }]                
                    }
        },
        /**
        * Badges related routes
        */
        '/badges': {
                    templateUrl : templatePath+'badges.html',
                    controller  : 'badgesController as ctrl',
                    resolve     : {
                        categories: ['routeBadgeCategoriesProvider', function (provider) {
                            return provider.load();
                        }]
                    }
        },
        /**
        * Badges related routes
        */
        '/search': {
                    templateUrl : templatePath+'search.html',
                    controller  : 'searchController as ctrl',
                    resolve     : {
                        search: ['routeSearchProvider', function (provider) {
                            return provider.load();
                        }]
                    }
        },        
        /**
        * Category related routes
        */
        '/categories': {
                    templateUrl : templatePath+'categories.html',
                    controller  : 'categoriesController as ctrl'
        },
        '/category/edit/:id': {
                    templateUrl : templatePath+'categoryEdit.html',
                    controller  : 'categoryEditController as ctrl',
                    resolve     : {
                        // request object data
                        category: ['routeCategoryProvider', function (provider) {
                            return provider.load();
                        }]
                    }        
        },
        '/category/:id/:title?': {
                    templateUrl : templatePath+'category.html',
                    controller  : 'categoryController as ctrl',
                    resolve     : {
                        category: ['routeCategoryProvider', function (provider) {
                            return provider.load();
                        }]
                    }                    
                    /*
                    controller  : ['$location', '$route', '$rootScope', function($location, $route, $rootScope) {
                        // todo : we shoud define a dedicated view (template) for category                            
                        // temp solution

                        var criteria = angular.extend({}, $rootScope.search.default, {q: '['+$route.current.params.title+']'});                        
                        angular.copy(criteria, $rootScope.search.criteria);                        
                        $location.path('/search');             
                    }]
                    */                    
        },
        
        
        /**
        * Article related routes
        */
        '/articles': {
                    templateUrl : templatePath+'articles.html',
                    controller  : 'articlesController as ctrl',
                    resolve     : {
                        // list of articles is required as well for selecting parent category
                        articles: ['routeArticlesProvider', function (provider) {
                            return provider.load();
                        }]
                    }
        },
        '/article/edit/:id': {
                    templateUrl : templatePath+'articleEdit.html',
                    controller  : 'articleEditController as ctrl',
                    resolve     : {
                        article: ['routeArticleProvider', function (provider) {
                            return provider.load();
                        }]
                    }        
        },
        '/article/:id/:title?': {
                    templateUrl : templatePath+'article.html',
                    controller  : 'articleController as ctrl',
                    resolve     : {
                        article: ['routeArticleProvider', function (provider) {
                            return provider.load();
                        }]
                    }
        },        
        /**
        * Document related routes
        */
        '/documents': {
                    templateUrl : templatePath+'documents.html',
                    controller  : 'documentsController as ctrl',
                    resolve     : {
                        // list of documents is required as well for selecting parent category
                        documents: ['routeDocumentsProvider', function (provider) {
                            return provider.load();
                        }]
                    }
        },
        '/document/edit/:id': {
                    templateUrl : templatePath+'documentEdit.html',
                    controller  : 'documentEditController as ctrl',
                    resolve     : {
                        document: ['routeDocumentProvider', function (provider) {
                            return provider.load();
                        }]
                    }        
        },
        '/document/:id/:title?': {
                    templateUrl : templatePath+'document.html',
                    controller  : 'documentController as ctrl',
                    resolve     : {
                        document: ['routeDocumentProvider', function (provider) {
                            return provider.load();
                        }]
                    }
        },
        /**
        * Question related routes
        */
        '/questions': {
                    templateUrl : templatePath+'questions.html',
                    controller  : 'questionsController as ctrl',
                    resolve     : {
                        // list of categories is required as well for selecting parent category
                        questions: ['routeQuestionsProvider', function (provider) {
                            return provider.load();
                        }]
                    }
        },
        '/question/edit/:id': {
                    templateUrl : templatePath+'questionEdit.html',
                    controller  : 'questionEditController as ctrl',
                    resolve     : {
                        question: ['routeQuestionProvider', function (provider) {
                            return provider.load();
                        }]
                    }        
        },    
        '/question/:id/:title?': {
                    templateUrl : templatePath+'question.html',
                    controller  : 'questionController as ctrl',
                    resolve     : {
                        question: ['routeQuestionProvider', function (provider) {
                            return provider.load();
                        }]
                    }
        },
        '/answer/edit/:id': {
                    templateUrl : templatePath+'answerEdit.html',
                    controller  : 'answerEditController as ctrl',
                    resolve     : {
                        answer: ['routeAnswerProvider', function (provider) {
                            return provider.load();
                        }]
                    }        
        },     
        '/answer/:id': {
                    templateUrl : templatePath+'question.html',
                    controller  : ['$location', 'routeAnswerProvider', function($location, routeAnswerProvider) {
                        routeAnswerProvider.load().then(
                        function(answer) {
                            $location.path('/question/'+answer.question_id);
                        });                
                    }]  
        },
        '/questionComment/:id': {
                    templateUrl : templatePath+'question.html',
                    controller  : ['$location', 'routeObjectProvider', function($location, routeObjectProvider) {
                        routeObjectProvider.provide('resiexchange_questioncomment').then(
                        function(comment) {
                            $location.path('/question/'+comment.question_id);
                        });                
                    }]  
        },
        '/answerComment/:id': {
                    templateUrl : templatePath+'question.html',
                    controller  : ['$location', 'routeObjectProvider', function($location, routeObjectProvider) {
                        routeObjectProvider.provide('resiexchange_answercomment').then(
                        function(comment) {
                            $location.path('/question/'+comment['answer_id.question_id']);
                        });                
                    }]  
        },      
        /**
        * User related routes
        */
        '/users': {
                    templateUrl : templatePath+'users.html',
                    controller  : 'usersController as ctrl',
                    resolve     : {
                        // list of categories is required as well for selecting parent category
                        users: ['routeUsersProvider', function (provider) {
                            return provider.load();
                        }]
                    }
        },   
        '/user/current/profile': {
                    templateUrl : templatePath+'userProfile.html',
                    controller  : ['$location', 'authenticationService', function($location, authenticationService) {
                        authenticationService.userId().then(
                        function(user_id) {
                            $location.path('/user/profile/'+user_id);
                        });                
                    }]  
        },
        '/user/current/edit': {
                    templateUrl : templatePath+'userEdit.html',
                    controller  : ['$location', 'authenticationService', function($location, authenticationService) {
                        authenticationService.userId().then(
                        function(user_id) {
                            $location.path('/user/edit/'+user_id);
                        });                
                    }]  
        },    
        '/user/password/:code?': {
                    templateUrl : templatePath+'userPassword.html',
                    controller  : 'userPasswordController as ctrl'          
        },       
        '/user/confirm/:code': {
                    templateUrl : templatePath+'userConfirm.html',
                    controller  : 'userConfirmController as ctrl'
        },           
        '/user/notifications/:id': {
                    templateUrl : templatePath+'userNotifications.html',
                    controller  : 'userNotificationsController as ctrl'
        },
        '/user/sign/:mode?': {
                    templateUrl : templatePath+'userSign.html',
                    controller  : 'userSignController as ctrl',
                    reloadOnSearch: false
        },
        '/user/profile/:id/:name?': {
                    redirectTo: '/user/:id/:name?',
        },
        '/user/edit/:id': {
                    templateUrl : templatePath+'userEdit.html',
                    controller  : 'userEditController as ctrl',
                    resolve     : {
                        user: ['routeUserProvider', function (provider) {
                            return provider.load();
                        }]
                    }        
        },      
        '/user/:id/:name?': {
                    templateUrl : templatePath+'userProfile.html',
                    controller  : 'userProfileController as ctrl',
                    resolve     : {
                        user:  ['routeUserProvider', function (provider) {
                            return provider.load();
                        }]
                    }             
        },        
        /**
        * Author routes
        */
        '/author/edit/:id': {
                    templateUrl : templatePath+'authorEdit.html',
                    controller  : 'authorEditController as ctrl',
                    resolve     : {
                        author: ['routeAuthorProvider', function (provider) {
                            return provider.load();
                        }]
                    }        
        },            
        '/author/:id/:name?': {
                    templateUrl : templatePath+'author.html',
                    controller  : 'authorController as ctrl',
                    resolve     : {
                        author: ['routeAuthorProvider', function (provider) {
                            return provider.load();
                        }]
                    }        
        },        
/*        
        '/author/:name': {
                    templateUrl : templatePath+'author.html',
                    controller  : 'authorController as ctrl',
                    resolve     : {
                        author: ['routeAuthorByNameProvider', function (provider) {
                            return provider.load();
                        }]
                    }        
        },
*/        
        /**
        * Resiway routes            
        */        
        '/association/soutenir': {
                    templateUrl : templatePath+'support.html',
                    controller  : 'homeController as ctrl'
        },
        '/association/contact': {
                    templateUrl : templatePath+'contact.html',
                    controller  : 'emptyController as ctrl'
        },
        '/association/participer': {
                    templateUrl : templatePath+'participate.html',
                    controller  : 'emptyController as ctrl'
        },
        '/association/mentions-legales': {
                    templateUrl : templatePath+'legal.html',
                    controller  : 'emptyController as ctrl'
        },     
        '/association/ils-nous-soutiennent': {
                    templateUrl : templatePath+'supporters.html',
                    controller  : 'emptyController as ctrl'
        },         
        '/association': {
                    templateUrl : templatePath+'organisation.html',
                    controller  : 'emptyController as ctrl'
        }        
        };

        // routes i18n
        angular.forEach(routes, function(route, path) {
            var translation = path;
            if(typeof paths[path] != 'undefined') {
                translation = paths[path];
            }
            else console.warn('missing translation for route '+path);
            // is global locale 'en' ?
            if(path != translation) {
                // no : redirect to current locale translation
                $routeProvider.when(path, { redirectTo  : translation });
            }
            // register route
            $routeProvider.when(translation, routes[path]);
        });
        
        /**
        * Default route
        */           
        $routeProvider 
        .otherwise({
            templateUrl : templatePath+'home.html',
            controller  : 'homeController as ctrl'
        });
        
    }
]);
angular.module('resipedia')

.filter("nl2br", function() {
 return function(data) {
   if (!data) return data;
   return data.replace(/\n\r?/g, '<br />');
 };
})

.filter('size', function () {
  return function (input, size) {
    input = input || '';
    return input.replace(new RegExp('<size>', 'gi'), size);
  };
})

.filter("humanizeCount", function() {
    return function(value, show_full) {
        if(show_full) {
            return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        }
        else {
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
        var label = new String(item.title);
        var path  = new String(item.path);
        if (query.length > 0 || angular.isNumber(query)) {
            query = oiSelectEscape(query);
            html = label.replace(new RegExp(query, 'gi'), '<strong>$&</strong>') + ' <span style="color: grey; font-style: italic; font-size: 80%;">('+ path.replace(new RegExp(query, 'gi'), '<strong>$&</strong>') + ')</span>';
        }
        else {
            html = label + ' ' + '<span style="color: grey; font-style: italic; font-size: 80%;">('+ path +')</span>';
        }
        return $sce.trustAsHtml(html);
    };
}])

.filter('customListFilter', ['oiSelectEscape', function(oiSelectEscape) {
    
    function ascSort(input, query, getLabel, options) {
        var i, j, isFound, output, output1 = [], output2 = [], output3 = [], output4 = [];

        if (query) {
            query = oiSelectEscape(query).toASCII().toLowerCase();
            for (i = 0, isFound = false; i < input.length; i++) {
                // isFound = getLabel(input[i]).toASCII().toLowerCase().match(new RegExp(query));
                isFound = input[i].title.toASCII().toLowerCase().match(new RegExp(query));

                if (!isFound && options && (options.length || options.fields)) {
                    for (j = 0; j < options.length; j++) {
                        if (isFound) break;
                        isFound = String(input[i][options[j]]).toASCII().toLowerCase().match(new RegExp(query));
                    }
                }
                if (isFound) {
                    output1.push(input[i]);
                }
            }
            for (i = 0; i < output1.length; i++) {
                if (getLabel(output1[i]).toASCII().toLowerCase().match(new RegExp('^' + query))) {
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
angular.module('resipedia')

.controller('answerEditController', [
    'answer', 
    '$scope', 
    '$window', 
    '$location', 
    '$sce', 
    'feedbackService', 
    'actionService', 
    function(answer, $scope, $window, $location, $sce, feedbackService, actionService) {
        console.log('answerEdit controller');
        
        var ctrl = this;   
      
        // @model
        // content is inside a textarea and do not need sanitize check
        answer.content = $sce.valueOf(answer.content);
        
        $scope.answer = angular.merge({
                            id: 0,
                            content: ''
                          }, 
                          answer);
                          
        $scope.noExternalSource = (answer.source_author.length <= 0);
        
        // @methods
        $scope.answerPost = function($event) {
            ctrl.running = true;
            var selector = feedbackService.selector($event.target);
            actionService.perform({
                // valid name of the action to perform server-side
                action: 'resiexchange_answer_edit',
                // string representing the data to submit to action handler (i.e.: serialized value of a form)
                data: {
                    answer_id: $scope.answer.id,
                    content: $scope.answer.content,
                    source_author: $scope.answer.source_author,
                    source_license: $scope.answer.source_license,
                    source_url: $scope.answer.source_url
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
                        if(msg.substr(0, 8) == 'missing_') {
                            msg = 'answer_'+msg;
                        }                             
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
angular.module('resipedia')
/**
* Display given article for edition
*
*/
.controller('articleEditController', [
    'article',
    '$scope',
    '$rootScope',
    '$window', 
    '$location', 
    '$sce', 
    'feedbackService', 
    'actionService', 
    '$http',
    '$q',
    '$httpParamSerializerJQLike',
    function(article, $scope, $rootScope, $window, $location, $sce, feedbackService, actionService, $http, $q, $httpParamSerializerJQLike) {
        console.log('articleEdit controller');
        
        var ctrl = this;   

        
// todo: if user is not identified : redirect to login screen (to prevent risk of losing filled data)

        // @view
        $scope.alerts = [];
        // alerts format : { type: 'danger|warning|success', msg: 'Alert message.' }
                
        ctrl.closeAlert = function(index) {
            $scope.alerts.splice(index, 1);
        };

      
        $scope.versionPopup = {
            opened: false
        };        
        $scope.versionPopupOpen = function() {
            $scope.versionPopup.opened = true;
        };  
        
        $scope.addCategory = function(query) {
            return {
                id: null, 
                title: query, 
                path: query, 
                parent_id: 0, 
                parent_path: ''
            };
        };

        $scope.addTerm = function(query) {
            return {
                id: null, 
                title: query
            };
        };
        
        $scope.loadCategoriesMatches = function(query) {
            if(query.length < 2) return [];
            
            return $http.get('index.php?get=resiway_category_list&channel='+$rootScope.config.channel+'&order=title&'+$httpParamSerializerJQLike({domain: ['title', 'ilike', '%'+query+'%']}))
            .then(
                function success(response) {
                    var data = response.data;
                    if(typeof data.result != 'object') return [];
                    return data.result;
                },
                function error(response) {
                    // something went wrong server-side
                    return [];
                }
            );                
        };

        $scope.loadTermsMatches = function(query) {
            if(query.length < 2) return [];
            
            return $http.get('index.php?get=resilexi_term_list&order=title&'+$httpParamSerializerJQLike({domain: ['title', 'ilike', '%'+query+'%']}))
            .then(
                function success(response) {
                    var data = response.data;
                    if(typeof data.result != 'object') return [];
                    return data.result;
                },
                function error(response) {
                    // something went wrong server-side
                    return [];
                }
            );                
        };
        
        
        // @model
        // content is inside a textarea and do not need sanitize check
        article.content = $sce.valueOf(article.content);
        $scope.article = angular.merge({
                            id: 0,
                            title: '',                      
                            content: '',
                            categories: [],
                            source_license: 'CC-by-nc-sa'
                          }, 
                          article);

        if(!angular.isDefined(article.term) && angular.isDefined(article.title)) {
            $scope.article.term = {
                id: null, 
                title: article.title
            };
        }

        /**
        * for many2many field, as initial setting we mark all ids to be removed
        */
        // save initial categories_ids
        $scope.initial_cats_ids = [];
        angular.forEach($scope.article.categories, function(cat, index) {
            $scope.initial_cats_ids.push('-'+cat.id);
        });

       
        // @events
        $scope.$watch('article.categories', function() {
            // reset selection
            $scope.article.categories_ids = angular.copy($scope.initial_cats_ids);
            angular.forEach($scope.article.categories, function(cat, index) {
                if(cat.id == null) {
                    $scope.article.categories_ids.push(cat.title);
                }
                else $scope.article.categories_ids.push('+'+cat.id);
            });
        });

        $scope.$watch('article.term', function() {
            if(angular.isDefined($scope.article.term)) {
                $scope.article.title = $scope.article.term.title;
            }
        });        
  

        // @methods
        $scope.articlePost = function($event) {
            ctrl.running = true;
            var selector = feedbackService.selector(angular.element($event.target));                   
            actionService.perform({
                // valid name of the action to perform server-side
                action: 'resilexi_article_edit',
                // string representing the data to submit to action handler (i.e.: serialized value of a form)
                data: {
                    channel: $rootScope.config.channel,
                    id: $scope.article.id,
                    title: $scope.article.title,
                    content: $scope.article.content,
                    categories_ids: $scope.article.categories_ids,
                    source_author: $scope.article.source_author,
                    source_url: $scope.article.source_url,
                    source_license: $scope.article.source_license                    
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
                            msg = 'article_'+msg;
                        }
                        feedbackService.popover(selector, msg);
                    }
                    else {
                        var article_id = data.result.id;
                        $location.path('/article/'+article_id);
                    }
                }        
            });
        };  
        
    }
]);
angular.module('resipedia')

.controller('articlesController', [
    'articles', 
    '$scope',
    '$rootScope',
    '$route',
    '$http',
    '$httpParamSerializerJQLike',
    '$window',
    function(articles, $scope, $rootScope, $route, $http, $httpParamSerializerJQLike, $window) {
        console.log('articles controller');

        var ctrl = this;

        // @data model
        angular.merge(ctrl, {
            articles: {
                items: articles,
                total: $rootScope.search.total,
                currentPage: 1,
                previousPage: -1,                
                limit: $rootScope.search.criteria.limit
            }
        });

        ctrl.load = function() {
            if(ctrl.articles.currentPage != ctrl.articles.previousPage) {
                ctrl.articles.previousPage = ctrl.articles.currentPage;
                // reset objects list (triggers loader display)
                ctrl.articles.items = -1;
                $rootScope.search.criteria.start = (ctrl.articles.currentPage-1)*ctrl.articles.limit;
                
                $http.get('index.php?get=resilexi_article_list&'+$httpParamSerializerJQLike($rootScope.search.criteria))
                .then(
                    function successCallback(response) {
                        var data = response.data;
                        if(typeof data.result != 'object') {
                            ctrl.articles.items = [];
                        }
                        ctrl.articles.items = data.result;
                        $window.scrollTo(0, 0);
                    },
                    function errorCallback(response) {
                        // something went wrong server-side
                        return [];
                    }
                );
            }
        };            

        // @async loads
        ctrl.categories = [];
        
        // store categories list in controller, if any
        angular.forEach($rootScope.search.criteria.domain, function(clause, i) {
            if(clause[0] == 'categories_ids') {
                $scope.related_categories = [];
                if(typeof clause[2] != 'object') {
                    clause[2] = [clause[2]];
                }
                ctrl.categories = clause[2];
            }
        });
        
        /*
        * async load and inject $scope.categories and $scope.related_categories
        */
        if(ctrl.categories.length > 0) {
            $http.get('index.php?get=resiway_category_list&channel='+$rootScope.config.channel+'&'+$httpParamSerializerJQLike({domain: ['id', 'in', ctrl.categories]}))
            .then(
                function successCallback(response) {
                    var data = response.data;
                    if(typeof data.result == 'object') {
                        $scope.categories = data.result;
                    }
                }
            );
            angular.forEach(ctrl.categories, function(category_id, j) {
                $http.get('index.php?get=resiway_category_related-article&category_id='+category_id)
                .then(
                    function successCallback(response) {
                        var data = response.data;
                        if(typeof data.result == 'object') {
                            $scope.related_categories = data.result;
                        }
                    }
                );
                
            });
        }
        
        /*
        * async load and inject $scope.categories and $scope.featured_categories
        */
        $http.get('index.php?get=resiway_category_list&channel='+$rootScope.config.channel+'&limit=15&order=count_articles&sort=desc')
        .then(
            function successCallback(response) {
                var data = response.data;
                if(typeof data.result == 'object') {
                    $scope.featured_categories = data.result;
                }
            }
        );
        
    }
]);
angular.module('resipedia')

.controller('authorController', [
    'author', 
    '$scope',
    '$rootScope',    
    '$http',
    function(author, $scope, $rootScope, $http) {
        console.log('author controller');

        var ctrl = this;

        // @data model
        $scope.author = angular.merge({
                            id: 0,
                            name: '',
                            description: ''
                          }, 
                          author);
                          
        // acknowledge user profile view (so far, user data have been loaded but nothing indicated a profile view)
        $http.get('index.php?do=resiway_author_profileview&id='+author.id);
        
    }
]);
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
angular.module('resipedia')

.controller('badgesController', [
    'categories', 
    '$scope',
    '$http',
    'authenticationService',    
    function(categories, $scope, $http, authenticationService) {
        console.log('badges controller');

        var ctrl = this;

        // @data model
        $scope.userBadges = [];
        $scope.badgeCategories = categories;
        
        // @init
        // group badges inside each category
        angular.forEach(categories, function(category, i) {
            categories[i].groups = {};
            angular.forEach(category.badges, function(badge, j) {
                if(typeof categories[i].groups[badge.group] == 'undefined') {
                    categories[i].groups[badge.group] = [];
                }
                categories[i].groups[badge.group].push(badge);                
            });
        });

        // request current user badges
        authenticationService.userId().then(
            function(user_id) {
            $http.post('index.php?get=resiway_userbadge_list', {
                domain: ['user_id', '=', user_id],
                start: 0,
                limit: 100
            }).then(
            function success(response) {
                var data = response.data;
                angular.forEach(data.result, function (badge, i) {
                    $scope.userBadges.push(+badge.badge_id);
                });
            });
        });         
      
    }
]);
angular.module('resipedia')

.controller('categoriesController', [
    '$scope',
    '$rootScope',    
    '$http',
    'actionService',
    'feedbackService',
    function($scope, $rootScope, $http, actionService, feedbackService) {
        console.log('categories controller');

        var ctrl = this;
        
        // @data model
        ctrl.config = {
            items: [],
            total: -1,
            currentPage: 1,
            previousPage: -1,
            limit: 30,
            domain: [],
            loading: true
        };
/*
        switch($rootScope.config.application) {
        case 'resiexchange':
            ctrl.config.domain = ['count_questions', '>', '0'];
            break;
        case 'resilib':
            ctrl.config.domain = ['count_documents', '>', '0'];            
            break;
        }
        */
        ctrl.load = function(config) {
            if(config.currentPage != config.previousPage) {
                config.previousPage = config.currentPage;
                // trigger loader display
                if(config.total > 0) {
                    config.loading = true;
                }
                $http.post('index.php?get=resiway_category_list&channel='+$rootScope.config.channel, {
                    domain: config.domain,
                    start: (config.currentPage-1)*config.limit,
                    limit: config.limit,
                    total: config.total
                }).then(
                function success(response) {
                    var data = response.data;
                    config.items = data.result;
                    config.total = data.total;
                    config.loading = false;
                    angular.forEach(config.items, function(item, index) {
                        config.items[index]['count_items'] = parseInt(item['count_questions']) + parseInt(item['count_documents']) + parseInt(item['count_articles']);
                    });
                },
                function error() {
                    // something went wrong server-side
                });
            }
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
                angular.merge($scope.question, $scope.previous);
            }
        };
        
        $scope.categoryStar = function ($event, index) {

            // normalize : make sure impacted properties are set
            if(!angular.isDefined(ctrl.config.items[index].history)) {
                ctrl.config.items[index].history = {};
            }            
            if(!angular.isDefined(ctrl.config.items[index].history['resiway_category_star'])) {
                ctrl.config.items[index].history['resiway_category_star'] = false;
            }
            // define transaction
            var commit = function ($scope) {
                // prevent action if it has already been committed
                if(!angular.isDefined($scope.committed) || !$scope.committed) {

                    // update current state to new values
                    if(ctrl.config.items[index].history['resiway_category_star'] === true) {
                        ctrl.config.items[index].history['resiway_category_star'] = false;
                        ctrl.config.items[index].count_stars--;
                    }
                    else {
                        ctrl.config.items[index].history['resiway_category_star'] = true;
                        ctrl.config.items[index].count_stars++;
                    }
                }
            };

            // set previous state and begin transaction
            $scope.begin(commit, 
                         { 
                            history: {
                                resiway_category_star: ctrl.config.items[index].history['resiway_category_star']
                            },
                            count_stars: ctrl.config.items[index].count_stars            
                         });    
            
            // remember selector for popover location
            var selector = feedbackService.selector($event.target);
            
            actionService.perform({
                // valid name of the action to perform server-side
                action: 'resiway_category_star',
                // string representing the data to submit to action handler (i.e.: serialized value of a form)
                data: {category_id: ctrl.config.items[index].id},
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
        
        // @init
        ctrl.load(ctrl.config);
        
    }
]);
angular.module('resipedia')

.controller('categoryController', [
    'category', 
    '$scope',
    '$rootScope',
    '$route',
    '$http',
    '$httpParamSerializerJQLike',
    '$window',
    function(category, $scope, $rootScope, $route, $http, $httpParamSerializerJQLike, $window) {
        console.log('category controller');

        
        $scope.getClassFromType = function(type) {
            switch(type) {
            case 'question': return {'fa-comment-o':true};
            case 'article':  return {'fa-file-text-o':true};
            case 'document': return {'fa-book':true};
            }
            return {};
        };
        
        // @init
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

        angular.merge(ctrl, {
            search: {
                items: [],
                criteria: angular.extend({}, $rootScope.search.default, {q: '['+$scope.category.title+']'}),
                total: $scope.category.count_items,
                currentPage: 1,
                previousPage: -1,                
                limit: $rootScope.search.criteria.limit
            }
        });                
        
        ctrl.load = function() {
            if(ctrl.search.currentPage != ctrl.search.previousPage) {
                ctrl.search.previousPage = ctrl.search.currentPage;
                // reset objects list (triggers loader display)
                ctrl.search.items = -1;
                ctrl.search.criteria.start = (ctrl.search.currentPage-1)*ctrl.search.limit;
                
                $http.get('index.php?get=resiway_search&'+$httpParamSerializerJQLike(ctrl.search.criteria))
                .then(
                    function successCallback(response) {
                        var data = response.data;
                        if(typeof data.result != 'object') {
                            ctrl.search.items = [];
                        }
                        ctrl.search.items = data.result;
                        $window.scrollTo(0, 0);
                    },
                    function errorCallback(response) {
                        // something went wrong server-side
                        return [];
                    }
                );
            }
        };

        // @async loads

        ctrl.load();
        
        /*
        * async load and inject $scope.categories and $scope.related_categories
        */
        $http.get('index.php?get=resiway_category_related&category_id='+$scope.category.id)
        .then(
            function successCallback(response) {
                var data = response.data;
                if(typeof data.result == 'object') {
                    $scope.related_categories = data.result;
                }
            }
        );
        

        
    }
]);
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
angular.module('resipedia')
/**
* Display given document for edition
*
*/
.controller('documentEditController', [
    'document',
    '$scope',
    '$rootScope',
    '$window', 
    '$location', 
    '$sce',
    '$translate',
    'feedbackService', 
    'actionService', 
    '$http',
    '$q',
    '$httpParamSerializerJQLike',
    'Upload',
    function(document, $scope, $rootScope, $window, $location, $sce, $translate, feedbackService, actionService, $http, $q, $httpParamSerializerJQLike, Upload) {
        console.log('documentEdit controller');
        
        var ctrl = this;   

        
// todo: if user is not identified : redirect to login screen (to prevent risk of losing filled data)

        // @view
        $scope.alerts = [];
        // alerts format : { type: 'danger|warning|success', msg: 'Alert message.' }
                
        ctrl.closeAlert = function(index) {
            $scope.alerts.splice(index, 1);
        };
/*
        var getNames_timeout;
        ctrl.getNames = function(val) {
            var deferred = $q.defer();
            
            if (getNames_timeout) {
                clearTimeout(getNames_timeout);
            }
            
            getNames_timeout = setTimeout(function() {
                var str = new String(val);
                if(str.length < 3) {
                    deferred.resolve([]);
                    return;
                }
                var domain = [];
                angular.forEach(str.toURL().split('-'), function(part, index) {
                    if(part.length > 2) {
                        domain.push([['name', 'ilike', '%'+part+'%']]);
                    }
                });
                $http.get('index.php?get=resiway_author_list&'+$httpParamSerializerJQLike({domain: domain}))
                .then(function(response){
                    deferred.resolve(
                        response.data.result.map(function(item){
                            return item.name;
                        })
                    );
                });                
            }, 300);
            
            return deferred.promise;
        };
*/  
        $scope.dateOptions = {           
            formatYear: 'yy',
            maxDate: new Date(),
            startingDay: 1
        };        
        $scope.versionPopup = {
            opened: false
        };        
        $scope.versionPopupOpen = function() {
            $scope.versionPopup.opened = true;
        };  
        
        $scope.addCategory = function(query) {
            return {
                id: null, 
                title: query, 
                path: query, 
                parent_id: 0, 
                parent_path: ''
            };
        };

        $scope.addAuthor = function(query) {
            return {
                id: null, 
                name: query
            };
        };

        
        $scope.loadCategoriesMatches = function(query) {
            if(query.length < 2) return [];
            
            return $http.get('index.php?get=resiway_category_list&channel='+$rootScope.config.channel+'&order=title&'+$httpParamSerializerJQLike({domain: ['title', 'ilike', '%'+query+'%']}))
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

        $scope.loadAuthorsMatches = function(query) {
            if(query.length < 2) return [];
            
            return $http.get('index.php?get=resiway_author_list&channel='+$rootScope.config.channel+'&order=name&'+$httpParamSerializerJQLike({domain: ['name', 'ilike', '%'+query+'%']}))
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
        
        // @model
        // description is inside a textarea and do not need sanitize check
        document.description = $sce.valueOf(document.description);
        document.last_update = new Date(document.last_update);
        $scope.document = angular.merge({
                            id: 0,
                            title: '',
                            //author: '',
                            authors_ids: [{}],                            
                            last_update: '',
                            description: '',
                            categories_ids: [{}],
                            license: 'CC-by-nc-sa',
                            content: {
                                name: document.title
                            },
                            thumbnail: {
                                name: 'thumbnail'
                            }
                          }, 
                          document);
                          

        /**
        * for many2many field, as initial setting we mark all ids to be removed
        */
        // save initial categories_ids
        $scope.initial_cats_ids = [];
        angular.forEach($scope.document.categories, function(cat, index) {
            $scope.initial_cats_ids.push('-'+cat.id);
        });

        // save initial authors_ids
        $scope.initial_authors_ids = [];
        angular.forEach($scope.document.authors, function(author, index) {
            $scope.initial_authors_ids.push('-'+author.id);
        });
        
        // @events
        $scope.$watch('document.categories', function() {
            // reset selection
            $scope.document.categories_ids = angular.copy($scope.initial_cats_ids);
            angular.forEach($scope.document.categories, function(cat, index) {
                if(cat.id == null) {
                    $scope.document.categories_ids.push(cat.title);
                }
                else $scope.document.categories_ids.push('+'+cat.id);
            });
        });


        $scope.$watch('document.authors', function() {
            // reset selection
            $scope.document.authors_ids = angular.copy($scope.initial_authors_ids);
            angular.forEach($scope.document.authors, function(author, index) {
                if(author.id == null) {
                    $scope.document.authors_ids.push(author.name);
                }
                else $scope.document.authors_ids.push('+'+author.id);
            });
        });
        
        $scope.documentThumbnailSelected = false;
        
        $scope.thumbnailChange = function($files, $file, $newFiles, $duplicateFiles, $invalidFiles, $event) {            
            if(angular.isDefined($newFiles) && $newFiles.length) {
                var elem = angular.element(window.document.querySelector('#document-thumbnail'));
                elem.detach();
                window.setTimeout(function() {
                    $scope.documentThumbnailSelected = true;
                }, 250);                
            }
        }
        
        // @methods
        $scope.documentPost = function($event) {

            if(typeof $scope.document.last_update !== 'object' || $scope.document.last_update === null) {
                $scope.alerts.push({ type: 'warning', msg: 'Il manque la date de publication du document (en cas de doute, une approximation suffit).' });                
            }
            else if($scope.document.id == 0 && typeof $scope.document.thumbnail.size == 'undefined') {
                $scope.alerts.push({ type: 'warning', msg: 'La vignette n\'est pas reconnue: vérifiez le format d\'image (jpeg) et la taille (<1MB).' });                
            }
            else if($scope.document.id == 0 && typeof $scope.document.content.size == 'undefined') {
                $scope.alerts.push({ type: 'warning', msg: 'Le document n\'est pas reconnu: vérifiez le format (pdf) et la taille (<64MB).' });                
            }            
            else {
                var selector = feedbackService.selector(angular.element($event.target));                               
                ctrl.running = true;   
                
                Upload.upload({
                    url: 'index.php?do=resilib_document_edit', 
                    method: 'POST',                
                    data: {
                        channel: $rootScope.config.channel,
                        id: $scope.document.id,
                        title: $scope.document.title,
                        // author: $scope.document.author,                
                        authors_ids: $scope.document.authors_ids,                        
                        last_update: $scope.document.last_update.toJSON(),  
                        original_url: $scope.document.original_url, 
                        license: $scope.document.license,                    
                        description: $scope.document.description,
                        pages: $scope.document.pages,
                        categories_ids: $scope.document.categories_ids,
                        content: $scope.document.content, 
                        thumbnail: $scope.document.thumbnail
                    }
                })
                .then(function (response) {
                        ctrl.running = false;   

                        var data = response.data;
                        if(typeof data.result != 'object') {
                            // result is an error code
                            var error_id = data.error_message_ids[0];                    
                            // todo : get error_id translation
                            var msg = error_id;
                            // in case a field is missing, adapt the generic 'missing_*' message
                            if(msg.substr(0, 8) == 'missing_') {
                                msg = 'document_'+msg;
                            }
                            feedbackService.popover(selector, msg);
                        }
                        else {
                            var document_id = data.result.id;
                            $location.path('/document/'+document_id);
                        }

                    }, function (response) {
                        ctrl.running = false;
                        var feedback = '';
                        console.log(response);
                        angular.forEach(response.data.errors, function(message, error) {
                            console.log(error+': '+message+' ('+response.status+')');
                            if(error == 'MISSING_PARAM') {
                                feedback += $translate.instant('document_missing_'+message);
                            }
                            else {
                                feedback += $translate.instant(message);
                            }
                        });
                        feedbackService.popover(selector, feedback);
                    }, function (evt) {
                        // var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                        // console.log('progress: ' + progressPercentage + '% ' + evt.config.data.file.name);
                    }
                );
            }
            return;
            

            /*
            var selector = feedbackService.selector(angular.element($event.target));                   
            actionService.perform({
                // valid name of the action to perform server-side
                action: 'resilib_document_edit',
                // string representing the data to submit to action handler (i.e.: serialized value of a form)
                data: {
                    channel: $rootScope.config.channel,
                    id: $scope.document.id,
                    title: $scope.document.title,
                    author: $scope.document.author,                    
                    last_update: update.getDay()+'/'+update.getMonth()+'/'+update.getFullYear(),  
                    description: $scope.document.description,
                    pages: $scope.document.pages,                    
                    content: (typeof fileInput[0].files != 'undefined')?fileInput[0]:[],
                    categories_ids: $scope.document.categories_ids
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
                        // in case a field is missing, adapt the generic 'missing_*' message
                        if(msg.substr(0, 8) == 'missing_') {
                            msg = 'document_'+msg;
                        }
                        feedbackService.popover(selector, msg);
                    }
                    else {
                        var document_id = data.result.id;
                        $location.path('/document/'+document_id);
                    }
                }        
            });
            */
            
        };  
           
    }
]);
angular.module('resipedia')

.controller('documentsController', [
    'documents', 
    '$scope',
    '$rootScope',
    '$route',
    '$http',
    '$httpParamSerializerJQLike',
    '$window',
    function(documents, $scope, $rootScope, $route, $http, $httpParamSerializerJQLike, $window) {
        console.log('documents controller');

        var ctrl = this;

        // @data model
        angular.merge(ctrl, {
            documents: {
                items: documents,
                total: $rootScope.search.total,
                currentPage: 1,
                previousPage: -1,                
                limit: $rootScope.search.criteria.limit
            }
        });

        ctrl.load = function() {
            if(ctrl.documents.currentPage != ctrl.documents.previousPage) {
                ctrl.documents.previousPage = ctrl.documents.currentPage;
                // reset objects list (triggers loader display)
                ctrl.documents.items = -1;
                $rootScope.search.criteria.start = (ctrl.documents.currentPage-1)*ctrl.documents.limit;
                
                $http.get('index.php?get=resilib_document_list&'+$httpParamSerializerJQLike($rootScope.search.criteria))
                .then(
                    function successCallback(response) {
                        var data = response.data;
                        if(typeof data.result != 'object') {
                            ctrl.documents.items = [];
                        }
                        ctrl.documents.items = data.result;
                        $window.scrollTo(0, 0);
                    },
                    function errorCallback(response) {
                        // something went wrong server-side
                        return [];
                    }
                );
            }
        };            

        // @async loads
        ctrl.categories = [];
        
        // store categories list in controller, if any
        angular.forEach($rootScope.search.criteria.domain, function(clause, i) {
            if(clause[0] == 'categories_ids') {
                $scope.related_categories = [];
                if(typeof clause[2] != 'object') {
                    clause[2] = [clause[2]];
                }
                ctrl.categories = clause[2];
            }
        });
        
        /*
        * async load and inject $scope.categories and $scope.related_categories
        */
        if(ctrl.categories.length > 0) {
            $http.get('index.php?get=resiway_category_list&channel='+$rootScope.config.channel+'&'+$httpParamSerializerJQLike({domain: ['id', 'in', ctrl.categories]}))
            .then(
                function successCallback(response) {
                    var data = response.data;
                    if(typeof data.result == 'object') {
                        $scope.categories = data.result;
                    }
                }
            );
            angular.forEach(ctrl.categories, function(category_id, j) {
                $http.get('index.php?get=resiway_category_related-document&category_id='+category_id)
                .then(
                    function successCallback(response) {
                        var data = response.data;
                        if(typeof data.result == 'object') {
                            $scope.related_categories = data.result;
                        }
                    }
                );
                
            });
        }
        
        /*
        * async load and inject $scope.categories and $scope.featured_categories
        */
        $http.get('index.php?get=resiway_category_list&channel='+$rootScope.config.channel+'&limit=15&order=count_documents&sort=desc')
        .then(
            function successCallback(response) {
                var data = response.data;
                if(typeof data.result == 'object') {
                    $scope.featured_categories = data.result;
                }
            }
        );
        
    }
]);
angular.module('resipedia')

.controller('emptyController', [
    '$scope',
    function($scope) {
        console.log('empty controller');

        var ctrl = this;
        
    }
]);
angular.module('resipedia')

.controller('helpCategoriesController', [
    'categories', 
    '$scope',
    function(categories, $scope) {
        console.log('helpCategories controller');

        var ctrl = this;

        // @data model
        ctrl.categories = categories;
    
    }
]);
angular.module('resipedia')

.controller('helpCategoryController', [
    'category', 
    '$scope',
    function(category, $scope) {
        console.log('helpCategory controller');

        var ctrl = this;

        // @data model
        ctrl.category = category;
    
    }
]);
angular.module('resipedia')

.controller('helpCategoryEditController', [
    'category', 
    '$scope',
    '$location',
    'feedbackService',
    'actionService',
    function(category, $scope, $location, feedbackService, actionService) {
        console.log('helpCategoryEdit controller');

        var ctrl = this;

        // @data model
        ctrl.category = angular.extend({
                            title: '', 
                            description: ''
                        }, 
                        category);

        // @methods
        $scope.categoryPost = function($event) {
            var selector = feedbackService.selector($event.target);
            actionService.perform({
                // valid name of the action to perform server-side
                action: 'resiexchange_helpcategory_edit',
                // string representing the data to submit to action handler (i.e.: serialized value of a form)
                data: {
                    category_id: ctrl.category.id,
                    title: ctrl.category.title,
                    description: ctrl.category.description
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
                        var category_id = data.result.id;
                        $location.path('/help/category/'+category_id);
                    }
                }        
            });
        };          
        
    }
]);
angular.module('resipedia')

.controller('helpTopicController', [
    'topic', 
    'categories',     
    '$scope',
    function(topic, categories, $scope) {
        console.log('helpTopic controller');

        var ctrl = this;

        // @data model
        ctrl.topic = topic;
        ctrl.categories = categories;
    
    }
]);
angular.module('resipedia')

.controller('helpTopicEditController', [
    'topic',
    'categories', 
    '$scope',
    '$location',
    '$sce',
    'feedbackService',
    'actionService',
    function(topic, categories, $scope, $location, $sce, feedbackService, actionService) {
        console.log('hepTopicEdit controller');

        var ctrl = this;

                // content is inside a textarea and do not need sanitize check
        topic.content = $sce.valueOf(topic.content);
        
        // @data model
        ctrl.topic = angular.extend({
                        id: 0,
                        title: '',
                        content: '',
                        category_id: 0
                     }, 
                     topic);
       
        ctrl.categories = categories;

        $scope.category = null;
        
        // set initial parent 
        angular.forEach(ctrl.categories, function(category, index) {
            if(category.id == ctrl.topic.category_id) {
                $scope.category = category; 
            }
        });       
        
        // @events
        $scope.$watch('category', function() {
            ctrl.topic.category_id = $scope.category.id;   
        });
        
        // @methods
        $scope.topicPost = function($event) {
            var selector = feedbackService.selector($event.target);
            actionService.perform({
                // valid name of the action to perform server-side
                action: 'resiexchange_helptopic_edit',
                // string representing the data to submit to action handler (i.e.: serialized value of a form)
                data: {
                    topic_id: ctrl.topic.id,
                    title: ctrl.topic.title,
                    content: ctrl.topic.content,
                    category_id: ctrl.topic.category_id
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
                        var topic_id = data.result.id;
                        $location.path('/help/topic/'+topic_id);
                    }
                }        
            });
        };          
    }
]);
angular.module('resipedia')

.controller('homeController', ['$http', '$scope', '$rootScope', '$location', 'authenticationService', function($http, $scope, $rootScope, $location, authenticationService) {
    console.log('home controller');  
    
    var ctrl = this;

    ctrl.active_questions = [];
    ctrl.poor_questions = [];  
    ctrl.last_documents = [];

    /*
    // redirect to questions list if already logged in ?
    if(global_config.application == 'resiexchange' && $rootScope.previousPath == '/') {
        authenticationService.userId().then(
        function(user_id) {
            $location.path('/questions');
        });
    }
    */
    
    // note : maintain item count with number of .row children in #home-carousel
    var slides = $scope.slides = [{}, {}, {}];
    
    $scope.recent_activity = { actions: [] };
    $http.get('index.php?get=resiway_actionlog_recent')
    .then(
    function success(response) {
        var data = response.data;
        if(typeof response.data.result == 'object') {
            $scope.recent_activity.actions = response.data.result;
        }
    },
    function error() {
        // something went wrong server-side
    });

    
    $http.get('index.php?get=resiway_stats')
    .then(
    function success(response) {
        var data = response.data;
        if(typeof response.data.result == 'object') {
            ctrl.count_questions = parseInt(data.result['resiexchange.count_questions']);
            ctrl.count_answers = parseInt(data.result['resiexchange.count_answers']);
            ctrl.count_comments = parseInt(data.result['resiexchange.count_comments']);
            ctrl.count_comments += parseInt(data.result['resilib.count_comments']);
            ctrl.count_comments += parseInt(data.result['resilexi.count_comments']);            
            ctrl.count_documents = parseInt(data.result['resilib.count_documents']);
            ctrl.count_articles = parseInt(data.result['resilib.count_documents']);            
            ctrl.count_posts = ctrl.count_questions + ctrl.count_answers + ctrl.count_articles + ctrl.count_comments + 2479;
            ctrl.count_users = parseInt(data.result['resiway.count_users']) + 5560;
        }
    },
    function error() {
        // something went wrong server-side
    }); 

    
    $http.get('index.php?get=resiexchange_question_list&order=modified&limit=15&sort=desc')
    .then(
    function success(response) {
        var data = response.data;
        if(typeof response.data.result == 'object') {
            ctrl.active_questions = response.data.result;
        }
    },
    function error() {
        // something went wrong server-side
    });
    
    $http.get('index.php?get=resiexchange_question_list&order=count_answers&limit=15&sort=asc')
    .then(
    function success(response) {
        var data = response.data;
        if(typeof response.data.result == 'object') {
            ctrl.poor_questions = response.data.result;
        }
    },
    function error() {
        // something went wrong server-side
    });

    $http.get('index.php?get=resilib_document_list&order=count_stars&limit=10&sort=desc')
    .then(
    function success(response) {
        var data = response.data;
        if(typeof response.data.result == 'object') {
            ctrl.last_documents = response.data.result;
        }
    },
    function error() {
        // something went wrong server-side
    });
    
    $scope.amount = "5EUR/mois";
    
    $scope.$watch('amount', function (value){
        switch(value) {
            case '5EUR/mois': $scope.amount_dedication = "Aidez une famille à savoir comment manger sain et local";
            break;
            case '10EUR/mois': $scope.amount_dedication = "Offrez aux agriculteurs les moyens d'absorber du CO2 au lieu d'en émettre trop";
            break;
            case '25EUR/mois': $scope.amount_dedication = "Participez à la résilience de l'humain vivant en harmonie avec l'environnement dont il dépend";
            break;
            case '25EUR/an': $scope.amount_dedication = "Contribuez à ce que chacun puisse fabriquer ses produits d'entretien écologiques";
            break;
            case '50EUR/an': $scope.amount_dedication = "Permettez la diffusion de savoirs ancestraux et de nouvelles technologies écologiques";
            break;
        }
    });
}]);
angular.module('resipedia')

/**
 * Question controller
 *
 */
.controller('questionController', [
    'question', 
    '$scope', 
    '$window', 
    '$location',
    '$http',    
    '$sce', 
    '$timeout', 
    '$uibModal', 
    'actionService', 
    'feedbackService', 
    function(question, $scope, $window, $location, $http, $sce, $timeout, $uibModal, actionService, feedbackService) {
        console.log('question controller');
        
        var ctrl = this;

        // @model
        $scope.question = question;

        
        /*
        * async load and inject $scope.related_questions
        */
        $scope.related_questions = [];
        $http.get('index.php?get=resiexchange_question_related&limit=7&question_id='+question.id)
        .then(
            function (response) {
                $scope.related_questions = response.data.result;
            }
        );

        
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
                appendTo: angular.element(document.querySelector(".modal-wrapper")),
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
                angular.merge($scope.question, $scope.previous);
            }
        };
        
        $scope.questionComment = function($event) {

            // remember selector for popover location 
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

            // define transaction
            var commit = function ($scope) {
                // prevent action if it has already been committed
                if(!angular.isDefined($scope.committed) || !$scope.committed) {
                    // make sure impacted properties are set
                    if(!angular.isDefined($scope.question.history['resiexchange_question_flag'])) {
                        $scope.question.history['resiexchange_question_flag'] = false;
                    }
                    // update current state to new values
                    if($scope.question.history['resiexchange_question_flag'] === true) {
                        $scope.question.history['resiexchange_question_flag'] = false;
                    }
                    else {
                        $scope.question.history['resiexchange_question_flag'] = true;
                    }
                }
            };

            // set previous state and begin transaction
            $scope.begin(commit, 
                         { 
                            history: {
                                resiexchange_question_flag: $scope.question.history['resiexchange_question_flag'] 
                            }
                         });     
            
            // remember selector for popover location        
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
                        // $scope.question.history['resiexchange_question_flag'] = data.result;
                    }
                }        
            });
        };

        $scope.questionAnswer = function($event) {
            ctrl.running = true;
            // remember selector for popover location 
            var selector = feedbackService.selector($event.target);                   
            
            actionService.perform({
                // valid name of the action to perform server-side
                action: 'resiexchange_question_answer',
                // string representing the data to submit to action handler (i.e.: serialized value of a form)
                data: {
                    question_id: $scope.question.id,
                    content: $scope.question.newAnswerContent,
                    source_author: $scope.question.newAnswerSource_author,
                    source_url: $scope.question.newAnswerSource_url,
                    source_license: $scope.question.newAnswerSource_license                   
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

            // normalize : make sure impacted properties are set
            if(!angular.isDefined($scope.question.history['resiexchange_question_votedown'])) {
                $scope.question.history['resiexchange_question_votedown'] = false;
            }
            if(!angular.isDefined($scope.question.history['resiexchange_question_voteup'])) {
                $scope.question.history['resiexchange_question_voteup'] = false;
            }           
            // define transaction
            var commit = function ($scope) {
                // prevent action if it has already been committed
                if(!angular.isDefined($scope.committed) || !$scope.committed) {                 
                    // update current state to new values
                    if($scope.question.history['resiexchange_question_voteup'] === true) {
                        // toggle voteup
                        $scope.question.history['resiexchange_question_voteup'] = false;
                        $scope.question.score--;
                    }
                    else {
                        // undo votedown
                        if($scope.question.history['resiexchange_question_votedown'] === true) {
                            $scope.question.history['resiexchange_question_votedown'] = false;
                            $scope.question.score++;
                        }
                        // voteup
                        $scope.question.history['resiexchange_question_voteup'] = true;
                        $scope.question.score++;
                    }
                }
            };

            // set previous state and begin transaction
            $scope.begin(commit, 
                         {
                            history: {
                                resiexchange_question_votedown: $scope.question.history['resiexchange_question_votedown'],
                                resiexchange_question_voteup:   $scope.question.history['resiexchange_question_voteup']                        
                            },
                            score: $scope.question.score
                         });
                         
            // remember selector for popover location    
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
                    if(data.result >= 0) {
                        // commit if it hasn't been done already
                        commit($scope);
                        if(data.result === true) feedbackService.popover(selector, 'QUESTION_ACTIONS_VOTEUP_OK', 'info', true);
                        // $scope.question.history['resiexchange_question_voteup'] = true;
                        // $scope.question.score++;
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
        
        $scope.questionVoteDown = function ($event) {

            // normalize : make sure impacted properties are set
            if(!angular.isDefined($scope.question.history['resiexchange_question_votedown'])) {
                $scope.question.history['resiexchange_question_votedown'] = false;
            }
            if(!angular.isDefined($scope.question.history['resiexchange_question_voteup'])) {
                $scope.question.history['resiexchange_question_voteup'] = false;
            }           
            // define transaction
            var commit = function ($scope) {
                // prevent action if it has already been committed
                if(!angular.isDefined($scope.committed) || !$scope.committed) {                                 
                    // update current state to new values
                    if($scope.question.history['resiexchange_question_votedown'] === true) {
                        // toggle votedown
                        $scope.question.history['resiexchange_question_votedown'] = false;
                        $scope.question.score++;
                    }
                    else {
                        // undo voteup
                        if($scope.question.history['resiexchange_question_voteup'] === true) {
                            $scope.question.history['resiexchange_question_voteup'] = false;
                            $scope.question.score--;
                        }
                        // votedown
                        $scope.question.history['resiexchange_question_votedown'] = true;
                        $scope.question.score--;
                    }
                }
            };

            // set previous state and begin transaction
            $scope.begin(commit, 
                         {
                            history: {
                                resiexchange_question_votedown: $scope.question.history['resiexchange_question_votedown'],
                                resiexchange_question_voteup:   $scope.question.history['resiexchange_question_voteup']                        
                            },
                            score: $scope.question.score
                         });
                         
            // remember selector for popover location
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

        $scope.questionStar = function ($event) {

            // normalize : make sure impacted properties are set
            if(!angular.isDefined($scope.question.history['resiexchange_question_star'])) {
                $scope.question.history['resiexchange_question_star'] = false;
            }
            // define transaction
            var commit = function ($scope) {
                // prevent action if it has already been committed
                if(!angular.isDefined($scope.committed) || !$scope.committed) {

                    // update current state to new values
                    if($scope.question.history['resiexchange_question_star'] === true) {
                        $scope.question.history['resiexchange_question_star'] = false;
                        $scope.question.count_stars--;
                    }
                    else {
                        $scope.question.history['resiexchange_question_star'] = true;
                        $scope.question.count_stars++;
                    }
                }
            };

            // set previous state and begin transaction
            $scope.begin(commit, 
                         { 
                            history: {
                                resiexchange_question_star: $scope.question.history['resiexchange_question_star']
                            },
                            count_stars: $scope.question.count_stars            
                         });    
            
            // remember selector for popover location
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
                        /*
                        $scope.question.history['resiexchange_question_star'] = data.result;
                        if(data.result === true) {
                            $scope.question.count_stars++;
                        }
                        else {
                            $scope.question.count_stars--;
                        }
                        */
                    }
                }        
            });
        };      

        $scope.questionCommentVoteUp = function ($event, index) {
            // normalize : make sure impacted properties are set
            if(!angular.isDefined($scope.question.comments[index].history['resiexchange_questioncomment_voteup'])) {
                $scope.question.comments[index].history['resiexchange_questioncomment_voteup'] = false;
            }    
            // define transaction
            var commit = function ($scope) {
                // prevent action if it has already been committed
                if(!angular.isDefined($scope.committed) || !$scope.committed) {                                   
                    // update current state to new values
                    if($scope.question.comments[index].history['resiexchange_questioncomment_voteup'] === true) {
                        $scope.question.comments[index].history['resiexchange_questioncomment_voteup'] = false;
                        $scope.question.comments[index].score--;
                    }
                    else {
                        $scope.question.comments[index].history['resiexchange_questioncomment_voteup'] = true;
                        $scope.question.comments[index].score++;
                    }
                }
            };
            
            // set previous state and begin transaction
            $scope.begin(commit, { comments: $scope.question.comments });
            
            // remember selector for popover location            
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
                        /*
                        $scope.question.comments[index].history['resiexchange_questioncomment_voteup'] = data.result;
                        if(data.result === true) {
                            $scope.question.comments[index].score++;
                        }
                        else {
                            $scope.question.comments[index].score--;
                        }
                        */
                    }
                }        
            });
        };

        $scope.questionCommentFlag = function ($event, index) {
            // normalize : make sure impacted properties are set
            if(!angular.isDefined($scope.question.comments[index].history['resiexchange_questioncomment_flag'])) {
                $scope.question.comments[index].history['resiexchange_questioncomment_flag'] = false;
            }  
                    
            // define transaction
            var commit = function ($scope) {
                // prevent action if it has already been committed
                if(!angular.isDefined($scope.committed) || !$scope.committed) {                    
                  
                    // update current state to new values (toggle flag)
                    if($scope.question.comments[index].history['resiexchange_questioncomment_flag'] === true) {
                        $scope.question.comments[index].history['resiexchange_questioncomment_flag'] = false;
                    }
                    else {
                        $scope.question.comments[index].history['resiexchange_questioncomment_flag'] = true;
                    }
                }
            };
            
            // set previous state and begin transaction
            $scope.begin(commit, { comments: $scope.question.comments });
            
            // remember selector for popover location             
            var selector = feedbackService.selector($event.target);
            
            actionService.perform({
                // valid name of the action to perform server-side
                action: 'resiexchange_questioncomment_flag',
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
                        // $scope.question.comments[index].history['resiexchange_answercomment_flag'] = data.result;
                    }
                }        
            });
        };        

        $scope.questionCommentEdit = function ($event, index) {
                       
            // remember selector for popover location 
            var selector = feedbackService.selector($event.target);

            actionService.perform({
                // valid name of the action to perform server-side
                action: 'resiexchange_questioncomment_edit',
                // string representing the data to submit to action handler (i.e.: serialized value of a form)
                data: {
                        comment_id: $scope.question.comments[index].id,
                        content: $scope.question.comments[index].content
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
                        $scope.question.comments[index].editMode = false;
                    }
                }        
            });
        };


        $scope.questionCommentDelete = function ($event, index) {
            
            // remember selector for popover location 
            var selector = feedbackService.selector($event.target);
            
            ctrl.openModal('MODAL_COMMENT_DELETE_TITLE', 'MODAL_COMMENT_DELETE_HEADER', $scope.question.comments[index].content)
            .then(
                function () {
                    actionService.perform({
                        // valid name of the action to perform server-side
                        action: 'resiexchange_questioncomment_delete',
                        // string representing the data to submit to action handler (i.e.: serialized value of a form)
                        data: {comment_id: $scope.question.comments[index].id},
                        // scope in wich callback function will apply 
                        scope: $scope,
                        // callback function to run after action completion (to handle error cases, ...)
                        callback: function($scope, data) {
                            // we need to do it this way because current controller might be destroyed in the meantime
                            // (if route is changed to signin form)
                            if(data.result === true) {                  
                                // update view
                                $scope.question.comments.splice(index, 1);
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

        
        $scope.questionDelete = function ($event) {
            
            // remember selector for popover location 
            var selector = feedbackService.selector($event.target);
            
            ctrl.openModal('MODAL_QUESTION_DELETE_TITLE', 'MODAL_QUESTION_DELETE_HEADER', $scope.question.title)
            .then(
                function () {
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
                }
            );     
        };
        
        $scope.answerVoteUp = function ($event, index) {
            // normalize : make sure impacted properties are set
            if(!angular.isDefined($scope.question.answers[index].history['resiexchange_answer_votedown'])) {
                $scope.question.answers[index].history['resiexchange_answer_votedown'] = false;
            }
            if(!angular.isDefined($scope.question.answers[index].history['resiexchange_answer_voteup'])) {
                $scope.question.answers[index].history['resiexchange_answer_voteup'] = false;
            }
               
            // define transaction
            var commit = function ($scope) {
                // prevent action if it has already been committed
                if(!angular.isDefined($scope.committed) || !$scope.committed) {
                    // update current state to new values
                    if($scope.question.answers[index].history['resiexchange_answer_voteup'] === true) {
                        // toggle voteup
                        $scope.question.answers[index].history['resiexchange_answer_voteup'] = false;
                        $scope.question.answers[index].score--;
                    }
                    else {
                        // undo votedown
                        if($scope.question.answers[index].history['resiexchange_answer_votedown'] === true) {
                            $scope.question.answers[index].history['resiexchange_answer_votedown'] = false;
                            $scope.question.answers[index].score++;
                        }
                        // voteup
                        $scope.question.answers[index].history['resiexchange_answer_voteup'] = true;
                        $scope.question.answers[index].score++;
                    }
                }
            };

            // set previous state and begin transaction
            $scope.begin(commit, { answers: $scope.question.answers });

            // remember selector for popover location             
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
                    if(data.result >= 0) {
                        // commit if it hasn't been done already
                        commit($scope);
                        if(data.result === true) feedbackService.popover(selector, 'QUESTION_ACTIONS_VOTEUP_OK', 'info', true);
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
        
        $scope.answerVoteDown = function ($event, index) {

            // normalize : make sure impacted properties are set
            if(!angular.isDefined($scope.question.answers[index].history['resiexchange_answer_votedown'])) {
                $scope.question.answers[index].history['resiexchange_answer_votedown'] = false;
            }
            if(!angular.isDefined($scope.question.answers[index].history['resiexchange_answer_voteup'])) {
                $scope.question.answers[index].history['resiexchange_answer_voteup'] = false;
            }
        
            // define transaction
            var commit = function ($scope) {
                // prevent action if it has already been committed
                if(!angular.isDefined($scope.committed) || !$scope.committed) {
                    // update current state to new values
                    if($scope.question.answers[index].history['resiexchange_answer_votedown'] === true) {
                        // toggle votedown
                        $scope.question.answers[index].history['resiexchange_answer_votedown'] = false;
                        $scope.question.answers[index].score++;
                    }
                    else {
                        // undo voteup
                        if($scope.question.answers[index].history['resiexchange_answer_voteup'] === true) {
                            $scope.question.answers[index].history['resiexchange_answer_voteup'] = false;
                            $scope.question.answers[index].score--;                            
                        }
                        // votedown
                        $scope.question.answers[index].history['resiexchange_answer_votedown'] = true;
                        $scope.question.answers[index].score--;
                    }
                }
            };

            // set previous state and begin transaction
            $scope.begin(commit, { answers: $scope.question.answers });

            // remember selector for popover location              
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
                    if(data.result >= 0) {                  
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
        
        $scope.answerFlag = function ($event, index) {
            // normalize : make sure impacted properties are set
            if(!angular.isDefined($scope.question.answers[index].history['resiexchange_answer_flag'])) {
                $scope.question.answers[index].history['resiexchange_answer_flag'] = false;
            }
            // define transaction
            var commit = function ($scope) {
                // prevent action if it has already been committed
                if(!angular.isDefined($scope.committed) || !$scope.committed) {
                    // update current state to new values (toggle flag)
                    if($scope.question.answers[index].history['resiexchange_answer_flag'] === true) {
                        $scope.question.answers[index].history['resiexchange_answer_flag'] = false;
                    }
                    else {
                        $scope.question.answers[index].history['resiexchange_answer_flag'] = true;
                    }
                }
            };

            // set previous state and begin transaction
            $scope.begin(commit, { answers: $scope.question.answers });
            
            // remember selector for popover location 
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
                        $scope.rollback();
                        // result is an error code
                        var error_id = data.error_message_ids[0];                    
                        // todo : get error_id translation
                        var msg = error_id;
                        feedbackService.popover(selector, msg);                    
                    }                
                    else {
                        commit($scope);
                        //$scope.question.answers[index].history['resiexchange_answer_flag'] = data.result;
                    }
                }        
            });
        };
        
        $scope.answerComment = function($event, index) {
            
            // remember selector for popover location 
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
            // normalize : make sure impacted properties are set
            if(!angular.isDefined($scope.question.answers[answer_index].comments[index].history['resiexchange_answercomment_voteup'])) {
                $scope.question.answers[answer_index].comments[index].history['resiexchange_answercomment_voteup'] = false;
            }               
            // define transaction
            var commit = function ($scope) {
                // prevent action if it has already been committed
                if(!angular.isDefined($scope.committed) || !$scope.committed) {                    
                 
                    // update current state to new values 
                    if($scope.question.answers[answer_index].comments[index].history['resiexchange_answercomment_voteup'] === true) {
                        // undo voteup
                        $scope.question.answers[answer_index].comments[index].history['resiexchange_answercomment_voteup'] = false;
                        $scope.question.answers[answer_index].comments[index].score--;
                    }
                    else {
                        // voteup
                        $scope.question.answers[answer_index].comments[index].history['resiexchange_answercomment_voteup'] = true;
                        $scope.question.answers[answer_index].comments[index].score++;
                    }
                }
            };
            
            // set previous state and begin transaction
            $scope.begin(commit, { answers: $scope.question.answers });
            
            // remember selector for popover location 
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
                        /*
                        $scope.question.answers[answer_index].comments[index].history['resiexchange_answercomment_voteup'] = data.result;
                        if(data.result === true) {
                            $scope.question.answers[answer_index].comments[index].score++;
                        }
                        else {
                            $scope.question.answers[answer_index].comments[index].score--;
                        }
                        */
                    }
                }        
            });
        };

        $scope.answerCommentFlag = function ($event, answer_index, index) {
            // normalize : make sure impacted properties are set
            if(!angular.isDefined($scope.question.answers[answer_index].comments[index].history['resiexchange_answercomment_flag'])) {
                $scope.question.answers[answer_index].comments[index].history['resiexchange_answercomment_flag'] = false;
            }  
                    
            // define transaction
            var commit = function ($scope) {
                // prevent action if it has already been committed
                if(!angular.isDefined($scope.committed) || !$scope.committed) {                    
                  
                    // update current state to new values (toggle flag)
                    if($scope.question.answers[answer_index].comments[index].history['resiexchange_answercomment_flag'] === true) {
                        $scope.question.answers[answer_index].comments[index].history['resiexchange_answercomment_flag'] = false;
                    }
                    else {
                        $scope.question.answers[answer_index].comments[index].history['resiexchange_answercomment_flag'] = true;
                    }
                }
            };
            
            // set previous state and begin transaction
            $scope.begin(commit, { answers: $scope.question.answers });
            
            // remember selector for popover location             
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
                        // $scope.question.answers[answer_index].comments[index].history['resiexchange_answercomment_flag'] = data.result;
                    }
                }        
            });
        };
        
        $scope.answerCommentEdit = function ($event, answer_index, index) {
                       
            // remember selector for popover location 
            var selector = feedbackService.selector($event.target);

            actionService.perform({
                // valid name of the action to perform server-side
                action: 'resiexchange_answercomment_edit',
                // string representing the data to submit to action handler (i.e.: serialized value of a form)
                data: {
                        comment_id: $scope.question.answers[answer_index].comments[index].id,
                        content: $scope.question.answers[answer_index].comments[index].content
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
                        $scope.question.answers[answer_index].comments[index].editMode = false;
                    }
                }        
            });
        };


        $scope.answerCommentDelete = function ($event, answer_index, index) {
            
            // remember selector for popover location 
            var selector = feedbackService.selector($event.target);
            
            ctrl.openModal('MODAL_COMMENT_DELETE_TITLE', 'MODAL_COMMENT_DELETE_HEADER', $scope.question.answers[answer_index].comments[index].content)
            .then(
                function () {
                    actionService.perform({
                        // valid name of the action to perform server-side
                        action: 'resiexchange_answercomment_delete',
                        // string representing the data to submit to action handler (i.e.: serialized value of a form)
                        data: {comment_id: $scope.question.answers[answer_index].comments[index].id},
                        // scope in wich callback function will apply 
                        scope: $scope,
                        // callback function to run after action completion (to handle error cases, ...)
                        callback: function($scope, data) {
                            // we need to do it this way because current controller might be destroyed in the meantime
                            // (if route is changed to signin form)
                            if(data.result === true) {                  
                                // update view
                                $scope.question.answers[answer_index].comments.splice(index, 1);
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
        

        $scope.answerDelete = function ($event, index) {
            
            // remember selector for popover location             
            var selector = feedbackService.selector($event.target);            
            
            ctrl.openModal('MODAL_ANSWER_DELETE_TITLE', 'MODAL_ANSWER_DELETE_HEADER', $scope.question.answers[index].content_excerpt)
            .then(
                function () {
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
                }
            );     
        };

        $scope.answerConvert = function ($event, index) {
            
            // remember selector for popover location             
            var selector = feedbackService.selector($event.target);            
            
            ctrl.openModal('MODAL_ANSWER_CONVERT_TITLE', 'MODAL_ANSWER_CONVERT_HEADER', $scope.question.answers[index].content_excerpt)
            .then(
                function () {
                    actionService.perform({
                        // valid name of the action to perform server-side
                        action: 'resiexchange_answer_convert',
                        // string representing the data to submit to action handler (i.e.: serialized value of a form)
                        data: {answer_id: $scope.question.answers[index].id},
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
                                $scope.question.answers.splice(index, 1);
                                // show user-answer block
                                $scope.question.history['resiexchange_question_answer'] = false;
                                // add new comment to the list
                                $scope.question.comments.push(data.result);
                                // wait for next digest cycle
                                $timeout(function() {
                                    // scroll to newly created comment
                                    feedbackService.popover('#comment-'+comment_id, '');
                                });
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
                templateUrl: 'questionShareModal.html',
                controller: ['$uibModalInstance', function ($uibModalInstance, items) {
                    var ctrl = this;
                    ctrl.title_id = 'Partager';

                    $uibModalInstance.question = $scope.question;
                    
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
                appendTo: angular.element(document.querySelector(".modal-wrapper"))
            }).result;

        };
        
    }
]);
angular.module('resipedia')
/**
* Display given question for edition
*
*/
.controller('questionEditController', [
    'question',
    '$scope',
    '$rootScope',
    '$window', 
    '$location', 
    '$sce', 
    'feedbackService', 
    'actionService', 
    '$http',
    '$httpParamSerializerJQLike',
    function(question, $scope, $rootScope, $window, $location, $sce, feedbackService, actionService, $http, $httpParamSerializerJQLike) {
        console.log('questionEdit controller');
        
        var ctrl = this;   

        // @view 
       
        $scope.addItem = function(query) {
            return {
                id: null, 
                title: query, 
                path: query, 
                parent_id: 0, 
                parent_path: ''
            };
        };
        
        $scope.loadMatches = function(query) {
            if(query.length < 2) return [];
            
            return $http.get('index.php?get=resiway_category_list&channel='+$rootScope.config.channel+'&order=title&'+$httpParamSerializerJQLike({domain: ['title', 'ilike', '%'+query+'%']}))
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
        
        // @model
        // content is inside a textarea and do not need sanitize check
        question.content = $sce.valueOf(question.content);
        
        $scope.question = angular.merge({
                            id: 0,
                            title: '',
                            content: '',
                            tags_ids: [{}]
                          }, 
                          question);
        // fix to support model update (from .tags to .categories)
        $scope.question.tags = {};
        angular.merge($scope.question.tags, question.categories);
                          

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
                if(tag.id == null) {
                    $scope.question.tags_ids.push(tag.title);
                }
                else $scope.question.tags_ids.push('+'+tag.id);
            });
        });

        // @methods
        $scope.questionPost = function($event) {
            ctrl.running = true;
            var selector = feedbackService.selector(angular.element($event.target));                   
            actionService.perform({
                // valid name of the action to perform server-side
                action: 'resiexchange_question_edit',
                // string representing the data to submit to action handler (i.e.: serialized value of a form)
                data: {
                    channel: $rootScope.config.channel,
                    question_id: $scope.question.id,
                    title: $scope.question.title,
                    content: $scope.question.content,
                    tags_ids: $scope.question.tags_ids
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
                            msg = 'question_'+msg;
                        }
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
angular.module('resipedia')

.controller('questionsController', [
    'questions', 
    '$scope',
    '$rootScope',
    '$route',
    '$http',
    '$httpParamSerializerJQLike',
    '$window',
    function(questions, $scope, $rootScope, $route, $http, $httpParamSerializerJQLike, $window) {
        console.log('questions controller');

        var ctrl = this;

        // @data model
        angular.merge(ctrl, {
            questions: {
                items: questions,
                total: $rootScope.search.total,
                currentPage: 1,
                previousPage: -1,                
                limit: $rootScope.search.criteria.limit
            }
        });

        // page loader
        ctrl.load = function() {
            if(ctrl.questions.currentPage != ctrl.questions.previousPage) {
                ctrl.questions.previousPage = ctrl.questions.currentPage;
                // reset objects list (triggers loader display)
                ctrl.questions.items = -1;
                $rootScope.search.criteria.start = (ctrl.questions.currentPage-1)*ctrl.questions.limit;
                
                $http.get('index.php?get=resiexchange_question_list&channel='+$rootScope.config.channel+'&'+$httpParamSerializerJQLike($rootScope.search.criteria))
                .then(
                    function successCallback(response) {
                        var data = response.data;
                        if(typeof data.result != 'object') {
                            ctrl.questions.items = [];
                        }
                        ctrl.questions.items = data.result;
                        $window.scrollTo(0, 0);
                    },
                    function errorCallback(response) {
                        // something went wrong server-side
                        return [];
                    }
                );
            }
        };            

        // @async loads
        ctrl.categories = [];
        
        // store categories list in controller, if any
        angular.forEach($rootScope.search.criteria.domain, function(clause, i) {
            if(clause[0] == 'categories_ids') {
                $scope.related_categories = [];
                if(typeof clause[2] != 'object') {
                    clause[2] = [clause[2]];
                }
                ctrl.categories = clause[2];
            }
        });
        
        /*
        * async load and inject $scope.categories and $scope.related_categories
        */
        if(ctrl.categories.length > 0) {
            $http.get('index.php?get=resiway_category_list&channel='+$rootScope.config.channel+'&'+$httpParamSerializerJQLike({domain: ['id', 'in', ctrl.categories]}))
            .then(
                function successCallback(response) {
                    var data = response.data;
                    if(typeof data.result == 'object') {
                        $scope.categories = data.result;
                    }
                }
            );
            angular.forEach(ctrl.categories, function(category_id, j) {
                $http.get('index.php?get=resiway_category_related-question&category_id='+category_id)
                .then(
                    function successCallback(response) {
                        var data = response.data;
                        if(typeof data.result == 'object') {
                            $scope.related_categories = data.result;
                        }
                    }
                );
                
            });
        }
        else {
            /*
            * async load and inject $scope.active_questions
            */
            $http.get('index.php?get=resiexchange_question_list&channel='+$rootScope.config.channel+'&limit=15&order=modified&sort=desc')
            .then(
                function successCallback(response) {
                    var data = response.data;
                    if(typeof data.result == 'object') {
                        $scope.active_questions = data.result;
                    }
                }
            );        
        }
        
        /*
        * async load and inject $scope.categories and $scope.featured_categories
        */
        $http.get('index.php?get=resiway_category_list&channel='+$rootScope.config.channel+'&limit=15&order=count_questions&sort=desc')
        .then(
            function successCallback(response) {
                var data = response.data;
                if(typeof data.result == 'object') {
                    $scope.featured_categories = data.result;
                }
            }
        );
        
        
    }
]);
angular.module('resipedia')

.controller('searchController', [
    'search', 
    '$scope',
    '$rootScope',
    '$route',
    '$http',
    '$httpParamSerializerJQLike',
    '$window',
    function(search, $scope, $rootScope, $route, $http, $httpParamSerializerJQLike, $window) {
        console.log('search controller');

        
        $scope.getClassFromType = function(type) {
            switch(type) {
            case 'question': return {'fa-comment-o':true};
            case 'article':  return {'fa-file-text-o':true};
            case 'document': return {'fa-book':true};
            }
            return {};
        };
        
        // @init
        var ctrl = this;

        // @data model
        angular.merge(ctrl, {
            search: {
                items: search,
                total: $rootScope.search.total,
                currentPage: 1,
                previousPage: -1,                
                limit: $rootScope.search.criteria.limit
            }
        });        
        
        
        ctrl.load = function(criteria) {
            if(arguments.length && typeof criteria == 'object') {
                angular.extend($rootScope.search.criteria, criteria);
                angular.merge(ctrl, {
                    search: {
                        currentPage: 1,
                        previousPage: -1
                    }
                });                
            }
            if(ctrl.search.currentPage != ctrl.search.previousPage) {
                ctrl.search.previousPage = ctrl.search.currentPage;
                // reset objects list (triggers loader display)
                ctrl.search.items = -1;
                $rootScope.search.criteria.start = (ctrl.search.currentPage-1)*ctrl.search.limit;
                
                $http.get('index.php?get=resiway_search&'+$httpParamSerializerJQLike($rootScope.search.criteria))
                .then(
                    function successCallback(response) {
                        var data = response.data;
                        if(typeof data.result != 'object') {
                            ctrl.search.items = [];
                        }
                        ctrl.search.items = data.result;
                        $window.scrollTo(0, 0);
                    },
                    function errorCallback(response) {
                        // something went wrong server-side
                        return [];
                    }
                );
            }
        };

        // @async loads

        
        /*
        * async load and inject $scope.categories and $scope.related_categories
        */
        if(angular.isDefined($rootScope.category)) {            

            $http.get('index.php?get=resiway_category_related&category_id='+$rootScope.category['id'])
            .then(
                function successCallback(response) {
                    var data = response.data;
                    if(typeof data.result == 'object') {
                        $scope.related_categories = data.result;
                    }
                }
            );
            
        }
        
    }
]);
angular.module('resipedia')

/**
* Top Bar Controller
* 
* 
*/
.controller('topBarCtrl', [
    '$scope',
    '$rootScope', 
    '$document',
    '$http',
    'actionService',
    'authenticationService',
    function($scope, $rootScope, $document, $http, action, authentication) {
        console.log('topbar controller');
        
        var ctrl = this;
        
        // @model
        ctrl.platformDropdown = false;
        ctrl.userDropdown = false;
        ctrl.notifyDropdown = false;
        ctrl.helpDropdown = false;
        
        function hideAll() {
            ctrl.platformDropdown = false;
            ctrl.userDropdown = false;
            ctrl.notifyDropdown = false;            
            ctrl.helpDropdown = false;            
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
        
        // @events
            
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

        $scope.toggleHelpDropdown = function() {
            var flag = ctrl.helpDropdown;            
            hideAll();
            if(!flag) $document.on('click', documentClickBind);   
            else $document.off('click', documentClickBind);
            ctrl.helpDropdown = !flag;
        };
        
        ctrl.signOut = function(){          
            action.perform({
                action: 'resiway_user_signout',
                next_path: '/',
                callback: function($scope, data) {
                    authentication.signout();
                }
            });
        };
        
        ctrl.notificationsDismissAll = function() {
            $rootScope.user.notifications = [];            
            $http.get('index.php?do=resiway_notification_dismiss-all');
        };
                
    }
]);
angular.module('resipedia')

.controller('userConfirmController', [
    '$scope',
    '$rootScope',
    '$routeParams',
    '$http',
    'authenticationService',
    function($scope, $rootScope, $routeParams, $http, authenticationService) {
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

         // @init
        $http.get('index.php?do=resiway_user_confirm&code='+ctrl.code)
        .then(
        function successCallback(response) {
            var data = response.data;
            if(typeof response.data.result != 'undefined'
            && response.data.result === true) {
                ctrl.verified = data.result;
                if(typeof data.notifications != 'undefined' && data.notifications.length > 0) {                
                    $rootScope.user.notifications = $rootScope.user.notifications.concat(data.notifications);
                }
                // we should now be able to authenticate (session is initiated)
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
angular.module('resipedia')
/**
* Display given user public profile for edition
*
*/
.controller('userEditController', [
    'user',
    '$scope',
    '$window',
    '$filter',
    '$http',
    '$translate',
    'feedbackService',
    'actionService',
    'hello',
    function(user, $scope, $window, $filter, $http, $translate, feedback, action, hello) {
    console.log('userEdit controller');    
    
    var ctrl = this;

    ctrl.user = user;
console.log(ctrl.user);
// todo : check against current user
// if user has no right : redirect to userView page
// + we need to ensure user is identified prior to access
    
    if(Object.keys(user).length == 0) {
        console.log('empty object');
        return;
    }
    ctrl.publicity_mode = {id: 1, text: 'Fullname'};

    ctrl.delays = [
        {delay: 0,  label: 'notification immédiate'},
        {delay: 1,  label: 'un jour (max 1 email par jour)'},
        {delay: 7,  label: 'une semaine (max 1 email par semaine)'},
        {delay: 30, label: 'un mois (max 1 email par mois)'}
    ];
    
    ctrl.modes = [ 
        {id: 1, text: 'Fullname'}, 
        {id: 2, text: 'Firstname + Lastname inital'}, 
        {id: 3, text: 'Firstname only'}
    ];
    
    // translate labels
    $translate(['USER_EDIT_PUBLICITY_MODE_FULLNAME','USER_EDIT_PUBLICITY_MODE_FIRSTNAME_L','USER_EDIT_PUBLICITY_MODE_FIRSTNAME'])
    .then(function (translations) {
        ctrl.modes[0].text = translations['USER_EDIT_PUBLICITY_MODE_FULLNAME'];
        ctrl.modes[1].text = translations['USER_EDIT_PUBLICITY_MODE_FIRSTNAME_L'];
        ctrl.modes[2].text = translations['USER_EDIT_PUBLICITY_MODE_FIRSTNAME'];        
    })
    .then(function() {
        angular.forEach(ctrl.modes, function(mode) {
            if(mode.id == ctrl.user.publicity_mode) {
                ctrl.publicity_mode = {id: mode.id, text: mode.text};                
            }
        });        
    });
    
    ctrl.avatars = {};
    
    if(typeof ctrl.user.login != 'undefined') {
        ctrl.avatars = {
            libravatar: 'https://seccdn.libravatar.org/avatar/'+md5(ctrl.user.login)+'?s=@size',
            gravatar: 'https://www.gravatar.com/avatar/'+md5(ctrl.user.login)+'?s=@size',
            identicon: 'https://www.gravatar.com/avatar/'+md5(ctrl.user.firstname+ctrl.user.id)+'?d=identicon&s=@size'
        };
        
        var online = function(session) {
            var currentTime = (new Date()).getTime() / 1000;
            return session && session.access_token && session.expires > currentTime;
        };

        var facebook = hello('facebook');
        var google = hello('google');

        if(online(facebook.getAuthResponse())) {
            facebook.api('me').then(function(json) {
                $scope.$apply(function() {
                    ctrl.avatars.facebook = json.thumbnail;
                });
            });
        }
        if(online(google.getAuthResponse())) {
            google.api('me').then(function(json) {
                $scope.$apply(function() {
                    var avatar_url = json.thumbnail;
                    ctrl.avatars.google = avatar_url.replace(/\?sz=.*/, "?sz=@size");
                });
            });            
        }
            
        // @init
        /*
        // retrieve GMail avatar, if any
        $http.get('https://picasaweb.google.com/data/entry/api/user/'+ctrl.user.login+'?alt=json')
        .then(
            function successCallback(response) {
                var url = response.data['entry']['gphoto$thumbnail']['$t'];
                ctrl.avatars.google = url.replace("/s64-c/", "/")+'?sz=@size';
            },
            function errorCallback(response) {

            }
        );
        */        
    }
    
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
        ctrl.running = true;        
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
                about: ctrl.user.about,
                avatar_url: ctrl.user.avatar_url,
                notify_reputation_update: ctrl.user.notify_reputation_update,
                notify_badge_awarded: ctrl.user.notify_badge_awarded,
                notify_question_comment: ctrl.user.notify_question_comment,
                notify_answer_comment: ctrl.user.notify_answer_comment,
                notify_question_answer: ctrl.user.notify_question_answer,
                notify_updates: ctrl.user.notify_updates,
                notice_delay: ctrl.user.notice_delay            
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
angular.module('resipedia')

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
angular.module('resipedia')

/**
* 
* 
* 
*/
.controller('userPasswordController', [
    '$scope',
    '$routeParams',
    '$http',
    'authenticationService',
    function($scope, $routeParams, $http, authenticationService) {
        console.log('userPassword controller');
        
        var ctrl = this;

        // @model             
        $scope.password = '';
        $scope.confirm = '';    
        $scope.alerts = [];
        // alerts format : { type: 'danger|warning|success', msg: 'Alert message.' }

        ctrl.code = $routeParams.code;        
        ctrl.password_updated = false;   
        ctrl.closeAlerts = function() {
            $scope.alerts = [];
        };

        // @init        
        if(typeof ctrl.code != 'undefined') {
            var decoded = String(ctrl.code).replace(/-/g, '_').replace(/\+/g, '/').base64_decode();
            if(decoded.indexOf(';') > 0) {
                var params = decoded.split(';');
                $http.get('index.php?do=resiway_user_signin&login='+params[0]+'&password='+params[1])
                .then(
                function success(response) {
                    var data = response.data;
                    if(typeof response.data.result != 'undefined'
                    && response.data.result > 0) {
                        ctrl.verified = data.result;
                        // we should now be able to authenticate (session is initiated)
                        authenticationService.authenticate();
                    }
                },
                function error() {
                    // something went wrong server-side
                });
            }
        }
        
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
angular.module('resipedia')

.controller('userProfileController', [
    'user', 
    '$scope', 
    '$http', 
    function(user, $scope, $http) {
        console.log('userProfile controller');
        
        var ctrl = this;
        
        ctrl.user = user;
        
        
        // @init
        // acknowledge user profile view (so far, user data have been loaded but nothing indicated a profile view)
        $http.get('index.php?do=resiway_user_profileview&id='+user.id);

        
        ctrl.load = function(config) {
            if(config.currentPage != config.previousPage) {
                config.previousPage = config.currentPage;
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
            }
        };
        
        angular.merge(ctrl, {
            updates: {
                items: -1,
                total: -1,
                currentPage: 1,
                previousPage: -1,
                limit: 5,
                domain: [[['user_id', '=', ctrl.user.id],['user_increment','<>', 0]],[['author_id', '=', ctrl.user.id],['author_increment','<>', 0]]],
                provider: 'resiway_actionlog_list'
            },
            badges: {
                items: -1,
                total: -1,
                currentPage: 1,
                previousPage: -1,                
                limit: 5,
                domain: ['user_id', '=', ctrl.user.id],
                provider: 'resiway_userbadge_list'
            },            
            questions: {
                items: -1,
                total: -1,
                currentPage: 1,
                previousPage: -1,                
                limit: 5,
                domain: ['creator', '=', ctrl.user.id],
                provider: 'resiexchange_question_list'
            },
            answers: {
                items: -1,
                total: -1,
                currentPage: 1,
                previousPage: -1,                
                limit: 5,
                domain: ['creator', '=', ctrl.user.id],
                provider: 'resiexchange_answer_list'
            },
/*            
            favorites: {
                items: -1,
                total: -1,
                currentPage: 1,
                previousPage: -1,                
                limit: 5,
                // 'resiexchange_question_star' == action (id=4)
                // todo : how to de-hardcode this                
                domain: [['user_id', '=', ctrl.user.id], ['action_id','=','4']],
                provider: 'resiway_actionlog_list'
            },
*/
            favorites: {
                items: -1,
                total: -1,
                currentPage: 1,
                previousPage: -1,                
                limit: 5,
                domain: ['user_id', '=', ctrl.user.id],
                provider: 'resiway_userfavorite_list'
            },            
            actions: {
                items: -1,
                total: -1,
                currentPage: 1,
                previousPage: -1,                
                limit: 5,
                domain: ['user_id', '=', ctrl.user.id],
                provider: 'resiway_actionlog_list'
            },        
        });
        
        $scope.removeFavorite = function($event, index) {            
            $http.post('index.php?do=resiway_userfavorite_delete&userfavorite_id='+ctrl.favorites.items[index].id);
            ctrl.favorites.items.splice(index, 1); 
        };
    }
]);
angular.module('resipedia')

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
        
        // set default mode to signin form
        ctrl.mode = 'in'; 
        
        // asign mode from URL if it matches one of the allowed modes
        switch($routeParams.mode) {
            case 'recover':
            case 'in': 
            case 'up': 
            ctrl.mode = $routeParams.mode;
        }


        // @model             
        $scope.remember = true;
        $scope.accept = false;
        $scope.username = '';
        $scope.password = '';
        $scope.firstname = '';
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
                else if($scope.password.length == 0) {
                    $scope.signInAlerts.push({ type: 'warning', msg: 'Please, provide your password.' });                
                }
            }
            else {
                ctrl.running = true;                
                // form is complete
                ctrl.closeSignInAlerts();                
                // authenticationService.setCredentials($scope.username, md5($scope.password), $scope.remember);
                // attempt to log the user in
                authenticationService.signin($scope.username, md5($scope.password)).then(
                function success(data) {
                    ctrl.running = false;
                    // if some action is pending, return to URL where it occured
                    if($rootScope.pendingAction
                    && typeof $rootScope.pendingAction.next_path != 'undefined') {
                       $location.path($rootScope.pendingAction.next_path);
                    }
                    else {
                        $location.path($rootScope.previousPath);
                    }
                },
                function error() {
                    ctrl.running = false;
                    // authenticationService.clearCredentials();
                    $scope.signInAlerts = [{ type: 'danger', msg: 'Email ou mot de passe incorrect.' }];
                });        
            }
        };
        
        ctrl.signUp = function() {
            if($scope.username.length == 0 || $scope.firstname.length == 0) {
                if($scope.firstname.length == 0) {
                    $scope.signUpAlerts.push({ type: 'warning', msg: 'Oups, il manque votre prénom.' });
                }                
                else if($scope.username.length == 0) {
                    $scope.signUpAlerts.push({ type: 'warning', msg: 'Il faut aussi un email comme identifiant.' });
                }
            }
            else if(!$scope.accept) {
                $scope.signUpAlerts.push({ type: 'warning', msg: 'Pour pouvoir participer il est nécessaire d\'accepter les conditions d\'utilisation.' });
            }
            else {
                ctrl.running = true;
                ctrl.closeSignUpAlerts();                
                authenticationService.register($scope.username, $scope.firstname).then(
                function successHandler(data) {
                    ctrl.running = false;
                    authenticationService.authenticate().then(
                    function success(data) {
                        // actively request emails
                        $http.get('index.php?do=resiway_user_pull');
                        // if some action is pending, return to URL where it occured
                        if($rootScope.pendingAction
                        && typeof $rootScope.pendingAction.next_path != 'undefined') {
                           $location.path($rootScope.pendingAction.next_path);
                        }
                        else {
                            $location.path($rootScope.previousPath);
                        }
                    },
                    function error(data) {
                        // authenticationService.clearCredentials();
                        $scope.signUpAlerts = [{ type: 'danger', msg: 'Sorry, an unexpected error occured.' }];
                    });  
                },
                function error(data) {
                    ctrl.running = false;
                    var error_id = data.error_message_ids[0];     
                    // server fault, email already registered, ...
                    $scope.signUpAlerts = [{ type: 'danger', msg: error_id }];
                });             

            }
        };

        ctrl.recover = function () {
            if($scope.email.length == 0) {
                $scope.recoverAlerts.push({ type: 'warning', msg: 'Please, provide your email.' });
            }
            else {
                ctrl.running = true;
                ctrl.closeRecoverAlerts();
                $http.get('index.php?do=resiway_user_passwordrecover&email='+$scope.email)
                .then(
                function successCallback(response) {
                    ctrl.running = false;
                    var data = response.data;
                    if(typeof response.data.result != 'undefined'
                    && response.data.result === true) {
                        ctrl.recovery_sent = data.result;
                    }
                },
                function errorCallback() {
                    ctrl.running = false;
                    var error_id = data.error_message_ids[0];     
                    // server fault, user not verified, ...
                    $scope.recoverAlerts = [{ type: 'danger', msg: error_id }];
                });                  
            }
        };
        
        $scope.$on('auth.signed', function(event, auth) {
            ctrl.running = false;
            console.log('auth notification received in userSign controller');
            // if some action is pending, return to URL where it occured
            if($rootScope.pendingAction
            && typeof $rootScope.pendingAction.next_path != 'undefined') {
               $location.path($rootScope.pendingAction.next_path);
            }
            else {
                $location.path($rootScope.previousPath);
            }
        });
    }
]);
angular.module('resipedia')

.controller('usersController', [
    'users', 
    '$scope',
    '$rootScope',    
    '$http',
    function(users, $scope, $rootScope, $http) {
        console.log('users controller');

        var ctrl = this;

        // @data model
        ctrl.config = {
            items: users,
            total: -1,
            currentPage: 1,
            previousPage: -1,
            limit: 30,
            domain: [],
            loading: false
        };
        
        ctrl.load = function(config) {
            if(config.currentPage != config.previousPage) {
                config.previousPage = config.currentPage;
                // trigger loader display
                if(config.total > 0) {
                    config.loading = true;
                }
                $http.post('index.php?get=resiway_users', {
                    domain: config.domain,
                    start: (config.currentPage-1)*config.limit,
                    limit: config.limit,
                    total: config.total
                }).then(
                function successCallback(response) {
                    var data = response.data;
                    config.items = data.result;
                    config.total = data.total;
                    config.loading = false;
                },
                function errorCallback() {
                    // something went wrong server-side
                });
            }
        };
        
        
        // @init
        ctrl.load(ctrl.config);
        
    }
]);