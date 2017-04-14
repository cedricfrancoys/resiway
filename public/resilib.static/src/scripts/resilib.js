'use strict';

var resilib = angular.module('resilib', [
    'ngRoute', 
    'ngCookies', 
    'ngToast',     
    'ngAnimate',
    'pascalprecht.translate',
    'ui.bootstrap'
])
.directive('categoryTree', function($timeout) {
    return {
        restrict: 'A',
        link: function($scope, element, attrs) {
            console.log('category-tree directive');
            $scope.$on('categoriesReady', function(event) {
                console.log('categoriesReady event received');
                // wait for rendering to complete
                $timeout(function() {
                    console.log('enriching categrories tree');
                    element.menu().show();
                }, 0);
            });
        }
    };
})
.directive('searchTabs', function($timeout) {
    return {
        restrict: 'A',
        link: function($scope, element, attrs) {
            console.log('search-tabs directive');
            // wait for rendering to complete
            $timeout(function() {
                element.tabs();
            }, 0);

        }
    };
})
.directive('chosenSelect', function($timeout) {
    return {
        // apply to all elements having class chosen-select
        restrict: 'C',
        link: function($scope, element, attrs) {
            console.log('chosen-select directive');
            $scope.$on('categoriesReady', function(event) {
                console.log('categoriesReady event triggered');
                // wait for rendering to complete
                $timeout(function() {                
                    element
                    .chosen({'width':'200px', 'search_contains':true, 'allow_single_deselect':true})
                    .parent().find('.chosen-drop').css({'width':element.attr('drop-width')});
                });
            });
        }
    };
})
.directive('simpleTabs', function($timeout) {
    return {
        // apply to all elements having class chosen-select
        restrict: 'C',
        link: function($scope, element, attrs) {
            console.log('simple-tabs directive');
            // wait for rendering to complete
            $timeout(function() {                
                var tab_id= '#page-1';
                element.find('ul.simpleTabsNavigation').find('li')                
                .on('click', function() {
                    $(this).parent().find('li.current').removeClass('current');	
                    $(this).addClass('current');
                    $(tab_id).hide();
                    tab_id = $(this).find('a').attr('href');
                    $(tab_id).show();
                    return false;
                });
            });
        }
    };
})
.directive('hoverZoom', function($timeout) {
    return {
        restrict: 'C',
        link: function($scope, element, attrs) {
            console.log('hoverzoom directive');
            // wait for rendering to complete
            $timeout(function() {
                // make images animated on mouse over
                element
                .hover(
                    function() { element.css('zIndex', 200).addClass('transition');     }, 
                    function() { element.css('zIndex', 100).removeClass('transition');  }
                );                 
            });                
        }
    };
})
.directive('ngSticky', function($timeout) {
    return {
        restrict: 'A',
        link: function($scope, element, attrs) {
            // wait for rendering to complete
            $scope.$on('domReady', function(event) {             
                var tabs_abs_top = element.offset().top - parseFloat(element.css('marginTop').replace(/auto/, 0));
                var tabs_rel_top = element.position().top;		
                $(window).scroll(function (event) {
                    if (($(this).scrollTop()+tabs_rel_top) >= tabs_abs_top)
                        element.addClass('fixed').css('top', tabs_rel_top+'px');
                    else
                        element.removeClass('fixed').css('top', tabs_rel_top+'px');
                }); 
            });                
        }
    };
})
.service('$dataProvider', [
    '$http',
    function($http) {
        // use a deferred object as buffer for the service
        var categoriesDeferred = {'fr': null, 'es': null, 'en': null};
        
        this.getCategories = function(lang) {
            if(!categoriesDeferred[lang]) {
                categoriesDeferred[lang] = $.Deferred();
                console.log('requesting categories for language '+lang);
                $.ajax({
                    type: 'GET',
                    url: 'resilib.static/data/categories.php?recurse=1&lang='+lang,
                    dataType: 'json',
                    contentType: 'application/json; charset=utf-8',
                })
                .done(function (data) {
                    categoriesDeferred[lang].resolve(data);
                });
            }
            return categoriesDeferred[lang].promise();
        };
        
        this.getDocuments = function(criteria, recurse) {
            if(typeof recurse == 'undefined') recurse = true;
            return $http.get('resilib.static/data/documents.php?'+criteria+'&recurse='+recurse);
        };
        
    }    
])
.controller('mainCtrl', [
    // dependencies
    '$scope',
    '$rootScope',
    '$http',
    '$timeout',
    '$dataProvider',
    '$location',
    // declarations
    function($scope, $rootScope, $http, $timeout, $dataProvider, $location) {
        console.log('mainCtrl controller init');
        $rootScope.config = {
            application: global_config.application
        };
   
        //model definition
        $scope.domReady = false;
        $scope.selectedDocument = false;        
        $scope.documents = {};
        $scope.categories = {};
        $scope.pagingOptions = {
            currentPage: 1,
            resultsPerPage: 10,
            totalPages: 1,
            totalRecords: 1,
            criteria: {}
        };

        
        // explicit names of the documents languages (might differ from languages supported by the UI)
        $scope.languages = {
            'en': 'English',
            'fr': 'Français',
            'es': 'Español'
        };
        
        // info for quicksearch logos and related categories
        $scope.quickSearchItems = {
            'composting':               { category: 'food/composting', picture: 'resilib.static/src/img/compost.png'},                        
            'self-build':               { category: 'home/self-build', picture: 'resilib.static/src/img/construction_habitation.png'},            
            'compressed-earth-blocks':  { category: 'home/green-building/earth/compressed-earth-blocks', picture: 'resilib.static/src/img/construction_presse_a_briques.png'},
            'water-treatment':          { category: 'water/drinkable-water/treatment', picture: 'resilib.static/src/img/eau_filtre.png'},                
            'water-pumps':              { category: 'water/water-pumps', picture: 'resilib.static/src/img/eau_pompe_manuelle.png'},
            'lighting':                 { category: 'energy/lighting', picture: 'resilib.static/src/img/elec_eclairage.png'},
            'aerogenerator':            { category: 'energy/electricity/generators/aerogenerator', picture: 'resilib.static/src/img/elec_eolien.png'},
            'hydrogenerators':          { category: 'energy/electricity/generators/hydrogenerators', picture: 'resilib.static/src/img/elec_hydraulique.png'},
            'photovoltaic-panels':      { category: 'energy/electricity/generators/photovoltaic-panels', picture: 'resilib.static/src/img/elec_solaire.png'},
            'bread-ovens':              { category: 'energy/thermal-energy/ovens/bread-ovens', picture: 'resilib.static/src/img/nourriture_pain.png'},
            'solar-heaters':            { category: 'energy/thermal-energy/heating/solar', picture: 'resilib.static/src/img/therm_solaire.png'}
        };

        
        // @init
        $scope.init = true;
        $scope.ui = {};
        $scope.ui.lang;
        
        $scope.$watch('ui.lang', function() {
            $scope.ui.i18n = i18n[$scope.ui.lang];
            // request categories for building UI widgets
            $dataProvider.getCategories($scope.ui.lang)
            .done(function (categories) {
                if($scope.init) {
                    $scope.init = false;
                    // force watching for some actions
                    $scope.$apply(function() {
                        // update model
                        $scope.categories = categories;
                        $scope.categories.flat = $scope.getFlatCategories();
                        $scope.$broadcast('categoriesReady');
                        // wait for rendering to complete
                        $timeout(function() {    
                            $scope.domReady = true;
                            angular.element('#root').show();
                            $scope.$broadcast('domReady');
                        });
                        
                    });
                }
                else {
                    // update model
                    $scope.categories = categories;
                    $scope.categories.flat = $scope.getFlatCategories();
                    $scope.$broadcast('categoriesReady');
                }
            });            
        });       

        // set to default language 
        $scope.ui.lang = 'fr';
        $scope.ui.i18n = i18n[$scope.ui.lang];


// Supported URL syntax are:
// http://localhost/resilib/# (all docs)
// http://localhost/resilib/?category=water
// http://localhost/resilib/#ACF-Action-contre-la-faim_Assemblage-de-filtre-a-sable-pour-le-traitement-de-leau-a-domicile_2008_fr

        // request content for initial display 
        var documents_query, recurse = false;
        
        if(angular.isUndefined($location.search().category)) {
            // if hash is specified with no arg, display all docs
            if (location.href.indexOf("#") != -1) {
                documents_query = "limit=10";
                recurse = true;
            }
            // otherwise default is root category
            else {
                documents_query = "categories=''";
            }
        }
        else {
            documents_query = "categories="+$location.search().category;
            recurse = true;
        }
        // if hash is specified, limit initial display to the document matching the given hash as identifier
        if($location.hash().length) {
            documents_query = "id="+$location.hash();
        }
        $dataProvider.getDocuments(documents_query, recurse)
        .then(function (response) {
            $scope.documents = response.data.result;
            $scope.pagingOptions.totalRecords = response.data.total;                
            $scope.pagingOptions.totalPages = Math.ceil($scope.pagingOptions.totalRecords / $scope.pagingOptions.resultsPerPage);
        });

        
        // methods definitions
        
        /*
        * @public
        */        
        $scope.keys = function (item) { return Object.keys(item); };
        
        /*
        * @public
        */        
        $scope.min = function (a, b) { return Math.min(a, b); };
        
        /*
        * @public
        */
        $scope.getFlatCategories = function () {
            var build_flat;
            return (build_flat = function (parent, categories) {
                var result = {};
                $.each(categories, function(category_id, category) {
                    result[category_id] = {title: ((parent.length)?parent+'/':'')+category.title};
                    if(typeof category.categories != 'undefined') $.extend(result, build_flat(result[category_id].title, category.categories));
                });
                return result;
            })('', $scope.categories);
        };
        
        
        /*
        * @public
        */
        $scope.pageToFirst = function() {
            $scope.pagingOptions.currentPage = 1;
            $scope.searchDocuments($scope.pagingOptions.currentCriteria);
        };
        
        /*
        * @public
        */
        $scope.pageBackward = function() {
            --$scope.pagingOptions.currentPage;
            $scope.searchDocuments($scope.pagingOptions.currentCriteria);
        };
        
        /*
        * @public
        */
        $scope.pageForward = function() {
            ++$scope.pagingOptions.currentPage;
            $scope.searchDocuments($scope.pagingOptions.currentCriteria);
        };       
        
        /*
        * @public
        */
        $scope.pageToLast = function() {
            $scope.pagingOptions.currentPage = $scope.pagingOptions.totalPages;
            $scope.searchDocuments($scope.pagingOptions.currentCriteria);
        };
        
        /*
        * @public
        */
        $scope.cantPageBackward = function() { return ($scope.pagingOptions.currentPage <= 1); };
        
        /*
        * @public
        */        
        $scope.cantPageForward = function() { return ($scope.pagingOptions.currentPage >= $scope.pagingOptions.totalPages); };        
        
        /*
        * @public
        */        
        $scope.displayDetails = function(document_id) {
            $scope.selectedDocument = $scope.documents[document_id];
            $scope.selectedDocument.id = document_id;
            angular.element('#details_dialog')
            .dialog({
                autoOpen: true,
                modal: true,
                width: 700,
                height: 'auto',
                position: {
                    my: "center top",
                    at: "center top+15%",
                    of: window
                },
                buttons:[ 
                            {
                                text: $scope.ui.i18n['details-close'],
                                click: function() { $scope.selectedDocument = false; $(this).dialog('close'); }
                            }
                        ]
            });
        };

        /*
        * @public
        */
        $scope.updateResult = function (criteria) {
            // if no criteria is given, use form data
            if(typeof criteria == 'undefined') {
                criteria = {};
                $.each($('#search_form').serializeArray(), function(i, elem) {
                    criteria[elem.name] = elem.value;
                });
            }
            // remember current criteria
            $scope.pagingOptions.criteria = criteria;
            $scope.pagingOptions.currentPage = 1;
            $scope.searchDocuments();
        };
        
        /*
        * @private
        */
        $scope.searchDocuments = function () {
            $('#menu').menu('collapseAll', {}, true);
            $('#result').hide();
            $('#loader').show();
                        
            console.log('search documents');

            $dataProvider.getDocuments($.param($.extend({}, $scope.pagingOptions.criteria, { ui: $scope.ui.lang, start: ($scope.pagingOptions.currentPage-1)*$scope.pagingOptions.resultsPerPage, limit: $scope.pagingOptions.resultsPerPage })))
            .then(function (response) {
                $scope.documents = response.data.result;
                $scope.pagingOptions.totalRecords = response.data.total;                
                $scope.pagingOptions.totalPages = Math.ceil($scope.pagingOptions.totalRecords / $scope.pagingOptions.resultsPerPage);
                
                $('#loader').hide();
                $('#result').show();
            });
        };
        
    }
])
.config(function ($locationProvider) {
    // enable HTML5mode to disable hashbang urls
    $locationProvider.html5Mode({enabled: true, requireBase: false, rewriteLinks: false}).hashPrefix('!');
})

