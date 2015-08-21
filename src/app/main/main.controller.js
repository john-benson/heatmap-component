(function() {
  'use strict';

  angular
    .module('heatmapComponent')
    .controller('MainController', MainController);

  /** @ngInject */
  function MainController($scope, moment, boundries, serviceRequests, _) {
    var vm = this;

    $scope.moment = moment;

    this.markerControls = {};

    this.map = {
      center: {
        latitude: 40.069482,
        longitude: -74.976142
      },
      zoom: 12,
      markers: serviceRequests,
      boundries: boundries,
      events: {
        'bounds_changed': function (maps, eventName, args) {
          console.log('bounds_changed');
        },
        'zoom_changed': function (maps, eventName, args) {
          console.log('zoom_changed');
        }
      },
      heatLayerCreated: function (layer) {
        layer.setData(_.map(serviceRequests, function (item, i) {
         return new google.maps.LatLng(item.coords.latitude, item.coords.longitude);
        }));
      }
    };

    $scope.hideMarkers = function () {
      var gMarkers = vm.markerControls.getGMarkers();
    };
  }
})();
