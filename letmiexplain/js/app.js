var app = angular.module('lmeApp', ['ui.grid', 'ui.grid.moveColumns']);

app.controller('MainCtrl',
    ['$scope', '$rootScope', 'phoneData',
    function($scope, $rootScope, phoneData) {

        $scope.carriers = {
            EE: [1800, 2600],
            O2: [800],
            Vodafone: [800, 2600],
            Three: [800, 1800],
            "Asda Mobile": [],
            "BT Mobile": [800, 1800],
            "iD Mobile": [1800],
            "Freedom Pop": [800, 1800],
            GiffGaff: [800],
            "Lebara Mobile": [],
            "Lyca Mobile": [800],
            "Talk Mobile": [],
            TalkTalk: [800],
            "Tesco Mobile": [800],
            "The People's Operator": [800, 1800],
            "Virgin Mobile": []
        };

        $scope.visibleFields = {
            edition: true,
            model: true,
            screenSize: true,
            battery: true,
            minMemory: true,
            minStorage: true,
            cardSlot: false,
            backCamera: true,
            frontCamera: false,
            colours: false,
            averagePrice: true,
            carriers: true,
            cpu: false,
            approxTax: false
        };

        $scope.filterText = {
            edition: "",
            model: "",
            screenSize: 0,
            battery: "",
            minMemory: "",
            minStorage: "",
            averagePrice: "",
            carriers: ""
        }

        $scope.updateVisibleFields = function(field) {
            for (var column in $scope.gridOptions.columnDefs) {
                if ($scope.gridOptions.columnDefs[column].field === field) {
                    $scope.gridOptions.columnDefs[column].visible = $scope.visibleFields[field];
                }
            }
            $scope.gridApi.grid.refresh();
        };

        $scope.gridOptions = {
            enableRowHeaderSelection: false,
            columnDefs: [
                {
                    field: 'edition',
                    displayName: 'Edition'
                },{
                    field: 'model',
                    displayName: 'Model'
                },{
                    field: 'screenSize',
                    displayName: "Screen Size",
                    cellTemplate: "partials/screen_size_cell.html",
                    visible: $scope.visibleFields.screenSize
                },{
                    field: 'minMemory',
                    displayName: "Memory",
                    cellTemplate: "partials/memory_cell.html",
                    visible: $scope.visibleFields.minMemory
                },{
                    field: 'minStorage',
                    displayName: "Storage",
                    cellTemplate: "partials/storage_cell.html",
                    visible: $scope.visibleFields.minStorage
                },{
                    field: 'cardSlot',
                    displayName: "Card Slot",
                    cellTemplate: "partials/true_false_cell.html",
                    visible: $scope.visibleFields.cardSlot
                },{
                    field: 'backCamera',
                    displayName: "Back Camera",
                    cellTemplate: "partials/camera_cell.html",
                    visible: $scope.visibleFields.backCamera
                },{
                    field: 'frontCamera',
                    displayName: "Front Camera",
                    cellTemplate: "partials/camera_cell.html",
                    visible: $scope.visibleFields.frontCamera
                },{
                    field: 'colours',
                    displayName: "Colours",
                    visible: $scope.visibleFields.colours
                },{
                    field: 'averagePrice',
                    displayName: "Average Price",
                    cellTemplate: "partials/price_cell.html",
                    visible: $scope.visibleFields.averagePrice
                },{
                    field: 'battery',
                    displayName: "Battery (mAH)",
                    visible: $scope.visibleFields.battery
                },{
                    field: 'bands',
                    displayName: "Compatible Carriers",
                    cellTemplate: "partials/bands_cell.html",
                    visible: $scope.visibleFields.carriers
                },{
                    field: 'cpu',
                    displayName: "CPU",
                    visible: $scope.visibleFields.cpu
                },{
                    field: 'approxTax',
                    displayName: "Approximate Import Tax",
                    visible: $scope.visibleFields.approxTax
                }
            ]
        };

        $scope.gridOptions.onRegisterApi = function(gridApi){
            $scope.gridApi = gridApi;
        };

        $scope.init = function() {
            phoneData.init(function(res) {
                $scope.phoneData = res;
                $scope.visibleData = $scope.phoneData;
                $scope.gridOptions.data = $scope.visibleData;
                setTimeout(function() {
                    $scope.$digest();
                });
            });
        };

        $scope.updateFilterText = function() {
            $scope.visibleData = [];
            for (var x = 0; x < $scope.phoneData.length; x++) {
                var filterOut = false;

                if ($scope.filterText.edition && $scope.phoneData[x].edition !== $scope.filterText.edition) {
                    filterOut = true;
                }

                if ($scope.filterText.name && $scope.phoneData[x].model.toLowerCase().indexOf($scope.filterText.name.toLowerCase()) == -1) {
                    filterOut = true;
                }

                if ($scope.filterText.screenSize && $scope.phoneData[x].screenSize < $scope.filterText.screenSize) {
                    filterOut = true;
                }

                if ($scope.filterText.minMemory && $scope.phoneData[x].minMemory < $scope.filterText.minMemory && $scope.phoneData[x].maxMemory < $scope.filterText.minMemory) {
                    filterOut = true;
                }

                if ($scope.filterText.minStorage && $scope.phoneData[x].minStorage < $scope.filterText.minStorage  && $scope.phoneData[x].maxStorage < $scope.filterText.minStorage) {
                    filterOut = true;
                }

                if ($scope.filterText.averagePrice && ($scope.phoneData[x].averagePrice > $scope.filterText.averagePrice || !$scope.phoneData[x].averagePrice)) {
                    filterOut = true;
                }

                if ($scope.filterText.carriers) {
                    var matches = false;

                    var bands = JSON.parse($scope.filterText.carriers);
                    for (var y = 0; y < bands.length; y++) {
                        if ($scope.phoneData[x].bands.indexOf(bands[y]) !== -1) {
                            matches = true;
                        }
                    }

                    if (!matches) {
                        filterOut = true;
                    }
                }

                if (!filterOut) {
                    $scope.visibleData.push($scope.phoneData[x]);
                }
            }
            $scope.gridOptions.data = $scope.visibleData;

            setTimeout(function() {
                $scope.$digest();
            });
        };
    }
]);

