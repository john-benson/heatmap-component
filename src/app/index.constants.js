/* global malarkey:false, toastr:false, moment:false */
(function() {
  'use strict';

  angular
    .module('heatmapComponent')
      .constant('toastr', toastr)
      .constant('moment', moment)
      .constant('_', _);

})();
