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