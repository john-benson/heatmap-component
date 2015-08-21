(function() {
  'use strict';

  angular
    .module('heatmapComponent')
    .config(routeConfig);

  /** @ngInject */
  function routeConfig($stateProvider, $urlRouterProvider) {
    $stateProvider
      .state('home', {
        url: '/',
        templateUrl: 'app/main/main.html',
        controller: 'MainController',
        controllerAs: 'main',
        resolve: {

          heatmapConfiguration: function () {
            return {

            };
          },

          agencyServiceRequests: function (serviceRequests) {
            var agencyServiceRequests = _.groupBy(serviceRequests, function (item) {
              return item.request.agency_responsible;
            });

            for ( var x in agencyServiceRequests ) {
              var agencyCategories = _.groupBy(agencyServiceRequests[x], function (item) {
                return item.request.service_name;
              });

              agencyServiceRequests[x] = agencyCategories;
            }

            return agencyServiceRequests;
          },

          serviceRequests: function(ServiceRequest, _, moment) {
            return ServiceRequest.query().$promise.then(function (result){
              var items = _.filter(result, {status: 'Open'}),
                  markers = [];

              for ( var i = 0; i < items.length; i++ ) {
                var item = items[i];

                item.requested_day = moment(item.requested_datetime, 'YYYY-MM-DD').valueOf();

                markers.push({
                  coords: {
                    latitude: item.latitude,
                    longitude: item.longitude
                  },
                  request: item,
                  id: i
                });
              }

              return markers;
            });
          },

          boundries: function($http) {
            return $http.get('/app/data/phillyCoords.json').then(function (coordinates) {
              var boundries = [];

              var objs = coordinates.data.objects;

              angular.forEach(coordinates.data.objects, function (object, i) {
                var group = {id: 1, path: [], stroke: { color: '#000000', weight: 3 }};

                angular.forEach(_.first(_.first(object.shape.coordinates)), function (point) {
                  group.path.push({
                    latitude: point[1],
                    longitude: point[0]
                  });
                });

                boundries.push(group);
              });

              return boundries;
            });
          }
        }
      });

    $urlRouterProvider.otherwise('/');
  }

})();
