(function() {
  'use strict';

  angular
    .module('heatmapComponent')
    .controller('MainController', MainController);

  /** @ngInject */
  function MainController($scope, moment, boundries, agencyServiceRequests, _, $timeout, $mdSidenav, $mdUtil, heatmapConfiguration) {
    var vm = this;

    var defaultSparklineChartOptions = {
      chart: {
        type: 'sparklinePlus',
        showLastValue: false,
        height: 50,
        width: 250,
        margin: {
          top: 15,
          left: 30,
          right: 0,
          bottom: 0
        },
        transitionDuration: 250,
        xTickFormat: function (d) {
          return d3.time.format('%b %d')(new Date(+d));
        },
        yTickFormat: function (d) {
          return +d;
        }
      }
    };

    // TODO Change this be dynamic
    var serviceRequests = agencyServiceRequests['License & Inspections']['Maintenance Residential'];

    $scope.moment = moment;

    this.markerControls = {};
    this.startDate = moment(1435719600000);
    this.endDate = moment(1438311600000);
    this.sparklineAgencyCharts = {};

    this.map = {
      center: {
        latitude: 40.069482,
        longitude: -74.976142
      },
      zoom: 12,
      markers: [],
      markersController: {},
      boundries: boundries,
      events: {
        idle: function (gMap, eventName, originalEventArgs) {
          // set a timeout so that the gMap.getBounds() accuartely reflects the correct number
          $timeout(function () {
            vm.showMarkers(gMap);
            vm.showHeatmapPoints(gMap);
          }, 100);
        },
      },

      heatLayerCreated: function (layer) {
        vm.heatmapLayer = layer;
      }
    };

    this.fillEmptyDays = function (timeseries, startDate, endDate) {
      for (var x = startDate.clone(); x.diff(endDate, 'days') <= 0; x.add(1, 'days') ) {
        if (!timeseries[x.valueOf()]) {
          timeseries[x.valueOf()] = 0;
        }
      }

      return timeseries;
    };

    this.buildTimeSeriesData = function () {

      for (var agencyName in agencyServiceRequests) {

        this.sparklineAgencyCharts[agencyName] = {
          chartOptions: defaultSparklineChartOptions,
          chartData : { },
          subCharts: { },
          totalCount: 0
        };

        for (var category in agencyServiceRequests[agencyName]) {

          var timeseriesData = vm.fillEmptyDays(_.countBy(agencyServiceRequests[agencyName][category], function(item) {
            return item.request.requested_day;
          }), this.startDate, this.endDate);

          for ( var timestamp in timeseriesData ){
            var count = timeseriesData[timestamp];

            if(!this.sparklineAgencyCharts[agencyName].chartData[timestamp]) {
              this.sparklineAgencyCharts[agencyName].chartData[timestamp] = 0;
            }

            this.sparklineAgencyCharts[agencyName].chartData[timestamp] += count;
            this.sparklineAgencyCharts[agencyName].totalCount += count;
          }

          var items = this.convertAndSortTimeseriesData(timeseriesData);

          this.sparklineAgencyCharts[agencyName].subCharts[category] = {
            chartOptions : defaultSparklineChartOptions,
            chartData: items,
            totalCount: _.reduce(items, function (total, item, iv) {
              return total + item.y
            }, 0)
          }
        }

        this.sparklineAgencyCharts[agencyName].chartData = this.convertAndSortTimeseriesData(this.sparklineAgencyCharts[agencyName].chartData);

      }
    };

    this.convertAndSortTimeseriesData = function (data) {
     return _.sortBy(_.map(data, function (count, time) {
        return {
          x: +time,
          y: count
        };
      }), 'x')
    };

    this.openSideMenu = function (id) {
      return $mdSidenav(id).toggle();
    };

    this.showHeatmapPoints = function (gMap) {
      if(vm.heatmapLayer) {

        var layerData = [],
            modFactor = 16 - vm.map.zoom;

        for (var i = 0; i < serviceRequests.length; i++ ) {
          var item = serviceRequests[i];

          if (gMap.getBounds().contains(new google.maps.LatLng(item.coords.latitude, item.coords.longitude)) &&
              vm.map.zoom > 9 &&
              (modFactor > 0 ? i % modFactor === 0 : true)) {
            layerData.push(new google.maps.LatLng(item.coords.latitude, item.coords.longitude));
          }
        }

        vm.heatmapLayer.setData(layerData);
      }
    };

    this.showMarkers = function (gMap) {
      vm.map.markers = [];

      for (var i = 0; i < serviceRequests.length; i++ ) {
        var item = serviceRequests[i];
        if (gMap.getBounds().contains(new google.maps.LatLng(item.coords.latitude, item.coords.longitude)) && vm.map.zoom > 16) {
          vm.map.markers.push(item);
        }
      }
    };

    this.buildTimeSeriesData();

  }
})();
