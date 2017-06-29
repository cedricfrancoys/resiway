<!DOCTYPE html>
<html lang="fr" ng-app="catManager" id="top" >
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
        <meta name="title" content="ResiWay - La plateforme pour la résilience">        
        <meta name="description" content="categories manager">

        
        <script src="packages/resiexchange/apps/assets/js/angular.min.js"></script>
        <script src="packages/resiexchange/apps/assets/js/angular-animate.min.js"></script>
        <script src="packages/resiexchange/apps/assets/js/angular-touch.min.js"></script>
        <script src="packages/resiexchange/apps/assets/js/angular-sanitize.min.js"></script>
        <script src="packages/resiexchange/apps/assets/js/angular-cookies.min.js"></script>
        <script src="packages/resiexchange/apps/assets/js/angular-route.min.js"></script>


        <script src="packages/resiexchange/apps/assets/js/angular-ui-tree.min.js"></script>
        <script src="packages/resiexchange/apps/assets/js/ui-bootstrap-tpls-2.2.0.min.js"></script>


        

        <script src='packages/resiexchange/apps/assets/js/select-tpls.min.js'></script>
        
        <link rel="stylesheet" type="text/css" href="packages/resiexchange/apps/assets/css/bootstrap.min.css" />
        <link rel="stylesheet" type="text/css" href="packages/resiexchange/apps/assets/css/font-awesome.min.css" />
        <link rel="stylesheet" type="text/css" href="packages/resiexchange/apps/assets/css/cc-icons.min.css" >
        <link rel="stylesheet" type="text/css" href="packages/resiexchange/apps/assets/css/angular-ui-tree.min.css" />        

        <style>
        
.btn {
    margin-right: 8px;
    margin-top: 2px;
    font-size: xx-small;
}

ul, ol, li {
    padding: 0;
    margin: 0;
}
.angular-ui-tree-handle {
    background: #f8faff;
    border: 1px solid #dae2ea;
    color: #7c9eb2;
    padding: 0;
    padding-left: 5px;
}

.angular-ui-tree-handle {
    cursor: move;
    text-decoration: none;
    font-size: 12px;
    font-weight: 400;
    box-sizing: border-box;
    min-height: 23px;
    line-height: 1.5;
}

.angular-ui-tree-handle:hover {
    color: #438eb9;
    background: #f4f6f7;
    border-color: #dce2e8;
}

.angular-ui-tree-placeholder {
    background: #f0f9ff;
    border: 1px dashed #bed2db;
    -webkit-box-sizing: border-box;
    -moz-box-sizing: border-box;
    box-sizing: border-box;
}

tr.angular-ui-tree-empty {
    height:100px;
}

.group-title {
    background-color: #687074 !important;
    color: #FFF !important;
}


/* --- Tree --- */
.tree-node {
    border: 1px solid #dae2ea;
    background: #f8faff;
    color: #7c9eb2;
}

.nodrop {
    background-color: #f2dede;
}

.tree-node-content {
    margin: 2px;
}
.tree-handle {
    padding: 5px;
    background: #428bca;
    color: #FFF;
    margin-right: 10px;
}

.angular-ui-tree-handle:hover {
}

.angular-ui-tree-placeholder {
    background: #f0f9ff;
    border: 1px dashed #bed2db;
    -webkit-box-sizing: border-box;
    -moz-box-sizing: border-box;
    box-sizing: border-box;
}
</style>
<script>
  angular.module('catManager', ['ui.tree', 'ui.bootstrap']);

  
  
