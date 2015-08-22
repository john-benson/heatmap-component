(function() {
  'use strict';

  angular
    .module('heatmapComponent')
    .controller('MainController', MainController);

  /** @ngInject */
  function MainController($scope, moment, boundries, agencyServiceRequests, _, $timeout, $mdSidenav, $mdUtil, heatmapConfiguration) {
    var vm = this;

    var sparklineOptions = {
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

    var subSparklineOptions = _.cloneDeep(sparklineOptions);
    subSparklineOptions.chart.width = 220;
    subSparklineOptions.chart.margin = {
      top: 15,
      left: 10,
      right: 0,
      bottom: 0
    };

    vm.selectedAgency = 'License & Inspections';
    vm.selectedCategory = 'Maintenance Residential';
    vm.selectedStatus = 'Open';
    vm.selectedStartDate = moment(1435719600000);
    vm.selectedEndDate = moment(1438311600000);

    $scope.moment = moment;

    this.markerControls = {};
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

    this.buildTimeSeriesData = function (requestData, filterParams, startDate, endDate) {

      if (filterParams instanceof Date) {
        startDate = filterParams;
        endDate = startDate;
        filterParams = null;
      }

      var charts = {};

      for (var agencyName in requestData) {

        charts[agencyName] = {
          chartOptions: sparklineOptions,
          chartData : { },
          subCharts: { },
          showSubCharts: false,
          totalCount: 0
        };

        for (var category in requestData[agencyName]) {

          var categoryServiceRequests = _.pluck(requestData[agencyName][category], 'request');

          if (filterParams) {
            categoryServiceRequests = _.filter(categoryServiceRequests, filterParams);
          }

          var timeseriesData = vm.fillEmptyDays(_.countBy(categoryServiceRequests, function(item) {
            return item.requested_day;
          }), startDate, endDate);

          for ( var timestamp in timeseriesData ){
            var count = timeseriesData[timestamp];

            if(!charts[agencyName].chartData[timestamp]) {
              charts[agencyName].chartData[timestamp] = 0;
            }

            charts[agencyName].chartData[timestamp] += count;
            charts[agencyName].totalCount += count;
          }

          var items = this.convertAndSortTimeseriesData(timeseriesData);

          charts[agencyName].subCharts[category] = {
            chartOptions : subSparklineOptions,
            chartData: items,
            totalCount: _.reduce(items, function (total, item, iv) {
              return total + item.y
            }, 0)
          }
        }

        charts[agencyName].chartData = this.convertAndSortTimeseriesData(charts[agencyName].chartData);
      }

      return charts;
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

        for (var i = 0; i < vm.serviceRequests.length; i++ ) {
          var item = vm.serviceRequests[i];

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

      for (var i = 0; i < vm.serviceRequests.length; i++ ) {
        var item = vm.serviceRequests[i];
        if (gMap.getBounds().contains(new google.maps.LatLng(item.coords.latitude, item.coords.longitude)) && vm.map.zoom > 16) {
          vm.map.markers.push(item);
        }
      }
    };

    this.addAgency = function (agency) {
      vm.selectedAgencies.push(agency);
    };

    this.removeAgency = function (agency) {
      vm.selectedAgencies = _.remove(vm.selectedAgencies, function (item)item {
        return item === agency;
      });
    };

    this.addCategory = function (category) {
      vm.selectedCategories.push(category);
    };

    this.removeCategory = function (category) {
      vm.selectedCategories = _.remove(vm.selectedCategories, function (item)item {
        return item === category;
      });
    };

    this.showAgencyCategories = function (agency) {
      agency.showSubCharts = !agency.showSubCharts;
    };

    vm.serviceRequests = agencyServiceRequests[vm.selectedAgency][vm.selectedCategory];

    vm.sparklineAgencyCharts = vm.buildTimeSeriesData(agencyServiceRequests, {status : vm.selectedStatus}, vm.selectedStartDate, vm.selectedEndDate);

  }
})();
