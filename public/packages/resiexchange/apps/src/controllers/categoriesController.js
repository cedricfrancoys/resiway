angular.module('resiexchange')

.controller('categoriesController', [
    'categories', 
    '$scope',
    function(categories, $scope) {
        console.log('categories controller');

        var ctrl = this;

        // @data model
        $scope.categories = categories;
    
    }
]);