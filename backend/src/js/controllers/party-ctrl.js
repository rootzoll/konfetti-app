/**
 * Master Controller
 */

angular.module('RDash')
    .controller('PartyCtrl', ['$scope', '$stateParams', 'KonfettiApi', PartyCtrl]);

function PartyCtrl($scope, $stateParams, KonfettiApi) {

    $scope.geoMatchingEnabled = true;
    $scope.partyID = 0;
    $scope.saveButtonDisabled = "disabled";
   
    $scope.freshParty = {
        id : 0,
        name : "",
        detailText: "",
        contact: "",
        reviewLevel: 0,
        visibility : 0,
        newRequestMinKonfetti : 1,
        welcomeBalance: 0,
        lat: 0.0,
        lon: 0.0,
        meters: 0,
        sendKonfettiMode : 0,
        sendKonfettiWhiteList : [],
        sendKonfettiWhiteListCSV : ""
    };

    $scope.party = JSON.parse(JSON.stringify($scope.freshParty));

    $scope.$watchCollection('party', function(newValue, oldValue) {
       //console.log("watch party ("+(JSON.stringify(newValue)!=JSON.stringify(oldValue))+")");
        if (JSON.stringify(newValue)!=JSON.stringify(oldValue)) $scope.saveButtonDisabled = "active";
    });

    $scope.reviewOptions = [
        {id: 0, name: 'NONE - no review process, all tasks are public by posting'},
        {id: 1, name: 'TASKS - review on initial task creation, but user is free to post any additional info later'},
        {id: 2, name: 'EVERYTHING - all content visible to the public needs to get thru review process'}
    ];

    $scope.typeOptions = [
        {id: 0, name: 'PUBLIC - for everybody to see an join'},
        {id: 1, name: 'PRIVATE - for everybody to see but needs invitation code to join'},
        {id: 2, name: 'HIDDEN - can just be seen and joined by invitation code'}
    ];

    $scope.spendOptions = [
        {id: 0, name: 'DEACTIVATED - for everybody to see an join'},
        {id: 2, name: 'JUST EARNED - only the konfetti someone earned doing a task can be transfered'},
        {id: 1, name: 'ALL - all konfetti can be transfered between users'}
    ];
    
    $scope.partyWhitelistArray2CSV = function() {
    	if ((typeof $scope.party.sendKonfettiWhiteList != "undefined") && (typeof $scope.party.sendKonfettiWhiteList != null)) {
       		$scope.party.sendKonfettiWhiteListCSV = $scope.party.sendKonfettiWhiteList.join(", ");
       } else {
       		alert("NO WL");
       }
    };

    if (typeof $stateParams.id != "undefined") {

        $scope.partyID = $stateParams.id;
        if ((typeof $scope.partyID == "undefined") || ($scope.partyID==null) || ($scope.partyID==0)) {
            console.log("no need to load user ...");
        } else {
            KonfettiApi.loadParty($scope.partyID, function(party){
                // WIN
                $scope.party = party;
                $scope.partyWhitelistArray2CSV();
            }, function(){
                // FAIL
                alert("FAIL load party "+$scope.partyID);
                $scope.partyID=0;
            });
        }
    }

    $scope.buttonNewParty = function() {
        $scope.party = JSON.parse(JSON.stringify($scope.freshParty));
        $scope.saveButtonDisabled = "disabled";
        KonfettiApi.modalAlert("OK. Fill out form & the click 'Create Party'");
    };

    $scope.buttonGenerateAdminCodes = function() {

        var adminCodes = null;
        var reviewCodes = null;

        var bothCodesAreRead = function() {
            alert("ADMIN CODES: "+JSON.stringify(adminCodes)+" REVIEW CODES: "+JSON.stringify(reviewCodes));
        };

        KonfettiApi.generateCodes($scope.partyID, 3, 'admin', function(codes){
            // WIN
            adminCodes = codes;
            if (reviewCodes!=null) bothCodesAreRead();
        }, function() {
            // FAIL
            alert("FAILED Admin codes");
        });

        KonfettiApi.generateCodes($scope.partyID, 10, 'review', function(codes){
            // WIN
            reviewCodes = codes;
            if (adminCodes!=null) bothCodesAreRead();
        }, function() {
            // FAIL
            alert("FAILED Review codes");
        });
    };

    $scope.buttonDeleteAdminCodes = function() {
        alert("TODO: buttonDeleteAdminCodes");
    };

    $scope.generateKonfetti = function() {
        KonfettiApi.generateKonfetti($scope.partyID, 10, 100, function(res) {
            // TODO - better feedback later
            alert(JSON.stringify(res));
        }, function() {
            alert("generateKonfetti FAILED");
        });
    }

    // checks if user inputs are valid values
    $scope.inputsAreValid = function() {

        if (($scope.party.name.length<3) || ($scope.party.name.length>25)) {
            KonfettiApi.modalAlert("Name needs to be between 3 and 20 chars.");
            return false;
        }

        if ($scope.party.detailText.length==0) {
            KonfettiApi.modalAlert("Please enter any editorial or general info about party.");
            return false;
        }

        if ($scope.party.contact.length==0) {
            KonfettiApi.modalAlert("Contact is missing");
            return false;
        }

        if (!(($scope.party.contact.indexOf("@")>0) || ($scope.party.contact.indexOf("http")==0))) {
            KonfettiApi.modalAlert("Contact needs to be a email or an link to a website (starts with http:// or https://).");
            return false;
        }

        if ($scope.party.newRequestMinKonfetti<0) {
            alert("Minimum konfetti on task creation cannot be negative.");
            return false;
        }

        if ($scope.party.welcomeBalance<0) {
            KonfettiApi.modalAlert("Welcome konfetti cannot be negative.");
            return false;
        }

        // if no geo matching - reset values
        console.dir($scope.geoMatchingEnabled);
        if ((!$scope.geoMatchingEnabled) || ($scope.party.visibility==2)) {

            $scope.party.lat = 0;
            $scope.party.lon = 0;
            $scope.party.meters = 0;

        } else {

            if ($scope.party.meters<0) {
                KonfettiApi.modalAlert("Radius cannot be negative.");
                return false;
            }

            if ($scope.party.meters==0) {
                KonfettiApi.modalAlert("Radius needs to be bigger than 0.");
                return false;
            }

            if (($scope.party.lat<-90) || ($scope.party.lat>90)) {
                KonfettiApi.modalAlert("Latitude not between -90 and +90 ");
                return false;
            }

            if (($scope.party.lon<-180) || ($scope.party.lon>180)) {
                KonfettiApi.modalAlert("Longitude not between -180 and +180 ");
                return false;
            }

            if (($scope.party.lon==0) && ($scope.party.lat==0)) {
                KonfettiApi.modalAlert("Please set Latitude/Longitude as center of your area or deactivated area matching.");
                return false;
            }

        }
        
        // convert konfetti spend whitelist CSV --> ARRAY
        $scope.party.sendKonfettiWhiteListCSV = $scope.party.sendKonfettiWhiteListCSV.trim();
        if ($scope.party.sendKonfettiWhiteListCSV.length>0) {
        	$scope.party.sendKonfettiWhiteList = $scope.party.sendKonfettiWhiteListCSV.split(',');
        	for (var i=0; i<$scope.party.sendKonfettiWhiteList.length; i++) {
        		$scope.party.sendKonfettiWhiteList[i] = $scope.party.sendKonfettiWhiteList[i].trim();
        	}
        }

        return true;
    };

    $scope.saveParty = function(geomatching) {

        $scope.geoMatchingEnabled = geomatching;

        if (!$scope.inputsAreValid()) return;

        if ($scope.party.id==0) {

            // --> CREATE PARTY
            KonfettiApi.createParty($scope.party, function(party){
                // WIN
                $scope.party = party;
                $scope.partyWhitelistArray2CSV();
                $scope.saveButtonDisabled = "disabled";
                KonfettiApi.modalAlert("The Party got created and is online.", function(){
                    KonfettiApi.modalAlert("Now create PARTY-ADMIN CODES and send with info material to the party editorial admin - see the new options at the top.");
                });
            }, function() {
                // FAIL
                KonfettiApi.modalAlert("FAIL. Was not able to create party.");
            });

        } else {

            // --> UPDATE PARTY
            KonfettiApi.updateParty($scope.party, function(party){
                // WIN
                KonfettiApi.modalAlert("OK. Updates stored in party.");
                $scope.party = party;
                $scope.partyWhitelistArray2CSV();
            }, function() {
                // FAIL
                KonfettiApi.modalAlert("FAIL. Was not able to update party.");
            });

        }

        $scope.saveButtonDisabled = "disabled";
    };

    $scope.buttonDeleteParty = function() {
        KonfettiApi.deleteParty($scope.party, function(){
            // WIN
            KonfettiApi.modalAlert("OK. Party '"+$scope.party.id+"' was deleted.");
            $scope.party = JSON.parse(JSON.stringify($scope.freshParty));
        }, function() {
            // FAIL
            KonfettiApi.modalAlert("FAIL. Was not able to delete party.");
        });
    };

}