angular.module('catManager').controller('catCtrl', [
'$scope', 
'$http',
'$uibModal',
'$httpParamSerializerJQLike',
function ($scope, $http, $uibModal, $httpParamSerializerJQLike) {
        
    var ctrl = this;

    ctrl.prev_category_id = -1;
    ctrl.category_id = 0;
    ctrl.selected_tab = null;

    $scope.switchTab = function(tab) {
      ctrl.selected_tab = tab;
    };
  
    $scope.treeOptions = {
        dropped: function($event) {
            if(typeof $event.source.nodeScope.$modelValue == 'undefined'
            || $event.dest.nodesScope.$nodeScope == null) return false;
            var src = $event.source.nodeScope.$modelValue;
            var dst = $event.dest.nodesScope.$nodeScope.$modelValue;
            console.log(src);
            console.log(dst);
            var data = {
                id: src.id,
                title: src.title, 
                description: src.description,
                parent_id: dst.id
            };
            $http.get('index.php?do=resiway_category_edit&'+$httpParamSerializerJQLike(data))
            .then(
            function () {
            });            
            return true;
        },
        beforeDrag: function (sourceNodeScope) { // == 'select'
            ctrl.prev_category_id = ctrl.category_id;
            ctrl.category_id = sourceNodeScope.$modelValue.id;
            ctrl.questions.domain = ['categories_ids', 'contains', ctrl.category_id];
            ctrl.documents.domain = ['categories_ids', 'contains', ctrl.category_id];
            console.log(ctrl.selected_tab);
            if(ctrl.selected_tab != null) {
                ctrl.load(ctrl.selected_tab);
            }
            console.log(ctrl.category_id);
        }        
    };
  
    $http.get('index.php?get=resiway_category_tree')
    .then(
        function successCallback(response) {
            var data = response.data;
            $scope.data = data.result;
        }
    );


    ctrl.edit = function (scope) {
        var nodeData = scope.$modelValue;
        console.log(nodeData);

        var modalInstance = $uibModal.open({
            animation: true,            
            ariaLabelledBy: 'modal-title',
            ariaDescribedBy: 'modal-body',
            templateUrl: 'myModalContent.html',
            controller: ['$uibModalInstance', function ($uibModalInstance, items) {
                    var ctrl = this;
                    ctrl.title = nodeData.title;
                    ctrl.description = nodeData.description;
                    ctrl.ok = function () {
                        $uibModalInstance.close();
                        // save title change
                        nodeData.title = ctrl.title;
                        nodeData.description = ctrl.description;                        
                        var data = {
                            id: nodeData.id,
                            title: nodeData.title,
                            description: nodeData.description,
                            parent_id: nodeData.parent_id
                        }
                        $http.get('index.php?do=resiway_category_edit&'+$httpParamSerializerJQLike(data))
                        .then(
                        function () {
                        });
                    };
                    ctrl.cancel = function () {
                        $uibModalInstance.dismiss();
                    };
            }],
            controllerAs: 'ctrl',
            size: 'md',
            resolve: {
                items: function () {

                }
            }
        });

    };
    
    ctrl.remove = function (scope) {
        console.log('remove '+scope);
        var nodeData = scope.$modelValue;
        var category_id = nodeData.id;
        if(confirm('Supprimer la catégorie ?')) {
            $http.get('index.php?do=resiway_category_delete&category_id='+category_id)
            .then(function() {
                        scope.remove();
            });
        }
    };

    $scope.toggle = function (scope) {
        scope.toggle();
    };

    $scope.moveLastToTheBeginning = function () {
        var a = $scope.data.pop();
        $scope.data.splice(0, 0, a);
    };

    $scope.newSubItem = function (scope) {
        var nodeData = scope.$modelValue;
        nodeData.nodes.push({
          id: nodeData.id * 10 + nodeData.nodes.length,
          title: nodeData.title + '.' + (nodeData.nodes.length + 1),
          nodes: []
        });
    };

    $scope.collapseAll = function () {
        $scope.$broadcast('angular-ui-tree:collapse-all');
    };

    $scope.expandAll = function () {
        $scope.$broadcast('angular-ui-tree:expand-all');
    };
      
    ctrl.load = function(config) {
        if(config.currentPage != config.previousPage
        || ctrl.category_id != ctrl.prev_category_id) {
            config.previousPage = config.currentPage;
            // reset objects list (triggers loader display)
            config.items = -1;          
            $http.get('index.php?get='+config.provider+'&'+$httpParamSerializerJQLike({
                domain: config.domain,
                start: (config.currentPage-1)*config.limit,
                limit: config.limit,
                total: config.total
            })).then(
            function successCallback(response) {
                var data = response.data;
                config.items = data.result;
                config.total = data.total;
            },
            function errorCallback() {
                // something went wrong server-side
            });
        }
    };      

    angular.merge(ctrl, {
            documents: {
                items: -1,
                total: -1,
                currentPage: 1,
                previousPage: -1,                
                limit: 5,
                domain: ['categories_ids', 'contains', ctrl.category_id],
                provider: 'resilib_document_list'
            },            
            questions: {
                items: -1,
                total: -1,
                currentPage: 1,
                previousPage: -1,                
                limit: 5,
                domain: ['categories_ids', 'contains', ctrl.category_id],
                provider: 'resiexchange_question_list'
            }
    });            
      
}]);

  
</script>
</head>

<body ng-controller="catCtrl as ctrl">

<script type="text/ng-template" id="myModalContent.html">
        <div class="modal-header">
            <h3 class="modal-title" id="modal-title">Edition de la catégorie</h3>
        </div>
        <div class="modal-body" id="modal-body">
            <input class="form-control" type="text" ng-model="ctrl.title" /><br />
            <textarea class="form-control" style="width: 100%; height: 150px;" ng-model="ctrl.description"></textarea>
        </div>
        <div class="modal-footer">
            <button class="btn btn-primary" type="button" ng-click="ctrl.ok()">OK</button>
            <button class="btn btn-warning" type="button" ng-click="ctrl.cancel()">Cancel</button>
        </div>
</script>
    
