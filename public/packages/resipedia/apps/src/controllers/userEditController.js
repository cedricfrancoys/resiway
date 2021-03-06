angular.module('resipedia')
/**
* Display given user public profile for edition
*
*/
.controller('userEditController', [
    'user',
    '$scope',
    '$window',
    '$filter',
    '$http',
    '$translate',
    'feedbackService',
    'actionService',
    'hello',
    function(user, $scope, $window, $filter, $http, $translate, feedback, action, hello) {
    console.log('userEdit controller');    
    
    var ctrl = this;

    ctrl.user = user;
console.log(ctrl.user);
// todo : check against current user
// if user has no right : redirect to userView page
// + we need to ensure user is identified prior to access
    
    if(Object.keys(user).length == 0) {
        console.log('empty object');
        return;
    }
    ctrl.publicity_mode = {id: 1, text: 'Fullname'};

    ctrl.delays = [
        {delay: 0,  label: 'notification immédiate'},
        {delay: 1,  label: 'un jour (max 1 email par jour)'},
        {delay: 7,  label: 'une semaine (max 1 email par semaine)'},
        {delay: 30, label: 'un mois (max 1 email par mois)'}
    ];
    
    ctrl.modes = [ 
        {id: 1, text: 'Fullname'}, 
        {id: 2, text: 'Firstname + Lastname inital'}, 
        {id: 3, text: 'Firstname only'}
    ];
    
    // translate labels
    $translate(['USER_EDIT_PUBLICITY_MODE_FULLNAME','USER_EDIT_PUBLICITY_MODE_FIRSTNAME_L','USER_EDIT_PUBLICITY_MODE_FIRSTNAME'])
    .then(function (translations) {
        ctrl.modes[0].text = translations['USER_EDIT_PUBLICITY_MODE_FULLNAME'];
        ctrl.modes[1].text = translations['USER_EDIT_PUBLICITY_MODE_FIRSTNAME_L'];
        ctrl.modes[2].text = translations['USER_EDIT_PUBLICITY_MODE_FIRSTNAME'];        
    })
    .then(function() {
        angular.forEach(ctrl.modes, function(mode) {
            if(mode.id == ctrl.user.publicity_mode) {
                ctrl.publicity_mode = {id: mode.id, text: mode.text};                
            }
        });        
    });
    
    ctrl.avatars = {};
    
    if(typeof ctrl.user.login != 'undefined') {
        ctrl.avatars = {
            libravatar: 'https://seccdn.libravatar.org/avatar/'+md5(ctrl.user.login)+'?s=@size',
            gravatar: 'https://www.gravatar.com/avatar/'+md5(ctrl.user.login)+'?s=@size',
            identicon: 'https://www.gravatar.com/avatar/'+md5(ctrl.user.firstname+ctrl.user.id)+'?d=identicon&s=@size'
        };
        
        var online = function(session) {
            var currentTime = (new Date()).getTime() / 1000;
            return session && session.access_token && session.expires > currentTime;
        };

        var facebook = hello('facebook');
        var google = hello('google');

        if(online(facebook.getAuthResponse())) {
            facebook.api('me').then(function(json) {
                $scope.$apply(function() {
                    ctrl.avatars.facebook = json.thumbnail;
                });
            });
        }
        if(online(google.getAuthResponse())) {
            google.api('me').then(function(json) {
                $scope.$apply(function() {
                    var avatar_url = json.thumbnail;
                    ctrl.avatars.google = avatar_url.replace(/\?sz=.*/, "?sz=@size");
                });
            });            
        }
            
        // @init
        /*
        // retrieve GMail avatar, if any
        $http.get('https://picasaweb.google.com/data/entry/api/user/'+ctrl.user.login+'?alt=json')
        .then(
            function successCallback(response) {
                var url = response.data['entry']['gphoto$thumbnail']['$t'];
                ctrl.avatars.google = url.replace("/s64-c/", "/")+'?sz=@size';
            },
            function errorCallback(response) {

            }
        );
        */        
    }
    
    $scope.$watchGroup([
            function(){return ctrl.publicity_mode;},
            function(){return ctrl.user.firstname;},
            function(){return ctrl.user.lastname;}
        ], function() {
        ctrl.user.publicity_mode = ctrl.publicity_mode.id;
        switch(ctrl.user.publicity_mode) {
        case 1:
            ctrl.user.display_name = ctrl.user.firstname+' '+ctrl.user.lastname;
            break;
        case 2:
            var lastname = '';
            if(ctrl.user.lastname.length) {
                lastname = ctrl.user.lastname.substr(0, 1)+'.';
            }
            ctrl.user.display_name = ctrl.user.firstname+' '+lastname;
            break;
        case 3:
            ctrl.user.display_name = ctrl.user.firstname;
            break;
        }                
    });  
    
    ctrl.userPost = function($event) {
        ctrl.running = true;        
        var selector = feedback.selector(angular.element($event.target));                   
        action.perform({
            // valid name of the action to perform server-side
            action: 'resiway_user_edit',
            // string representing the data to submit to action handler (i.e.: serialized value of a form)
            data: {
                id: ctrl.user.id,
                firstname: ctrl.user.firstname,
                lastname: ctrl.user.lastname,
                publicity_mode: ctrl.user.publicity_mode,
                language: ctrl.user.language,
                country: ctrl.user.country,
                location: ctrl.user.location,
                about: ctrl.user.about,
                avatar_url: ctrl.user.avatar_url,
                notify_reputation_update: ctrl.user.notify_reputation_update,
                notify_badge_awarded: ctrl.user.notify_badge_awarded,
                notify_question_comment: ctrl.user.notify_question_comment,
                notify_answer_comment: ctrl.user.notify_answer_comment,
                notify_question_answer: ctrl.user.notify_question_answer,
                notify_updates: ctrl.user.notify_updates,
                notice_delay: ctrl.user.notice_delay            
            },
            // scope in wich callback function will apply 
            scope: $scope,
            // callback function to run after action completion (to handle error cases, ...)
            callback: function($scope, data) {
                ctrl.running = false;                
                // we need to do it this way because current controller might be destroyed in the meantime
                // (if route is changed to signin form)
                if(typeof data.result != 'object') {
                    // result is an error code
                    var error_id = data.error_message_ids[0];                    
                    // todo : get error_id translation
                    var msg = error_id;
                    feedback.popover(selector, msg);
                }
                else {
                    // scroll to top
                    $window.scrollTo(0, 0);
                    $scope.showMessage = true;
                }
            }        
        });
    };  
}]);