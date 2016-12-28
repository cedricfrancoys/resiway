'use strict';


// todo : uplad images (avatar)
// @see : http://stackoverflow.com/questions/13963022/angularjs-how-to-implement-a-simple-file-upload-with-multipart-form?answertab=votes#tab-top

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



var resiway = angular.module('resiway', [
'ui.bootstrap',
'ngSanitize',
'ngCookies', 
'ngAnimate', 
'oi.select',
'pascalprecht.translate',
'textAngular',
'ngRoute',
    // dependencies
    function() {
        console.log('resilib module init');
    }
])

.config(function(
                $provide, 
                $routeProvider, 
                $routeParamsProvider,
                $translateProvider,
                $locationProvider, 
                $anchorScrollProvider, 
                $httpProvider) {
    // $locationProvider.html5Mode({enabled: true, requireBase: false, rewriteLinks: false}).hashPrefix('!');
    $locationProvider.html5Mode({enabled: false, requireBase: false, rewriteLinks: false});
    
    //$anchorScrollProvider.disableAutoScrolling();

    $translateProvider.preferredLanguage('fr');

    $translateProvider.useStaticFilesLoader({
      prefix: '/i18n/locale-',
      suffix: '.json'
    });
    $translateProvider.useSanitizeValueStrategy('sanitize');
    
    // add fulscreen capability to textAngular editor
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

    /**
    * Routes definition
    * This call associates handled URL with their related views and controllers
    * 
    * As a convention, a 'ctrl' member is always defined inside a controller as itself
    * so it can be manipulated the same way in view and in controller
    */
    $routeProvider
    .when('/questions/:channel?', {
        templateUrl : 'search.html',
        controller  : 'searchController as ctrl'
    })
    .when('/question/edit/:id', {
        templateUrl : 'editQuestion.html',
        controller  : 'editQuestionController as ctrl',
        resolve     : {
            /**
            * editQuestionController will wait for these promises to be resolved and provided as services
            */
            question: function($http, $route, $sce) {
                // new question
                if($route.current.params.id == 0 
                || typeof $route.current.params.id == 'undefined') return {};
                return $http.get('index.php?get=resiexchange_question&id='+$route.current.params.id)
                .then(
                    function successCallback(response) {
                        var data = response.data;
                        if(typeof data.result != 'object') return {};
                        // mark html as safe
                        data.result.content = $sce.trustAsHtml(data.result.content); 
                        return data.result;
                    },
                    function errorCallback(response) {
                        // something went wrong server-side
                        return {};
                    }
                );
            },            
            categories: function($http, $sce) {
                return $http.get('index.php?get=resiway_categories')
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
            }
        }        
    })    
    .when('/question/:id', {
        templateUrl : 'question.html',
        controller  : 'questionController as ctrl',
        reloadOnSearch: false,
        resolve     : {
            /**
            * questionController will wait for these promises to be resolved and provided as services
            */
            question: function($http, $route, $sce) {

                if(typeof $route.current.params.id == 'undefined') return {};

                return $http.get('index.php?get=resiexchange_question&id='+$route.current.params.id)
                .then(
                    function successCallback(response) {
                        var data = response.data;
                        if(typeof data.result != 'object') return {};
                             
                        // adapt result to view requirements
                        var attributes = {
                            commentsLimit: 5,
                            newCommentShow: false,
                            newCommentContent: '',
                            newAnswerContent: ''                               
                        }
                        // mark html as safe
                        data.result.content = $sce.trustAsHtml(data.result.content);                               
                        // add special fields
                        angular.extend(data.result, attributes);
                        
                        angular.forEach(data.result.answers, function(value, index) {
                            // mark html as safe
                            data.result.answers[index].content = $sce.trustAsHtml(data.result.answers[index].content);
                            // add special fields
                            angular.extend(data.result.answers[index], attributes);
                        });
                        
                        return data.result;
                    },
                    function errorCallback(response) {
                        // something went wrong server-side
                        return {};
                    }
                );
            }
        }
    })
    .when('/answer/edit/:id', {
        templateUrl : 'editAnswer.html',
        controller  : 'editAnswerController as ctrl',
        resolve     : {
            /**
            * editQuestionController will wait for these promises to be resolved and provided as services
            */
            answer: function($http, $route, $sce) {
                // new question
                if($route.current.params.id == 0 
                || typeof $route.current.params.id == 'undefined') return {};
                return $http.get('index.php?get=resiexchange_answer&id='+$route.current.params.id)
                .then(
                    function successCallback(response) {
                        var data = response.data;
                        if(typeof data.result != 'object') return {};
                        // mark html as safe
                        data.result.content = $sce.trustAsHtml(data.result.content); 
                        return data.result;
                    },
                    function errorCallback(response) {
                        // something went wrong server-side
                        return {};
                    }
                );
            }
        }        
    })     
    .when('/user', {
        templateUrl : 'user.html',
        controller  : 'userController as ctrl'
    })
    .when('/user/sign/:mode?', {
        templateUrl : 'sign.html',
        controller  : 'signController as ctrl',
        reloadOnSearch: false
    })
    .otherwise({
        templateUrl : 'home.html',
        controller  : 'homeController as ctrl'
    });    
    
    
    // Use x-www-form-urlencoded Content-Type
    $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';
    
    // Override $http service's default transformRequest
    $httpProvider.defaults.transformRequest = [function(data) {
        // prepare the request data for the form post.
        return( serializeData( data ) );

        /**
        * Serialize the given Object into a key-value pair string. This
        * method expects an object and will default to the toString() method.
        * 
        * This is an atered version of the jQuery.param() method which
        * will serialize a data collection for Form posting.
        *
        * @private
        * @source: https://github.com/jquery/jquery/blob/master/src/serialize.js#L45
        */      
        function serializeData( data ) {
            // If this is not an object, defer to native stringification.
            if ( ! angular.isObject( data ) ) {
                return( ( data == null ) ? "" : data.toString() );
            }
            var buffer = [];
            // Serialize each key in the object.
            for ( var name in data ) {
                if ( ! data.hasOwnProperty( name ) ) {
                    continue;
                }
                var value = data[ name ];
                buffer.push(
                    encodeURIComponent( name ) +
                    "=" +
                    encodeURIComponent( ( value == null ) ? "" : value )
                );
            }
            // Serialize the buffer and clean it up for transportation.
            return buffer
                .join( "&" )
                .replace( /%20/g, "+" );
        }        
    }];    
    
})