<!-- Nested node template -->
<script type="text/ng-template" id="nodes_renderer.html">
  <div ui-tree-handle class="tree-node tree-node-content">
    <a class="btn btn-success btn-xs" ng-if="node.nodes && node.nodes.length > 0" data-nodrag ng-click="toggle(this)">
    <span style="font-size: smaller"
        class="fa"
        ng-class="{
          'fa-chevron-right': collapsed,
          'fa-chevron-down': !collapsed
        }"></span>
    </a>
    {{node.title}} ({{node.count_documents}} documents, {{node.count_questions}} questions)
    <a class="pull-right btn btn-danger btn-xs" data-nodrag ng-click="ctrl.remove(this)">
        <span class="fa fa-remove"></span>
    </a>
    <a class="pull-right btn btn-primary btn-xs" data-nodrag ng-click="newSubItem(this)" style="margin-right: 8px;">
        <span class="fa fa-plus"></span>        
    </a>
    <a class="pull-right btn btn-info btn-xs" data-nodrag ng-click="ctrl.edit(this)">
        <span class="fa fa-pencil"></span>
    </a>    
  </div>
  <ol ui-tree-nodes="" ng-model="node.nodes" ng-class="{hidden: collapsed}">
    <li ng-repeat="node in node.nodes" ui-tree-node data-collapsed="true" data-expand-on-hover="true" ng-include="'nodes_renderer.html'"></li>
  </ol>
</script>


<div class="container col-md-6" style="height: 750px; overflow-y: scroll;">
    <div ui-tree="treeOptions">
      <ol ui-tree-nodes="" ng-model="data" id="tree-root">
        <li ng-repeat="node in data" ui-tree-node data-collapsed="true" data-expand-on-hover="true" ng-include="'nodes_renderer.html'"></li>
      </ol>
    </div>
</div>

<div class="container col-md-6" style="height: 750px; overflow-y: scroll;">
    <uib-tabset active="active">

    <uib-tab index="0" select="switchTab(null)">
        <uib-tab-heading>
            <i class="fa fa-user"></i> Catégories
        </uib-tab-heading>
        <div class="user-profile col-1-1 nopad" style="padding-top: 10px;">
            <div ui-tree="treeOptions">
              <ol ui-tree-nodes="" ng-model="data" id="tree-root">
                <li ng-repeat="node in data" ui-tree-node data-collapsed="true" data-expand-on-hover="true" ng-include="'nodes_renderer.html'"></li>
              </ol>
            </div>                
        </div>
    </uib-tab>

    <uib-tab index="1" select="ctrl.load(ctrl.questions); switchTab(ctrl.questions)" >
      <uib-tab-heading>
        <i class="fa fa-bookmark"></i> Questions
      </uib-tab-heading>
        <div class="loader" ng-show="ctrl.questions.items == -1"><i class="fa fa-spin fa-spinner" aria-hidden="true"></i></div>

        <div class="col-1-1" style="padding-left: 15px; padding-top: 10px;">
            <div ng-repeat="question in ctrl.questions.items" class="post-summary col-1-1">
                <div class="col-9-12">
                    &bull; <a href="/resiexchange.fr#/question/{{question.id}}">{{question.title}}</a>
                </div>
            </div>
        </div>
        <ul uib-pagination
                    class="pagination-sm"
                    total-items="ctrl.questions.total"
                    ng-model="ctrl.questions.currentPage"
                    ng-change="ctrl.load(ctrl.questions)"
                    items-per-page="5"
                    max-size="5"
                    direction-links="false"
                    boundary-links="true"
                    first-text="«"
                    last-text="»"
                    rotate="true"
                    force-ellipses="true"></ul>        
    </uib-tab>

    <uib-tab index="2" select="ctrl.load(ctrl.documents); switchTab(ctrl.documents)" >
      <uib-tab-heading>
        <i class="fa fa-bookmark"></i> Documents
      </uib-tab-heading>
        <div class="loader" ng-show="ctrl.documents.items == -1"><i class="fa fa-spin fa-spinner" aria-hidden="true"></i></div>

        <div class="col-1-1" style="padding-left: 15px; padding-top: 10px;">
            <div ng-repeat="document in ctrl.documents.items" class="post-summary col-1-1">
                <div class="col-9-12">
                    &bull; <a href="/resilib.fr#/document/{{document.id}}">{{document.title}}</a>
                </div>
            </div>

        </div>
        <ul uib-pagination
                    class="pagination-sm"
                    total-items="ctrl.documents.total"
                    ng-model="ctrl.documents.currentPage"
                    ng-change="ctrl.load(ctrl.documents)"
                    items-per-page="5"
                    max-size="5"
                    direction-links="false"
                    boundary-links="true"
                    first-text="«"
                    last-text="»"
                    rotate="true"
                    force-ellipses="true"></ul>              
    </uib-tab>

    </uib-tabset>

</div>

</body>
</html>