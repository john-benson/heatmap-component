(function() {
  'use strict';

  angular
    .module('heatmapComponent')
    .controller('MainController', MainController);

  /** @ngInject */
  function MainController($scope, moment, boundries, serviceRequests, agencyServiceRequests, _, $timeout, $mdSidenav, heatmapConfiguration, $q) {
    var vm = this;

    var sparklineOptions = {
      chart: {
        type: 'sparklinePlus',
        showLastValue: false,
        height: 50,
        width: 250,
        margin: {
          top: 15,
          left: 35,
          right: 0,
          bottom: 0
        },
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

    vm.statuses = _.uniq(_.pluck(_.pluck(serviceRequests, 'request'), 'status'));
    vm.selectedStatuses = ['Open'];
    vm.selectedAgencies = {'License & Inspections' : _.keys(agencyServiceRequests['License & Inspections'])};
    vm.selectedStartDate = 1435719600000;
    vm.selectedEndDate = 1438311600000;

    vm.debouncedMapRedraw = _.debounce(function () {
      vm.showMarkers(vm.gMap);
      vm.showHeatmapPoints(vm.gMap);
      $scope.$apply();
    }, 250);

    vm.debouncedUpdateChartsAndRequests = _.debounce(function () {
      vm.updateCharts();
      vm.updateServiceRequests();
      $scope.$apply();
    }, 250);

    vm.dateSlider = {
      ceil: 1438311600000, // to be set to today's date
      floor: 1435719600000, // to be set to 30 days before today's date
      onChange: vm.debouncedUpdateChartsAndRequests,
      translate: function (val) {
        return moment(val).format('ll');
      }
    };

    $scope.moment = moment;

    vm.markerControls = {};
    vm.sparklineAgencyCharts = {};

    vm.map = {
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
          vm.gMap = gMap;

          vm.debouncedMapRedraw();
        },
      },

      heatLayerCreated: function (layer) {
        vm.heatmapLayer = layer;
      }
    };

    vm.fillEmptyDays = function (timeseries, startDate, endDate) {
      for (var x = startDate.clone(); x.diff(endDate, 'days') <= 0; x.add(1, 'days') ) {
        if (!timeseries[x.valueOf()]) {
          timeseries[x.valueOf()] = 0;
        }
      }

      return timeseries;
    };

    vm.buildTimeSeriesData = function (requestData, startDate, endDate) {

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

          var categoryServiceRequests = _.filter(_.pluck(requestData[agencyName][category], 'request'), function (item) {
            return item.requested_day >= startDate && item.requested_day <= endDate
          });

          categoryServiceRequests = _.filter(categoryServiceRequests, function (item) {
            return _.contains(vm.selectedStatuses, item.status);
          });

          var timeseriesData = vm.fillEmptyDays(_.countBy(categoryServiceRequests, function(item) {
            return item.requested_day;
          }), moment(startDate), moment(endDate));

          for ( var timestamp in timeseriesData ){
            var count = timeseriesData[timestamp];

            if(!charts[agencyName].chartData[timestamp]) {
              charts[agencyName].chartData[timestamp] = 0;
            }

            charts[agencyName].chartData[timestamp] += count;
            charts[agencyName].totalCount += count;
          }

          var items = vm.convertAndSortTimeseriesData(timeseriesData);

          charts[agencyName].subCharts[category] = {
            chartOptions : subSparklineOptions,
            chartData: items,
            totalCount: _.reduce(items, function (total, item, iv) {
              return total + item.y
            }, 0)
          }
        }

        charts[agencyName].chartData = vm.convertAndSortTimeseriesData(charts[agencyName].chartData);
      }
      return charts;
    };

    vm.convertAndSortTimeseriesData = function (data) {
      return _.sortBy(_.map(data, function (count, time) {
        return {
          x: +time,
          y: count
        };
      }), 'x');
    };

    vm.openSideMenu = function (id) {
      vm.sideBarOpened = !vm.sideBarOpened;

      return $mdSidenav(id).toggle();
    };

    vm.showHeatmapPoints = function (gMap) {
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

    vm.showMarkers = function (gMap) {
      vm.map.markers = [];

      for (var i = 0; i < vm.serviceRequests.length; i++ ) {
        var item = vm.serviceRequests[i];
        if (gMap.getBounds().contains(new google.maps.LatLng(item.coords.latitude, item.coords.longitude)) && vm.map.zoom > 16) {
          vm.map.markers.push(item);
        }
      }
    };

    vm.showAgencyCategories = function (agency) {
      agency.showSubCharts = !agency.showSubCharts;
    };

    vm.updateServiceRequests = function () {
      console.time('updateServiceRequests');

      vm.serviceRequests = [];
      for (var agency in vm.selectedAgencies ){
        for (var i = 0; i < vm.selectedAgencies[agency].length; i++){
          var curAgency = vm.selectedAgencies[agency][i],
              curRequests = agencyServiceRequests[agency][curAgency];

          vm.serviceRequests = vm.serviceRequests.concat(_.filter(curRequests, function (item) {
              return _.contains(vm.selectedStatuses, item.request.status) &&
                    item.request.requested_day >= vm.selectedStartDate &&
                    item.request.requested_day <= vm.selectedEndDate;
          }));
        }
      }

      if(vm.gMap){
        vm.showMarkers(vm.gMap);
        vm.showHeatmapPoints(vm.gMap);
      }

      console.timeEnd('updateServiceRequests');
    }

    vm.isAgencySelected = function(agency) {
      return !!vm.selectedAgencies[agency];
    }

    vm.isCategorySelected = function(agency, category) {
      return vm.selectedAgencies[agency] ? _.contains(vm.selectedAgencies[agency], category) : false;
    }

    vm.toggleAgency = function (agency) {
      if(vm.isAgencySelected(agency)) {
        delete vm.selectedAgencies[agency];
      } else {
        vm.selectedAgencies[agency] = _.keys(agencyServiceRequests[agency]);
      }

      vm.updateServiceRequests();
    }

    vm.toggleCategory = function(agency, category) {
      if(vm.isCategorySelected(agency, category)) {
        vm.selectedAgencies[agency] = _.pull(vm.selectedAgencies[agency], category);
      } else {
        vm.selectedAgencies[agency].push(category);
      }

      vm.updateServiceRequests();
    }

    vm.isStatusSelected = function (status) {
      return _.contains(vm.selectedStatuses, status);
    };

    vm.toggleStatus = function (status) {
      console.time('toggleStatus');
      if(vm.isStatusSelected(status)){
        vm.selectedStatuses = _.pull(vm.selectedStatuses, status);
      } else {
        vm.selectedStatuses.push(status);
      }

      // defer data updates so we can update the screen immediately
      vm.debouncedUpdateChartsAndRequests();
    }

    vm.updateCharts = function () {
      console.time("updateCharts");
      vm.sparklineAgencyCharts = vm.buildTimeSeriesData(agencyServiceRequests, vm.selectedStartDate, vm.selectedEndDate);
      console.timeEnd("updateCharts");
    };

    vm.updateServiceRequests();
    vm.updateCharts();
  }
})();
