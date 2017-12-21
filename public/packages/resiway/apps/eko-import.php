<!DOCTYPE html>
<html lang="en">
  <head>
    <title></title>
    <link href="http://netdna.bootstrapcdn.com/bootstrap/3.0.0/css/bootstrap.min.css" rel="stylesheet">
    <script src="http://ajax.googleapis.com/ajax/libs/angularjs/1.2.14/angular.min.js"></script>
    <script src="http://ajax.googleapis.com/ajax/libs/angularjs/1.2.14/angular-route.min.js"></script>
    <script>
		// Define an angular module for our app
		var app = angular.module('app', ['ngRoute']);
		app.config(['$routeProvider', function($routeProvider) { 
	      	$routeProvider
			.when('/', {
				templateUrl: 'home',
				controller: 'mainCtrl'
			})			
			.otherwise({
				redirectTo: '/'
			});
		}]);
		app.controller('mainCtrl', function($scope, $http) {
            console.log('ok');
            var ctrl = this;
            
            $scope.articles = [];
            
            $http.get('index.php?get=resiway_eko_list').then(
            function (response) {
                console.log(response);
                $scope.articles = response.data['result'];
            });
		});
    </script>    
  </head>

  <body ng-app="app">

    <div class="container">
      <div class="row">

        <div class="col-md-9">
          <div ng-view></div>
        </div>

      </div>
    </div>

    
    <script type="text/ng-template" id="home">
    	<div class="container">
			<h3>Articles</h3>
			<select
                ng-model="article_id">
                <option ng-repeat="(id, article) in articles" value="{{id}}">{{article}}</option>
            </select>
    	</div>
        selected article id: {{article_id}}
		<a href="/resipedia.fr#!/article/edit/eko_{{article_id}}" target="_blank">Import article</a>
    </script>
    

  </body>
</html>