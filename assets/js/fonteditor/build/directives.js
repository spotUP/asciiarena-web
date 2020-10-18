/*
    Directive
*/

var appDirectives = appDirectives || angular.module('figfont.directives', []);

appDirectives.directive('dialogExport', [
    '$rootScope',
    function($rootScope) {
        return {
            restrict: 'EA',
            scope: {

            },
            templateUrl: 'partials/dialog-export.htm',
            link: function($scope, element, attrs) {

                $scope.id = 'dialogExport';
                $scope.input = {};

                $scope.selectAll = function() {
                    $('#'+$scope.id + ' .fig-data-txt').select();
                };

                $rootScope.$on('dialog:export', function(evt, opts) {
                    $scope.input.data = opts.data;
                    $('#'+$scope.id).modal();
                });
            }
        };
    }
]); 
/*
    Directive
*/

var appDirectives = appDirectives || angular.module('figfont.directives', []);

appDirectives.directive('dialogImport', [
    '$rootScope',
    'library',
    function($rootScope, library) {
        return {
            restrict: 'EA',
            scope: {

            },
            templateUrl: 'partials/dialog-import.htm',
            link: function($scope, element, attrs) {

                $scope.id = 'dialogImport';
                $scope.input = {};

                $scope.import = function() {
                    figlet.parseFont('___IMPORTED_FONT___', $scope.input.data, function(err, opts) {
                        if (err) {
                            $scope.errorPresent = true;
                            return;
                        }
                        $scope.errorPresent = false;

                        library.set('figfont', $scope.input.data);
                        $rootScope.$broadcast('data:import');
                        $('#'+$scope.id).modal('hide');
                    });
                };

                $rootScope.$on('dialog:import', function(evt, opts) {
                    $scope.input.data = '';
                    $scope.errorPresent = false;
                    $('#'+$scope.id).modal();
                });
            }
        };
    }
]); 
/*
    Directive
*/

var appDirectives = appDirectives || angular.module('figfont.directives', []);

appDirectives.directive('dialogSubmitFont', [
    '$rootScope',
    'library',
    function($rootScope, library) {
        return {
            restrict: 'EA',
            scope: {

            },
            templateUrl: 'partials/dialog-submit-font.htm',
            link: function($scope, element, attrs) {

                $scope.id = 'dialogSubmitFont';
                $scope.input = {};

                $rootScope.$on('dialog:submitFont', function(evt, opts) {
                    console.log('boo');
                    $('#'+$scope.id).modal();
                });
            }
        };
    }
]); 
/*
    Directive
*/

var appDirectives = appDirectives || angular.module('figfont.directives', []);

appDirectives.directive('example', [
    function() {
        return {
            restrict: 'E',
            scope: {
                'source':'='
            },
            template: '<div></div>',
            link: function($scope, element, attrs) {

            }
        };
    }
]); 
var appDirectives = appDirectives || angular.module('figfont.directives', []);

appDirectives.directive('navbarLink', ['$location', 
    function($location) {
        'use strict';
        
        return {
            restrict: 'A',
            link: function(scope, element, attrs, controller) {
                // Watch for the $location
                scope.$watch(function() {
                    return $location.path();
                }, function(newValue, oldValue) {
                    $('li[navbar-link]').each(function(k, li) {
                        var $li = $(this).find('a'),
                            pattern = $li.attr('href').replace('#','#?'),
                            regexp = new RegExp('^' + pattern + '$', ['i']);

                        if (regexp.test(newValue)) {
                            $(this).addClass('active');
                        } else {
                            $(this).removeClass('active');
                        }
                    });
                });
            }
        };
    }
]);