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