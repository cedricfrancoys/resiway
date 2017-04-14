<!DOCTYPE html>
<html lang="fr-FR" ng-app="resilib" ng-controller="rootController as rootCtrl">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<link media="all" rel="stylesheet" type="text/css" href="resilib.static/src/styles/ui/1.10.4/themes/smoothness/jquery-ui.css" />
<link media="all" rel="stylesheet" type="text/css" href="resilib.static/src/styles/chosen.css" />
<link media="all" rel="stylesheet" type="text/css" href="resilib.static/src/styles/main.css" />
<link media="all" rel="stylesheet" type="text/css" href="resilib.static/src/styles/details.css" />
<link media="all" rel="stylesheet" type="text/css" href="resilib.static/src/styles/result.css" />
<link media="all" rel="stylesheet" type="text/css" href="resilib.static/src/styles/font-awesome.min.css"  />


        <link rel="stylesheet" type="text/css" href="packages/resiexchange/apps/assets/css/bootstrap.min.css" />
        <link rel="stylesheet" type="text/css" href="packages/resiexchange/apps/assets/css/ngToast.min.css" />
        <link rel="stylesheet" type="text/css" href="packages/resiexchange/apps/assets/css/ngToast-animations.min.css" />
        
        <script src="packages/resiexchange/apps/i18n/locale-fr.js"></script>
        <link rel="stylesheet" type="text/css" href="packages/resiexchange/apps/assets/css/resiexchange.min.css" />
        
<script type="text/javascript" src="resilib.static/src/scripts/jquery.min.js"></script>
<script type="text/javascript" src="resilib.static/src/scripts/jquery-ui.min.js"></script>
<script type="text/javascript" src="resilib.static/src/scripts/angular.min.js"></script>
<script type="text/javascript" src="resilib.static/src/scripts/angular-route.min.js"></script>



        <script src="packages/resiexchange/apps/assets/js/angular-translate.min.js"></script>
        <script src="packages/resiexchange/apps/assets/js/angular-touch.min.js"></script>
        <script src="packages/resiexchange/apps/assets/js/angular-sanitize.min.js"></script>
        <script src="packages/resiexchange/apps/assets/js/angular-animate.min.js"></script>
        <script src="packages/resiexchange/apps/assets/js/angular-cookies.min.js"></script>
        
        <script src="packages/resiexchange/apps/assets/js/ui-bootstrap-tpls-2.2.0.min.js"></script>
        <script src='packages/resiexchange/apps/assets/js/ngToast.min.js'></script>


<script type="text/javascript" src="resilib.static/src/scripts/chosen.jquery.min.js"></script>
<script type="text/javascript" src="resilib.static/src/scripts/resilib.js"></script>

<script type="text/javascript" src="resilib.static/src/i18n/resilib.i18n.js"></script>
        <script>
        var global_config = {
            application: 'resilib',
            locale: 'fr',
            channel: '1'
        };
        </script>
<style>
body {
    font-size: 100% !important;
    line-height: 23px !important;
    background: none !important;
    margin-top: 30px;
}
li {
    line-height: 17px;
}
ul.simpleTabsNavigation li {
        height: 24px;
}
#result-pager {
    height: 29px;
}
.quick-search-dock fieldset {
    font-family: Verdana,Arial,sans-serif;
    font-size: 80%;
    border-radius: 8px;
    margin: 0 20px 10px;
    border: 1px solid #D2D2CF;
    padding-bottom: 10px;
}
.quick-search-dock fieldset legend {
    display: block;
    font-size: 13px;
    margin: 0;
    padding: 0;
    margin-left: 10px;
    width: auto;
    border: 0;
}
</style>
</head>