/**
*
*/
.service('$authentication', function($rootScope, $http, $q, $cookieStore) {
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
// todo : define a custom controller to retrieve user data        
        $http.get('index.php?get=core_objects_read&class_name=resiway\\User&ids[]='+user_id)
        .success(function(data, status, headers, config) {
            if(typeof data == 'object' 
            && typeof data.result == 'object'
            && typeof data.result[user_id] != 'undefined') {
                deferred.resolve(data.result[user_id]);
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
        $rootScope.user_id = 0;
        $rootScope.user = {};
        $cookieStore.remove('username');
        $cookieStore.remove('password'); 
    };    
    

    // @private
    this.login = function() {
        var deferred = $q.defer();
        if(typeof $auth.username == 'undefined'
        || typeof $auth.password == 'undefined'
        || !$auth.username.length 
        || !$auth.password.length) {
            $auth.clearCredentials();
            // reject with a 'missing_param' error code
            deferred.reject({'result': -2});
        }
        else {
            $http.get('index.php?do=resiway_user_login&login='+$auth.username+'&password='+$auth.password)
            .then(
                function successCallback(response) {
                    if(typeof response.data.result == 'undefined') {
                        // something went wrong server-side
                        deferred.reject({'result': -1});
                    }
                    else {
                        if(response.data.result < 0) {
                            // given values not accepted
                            $auth.clearCredentials();
                            deferred.reject(response.data);
                        }
                        else {
                            deferred.resolve(response.data.result);
                        }
                    }
                },
                function errorCallback(response) {
                    // something went wrong server-side
                    deferred.reject({'result': -1});
                }
            );
        }
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
        if($rootScope.user_id > 0) {        
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
                    $rootScope.user_id = user_id;
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
                $auth.login().then(
                function(user_id) {
                    $auth.userData(user_id)
                    .then(
                        function successHandler(data) {
                            $rootScope.user_id = user_id;
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

})



.service('$actions', function($rootScope, $http, $location, $authentication) {
    
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
        
        $authentication.authenticate().then(
        // user is authentified and can perform the action
        function() {
            // pending action has been processed : reset it from global scope
            $rootScope.pendingAction = null;
            // submit action to the server, if any
            if(typeof task.action != 'undefined'
            && task.action.length > 0) {
                $http.post('index.php?do='+task.action, task.data).then(
                function successCallback(response) {
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
    
})


/**
* there can only be one popover at the same time on the whole page
* to display a popover, we need an anchor : a node having an id and a uid-popover-template attribute
* an event can be triggered by a A node or any of its sub-nodes
*/
.service('feedback', function($window) {
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
        * Scrolls to target element
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
        * returns the selector allowing to retrieve this node 
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

})



.run( function($document, $window, $timeout, $rootScope, $location, $anchorScroll, $cookieStore, $authentication, $actions, feedback) {
    console.log('run method invoked');

    // bind rootScope with feedback service (popover display)
    $rootScope.popover = feedback;
    
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
    * Required in order to return to previous location when user goes to sign page (login/register)
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
        $rootScope.viewContentLoading = true;
    });

    $rootScope.$on('$locationChangeSuccess', function(angularEvent) {
        console.log('$locationChangeSuccess');

        if($rootScope.currentPath) {
            $rootScope.previousPath = $rootScope.currentPath;
        }
        $rootScope.currentPath  = $location.path();

        console.log('previous path: '+$rootScope.previousPath);
        console.log('current path: '+$rootScope.currentPath);        
    });
    


    
    /**
    * This callback is invoked at each change of view
    * it is used to complete any pending action
    */
    $rootScope.$on('$viewContentLoaded', function(params) {
        console.log('$viewContentLoaded received');

        $rootScope.viewContentLoading = false;

        // wait next digest cycle to run following code
        $timeout(function() {
                
            if( $location.hash().length) {
                var elem = angular.element(document.querySelector( '#'+$location.hash() ))
                console.log(elem);
                //$anchorScroll(elem);

                // todo : wrong offset
                console.log(elem[0].offsetTop);
                $window.scrollTo(0, elem[0].offsetTop-55);
            }
            else {
                // scroll to top
                $window.scrollTo(0, 0);
            }
    /*            
                $anchorScroll.yOffset = angular.element(document.querySelector( '.topbar' ));
                $anchorScroll('.topbar');
                
                $window.scrollTo(0, 0);
                // $window.scrollTo(0, angular.element('put here your element').offsetTop); 
        */        
                

            if($rootScope.user_id == 0
            && $rootScope.previousPath.substring(0, signPath.length) == signPath
            && $rootScope.currentPath.substring(0, signPath.length) != signPath ) {
                // user jumped off login process
                // disgard pending action
                console.log('pending action disgarded');
                $rootScope.pendingAction = null;
            }
            // At this point view has been loaded and controller is ready
            // process pending action, if any                    
            if($rootScope.pendingAction
            && $rootScope.currentPath.substring(0, signPath.length) != signPath) {
                console.log('continuing ation');
                console.log($rootScope.pendingAction);
                $rootScope.pendingAction.scope = params.targetScope;
                $actions.perform($rootScope.pendingAction);
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
    $authentication.setCredentials(username, password);
    // try to authenticate or restore the session
    $authentication.authenticate();



    
    // load translations            

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

.controller('searchController', function($scope, $http, $httpParamSerializer) {
    console.log('search controller');

    var ctrl = this;

    // @data model
    $scope.questions = {};
    
    // @init
    (function () {
        // request possible actions with their related required reputations
        $http.get( 'index.php?get=resiway_privileges&'+$httpParamSerializer({'domain[0][]': ['object_class', '=', 'resiexchange\\Question']}) )
        .success(function() {
        })
        .error(function() {
        });
        
    
        $http.get('index.php?get=resiexchange_questions')
        .success(function(data, status, headers, config) {
            // data should be an object 
            if(typeof data != 'object' || typeof data.result != 'object') throw new Error('Something went wrong while retrieving questions.');
            $scope.questions = data.result;
        })
        .error(function(data, status, headers, config) {
        });
    })();

})

/**
 * Question controller
 *
 */
.controller('questionController', function(question, feedback, $scope, $window, $location, $sce, $uibModal, $actions, $timeout, textAngularManager) {
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
        var selector = feedback.selector($event.target);
        $actions.perform({
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
                    feedback.popover(selector, msg);
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
                        feedback.popover('#comment-'+comment_id, '');
                    });
                }
            }        
        });
    };

    $scope.questionFlag = function ($event) {
        var selector = feedback.selector($event.target);           
        $actions.perform({
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
                    feedback.popover(selector, msg);                    
                }                
                else {
                    $scope.question.history['resiexchange_question_flag'] = data.result;
                }
            }        
        });
    };

    $scope.questionAnswer = function($event) {
        var selector = feedback.selector($event.target);                   
        $actions.perform({
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
                    feedback.popover(selector, msg);
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
                        feedback.popover('#answer-'+answer_id, '');
                    });                    
                }
            }        
        });
    };  
    
    $scope.questionVoteUp = function ($event) {
        var selector = feedback.selector($event.target);
        $actions.perform({
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
                    
                    feedback.popover(selector, msg);

                }
            }        
        });
    };
    
    $scope.questionVoteDown = function ($event) {
        var selector = feedback.selector($event.target);
        $actions.perform({
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
                    feedback.popover(selector, msg);                    
                }
            }        
        });
    };    

    $scope.questionStar = function ($event) {
        var selector = feedback.selector($event.target);
        $actions.perform({
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
                    feedback.popover(selector, msg);                    
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
        var selector = feedback.selector($event.target);    
        $actions.perform({
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
                    feedback.popover(selector, msg);                    
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
                var selector = feedback.selector($event.target);                  
                $actions.perform({
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
                            feedback.popover(selector, msg);
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
        var selector = feedback.selector($event.target);           
        $actions.perform({
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
                    feedback.popover(selector, msg);
                }
            }        
        });
    };
    
    $scope.answerVoteDown = function ($event, index) {
        var selector = feedback.selector($event.target);        
        $actions.perform({
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
                    feedback.popover(selector, msg);
                }
            }        
        });
    };      
    
    $scope.answerFlag = function ($event, index) {
        var selector = feedback.selector($event.target);           
        $actions.perform({
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
                    feedback.popover(selector, msg);                    
                }                
                else {
                    $scope.question.answers[index].history['resiexchange_answer_flag'] = data.result;
                }
            }        
        });
    };
    
    $scope.answerComment = function($event, index) {
        var selector = feedback.selector($event.target);
        $actions.perform({
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
                    feedback.popover(selector, msg);
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
                        feedback.popover('#comment-'+answer_id+'-'+comment_id, '');
                    });
                }
            }        
        });
    };    
        
    $scope.answerCommentVoteUp = function ($event, answer_index, index) {
        var selector = feedback.selector($event.target);           
        $actions.perform({
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
                    feedback.popover(selector, msg);                    
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
        var selector = feedback.selector($event.target);           
        $actions.perform({
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
                    feedback.popover(selector, msg);                    
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
                var selector = feedback.selector($event.target);                  
                $actions.perform({
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
                            feedback.popover(selector, msg);
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


.controller('editAnswerController', function(answer, feedback, $scope, $window, $location, $sce, $actions, textAngularManager) {
    console.log('editAnswer controller');
    
    var ctrl = this;   
  
    // @model
    $scope.answer = answer;
    
    // @methods
    $scope.answerPost = function($event) {
        var selector = feedback.selector($event.target);
        $actions.perform({
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
                    feedback.popover(selector, msg);
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
.controller('editQuestionController', function(question, categories, feedback, $scope, $window, $location, $sce, $actions, textAngularManager) {
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
        var selector = feedback.selector(angular.element($event.target));                   
        $actions.perform({
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
                    feedback.popover(selector, msg);
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
.controller('userController', function() {
    console.log('user controller');    
})

/**
* 
* Once successfully identified, this controller will redirect to previously stored location, if any
*/
.controller('signController', function($scope, $rootScope, $authentication, $location, $routeParams) {
    
    /*
    this controller displays a form for collecting user credentials
    if global var return
    */
    console.log('sign controller');
    var ctrl = this;
    
    // set default mode to 'sign in'
    ctrl.mode = 'in'; 
    
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
    $scope.signAlerts = [];
    $scope.recoverAlerts = [];
    // alerts format : { type: 'danger|warning|success', msg: 'Alert message.' }
    
    
    ctrl.closeSignAlert = function(index) {
        $scope.signAlerts.splice(index, 1);
    };

    
    ctrl.closeRecoverAlert = function(index) {
        $scope.recoverAlerts.splice(index, 1);
    };
        
    ctrl.signIn = function () {       
        if($scope.username.length == 0 || $scope.password.length == 0) {
            if($scope.username.length == 0) {
                $scope.signAlerts.push({ type: 'warning', msg: 'Please, provide your email as identifier.' });                
            }
            if($scope.password.length == 0) {
                $scope.signAlerts.push({ type: 'warning', msg: 'Please, provide your password.' });                
            }
        }
        else {
            // form is complete
            $authentication.setCredentials($scope.username, hex_md5($scope.password), $scope.remember);

            // attempt to log the user in
            $authentication.authenticate().then(
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
                $authentication.clearCredentials();
                $scope.signAlerts = [{ type: 'danger', msg: 'Email or password mismatch.' }];
            });        
        }
    };
    
    ctrl.signUp = function() {
        if($scope.username.length == 0 || $scope.firstname.length == 0) {
            if($scope.username.length == 0) {
                $scope.signAlerts.push({ type: 'warning', msg: 'Please, provide your email as username.' });                
            }
            if($scope.firstname.length == 0) {
                $scope.signAlerts.push({ type: 'warning', msg: 'Please, indicate your firstname.' });                
            }
        }
        else {
            /*
            register
            .then(
            function successHandler(data) {
                // if some action is pending, return to URL where it occured
                if($rootScope.pendingAction
                && typeof $rootScope.pendingAction.next_path != 'undefined') {
                   $location.path($rootScope.pendingAction.next_path);
                }
                else {
                    $location.path('/');
                }
            },
            function errorHandler(data) {
                // server fault, email already registered, ...
                $scope.signAlerts = [{ type: 'danger', msg: 'Email or password mismatch.' }];
            });             
            */
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
                            $actions,
                            $authentication) {
        console.log('topbar controller');
        
        // @model
        $rootScope.showPlatformDropdown = false;
        $rootScope.showUserDropdown = false;

        
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
            $rootScope.showPlatformDropdown = !$rootScope.showPlatformDropdown;
        };
        
        $scope.toggleUserDropdown = function() {
            $rootScope.showUserDropdown = !$rootScope.showUserDropdown;
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
            $actions.perform({
                action: 'resiway_user_logout',
                next_path: '/',
                callback: function($scope, data) {
                    $authentication.clearCredentials();
                    $rootScope.showUserDropdown = false;
                }
            });
        };
    }
)
.controller('QuestionsListTabsCtrl', function ($scope, $timeout, $window) {

  $scope.updateSelection = function() {
    $timeout(function() {
      
    });
  };
})
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