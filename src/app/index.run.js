(function() {
  'use strict';

  angular
    .module('heatmapComponent')
    .run(runBlock);

  /** @ngInject */
  function runBlock($log) {

    $log.debug('runBlock end');
  }

})();