app.service('phoneData',
    ['$http',
    function($http) {

        this.phoneData = [];

        this.init = function(cb) {
            $http.get('./phoneData.json').then(function(res) {
                this.phoneData = res.data.phoneData;
                cb(this.phoneData);
            }).catch(function(err) {
                cb(this.phoneData);
            });
        };
    }
]);

app.filter('carrierFilter', function() {
    var bandsUsed = {
        EE: [1800, 2600],
        O2: [800],
        Vodafone: [800, 2600],
        Three: [800, 1800],
        "Asda Mobile": [],
        "BT Mobile": [800, 1800],
        "iD Mobile": [1800],
        "Freedom Pop": [800, 1800],
        GiffGaff: [800],
        "Lebara Mobile": [],
        "Lyca Mobile": [800],
        "Talk Mobile": [],
        TalkTalk: [800],
        "Tesco Mobile": [800],
        "The People's Operator": [800, 1800],
        "Virgin Mobile": []
    };

    return function(input) {
        var bands = input.split(",");
        var carriers = [];

        for (var x = 0; x < bands.length; x++) {
            
            for (var carrier in bandsUsed) {
                if (bandsUsed[carrier].indexOf(parseInt(bands[x].trim())) !== -1) {
                    carriers .push(carrier);
                }
            }
        }

        return carriers.join(", ");
    };
});

app.directive('debounce', function($rootScope, $timeout) {
    return {
        restrict: 'A',
        require: 'ngModel',
        priority: 99,
        link: function(scope, elm, attr, ngModelCtrl) {
            if (attr.type === 'radio' || attr.type === 'checkbox') return;

            elm.unbind('input');

            var debounce;
            elm.bind('input', function() {
                $timeout.cancel(debounce);
                debounce = $timeout( function() {
                    scope.$apply(function() {
                        ngModelCtrl.$setViewValue(elm.val());
                    });
                }, 300);
            });
            elm.bind('blur', function() {
                scope.$apply(function() {
                    ngModelCtrl.$setViewValue(elm.val());
                });
            });
        }

    }
});