<body ng-controller="mainCtrl" class="ng-cloak">

    <div id="topBar" class="topbar" ng-controller="topBarCtrl as ctrl" >        

        <div class="grid wrapper">
        <!-- 1) dropdown dialogs -->
            
            <!-- platform dialog -->
            <div class="platform-dialog" ng-show="ctrl.platformDropdown" ng-cloak>
                <div class="head text-uppercase">{{'TOOLBAR_PLATFORM_OTHER_APPS'|translate}}</div>
                <ul>
                    <li onclick="window.location.href='/resiway.fr'">
                        <div class="platform-icon resiway"></div>
                        <div class="descr"><a href="/resiway.fr">Présentation et gestion des outils collaboratifs</a></div>
                    </li>
                    <li onclick="window.location.href='/resiexchange.fr'">
                        <div class="platform-icon resiexchange"></div>
                        <div class="descr"><a href="/resiexchange.fr">Questions &amp; Réponses sur les thèmes de l'autonomie, la transition, la permaculture et la résilience</a></div>
                    </li>
                    <li onclick="window.location.href='/resilib.fr'">
                        <div class="platform-icon resilib"></div>
                        <div class="descr"><a href="/resilib.fr">Bibliothèque de retours d'expériences pour la réappropriation des savoirs-faire</a></div>
                    </li>
                    <!--
                    <li>
                        <div class="platform-icon resinet"></div>
                        <div class="descr">Réseau social de support mutuel et de présentaiton d'initiatives pour l'autonomie, la transition et la permaculture.</div>
                    </li>
                    -->
                    <!--
                    <li>
                        <div class="platform-icon resipedia"></div>
                        <div class="descr">Wiki rassemblant les informations de toutes les plateformes</div>
                    </li>
                    -->
                    <li onclick="window.location.href='/ekopedia.fr'">
                        <div class="platform-icon ekopedia"></div>
                        <div class="descr"><a href="/ekopedia.fr">Encyclopédie pratique pour intégrer l'écologie à son quotidien</a></div>
                    </li>
                </ul>
            </div>
            <!-- notifications dialog -->        
            <div class="notify-dialog" ng-show="ctrl.notifyDropdown">
                <div class="head">
                    <a href="/resiexchange.fr#/user/notifications/{{user.id}}">{{'TOOLBAR_NOTIFICATIONS_TITLE' | translate}}</a>
                    <a href class="pull-right" ng-click="ctrl.notificationsDismissAll()">tout supprimer</a>
                </div>
                <ul>
                    <li ng-repeat="(notification_index, notification) in user.notifications">
                        <div class="title"><a href="/resiexchange.fr#/user/notifications/{{user.id}}">{{notification.title}}</a></div>
                        <div class="descr" ng-bind-html="notification.content"></div>
                    </li>
                </ul>
                <div class="foot"><a href="/resiexchange.fr#/user/notifications/{{user.id}}">+ Voir toutes les notifications</a></div>
            </div>
            <!-- help dialog -->
            <div class="help-dialog" ng-show="ctrl.helpDropdown">
                <ul>
                    <li>
                        <div class="title">Centre d'Aide</div>
                        <div class="descr small"><a href="/resiexchange.fr#/help/categories">Des réponses à toutes vos questions sur le fonctionnement de la plateforme</a></div>
                    </li>
                    <li>
                        <div class="title">Meta</div>
                        <div class="descr small"><a href="/meta.resiexchange.fr#/questions">Discussions sur le fonctionnement et les règles de la plateforme</a></div>
                    </li>
                </ul>
            </div>
            <!-- user dialog -->
            <div class="user-dialog" ng-show="ctrl.userDropdown">
                <ul>
                    <li onclick="window.location.href='/resiexchange.fr#/user/current/profile'">
                        <a href="/resiexchange.fr#/user/profile/{{user.id}}"><i class="fa fa-user" aria-hidden="true"></i> Profil</a>
                    </li>
                    <li ng-click="ctrl.signOut()">
                       <a href ng-click="ctrl.signOut()"><i class="fa fa-sign-out" aria-hidden="true"></i> Déconnexion</a>
                    </li>
                </ul>
            </div>

            
        <!-- 2) toolbar -->
            <div class="col-1-1">
                <div class="platform-items">
                    <div class="platform-btn {{config.application}}" ng-class="{open: ctrl.platformDropdown}" ng-click="togglePlatformDropdown()">
                        <div class="app-icon"></div>
                        <i class="fa fa-caret-down" aria-hidden="true"></i>          
                    </div>            
                    <div id="notify-btn" class="notify-btn ng-hide hidden-xs" ng-class="{open: ctrl.notifyDropdown}" ng-click="toggleNotifyDropdown()" ng-show="user.id">
                        <i class="fa fa-inbox" aria-hidden="true"></i>
                        <span ng-show="user.notifications.length" class="unread-count bg-info">{{user.notifications.length}}</span>
                    </div>
                    <div id="help-btn" class="help-btn hidden-xs" ng-class="{open: ctrl.helpDropdown}" ng-click="toggleHelpDropdown()">
                        Aide 
                        <i class="fa fa-caret-down" aria-hidden="true"></i>          
                    </div>                
                </div>
                
                <div id="login-btn" class="login-btn ng-hide" ng-hide="user.id">
                        <a href="/resiexchange.fr#/user/sign/in"><i class="fa fa-sign-in" aria-hidden="true"></i> Connexion</a>
                        <a href="/resiexchange.fr#/user/sign/up"><i class="fa fa-user-plus" aria-hidden="true"></i> Inscription</a>
                </div>
                <div id="user-btn" class="user-btn ng-hide" ng-class="{open: ctrl.userDropdown}" ng-click="toggleUserDropdown()" ng-show="user.id">
                    <span class="user-avatar pull-left">
                      <img src="" ng-if="user.avatar_url" ng-src="{{rootCtrl.avatarURL(user.avatar_url, 30)}}" class="center-block">
                    </span>
                    {{ user.display_name }}
                    <i class="fa fa-caret-down" aria-hidden="true"></i>          
                </div>            
            </div>

        </div>
    </div>

    <div app-loader class="loader" ng-hide="domReady">Loading application...</div>

    <div id="details_dialog" ng-hide="!selectedDocument" ng-cloak>
        
        <!-- details template start -->    
        <table class="details reference" cellspacing="0" cellpadding="0">
            <tr>
                <th class="left"></th>
                <th class="right">{{ selectedDocument.title }}</th>
            </tr>
            <tr>
                <td class="left">{{ ui.i18n['details-author'] }}</td>
                <td class="right">{{ selectedDocument.author }}</td>
            </tr>
            <tr>
                <td class="left">{{ ui.i18n['details-links'] }}</td>
                <td class="right">
                    <i class="fa fa-cloud-download" aria-hidden="true"></i>
                    <a href="data/download.php?id={{ selectedDocument.id }}" type="application/pdf" download="{{ selectedDocument.id }}.pdf" target="_self">{{ ui.i18n['details-links-download'] }}</a>
                    
                    &nbsp;&nbsp;<i class="fa fa-ellipsis-v" aria-hidden="true"></i>&nbsp;&nbsp;
                    <i class="fa fa-eye" aria-hidden="true"></i>
                    <a href="{{ selectedDocument['url-download'] }}" type="application/pdf" target="_blank">{{ ui.i18n['details-links-see'] }}</a>                    

                    &nbsp;&nbsp;<i class="fa fa-ellipsis-v" aria-hidden="true"></i>&nbsp;&nbsp;
                    <i class="fa fa-file-code-o" aria-hidden="true"></i>
                    <a href="data/documents/{{ selectedDocument.id }}/src" target="_blank">{{ ui.i18n['details-links-source'] }}</a>  

                    &nbsp;&nbsp;<i class="fa fa-ellipsis-v" aria-hidden="true"></i>&nbsp;&nbsp;
                    <i class="fa fa-link" aria-hidden="true"></i>
                    <a href="#{{ selectedDocument.id }}" target="_blank">{{ ui.i18n['details-links-direct'] }}</a> 
                    
                    &nbsp;&nbsp;<i class="fa fa-ellipsis-v" aria-hidden="true"></i>&nbsp;&nbsp;                    
                    <!-- <a href="#{{ selectedDocument.id }}" target="_blank">{{ ui.i18n['details-links-share'] }}</a>  --> 
                      
                    <i class="fa fa-facebook-square" aria-hidden="true"></i>
                    <a href="https://www.facebook.com/dialog/feed?
