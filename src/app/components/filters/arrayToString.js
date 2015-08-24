(function() {
  'use strict';

  angular
    .module('heatmapComponent')
    .filter('arrayToString', ArrayToStringFilter);

  /** @ngInject */
  function ArrayToStringFilter(_) {
    return function(inputArr) {

        if(inputArr.length === 0) {
            return 'None Selected';
        }

        return inputArr.join(', ');
    };
  }
})();
