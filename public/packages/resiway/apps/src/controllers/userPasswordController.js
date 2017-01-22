angular.module('resiway')

/**
* 
* 
* 
*/
.controller('userPasswordController', [
    '$scope',
    '$http',
    function($scope, $http) {
        console.log('userPassword controller');
        
        var ctrl = this;

        // @model             
        $scope.password = '';
        $scope.confirm = '';    
        $scope.alerts = [];
        // alerts format : { type: 'danger|warning|success', msg: 'Alert message.' }
        
        ctrl.password_updated = false;   
        ctrl.closeAlerts = function() {
            $scope.alerts = [];
        };
        
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