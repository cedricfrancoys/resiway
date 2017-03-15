
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

.service('routeQuestionsProvider', ['$http', '$rootScope', '$httpParamSerializerJQLike', function($http, $rootScope, $httpParamSerializerJQLike) {
    this.load = function() {
        return $http.get('index.php?get=resiexchange_question_list&'+$httpParamSerializerJQLike($rootScope.search.criteria))
        .then(
            function successCallback(response) {
                var data = response.data;
                if(typeof data.result != 'object') {
                    $rootScope.search.total = 0;
                    return [];
                }
                $rootScope.search.total = data.total;
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
    '$cookies',
    function($rootScope, $http, $q, $cookies) {
        var $auth = this;
        
        // @init
        $auth.username = '';
        $auth.password = '';
        
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
        */
        this.setCredentials = function (username, password, store) {
            $auth.username = username;
            $auth.password = password;
            // store crendentials in the cookie
            if(store) {
                var now = new Date();
                var exp = new Date(now.getFullYear()+1, now.getMonth(), now.getDate());
                $cookies.put('username', username, {expires: exp});
                $cookies.put('password', password, {expires: exp});
            }             
        };
        
        this.clearCredentials = function () {
            console.log('clearing credentials');
            $auth.username = '';
            $auth.password = '';        
            $rootScope.user = {id: 0};
            $cookies.remove('username');
            $cookies.remove('password'); 
        };    
        

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
                        // $auth.clearCredentials();
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
        popover: function (selector, msg, classname) {            
            // popover has been previously assign
            closePopover();

            // retrieve element
            var elem = angular.element(document.querySelector( selector ));
            
            // save target content and element
            popover.content = msg;
            popover.elem = elem;
            popover.id = 'popover-'+elem.attr('id');
            popover.classname = 'popover-' + (classname || 'danger');

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