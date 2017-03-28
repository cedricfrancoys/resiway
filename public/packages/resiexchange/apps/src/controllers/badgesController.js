angular.module('resiexchange')

.controller('badgesController', [
    'badges', 
    '$scope',
    function(badges, $scope) {
        console.log('badges controller');

        var ctrl = this;

        // @data model
        $scope.badgeCategories = badges;
        
        
        angular.forEach($scope.badgeCategories, function(category, i) {
            $scope.badgeCategories[i].groups = {};
            angular.forEach(category.badges, function(badge, j) {
                if(typeof $scope.badgeCategories[i].groups[badge.group] == 'undefined') {
                    $scope.badgeCategories[i].groups[badge.group] = [];
                }
                $scope.badgeCategories[i].groups[badge.group].push(badge);                
            });
        });

    }
]);