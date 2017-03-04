'use strict';
/**
* Converts to lower case and strips accents
* this method is used in myListFilter, a custom filter for dsiplaying categories list
* using the oi-select angular plugin
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


/**
* Encode / Decode a string to base64url
*
*
*/
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

.controller('homeController', function() {
    var ctrl = this;

    console.log('home controller');  
    
    this.ok = function() {
        console.log('ok');
    };    
  
});

angular.module('resiexchange')

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
            var deferred = $q.defer();
            $http.get('index.php?do=resiway_user_signup&login='+login+'&firstname='+firstname)
            .then(
            function successCallback(response) {
                if(response.data.result < 0) {
                    return deferred.reject(response.data);
                }
                return deferred.resolve(response.data.result);
            },
            function errorCallback(response) {
                // something went wrong server-side
                return deferred.reject({'result': -1});
            }            
            );
            return deferred.promise;
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
                    function(data) {
                        // something went wrong server-side
                        deferred.reject(data); 
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
                            function errorHandler(data) {
                                // something went wrong server-side
                                deferred.reject(data);                                
                            }
                        );                            
                    },
                    function(data) {
                        // given values were not accepted 
                        // or something went wrong server-side
                        deferred.reject(data);  
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
angular.module('resiexchange')

.config([
    '$routeProvider', 
    '$routeParamsProvider', 
    '$httpProvider',
    function($routeProvider, $routeParamsProvider, $httpProvider) {
        
        var templatePath = 'packages/resiexchange/apps/views/';
        /**
        * Routes definition
        * This call associates handled URL with their related views and controllers
        * 
        * As a convention, a 'ctrl' member is always defined inside a controller as itself
        * so it can be manipulated the same way in view and in controller
        */
        $routeProvider
        /**
        * Help related routes
        */
        // display all categories with first 5 topics in each
        .when('/help/categories', {
            templateUrl : templatePath+'helpCategories.html',
            controller  : 'helpCategoriesController as ctrl',
            resolve     : {
                categories: ['routeHelpCategoriesProvider', function (provider) {
                    return provider.load();
                }]
            }
        })
        .when('/help/category/edit/:id', {
            templateUrl : templatePath+'helpCategoryEdit.html',
            controller  : 'helpCategoryEditController as ctrl',
            resolve     : {
                // request object data
                category: ['routeHelpCategoryProvider', function (provider) {
                    return provider.load();
                }]
            }        
        })        
        // display a single category with all topics
        .when('/help/category/:id/:title?', {
            templateUrl : templatePath+'helpCategory.html',
            controller  : 'helpCategoryController as ctrl',
            resolve     : {
                // request object data
                category: ['routeHelpCategoryProvider', function (provider) {
                    return provider.load();
                }]
            }        
        })
        .when('/help/topic/edit/:id', {
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
        })           
        // display a topic with breadcrumb
        .when('/help/topic/:id/:title?', {
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
        })
        /**
        * Badges related routes
        */
        
        .when('/badges', {
            templateUrl : templatePath+'badges.html',
            controller  : 'badgesController as ctrl',
            resolve     : {
                badges: ['routeBadgesProvider', function (provider) {
                    return provider.load();
                }]
            }
        })        
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
        .when('/user/profile/:id/:name?', {
            templateUrl : templatePath+'userProfile.html',
            controller  : 'userProfileController as ctrl',
            resolve     : {
                user:  ['routeUserProvider', function (provider) {
                    return provider.load();
                }]
            }             
        })
        .when('/user/password/:code?', {
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
angular.module('resiexchange')

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
        var label = item.title.toString();
        var path  = item.path.toString();
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
                isFound = getLabel(input[i]).toASCII().toLowerCase().match(new RegExp(query));

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
angular.module('resiexchange')

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
angular.module('resiexchange')

.controller('badgesController', [
    'badges', 
    '$scope',
    function(badges, $scope) {
        console.log('badges controller');

        var ctrl = this;

        // @data model
        $scope.badges = badges;
    
    }
]);
angular.module('resiexchange')

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

        // @view
        $scope.categories = angular.extend({
                                id: 0,
                                title: '',
                                description: ''
                            }, 
                            categories); 
        
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
angular.module('resiexchange')

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
angular.module('resiexchange')

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
angular.module('resiexchange')

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
angular.module('resiexchange')

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
angular.module('resiexchange')

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
angular.module('resiexchange')

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
            var selector = feedbackService.selector($event.target);
            ctrl.open('MODAL_QUESTION_DELETE_TITLE', 'MODAL_QUESTION_DELETE_HEADER', $scope.question.title).then(
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
            var selector = feedbackService.selector($event.target);            
            ctrl.open('MODAL_ANSWER_DELETE_TITLE', 'MODAL_ANSWER_DELETE_HEADER', $scope.question.answers[index].content_excerpt).then(
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
                }, 
                function () {
                    // dismissed
                }
            );     
        };
        
    }
]);
angular.module('resiexchange')
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
        // content is inside a textarea and do not need sanitize check
        question.content = $sce.valueOf(question.content);
        
        $scope.question = angular.merge({
                            id: 0,
                            title: '',
                            content: '',
                            tags_ids: [{}]
                          }, 
                          question);
                  
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
                    question_id: $scope.question.id,
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
angular.module('resiexchange')

.controller('questionsController', [
    'questions', 
    '$scope',
    '$http',
    function(questions, $scope, $http) {
        console.log('questions controller');

        var ctrl = this;

        // @data model
        ctrl.questions = questions;


        $http.get('index.php?get=resiexchange_stats')
        .then(
        function successCallback(response) {
            var data = response.data;
            if(typeof response.data.result == 'object') {
                ctrl.count_questions = data.result['resiexchange.count_questions'];
                ctrl.count_answers = data.result['resiexchange.count_answers'];
                ctrl.count_comments = data.result['resiexchange.count_comments'];
            }
        },
        function errorCallback() {
            // something went wrong server-side
        });                  
        
    }
]);
angular.module('resiexchange')

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
angular.module('resiexchange')

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

         // @init
        $http.get('index.php?do=resiway_user_confirm&code='+ctrl.code)
        .then(
        function successCallback(response) {
            var data = response.data;
            if(typeof response.data.result != 'undefined'
            && response.data.result === true) {
                ctrl.verified = data.result;
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
angular.module('resiexchange')
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
    function(user, $scope, $window, $filter, $http, $translate, feedback, action) {
    console.log('userEdit controller');    
    
    var ctrl = this;

    ctrl.user = user;    
    ctrl.publicity_mode = {id: 1, text: 'Fullname'};
    
    ctrl.modes = [ 
        {id: 1, text: 'Fullname'}, 
        {id: 2, text: 'Firstname + Lastname inital'}, 
        {id: 3, text: 'Firstname only'}
    ];
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
    
    ctrl.avatars = {
        gravatar: 'http://www.gravatar.com/avatar/'+md5(ctrl.user.login)+'?s=@size',
        identicon: 'http://www.gravatar.com/avatar/'+md5(ctrl.user.firstname+ctrl.user.id)+'?d=identicon&s=@size',
        google: ''
    };
        
    // @init
    // retrieve GMail avatar, if any
    $http.get('http://picasaweb.google.com/data/entry/api/user/'+ctrl.user.login+'?alt=json')
    .then(
        function successCallback(response) {
            var url = response.data['entry']['gphoto$thumbnail']['$t'];
            ctrl.avatar.google = url.replace("/s64-c/", "/")+'?sz=@size';
        },
        function errorCallback(response) {

        }
    );     

    
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
                about: ctrl.user.about,
                avatar_url: ctrl.user.avatar_url
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
angular.module('resiexchange')

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
angular.module('resiexchange')

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
            var decoded = String(ctrl.code).base64_decode();
            if(decoded.indexOf(';') > 0) {
                var params = decoded.split(';');
                $http.get('index.php?do=resiway_user_signin&login='+params[0]+'&password='+params[1])
                .then(
                function successCallback(response) {
                    var data = response.data;
                    if(typeof response.data.result != 'undefined'
                    && response.data.result > 0) {
                        ctrl.verified = data.result;
                        // we should now be able to authenticate (session is initiated)
                        authenticationService.authenticate();
                    }
                },
                function errorCallback() {
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
angular.module('resiexchange')

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
        
        
        // @init
        // acknowledge user profile view (so far, user data have been loaded but nothing indicated a profile view)
        $http.get('index.php?do=resiway_user_profileview&id='+user.id);

        
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
angular.module('resiexchange')

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
        $scope.remember = true;
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
                // form is complete
                ctrl.closeSignInAlerts();                
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
                if($scope.firstname.length == 0) {
                    $scope.signUpAlerts.push({ type: 'warning', msg: 'Please, indicate your firstname.' });                
                }                
                else if($scope.username.length == 0) {
                    $scope.signUpAlerts.push({ type: 'warning', msg: 'Please, provide your email as username.' });                
                }
            }
            else {
                ctrl.closeSignUpAlerts();                
                authenticationService.register($scope.username, $scope.firstname).then(
                function successHandler(data) {
                    authenticationService.authenticate().then(
                    function successHandler(data) {
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
                    function errorHandler(data) {
                        authenticationService.clearCredentials();
                        $scope.signUpAlerts = [{ type: 'danger', msg: 'Sorry, an unexpected error occured.' }];
                    });  
                },
                function errorHandler(data) {
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
                ctrl.closeRecoverAlerts();
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