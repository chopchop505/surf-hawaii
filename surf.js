'use strict';

var app = angular.module('surfstreams', ['chart.js']);

app.config(function($sceDelegateProvider) {
    $sceDelegateProvider.resourceUrlWhitelist([
        'http://api.surfline.com/**',
        'self'
    ]);
});


app.controller('SurfController', ['$scope', '$http', function($scope, $http) {
    // For more streams, add their name/ID here.
    $scope.regions = [{
      name: 'Big Island (Kona)',
      sites: [{
          id: 4762,
          name: 'Banyans, HI'
      }, {
          id: 13830,
          name: 'Kahalu\'u, HI'
      }]
    }];
}]);


app.controller('SiteController', ['$scope', '$http', '$sce', function($scope, $http, $sce) {
    console.debug('Instantiating SiteController');

    // API query params
    var days = 3;
    var resources = 'wind,surf,analysis,weather,tide,sort,watertemp';

    $scope.analysis;
    $scope.tide;

    // Tide chart data
    $scope.tideData = [[]];
    $scope.tideLabels = [];

    // Surf chart data
    $scope.surfData = [[], []];
    $scope.surfSeries = ['Surf Min', 'Surf Max'];
    $scope.surfLabels = [];

    console.dir('Fetching forecast for site ID: ' + $scope.site.id);
    var url = 'http://api.surfline.com/v1/forecasts/'+$scope.site.id+'?resources='+resources+'&days='+days+'&getAllSpots=false&units=e&interpolate=false&showOptimal=false';

    $http.jsonp(url).then(
        function(response) {
            console.dir('Got forecast');
            console.dir(response);

            var forecast = response.data;

            $scope.analysis = $sce.trustAsHtml(forecast.Analysis.short_term_forecast);

            $scope.tide = response.data.Tide;

            angular.forEach(response.data.Tide.dataPoints, function(value, key) {
                var t = moment(value.Localtime).format('ddd, hA');

                $scope.tideLabels.push(t);
                $scope.tideData[0].push(value.height);
            });

            // Surf data is in a nested array.
            // Each element of the root array contains a list of timestamps.
            angular.forEach(forecast.Surf.dateStamp, function(value, i) {
                angular.forEach(value, function(dateString, j) {
                    var t = moment(dateString).format('ddd, hA');

                    $scope.surfLabels.push(t);
                    $scope.surfData[0].push(forecast.Surf.surf_min[i][j]);
                    $scope.surfData[1].push(forecast.Surf.surf_max[i][j]);
                });
            });
        }, function(err) {
            console.dir('Error obtaining forecast');
            console.dir(err);
        });
}]);

app.directive('ssPanel', ['$http', function($http) {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'templates/panel.html',
        link: function($scope, element, attrs) {
            var player;

            var playerId = '#player-' + $scope.site.id;


            var url = 'https://cams.cdn-surfline.com/cdn-wc/hi-banyans/chunklist.m3u8';

            console.log(url);

            $http.jsonp(url).then(
                function(response) {
                    console.log('Got response from Cam ID: ', $scope.site.id);
                    console.dir(response);

                    var stream = response.data.streamInfo.stream[0].file;

                    console.log('Player ' + playerId + ' playing stream: ' + stream);

                    player = new Clappr.Player({
                        parentId: playerId,
                        source: stream,
                        autoPlay: true,
                        width: '100%',
                        height: '100%'
                    });
                }, function(err) {
                    console.dir('Error reading Surfline API');
                    console.dir(err);
                });
        }
    }
}]);
