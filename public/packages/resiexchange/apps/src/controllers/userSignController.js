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
        
        // set default mode to blank
        ctrl.mode = ''; 
        
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
                // form is complete
                ctrl.closeSignInAlerts();                
                authenticationService.setCredentials($scope.username, md5($scope.password), $scope.remember);
                // attempt to log the user in
                authenticationService.authenticate().then(
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
                    authenticationService.clearCredentials();
                    $scope.signInAlerts = [{ type: 'danger', msg: 'Email or password mismatch.' }];
                });        
            }
        };
        
        ctrl.signUp = function() {
            if($scope.username.length == 0 || $scope.firstname.length == 0) {
                if($scope.firstname.length == 0) {
                    $scope.signUpAlerts.push({ type: 'warning', msg: 'Please, indicate your firstname.' });                
                }                
                else if($scope.username.length == 0) {
                    $scope.signUpAlerts.push({ type: 'warning', msg: 'Please, provide your email as username.' });                
                }
            }
            else {
                ctrl.closeSignUpAlerts();                
                authenticationService.register($scope.username, $scope.firstname).then(
                function successHandler(data) {
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
                ctrl.closeRecoverAlerts();
                $http.get('index.php?do=resiway_user_passwordrecover&email='+$scope.email)
                .then(
                function successCallback(response) {
                    var data = response.data;
                    if(typeof response.data.result != 'undefined'
                    && response.data.result === true) {
                        ctrl.recovery_sent = data.result;
                    }
                },
                function errorCallback() {
                    // something went wrong server-side
                });                  
            }
        };    
    }
]);