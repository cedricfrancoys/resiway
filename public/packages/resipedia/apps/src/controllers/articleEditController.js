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