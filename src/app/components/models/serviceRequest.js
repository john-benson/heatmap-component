(function() {
  'use strict';

  angular
    .module('heatmapComponent')
    .factory('ServiceRequest', ['$resource', ServiceRequestService]);

  /** @ngInject */
  function ServiceRequestService($resource) {
    return $resource('/app/data/phillyData.json');
  }
})();