app_id=1786954014889199
&display=page
&redirect_uri=http%3A//www.resiway.org/resilib
&caption=ResiLib - {{ selectedDocument.title }}
&link=http%3A//www.resiway.org/resilib/%23{{ selectedDocument.id }}
&picture=http%3A//www.resiway.org/resilib/data/documents/{{ selectedDocument.id }}/thumbnail.jpg
&description={{ selectedDocument.description }}" target="_blank">{{ ui.i18n['details-links-share'] }}</a>
  
                </td>
            </tr>           
            <tr>
                <td class="left">{{ ui.i18n['details-language'] }}</td>
                <td class="right">{{ languages[selectedDocument.language] }}</td>
            </tr>
            <tr>
                <td class="left">{{ ui.i18n['details-description'] }}</td>
                <td class="right">{{ selectedDocument.description }}</td>
            </tr>            
            <tr>
                <td class="left">{{ ui.i18n['last-update'] }}</td>
                <td class="right">{{ selectedDocument.version }}</td>
            </tr>
            <tr>
                <td class="left">{{ ui.i18n['details-license'] }}</td>
                <td class="right">{{ selectedDocument.license }}</td>
            </tr>
            <tr>
                <td class="left">{{ ui.i18n['details-size'] }}</td>
                <td class="right">{{ selectedDocument['file-size'] }} / {{ selectedDocument['file-pages'] }} p.</td>
            </tr>
            <tr>
                <td class="left">{{ ui.i18n['details-url-origin'] }}</td>
                <td class="right">{{ selectedDocument['url-origin'] }}</td>
            </tr>
            <tr>
                <td class="left">{{ ui.i18n['categories'] }}</td>
                <td class="right">
                    <ul style="padding: 0; margin: 0; padding-left: 10pt;">
                        <li ng-repeat="(category_id, category) in selectedDocument['categories']">{{ category_id }}</li>
                    </ul>
                </td>
            </tr>

        </table>
       <!-- details template end -->
            
    </div>

    <div id="root" class="simple-tabs" style="display: none;">
        <div style="position: absolute; top: 40px; right: 0px; margin-right: 50px; font-family: Lucida Grande,Arial; font-size: 14px;">
        <a href="#" ng-click="ui.lang = 'fr'">français</a> | <a href="#" ng-click="ui.lang = 'en'">english</a> | <a href="#" ng-click="ui.lang = 'es'">español</a>
        </div>
        
        <ul class="simpleTabsNavigation">
            <li class="current"><a href="#page-1">{{ ui.i18n.search }}</a></li>
            <li><a href="#page-2">{{ ui.i18n.presentation }}</a></li>
            <li><a href="#page-3">{{ ui.i18n.contribute }}</a></li>
        </ul>
        <div id="page-1" class="simpleTabsContent" style="display: block;">

            <div style="text-align: center; font-size: 18pt; font-family: Lucida Grande,Arial;">
                <span style="font-size: 15pt;" class="fa fa-file-text-o"></span>&nbsp;110 {{ ui.i18n['documents'].toLowerCase() }}&nbsp;&nbsp;&nbsp;&nbsp;
                <span style="font-size: 18pt;"class="fa fa-folder-o"></span>&nbsp;94 {{ ui.i18n['categories'].toLowerCase() }}&nbsp;&nbsp;&nbsp;&nbsp;       
                <span style="font-size: 18pt;" class="fa fa-language"></span>&nbsp;3 {{ ui.i18n['languages'].toLowerCase() }}
            </div>
            <div style="position: relative; display: table; margin: 0; padding: 0; height: 100px; width: 100%;" >
                <div class="quick-search-dock">
                    <fieldset>
                        <legend>{{ ui.i18n['main-categories'] }}</legend>
                        <img class="hover-zoom" ng-repeat="(item_id, item) in quickSearchItems" ng-click="updateResult({ categories: [item.category] })" ng-src="{{ item.picture }}" alt="item_id" />
                    </fieldset>
                </div>
                <div class="logo-dock">
                    <img src="resilib.static/src/img/resilib_logo.png" />
                </div>
            </div>

            <div id="container">

                <table id="inner">
                <tr>
                    <td id="left_pane">
                        <div search-tabs id="tabs" ng-sticky>
                        
                          <ul>
                            <li><a href="#tabs-1">{{ ui.i18n.categories }}</a></li>
                            <li><a href="#tabs-2">{{ ui.i18n.search }}</a></li>
                          </ul>
                          
                          <div id="tabs-1">

                            <!-- category tree template start -->
                            <script type="text/ng-template" id="categoryTree">
                                <a name="{{ category_id }}" href="#" ng-click="updateResult({ categories: [category_id] })">{{ category.title }}</a>
                                <ul ng-if="category.categories">
                                    <li ng-repeat="(category_id, category) in category.categories" ng-include="'categoryTree'"></li>
                                </ul>
                            </script>
                            <ul category-tree id="menu" style="display: none;">
                                <li ng-repeat="(category_id, category) in categories" ng-if="category_id != 'flat'" ng-include="'categoryTree'"></li>
                            </ul>
                            <!-- category tree template end -->

                          </div>
                          
                          <div id="tabs-2">
                            <form id="search_form" ng-submit="updateResult()">
                                <div style="font-weight: bold; height: 25px;">{{ ui.i18n['search-lang'] }}</div>
                                <div style="width: 200px; display: block;">
                                  <select id="widget_lang" name="language" data-placeholder="{{ ui.i18n['search-select-lang'] }}" class="chosen-select">
                                    <option value="" default></option>
                                    <option value="fr">Français</option>
                                    <option value="en">Anglais</option>
                                    <option value="es">Espagnol</option>
                                  </select>
                                </div>
                                <br />
                                <div style="font-weight: bold; height: 25px;">{{ ui.i18n['search-category'] }}</div>
                                <div style="width: 200px; display: block;">
                                    <select id="widget_categories" name="categories" drop-width="500px" data-placeholder="{{ ui.i18n['search-select-categories'] }}" class="chosen-select" multiple="multiple">

                                        <!-- category select template start -->
                                        <option ng-repeat="(category_id, category) in categories.flat" value="{{ category_id }}">{{ category.title }}</option>
                                        <!-- category select template end -->

                                    </select>
                                </div>
                                <br />
                                <div style="font-weight: bold; height: 25px;">{{ ui.i18n['search-author'] }}</div>
                                <div><input id="widget_author" style="width: 198px;" name="author" type="text" value="" placeholder="{{ ui.i18n['search-input-author'] }}"></div>
                                <br />
                                <div style="font-weight: bold; height: 25px;">{{ ui.i18n['search-title'] }}</div>
                                <div><input id="widget_title" style="width: 198px;" name="title" type="text" value="" placeholder="{{ ui.i18n['search-input-title'] }}"></div>
                                <br />
                                <div style="width:100%; text-align: right;"><button type="submit" class="button">Ok</button></div>
                                <input style="display: none;" type="reset" />
                            </form>
                          </div>
                        </div>
                    </td>
                    <td id="main">
                        <section id="result-grid">

                            <div id="result-pager">
                                <div style="position: absolute; top: 1pt; height: 29px; left: 50%; margin-left: -50pt;">
                                    <button type="button" class="ngPagerButton" ng-click="pageToFirst()" ng-disabled="cantPageBackward()" title="First Page"><div class="fa fa-angle-double-left"></div></button>
                                    <button type="button" class="ngPagerButton" ng-click="pageBackward()" ng-disabled="cantPageBackward()" title="Previous Page"><div class="fa fa-angle-left"></div></button>
                                    <span ng-bind="pagingOptions.currentPage"></span>
                                    <span>/ </span><span  ng-bind="pagingOptions.totalPages"></span>

                                    <button type="button" class="ngPagerButton" ng-click="pageForward()" ng-disabled="cantPageForward()" title="Next Page"><div class="fa fa-angle-right"></div></button>
                                    <button type="button" class="ngPagerButton" ng-click="pageToLast()" ng-disabled="cantPageForward()" title="Last Page"><div class="fa fa-angle-double-right"></div></button>
                                </div>
                                <div style="position: absolute; top: 3px; height: 29px; left: 2%;">
                                    <span>{{ ui.i18n['grid-documents'] }}: </span><span>{{ ((pagingOptions.currentPage-1)*pagingOptions.resultsPerPage)+1 }}</span> - <span>{{ min(pagingOptions.totalRecords, (((pagingOptions.currentPage-1)*pagingOptions.resultsPerPage) + pagingOptions.resultsPerPage*1)) }}</span> of <span ng-bind="pagingOptions.totalRecords"></span>
                                </div>
                                <div style="position: absolute; top: 2pt; height: 20pt; right: 2%;">
                                    <span>{{ ui.i18n['grid-show'] }}:&nbsp;</span>
                                    <select data-ng-model="pagingOptions.resultsPerPage" ng-change="updateResult(pagingOptions.criteria)">
                                        <option ng-selected="{{pagingOptions.resultsPerPage == 10}}" value="10">10</option>
                                        <option ng-selected="{{pagingOptions.resultsPerPage == 25}}" value="25">25</option>
                                        <option ng-selected="{{pagingOptions.resultsPerPage == 50}}" value="50">50</option>
                                        <option ng-selected="{{pagingOptions.resultsPerPage == 100}}" value="100">100</option>
                                    </select>
                                </div>
                            </div>

                            <div id="loader" class="loader ng-hide">{{ ui.i18n.loading }}</div>

                            <table id="result">

                                <!-- records template start -->
                                <tr ng-repeat="(document_id, document) in documents" style="border-top: 1px solid darkgrey;">
                                    <td width="50">
                                        <a href="{{ document['url-download'] }}" target="_blank"><img width="100" height="133" ng-src="{{document['file-thumbnail']}}" border="1" /></a>
                                    </td>
                                    <td class="summary">
                                        <div class="title">
                                            <a class="display-details" ng-click="displayDetails( document_id )">{{document.title}}</a>
                                        </div>
                                        <div class="author">
                                            <span>{{document.author}}</span>
                                        </div>
                                        <div class="version">{{ ui.i18n['last-update'] }}: 
                                            <span>{{document.version}}</span>
                                        </div>
                                        <div class="categories">{{ ui.i18n.categories }}: 
                                            <span ng-repeat="(category_id, category) in document.categories"><a href="#" ng-click="updateResult({ categories: [category_id] })" title="{{ category_id }}">{{ categories.flat[category_id].title.substr(categories.flat[category_id].title.lastIndexOf('/')+1) }}</a>&nbsp;&nbsp;</span>
                                        </div>
                                        <div class="actions">{{ ui.i18n['result-search'] }}:
                                            <a href="#" class="search-author" ng-click="updateResult({ author: document_id.substr(0, document_id.indexOf('_', 0)) })" >{{ ui.i18n['author-publications'] }}</a>
                                            <a href="#" class="search-category" ng-click="updateResult({ categories: keys(document.categories) })">{{ ui.i18n['categories-publications'] }}</a>
                                        </div>
                                    </td>
                                 </tr>
                                 <!-- records template end -->

                            </table>
                        </section>

                    </td>
                </tr>
                </table>
            </div>
        </div>
        <div id="page-2" class="simpleTabsContent" ng-include="'resilib.static/src/i18n/presentation.fr.html'"></div>
        <div id="page-3" class="simpleTabsContent" ng-include="'resilib.static/src/i18n/contribute.fr.html'"></div>
    </div>

    <div id="footer" ng-hide="!domReady">Avril 2017 &nbsp;&bull;&nbsp; 110 documents référencés dans 3 langues et 94 catégories<br />Resilib est une initiative citoyenne &nbsp;&bull;&nbsp; Le contenu de ce site est librement partageable </div>

</body>
</html>