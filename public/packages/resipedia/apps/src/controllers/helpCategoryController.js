angular.module('resipedia')

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