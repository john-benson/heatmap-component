(function() {
  'use strict';

  angular
    .module('heatmapComponent')
    .controller('MainController', ['$scope', 'uiGmapGoogleMapApi', '$http', MainController]);

  /** @ngInject */
  function MainController($scope, GoogleMapsAPI, $http) {
    var vm = this;

    this.map = {
      center: {
        latitude: 45, longitude: -73
      },
      zoom: 8,
      markersId: 'mark'
    };

    this.markers = [
      {
        coords: {
          latitude: 45,
          longitude: -73
        },
        title: 'Marker 1',
        id: 1
      }
    ];


    $http.get('/app/data/phillyCoords.json').then(function (coordinates) {
      vm.map.boundries = [];

      var objs = coordinates.data.objects;

      for ( var i = 0; i < objs.length; i++ ) {
        var coordinates = objs[i].shape.coordinates,
            group = { id: i, path: [], stroke: { color: '#000000', weight: 3 } };

        for( var y = 0; y < coordinates.length; y++ ) {
          var coordGroup = coordinates[y][0];

          for ( var z = 0; z < coordGroup.length; z++ ) {
            group.path.push({
              latitude: coordGroup[0],
              longitude: coordGroup[1]
            });
          }
        }

        vm.map.boundries.push(group);
      }

      console.log(vm.map.boundries);
    });

    GoogleMapsAPI.then(function (maps){
    });

  }
})();
