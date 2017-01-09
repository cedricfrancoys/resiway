// retrieve resiway module
angular.module('resiway')

.config(function(
                $routeProvider, 
                $routeParamsProvider,
                $httpProvider
                ) {

    var userProvider = function($http, $route) {
        // new question
        if($route.current.params.id == 0 
        || typeof $route.current.params.id == 'undefined') return {};
        return $http.get('index.php?get=resiway_user&id='+$route.current.params.id)
        .then(
            function successCallback(response) {
                var data = response.data;
                if(typeof data.result != 'object') return {};
                return data.result;
            },
            function errorCallback(response) {
                // something went wrong server-side
                return {};
            }
        );
    };
    
    /**
    * Routes definition
    * This call associates handled URL with their related views and controllers
    * 
    * As a convention, a 'ctrl' member is always defined inside a controller as itself
    * so it can be manipulated the same way in view and in controller
    */
    $routeProvider
    .when('/categories', {
        templateUrl : 'categories.html',
        controller  : 'categoriesController as ctrl',
        resolve     : {
            categories: function($http) {
                return $http.get('index.php?get=resiway_categories&order=title')
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
    .when('/category/edit/:id', {
        templateUrl : 'editCategory.html',
        controller  : 'editCategoryController as ctrl',
        resolve     : {
            // request object data
            category: function($http, $route) {
                // new question
                if($route.current.params.id == 0 
                || typeof $route.current.params.id == 'undefined') return {};
                return $http.get('index.php?get=resiway_category&id='+$route.current.params.id)
                .then(
                    function successCallback(response) {
                        var data = response.data;
                        if(typeof data.result != 'object') return {};
                        return data.result;
                    },
                    function errorCallback(response) {
                        // something went wrong server-side
                        return {};
                    }
                );
            },
            // list of categories is required as well for selecting parent category
            categories: function($http) {
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
    .when('/category/:id', {
        templateUrl : 'category.html',
        controller  : 'categoryController as ctrl',
        resolve     : {
            // request object data
            category: function($http, $route) {
                // new question
                if($route.current.params.id == 0 
                || typeof $route.current.params.id == 'undefined') return {};
                return $http.get('index.php?get=resiway_category&id='+$route.current.params.id)
                .then(
                    function successCallback(response) {
                        var data = response.data;
                        if(typeof data.result != 'object') return {};
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
    .when('/questions/:channel?', {
        templateUrl : 'questions.html',
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
/*    
    .when('/user', {
        templateUrl : 'user.html',
        controller  : 'userController as ctrl'
    })
*/
    .when('/user/settings/:id', {
        templateUrl : 'editUser.html',
        controller  : 'editUserController as ctrl',
        resolve     : {
            user: userProvider
        }        
    })
    .when('/user/profile/:id', {
        templateUrl : 'userProfile.html',
        controller  : 'userProfileController as ctrl',
        resolve     : {
            user: userProvider
        }             
    })    
    .when('/user/notifications/:id', {
        templateUrl : 'userNotifications.html',
        controller  : 'userNotificationsController as ctrl'
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
    
    
});