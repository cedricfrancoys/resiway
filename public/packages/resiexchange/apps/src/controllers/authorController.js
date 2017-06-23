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
        ctrl.author = angular.merge({
                            id: 0,
                            name: '',
                            description: ''
                          }, 
                          author);        
        
    }
]);