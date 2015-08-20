(function() {
  'use strict';

  angular
    .module('heatmapComponent')
    .config(['$logProvider', 'toastr', 'uiGmapGoogleMapApiProvider', config]);

  /** @ngInject */
  function config($logProvider, toastr, uiGmapGoogleMapApi) {
    // Enable log
    $logProvider.debugEnabled(true);

    // Set options third-party lib
    toastr.options.timeOut = 3000;
    toastr.options.positionClass = 'toast-top-right';
    toastr.options.preventDuplicates = true;
    toastr.options.progressBar = true;

    uiGmapGoogleMapApi.configure({
      key: 'AIzaSyBMhgWdfJFl1bz6fcnawbDoU5zKk2adcwc',
      v: '3.20',
      libraries: 'visualization'
    });
  }

})();
