(function() {
  'use strict';

  angular
    .module('heatmapComponent')
    .config(config);

  /** @ngInject */
  function config($logProvider, toastr, uiGmapGoogleMapApiProvider, $mdThemingProvider, $mdIconProvider) {
    // Enable log
    $logProvider.debugEnabled(true);

    // Set options third-party lib
    toastr.options.timeOut = 3000;
    toastr.options.positionClass = 'toast-top-right';
    toastr.options.preventDuplicates = true;
    toastr.options.progressBar = true;

    uiGmapGoogleMapApiProvider.configure({
      key: 'AIzaSyBMhgWdfJFl1bz6fcnawbDoU5zKk2adcwc',
      v: '3.20',
      libraries: 'visualization'
    });

    $mdThemingProvider.theme('default')
      .primaryPalette('blue')
      .accentPalette('orange');
  }

})();
