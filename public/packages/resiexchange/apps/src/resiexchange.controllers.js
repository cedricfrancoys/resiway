angular.module('resiexchange')

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
        $scope.answer = answer;
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
angular.module('resiexchange')

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
angular.module('resiexchange')
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
angular.module('resiexchange')

.controller('badgesController', [
    'categories', 
    '$scope',
    '$http',
    'authenticationService',    
    function(categories, $scope, $http, authenticationService) {
        console.log('badges controller');

        var ctrl = this;


        
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
            function successCallback(response) {
                var data = response.data;
                angular.forEach(data.result, function (badge, i) {
                    $scope.userBadges.push(badge.badge_id);
                });
            });
        });         
  
        
        // @data model
        $scope.userBadges = [];
        $scope.badgeCategories = categories;
        
      
    }
]);
angular.module('resiexchange')

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

        switch($rootScope.config.application) {
        case 'resiexchange':
            ctrl.config.domain = ['count_questions', '>', '0'];
            break;
        case 'resilib':
            ctrl.config.domain = ['count_documents', '>', '0'];            
            break;
        }
        
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
angular.module('resiexchange')

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
angular.module('resiexchange')

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
angular.module('resiexchange')
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
    'feedbackService', 
    'actionService', 
    '$http',
    '$q',
    '$httpParamSerializerJQLike',
    'Upload',
    function(document, $scope, $rootScope, $window, $location, $sce, feedbackService, actionService, $http, $q, $httpParamSerializerJQLike, Upload) {
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
                                name: document.original_filename
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

        // @methods
        $scope.documentPost = function($event) {
            if(typeof $scope.document.last_update !== 'object' || $scope.document.last_update === null) {
                $scope.alerts.push({ type: 'warning', msg: 'Oups, il manque la date de publication du document (en cas de doute, une approximation suffit).' });                
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

                    }, function (resp) {
                        ctrl.running = false;
                        feedbackService.popover(selector, 'network error');
                        console.log('Error status: ' + resp.status);
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
angular.module('resiexchange')

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
angular.module('resiexchange')

.controller('emptyController', [
    '$scope',
    function($scope) {
        console.log('empty controller');

        var ctrl = this;
        
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
                    source_license: $scope.question.newAnswerSource_license,                    
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
angular.module('resiexchange')
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
angular.module('resiexchange')

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
angular.module('resiexchange')

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
angular.module('resiexchange')

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
                ctrl.avatars.facebook = json.thumbnail;
            });
        }
        if(online(google.getAuthResponse())) {
            google.api('me').then(function(json) {
                ctrl.avatars.google = json.thumbnail;
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
                authenticationService.setCredentials($scope.username, md5($scope.password), $scope.remember);
                // attempt to log the user in
                authenticationService.authenticate().then(
                function successHandler(data) {
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
                function errorHandler() {
                    ctrl.running = false;
                    authenticationService.clearCredentials();
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
angular.module('resiexchange')

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
                $http.post('index.php?get=resiway_user_list&order=reputation', {
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