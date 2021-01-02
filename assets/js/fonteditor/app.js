/*
    sets up the app


*/

var app = angular.module('figfont', [
    'ngAnimate',
    'ngRoute',
    'figfont.services', 'figfont.controllers', 'figfont.filters', 'figfont.directives']);

app.config(function ($routeProvider) {
    $routeProvider
        .when('/', 
            {
                redirectTo: '/edit'
            })
        .when('/edit', 
            {
                templateUrl: 'partials/main.htm',
                controller: 'MainCtrl'
            })
        .when('/test', 
            {
                templateUrl: 'partials/test.htm',
                controller: 'TestCtrl'
            })
        .otherwise(
            { 
                redirectTo: '/' 
            })
        ;
});

app.run(function() {
    
});

// ok-ing console usage
if (typeof console === 'undefined') {
    var console = {};
    console.log = function(){};
    console.dir = function(){};
}
