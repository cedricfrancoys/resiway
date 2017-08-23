angular.module('resiexchange')

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
    
    $scope.recent_activity = {
        actions: [
                    {
                        created: '2017-01-01 00:00:00',
                        name: 'resiway_user_signup',
                        object_class: 'resiway\\User',
                        object_id: 411,
                        object: {
                            id: 411,
                            created: '2017-01-01 00:00:00',
                            display_name: 'Laurent M.',
                            country: 'FR',
                            location: 'Paris', 
                            about: 'Lorem ipsum sympathisant écolo de la première heure loret sit amet ec nerum loriposet quid negatur est',
                            avatar_url: 'https://www.gravatar.com/avatar/5192e7cbcf2f72a847d6fb0d1552f049?s=@size'
                        },
                        user: {
                            id: 3,
                            display_name: 'Julie M.',
                            name_url: 'julie-m',
                            avatar_url: 'https://www.gravatar.com/avatar/5192e7cbcf2f72a847d6fb0d1552f049?s=@size'
                        }
                    },        
                    {
                        created: '2017-01-01 00:00:00',
                        name: 'resiexchange_question_post',
                        object_class: 'resiexchange\\Question',
                        object_id: 10,
                        object: {
                            id: 10,
                            created: '2017-01-01 00:00:00',
                            creator: {
                                id: 3,
                                display_name: 'Julie M.',
                                name_url: 'julie-m'
                            },
                            title: 'C\'est pour quoi faire ?',
                            title_url: 'c-est-pour-quoi-faire',
                            categories_ids: [1, 2, 3],
                            'categories_ids.name': ['test1', 'test2', 'test3']
                        },
                        user_id: 3,
                        user: {
                            id: 3,
                            display_name: 'Julie M.',
                            name_url: 'julie-m',
                            avatar_url: 'https://www.gravatar.com/avatar/5192e7cbcf2f72a847d6fb0d1552f049?s=@size'
                        }
                    },
                    {
                        created: '2017-01-01 00:00:00',                        
                        name: 'resilib_document_post',
                        object_class: 'resilib\\Document',
                        object_id: 10,
                        object: {
                            id: 10,
                            created: '2017-01-01 00:00:00',
                            creator: {
                                id: 3,
                                display_name: 'Julie M.',
                                name_url: 'julie-m'
                            },
                            title: 'Tout sur tout',
                            title_url: 'tout-sur-tout',
                            categories_ids: [1, 2, 3],
                            'categories_ids.name': ['test1', 'test2', 'test3']
                        },
                        user_id: 3,
                        user: {
                            id: 3,
                            display_name: 'Julie M.',
                            name_url: 'julie-m',
                            avatar_url: 'https://www.gravatar.com/avatar/5192e7cbcf2f72a847d6fb0d1552f049?s=@size'
                        }
                        
                    },                    
                    {
                        created: '2017-01-01 00:00:00',                        
                        name: 'resiexchange_question_answer',
                        object_class: 'resiexchange\\Answer',
                        object_id: 411,
                        object: {
                            id: 411,
                            created: '2017-01-01 00:00:00',
                            creator : {
                                id: 4,
                                display_name: 'Jacques',
                                name_url: 'jacques'
                            },
                            question_id: 13,
                            question: {                                
                                id: 13,
                                created: '2017-01-01 00:00:00',
                                creator: {
                                    id: 4,
                                    display_name: 'Michel P.',
                                    name_url: 'michel-p'                                    
                                },                                    
                                title: 'Pourquoi pas ?',
                                title_url: ''
                            }
                        },
                        user_id: 3,
                        user: {
                            id: 3,
                            display_name: 'Julie M.',
                            name_url: 'julie-m',
                            avatar_url: 'https://www.gravatar.com/avatar/5192e7cbcf2f72a847d6fb0d1552f049?s=@size'
                        }
                    },
                    {
                        created: '2017-01-01 00:00:00',                        
                        name: 'resiexchange_answer_comment',
                        object_class: 'resiexchange\\AnswerComment',
                        object_id: 411,
                        object: {
                            id: 411,
                            created: '2017-01-01 00:00:00',
                            creator : {
                                id: 4,
                                display_name: 'Jacques',
                                name_url: 'jacques'
                            },
                            answer_id: 13,
                            answer: {
                                id: 13,
                                created: '2017-01-01 00:00:00',
                                creator: {
                                    id: 4,
                                    display_name: 'Michel P.',
                                    name_url: 'michel-p'                                    
                                },
                                question_id: 13,
                                'question_id.creator': {
                                        id: 5,
                                        display_name: 'Stéhane J.',
                                        name_url: 'stephane-j'
                                },
                                'question_id.title': 'Pourquoi pas ?'
                            }
                        },
                        user_id: 3,
                        user: {
                            id: 3,
                            display_name: 'Julie M.',
                            name_url: 'julie-m',
                            avatar_url: 'https://www.gravatar.com/avatar/5192e7cbcf2f72a847d6fb0d1552f049?s=@size'
                        }
                    }                      
                    
        ]
    };

    $http.get('index.php?get=resiway_actionlog_recent')
    .then(
    function successCallback(response) {
        var data = response.data;
        if(typeof response.data.result == 'object') {
            $scope.recent_activity.actions = response.data.result;
        }
    },
    function errorCallback() {
        // something went wrong server-side
    });

    
    $http.get('index.php?get=resiway_stats')
    .then(
    function successCallback(response) {
        var data = response.data;
        if(typeof response.data.result == 'object') {
            ctrl.count_questions = parseInt(data.result['resiexchange.count_questions']);
            ctrl.count_answers = parseInt(data.result['resiexchange.count_answers']);
            ctrl.count_comments = parseInt(data.result['resiexchange.count_comments']);
            ctrl.count_documents = data.result['resilib.count_documents'];                                    
            ctrl.count_posts = ctrl.count_questions + ctrl.count_answers + ctrl.count_comments;
            ctrl.count_users = data.result['resiway.count_users'];            
        }
    },
    function errorCallback() {
        // something went wrong server-side
    }); 

    
    $http.get('index.php?get=resiexchange_question_list&order=modified&limit=15&sort=desc')
    .then(
    function successCallback(response) {
        var data = response.data;
        if(typeof response.data.result == 'object') {
            ctrl.active_questions = response.data.result;
        }
    },
    function errorCallback() {
        // something went wrong server-side
    });
    
    $http.get('index.php?get=resiexchange_question_list&order=count_answers&limit=15&sort=asc')
    .then(
    function successCallback(response) {
        var data = response.data;
        if(typeof response.data.result == 'object') {
            ctrl.poor_questions = response.data.result;
        }
    },
    function errorCallback() {
        // something went wrong server-side
    });

    $http.get('index.php?get=resilib_document_list&order=count_stars&limit=10&sort=desc')
    .then(
    function successCallback(response) {
        var data = response.data;
        if(typeof response.data.result == 'object') {
            ctrl.last_documents = response.data.result;
        }
    },
    function errorCallback() {
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