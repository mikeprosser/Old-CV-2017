var app = angular.module("deckTrackerApp", ['chart.js']);

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

        $scope.$on('deckAltered', function(ev, info) {
            for (var key in info) {
                if ($scope.editingDeck.hasOwnProperty(key)) {
                    $scope.editingDeck[key] = info[key];
                }
            }
        });
    }
])

.controller("deckController", ["$scope", "netrunnerDBService", "deckTrackerService",
    function($scope, netrunnerDBService, deckTrackerService) {

        $scope.colors = ["#99C95E", "#BF4840"];

        $scope.init = function() {
            $scope.newMatch = null;
            $scope.editingDeck = JSON.parse(JSON.stringify($scope.editingDeck));

            $scope.enemyFactions;

            if ($scope.editingDeck.type === "runner") {
                $scope.enemyFactions = ["Haas-Bioroid", "Jinteki", "NBN", "Weyland"];
            } else {
                $scope.enemyFactions = ["Anarch", "Criminal", "Shaper", "Adam", "Apex", "Sunny"];
            }

            // The first array is for wins, the second is for losses
            $scope.deckStats = [[],[]];

            var x;

            for (x = 0; x < $scope.enemyFactions.length; x++) {
                $scope.deckStats[0].push(0);
                $scope.deckStats[1].push(0);
            }

            if ($scope.editingDeck.matches) {
                for (x = 0; x < $scope.editingDeck.matches.length; x++) {
                    var match = $scope.editingDeck.matches[x];
                    var ndx = $scope.enemyFactions.indexOf(match.opponentId.faction);
                    if (match.won === "true") {
                        $scope.deckStats[0][ndx]++;
                    } else {
                        $scope.deckStats[1][ndx]++;
                    }
                }
            }

            netrunnerDBService.getCard($scope.editingDeck.identity).then(function(res) {
                $scope.deckIdentity = res.data[0];
                $scope.idImage = netrunnerDBService.getImage($scope.deckIdentity);
            });
        };

        $scope.addMatch = function() {
            $scope.newMatch = {
                opponentId: null,
                won: null,
                date: new Date()
            };
        };

        $scope.confirmMatch = function() {
            var accept = true;
            if (!$scope.newMatch.opponentId || !$scope.newMatch.won) {
                accept = false;
            }

            if (accept) {
                if (!$scope.editingDeck.matches) {
                    $scope.editingDeck.matches = [];
                }
                $scope.editingDeck.matches.push(JSON.parse(JSON.stringify($scope.newMatch)));

                var ndx = $scope.enemyFactions.indexOf($scope.newMatch.opponentId.faction);
                if ($scope.newMatch.won === "true") {
                    $scope.deckStats[0][ndx]++;
                } else {
                    $scope.deckStats[1][ndx]++;
                }

                $scope.newMatch = null;
                deckTrackerService.saveDeck($scope.editingDeck);
                $scope.$emit('deckAltered', $scope.editingDeck);
            } else {
                alert("More information required");
            }
        };

        $scope.cancelMatch = function() {
            $scope.newMatch = null;
        };

        $scope.deleteMatch = function(index) {
            $scope.editingDeck.matches.splice(index, 1);
        };

        $scope.save = function() {
            deckTrackerService.saveDeck($scope.editingDeck);
            $scope.$emit('deckAltered', $scope.editingDeck);
            $scope.closeDeck();
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

            deckTrackerService.saveDeck(deck);
            $scope.$parent.reFetchDecks();
            $scope.$parent.closeNew();
        };

        $scope.cancel = function() {
            $scope.$parent.closeNew();
        }
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
                        alert("One of your decks appears to have become corrupted");
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
        saveDeck: function(data) {
            if (!data.deckId) {
                data.deckId = new Date().getTime();
            }
            localStorage.setItem("deck-" + data.deckId, JSON.stringify(data));
        }
    };

    return functions;
}])

// Currently there doesn't seem to be a way to query NRDB by a search term (i.e. type === id) so the ids are hard
// coded here and individual cards are retrieved if needed
.service("netrunnerDBService", ["$http", function($http) {

    var initted = false;
    var netrunnerdbLink = "http://netrunnerdb.com"

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
        },
        getCard: function(card) {
            return $http.get(netrunnerdbLink + "/api/card/" + card.id);
        },
        getImage: function(cardData) {
            return netrunnerdbLink + cardData.imagesrc;
        }
    }

    return functions;
}]);