.run( [
    '$rootScope',
    '$cookies',
    'authenticationService',
    function($rootScope, $cookies, authenticationService) {
        console.log('run method invoked');
        $rootScope.user = {id: 0};
        
        /*
        * auto-restore session or auto-login with cookie values    
        */
        authenticationService.setCredentials($cookies.get('username'), $cookies.get('password'));
        // try to authenticate or restore the session
        authenticationService.authenticate();
    }
])

.controller('rootController', [
    '$rootScope', 
    '$scope',
    function($rootScope, $scope) {
        console.log('root controller');

        var rootCtrl = this;
        
        rootCtrl.avatarURL = function(url, size) {
            var str = new String(url);
            return str.replace("@size", size);
        };
    }
])

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
                        $auth.last_auth_time = new Date().getTime();
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

        /*
        * Checks if current user is authenticated and, if not, tries to login
        * This method tries to recover if a session is already set server-side,
        * otherwise it uses current credentials to log user in and read related data
        *
        * @public
        */
        this.authenticate = function() {
            var deferred = $q.defer();        
            var require_new_auth = true;

            // we cannot trust $rootScope.user.id alone, since session might have expired server-side
            if($rootScope.user.id > 0) {
                var now = new Date().getTime();
                if( (now - $auth.last_auth_time) < $auth.max_auth_delay ) {
                    // we assume that $auth.autenticate is always walled just before sending request to the server
                    // and thereby maintain the session active
                    $auth.last_auth_time = now;
                    require_new_auth = false;
                    deferred.resolve($rootScope.user);
                }
            }
        
            if(require_new_auth) {
                // request user_id (checks if session is set server-side)
                $auth.userId()
                .then(

                    // session is already set
                    function successHandler(user_id) {
                        // we already have user data
                        if($rootScope.user.id > 0) {
                            deferred.resolve($rootScope.user);
                        }
                        // we still need user data
                        else {
                            // retrieve user data
                            $auth.userData(user_id)
                            .then(
                                function successHandler(data) {
                                    $rootScope.user = data;
                                    deferred.resolve(data);
                                },
                                function errorHandler(data) {
                                    // something went wrong server-side
                                    console.log('something went wrong server-side');
                                    deferred.reject(data);
                                }
                            );
                        }
                    },

                    // user is not identified yet (or session has expired server-side)
                    function errorHandler() {
                        // try to sign in with current credentials
                        $auth.signin()
                        .then(
                            function successHandler(user_id) {
                                // retrieve user data
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
                            function errorHandler(data) {
                                // given values were not accepted
                                // or something went wrong server-side
                                deferred.reject(data);
                            }
                        );
                    }
                );
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
                    authentication.clearCredentials();
                }
            });
        };
        
        ctrl.notificationsDismissAll = function() {
            $rootScope.user.notifications = [];            
            $http.get('index.php?do=resiway_notification_dismiss-all');
        };
                
    }
]);