angular.module('resiway')

.controller('questionsController', [
    'questions', 
    '$scope',
    function(questions, $scope) {
        console.log('questions controller');

        var ctrl = this;

        // @data model
        ctrl.questions = questions;
    
    }
]);