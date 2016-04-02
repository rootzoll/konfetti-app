/**
 * Master Controller
 */

angular.module('RDash')
    .controller('MasterCtrl', ['$scope', '$cookieStore', 'KonfettiApi' , MasterCtrl]);

// when injecting services adjusr also controller declaration above
function MasterCtrl($scope, $cookieStore, KonfettiApi) {

    var emptyData = {
        numberOfUsers: "?",
        numberOfParties: "?",
        numberOfKonfetti : "?",
        numberOfTasks : "?"
    };

    $scope.data = JSON.parse(JSON.stringify(emptyData));

    /**
     * Sidebar Toggle & Cookie Control
     */
    var mobileView = 992;

    $scope.getWidth = function() {
        return window.innerWidth;
    };

    $scope.$watch($scope.getWidth, function(newValue, oldValue) {
        if (newValue >= mobileView) {
            if (angular.isDefined($cookieStore.get('toggle'))) {
                $scope.toggle = ! $cookieStore.get('toggle') ? false : true;
            } else {
                $scope.toggle = true;
            }
        } else {
            $scope.toggle = false;
        }

    });

    $scope.toggleSidebar = function() {
        $scope.toggle = !$scope.toggle;
        $cookieStore.put('toggle', $scope.toggle);
    };

    window.onresize = function() {
        $scope.$apply();
    };

    $scope.refreshData = function() {

        KonfettiApi.loadDashBoardInfo(function(data){
            // WIN
            $scope.data = data;
        }, function() {
            // FAIL
            KonfettiApi.modalAlert("Getting Data failed. Check internet connection. Try later.");
            $scope.data = JSON.parse(JSON.stringify(emptyData));
        });

    };
    $scope.refreshData();

}