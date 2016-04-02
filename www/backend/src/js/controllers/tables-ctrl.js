// when injecting services adjusr also controller declaration above

angular.module('RDash')
.controller('TablesCtrl', ['$scope', 'KonfettiApi' , '$location', TablesCtrl]);

function TablesCtrl($scope, KonfettiApi, $location) {

    $scope.parties = [];
    $scope.users = [];

    $scope.getTypeInfo = function(party) {
        if (party.visibility==0) return "public";
        if (party.visibility==1) return "private/listed";
        if (party.visibility==2) return "private";
        if (party.visibility==-1) return "deactivated";
        return "-";
    };

    $scope.editParty = function(id) {
        $location.path('/party/'+id);
    };

    $scope.optionsUser = function(id) {
        alert("TODO: Give Options on User("+id+")");
    };

    $scope.refreshParties = function () {

        $scope.parties = null;
        KonfettiApi.loadAllParties(function(parties){
        // WIN

            $scope.parties = parties;

            //console.log("OK PARTIES:");
            //console.dir(parties);

        }, function(){
        // FAIL
            alert("FAIL loading parties");
        });

    };

    $scope.refreshUsers = function () {

        $scope.users = null;
        KonfettiApi.loadAllUsers(function(users){
            // WIN

            $scope.users = users;

            console.log("OK USERS:");
            console.dir(users);

        }, function(){
            // FAIL
            alert("FAIL loading users");
        });

    };

}