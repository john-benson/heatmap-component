(function() {
  'use strict';

  angular
    .module('heatmapComponent')
    .filter('keysToString', KeysToStringFilter);

  /** @ngInject */
  function KeysToStringFilter(_) {
    return function(inputObj) {
        var keys = _.keys(inputObj);

        if(keys.length === 0) {
            return 'None Selected';
        }

        return keys.join(', ');
    };
  }
})();
