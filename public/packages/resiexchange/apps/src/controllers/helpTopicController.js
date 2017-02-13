angular.module('resiway')

.controller('helpTopicController', [
    'topic', 
    'categories',     
    '$scope',
    function(topic, categories, $scope) {
        console.log('helpTopic controller');

        var ctrl = this;

        // @data model
        ctrl.topic = topic;
        ctrl.categories = categories;
    
    }
]);