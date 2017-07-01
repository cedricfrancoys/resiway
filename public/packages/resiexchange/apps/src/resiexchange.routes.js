angular.module('resiexchange')

.config([
    '$routeProvider', 
    '$routeParamsProvider', 
    '$httpProvider',
    function($routeProvider, $routeParamsProvider, $httpProvider) {
        
        // templates should be pre-loaded (included in main html or dynamically)
        var templatePath = '';
        // var templatePath = 'packages/resiexchange/apps/views/';
        
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
            '/category/:id': '/categorie/:id',
            '/categories': '/categories',
            '/badges': '/badges',
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
            '/user/sign/:mode?': '/participant/sign/:mode?',
            '/user/edit/:id': '/participant/edition/:id',
            '/user/:id/:name?': '/participant/:id/:name?',                        
            '/author/:name': '/auteur/:name',
            '/author/edit/:id': '/auteur/edition/:id',
            '/association/soutenir': '/association/soutenir',
            '/association/contact': '/association/contact',
            '/association/participer': '/association/participer',
            '/association/mentions-legales': '/association/mentions-legales',
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
        * Category related routes
        */
        '/categories': {
                    templateUrl : templatePath+'categories.html',
                    controller  : 'categoriesController as ctrl',
                    resolve     : {
                        categories: ['routeCategoriesProvider', function (provider) {
                            return provider.load();
                        }]
                    }
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
        '/category/:id': {
                    templateUrl : templatePath+'category.html',
                    controller  : 'categoryController as ctrl',
                    resolve     : {
                        category: ['routeCategoryProvider', function (provider) {
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
                        // list of categories is required as well for selecting parent category
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
        '/author/:name': {
                    templateUrl : templatePath+'author.html',
                    controller  : 'authorController as ctrl',
                    resolve     : {
                        author: ['routeAuthorByNameProvider', function (provider) {
                            return provider.load();
                        }]
                    }        
        },
        '/author/edit/:id': {
                    templateUrl : templatePath+'authorEdit.html',
                    controller  : 'authorEditController as ctrl',
                    resolve     : {
                        author: ['routeAuthorProvider', function (provider) {
                            return provider.load();
                        }]
                    }        
        },            
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