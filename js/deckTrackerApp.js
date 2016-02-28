var app = angular.module("deckTrackerApp", []);

app.controller("deckTrackerController", ["$scope", "netrunnerDBService", "deckTrackerService",
    function($scope, netrunnerDBService, deckTrackerService) {

        $scope.addingNew = false;
        $scope.editingDeck = null;;

        $scope.init = function() {
            netrunnerDBService.init(function() {
                $scope.corpIds = netrunnerDBService.getCorpIds();
                $scope.runnerIds = netrunnerDBService.getRunnerIds();
                $scope.$digest();
            });

            deckTrackerService.init(function() {
                var decksData = deckTrackerService.getDecks();
                $scope.corpDecks = decksData.corp;
                $scope.runnerDecks = decksData.runner;
            });
        };

        $scope.reFetchDecks = function() {
            deckTrackerService.init(function() {
                var decksData = deckTrackerService.getDecks();
                $scope.corpDecks = decksData.corp;
                $scope.runnerDecks = decksData.runner;
            });
        };

        $scope.addNew = function(isCorp) {
            $scope.addingNew = true;
            $scope.newDeckIsCorp = isCorp;
        };

        $scope.closeNew = function() {
            $scope.addingNew = false;
        };

        $scope.editDeck = function(deck) {
            $scope.editingDeck = deck;
        };

        $scope.closeDeck = function() {
            $scope.editingDeck = null;
        };
    }
])

.controller("deckController", ["$scope",
    function($scope) {

        $scope.init = function() {
            $scope.deck = $scope.editingDeck;
        };

        $scope.close = function() {
            $scope.$parent.closeDeck();
        };

    }
])

.controller("addingNewController", ["$scope", "deckTrackerService",
    function($scope, deckTrackerService) {

        $scope.data = {
            deckName: "",
            id: null
        };

        $scope.init = function() {
            $scope.isCorp = $scope.$parent.newDeckIsCorp;
        };

        $scope.submit = function() {
            if (!$scope.data.deckName) {
                return alert("Please enter a deck name");
            }

            if (!$scope.data.id) {
                return alert("Please choose an id");
            }

            var deck = {
                name: $scope.data.deckName,
                identity: $scope.data.id,
                type: $scope.isCorp ? "corp" : "runner"
            }

            deckTrackerService.saveDeck($scope.data.deckName, deck);
            $scope.$parent.reFetchDecks();
            $scope.$parent.closeNew();
        };
    }
])

.service("deckTrackerService", [function() {

    var corpDecks = [];
    var runnerDecks = [];

    var functions = {
        init: function(cb) {
            corpDecks = [];
            runnerDecks = [];

            for (var key in localStorage) {
                if (key.indexOf("deck-") === 0) {
                    try {
                        var deck = localStorage[key];
                        deck = JSON.parse(deck);
                        if (deck.type === "runner") {
                            runnerDecks.push(deck);
                        } else {
                            corpDecks.push(deck);
                        }
                    } catch(e) {
                        alert("One of your decks appears to have become corrupted")
                    }
                }
            }
            cb();
        },
        getDecks: function() {
            return {
                corp: corpDecks,
                runner: runnerDecks
            };
        },
        saveDeck: function(name, data) {
            localStorage.setItem("deck-" + name, JSON.stringify(data));
        }
    }

    return functions;
}])

// Currently there doesn't seem to be a way to query NRDB by a search term (i.e. type === id) so the ids are hard
// coded here and individual cards are retrieved if needed
.service("netrunnerDBService", ["$http", function($http) {

    var initted = false;

    var corpIds = [];
    var runnerIds = [];

    $http.get('./js/ids.json')
        .then(function(res){
            corpIds = res.data.corps;
            runnerIds = res.data.runners;
            initted = true;
        });

    var functions = {
        init: function(cb) {
            if (initted) {
                return cb();
            } else {
                setTimeout(function() {
                    functions.init(cb);
                }, 100);
            }
        },
        getCorpIds: function() {
            return corpIds;
        },
        getRunnerIds: function() {
            return runnerIds;
        }
    }

    return functions;
}]);
