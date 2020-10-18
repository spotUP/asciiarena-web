/*
    Filter for capitalizing the first letter of a word
*/

var appFilters = appFilters || angular.module('figfont.filters', []);

appFilters.filter('capitalize', function() {
    return function(input, scope) {
        if (input) {
            return input.substring(0,1).toUpperCase() + input.substring(1);
        }
    };
});
var appFilters = appFilters || angular.module('figfont.filters', []);

appFilters.filter('makeRange', function() {
    return function(input) {
        var lowBound, highBound;
        switch (input.length) {
        case 1:
            lowBound = 0;
            highBound = parseInt(input[0], 10) - 1;
            break;
        case 2:
            lowBound = parseInt(input[0], 10);
            highBound = parseInt(input[1], 10);
            break;
        default:
            return input;
        }
        var result = [];
        for (var i = lowBound; i <= highBound; i++)
            result.push(i);
        return result;
    };
});