angular.module('resiway')

.controller('badgesController', [
    'badges', 
    '$scope',
    function(badges, $scope) {
        console.log('badges controller');

        var ctrl = this;

        // @data model
        $scope.badges = badges;
    
    }
]);