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
    'textAngularManager',
    '$http',
    '$httpParamSerializerJQLike',
    'Upload',
    function(document, $scope, $rootScope, $window, $location, $sce, feedbackService, actionService, textAngularManager, $http, $httpParamSerializerJQLike, Upload) {
        console.log('documentEdit controller');
        
        var ctrl = this;   

        
// todo: if user is not identified : redirect to login screen (to prevent risk of losing filled data)

        // @view
        $scope.alerts = [];
        // alerts format : { type: 'danger|warning|success', msg: 'Alert message.' }
                
        ctrl.closeAlert = function(index) {
            $scope.alerts.splice(index, 1);
        };
        
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
        // description is inside a textarea and do not need sanitize check
        document.description = $sce.valueOf(document.description);
        document.last_update = new Date(document.last_update);
        $scope.document = angular.merge({
                            id: 0,
                            title: '',
                            author: '',
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
        * categories_ids is a many2many field, so as initial setting we mark all ids to be removed
        */
        // save initial categories_ids
        $scope.initial_cats_ids = [];
        angular.forEach($scope.document.categories, function(cat, index) {
            $scope.initial_cats_ids.push('-'+cat.id);
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
                        author: $scope.document.author,                    
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