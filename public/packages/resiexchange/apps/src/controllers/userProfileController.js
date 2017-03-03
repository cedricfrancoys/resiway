angular.module('resiexchange')

.controller('userProfileController', [
    'user', 
    '$scope', 
    '$http', 
    function(user, $scope, $http) {
        console.log('userProfile controller');
        
        var ctrl = this;
        
        ctrl.user = user;
        ctrl.actions = -1;    
        ctrl.answers = -1;
        ctrl.favorites = -1;    

        var defaults = {
            total: -1,
            currentPage: 1,
        };
        
        // acknowledge user profile view (so far, user data have been loaded but nothing indicated a profile view)
        $http.get('index.php?do=resiway_user_profileview&id='+user.id);

        ctrl.load = function(config) {
            // reset objects list (triggers loader display)
            config.items = -1;          
            $http.post('index.php?get='+config.provider, {
                domain: config.domain,
                start: (config.currentPage-1)*config.limit,
                limit: config.limit,
                total: config.total
            }).then(
            function successCallback(response) {
                var data = response.data;
                config.items = data.result;
                config.total = data.total;
            },
            function errorCallback() {
                // something went wrong server-side
            });
        };
        
        ctrl.avatar = {
            gravatar: 'http://www.gravatar.com/avatar/'+md5(ctrl.user.login)+'?s=40',
            identicon: 'http://www.gravatar.com/avatar/'+md5(ctrl.user.firstname+ctrl.user.id)+'?s=40',
            google: ''
        };
        
        ctrl.getGoogleURL = function() {
            $http.get('http://picasaweb.google.com/data/entry/api/user/'+ctrl.user.login+'?alt=json')
            .then(
                function successCallback(response) {
                    var url = response.data['entry']['gphoto$thumbnail']['$t'];
                    ctrl.avatar.google = url.replace("/s64-c/", "/")+'?sz=40';
                },
                function errorCallback(response) {

                }
            ); 
        };

        angular.merge(ctrl, {
            updates: {
                items: -1,
                total: -1,
                currentPage: 1,
                limit: 5,
                domain: [[['user_id', '=', ctrl.user.id],['user_increment','<>', 0]],[['author_id', '=', ctrl.user.id],['author_increment','<>', 0]]],
                provider: 'resiway_actionlog_list'
            },
            questions: {
                items: -1,
                total: -1,
                currentPage: 1,
                limit: 5,
                domain: ['creator', '=', ctrl.user.id],
                provider: 'resiexchange_question_list'
            },
            answers: {
                items: -1,
                total: -1,
                currentPage: 1,
                limit: 5,
                domain: ['creator', '=', ctrl.user.id],
                provider: 'resiexchange_answer_list'
            },
            favorites: {
                items: -1,
                total: -1,
                currentPage: 1,
                limit: 5,
                // 'resiexchange_question_star' == action (id=4)
                domain: [['user_id', '=', ctrl.user.id], ['action_id','=','4']],
                provider: 'resiway_actionlog_list'
            },
            actions: {
                items: -1,
                total: -1,
                currentPage: 1,
                limit: 5,
                domain: [['user_id', '=', ctrl.user.id]],
                provider: 'resiway_actionlog_list'
            },        
        });   
    }
]);