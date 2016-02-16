angular.module('starter.controller.account', [])

.controller('AccountCtrl', function($rootScope, $scope, $state, $translate, $ionicPopup, ApiService, AppContext, $ionicLoading, $timeout, KonfettiToolbox) {

  $scope.$on('$ionicView.enter', function(e) {

      // when no party is loaded
      if ($rootScope.party.id===0) {
          $state.go('tab.dash', {id: 0});
          return;
      }

      // make sure lang selector is set correct
      $timeout(function(){
          $rootScope.setActualLangOnSelector();
      },100);

      // debug information
      $scope.accountJson = JSON.stringify(AppContext.getAccount());
  });

  $scope.settings = {
    enablePush: true,
    pauseChat: true
  };

  $scope.onButtonCoupon = function() {
      KonfettiToolbox.processCode(true);
  };

  $scope.onButtonCode = function() {
      KonfettiToolbox.processCode(false);
  };

});