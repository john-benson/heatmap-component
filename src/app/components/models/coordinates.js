(function() {
  'use strict';

  angular
    .module('heatmapComponent')
    .factory('Coordinates', ['$resource', Coordinates]);

  function Coordinates($resource) {
    return $resource('app/data/phillyCoords.json');
  }
})();
