angular.module('starter.controller.account', [])

.controller('AccountCtrl', function($rootScope, $scope, $state, $translate, $ionicPopup, ApiService, AppContext, $ionicLoading, $timeout, KonfettiToolbox) {

  $scope.email = "";

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

      $scope.email = AppContext.getAccount().eMail;
  });
  
  $scope.keyUpEmailInput = function(e) {
  	console.dir(e);
  };

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

  $scope.onButtonAdminCreateCoupons = function(email) {

      // check if eMail is set
      if ((typeof email == "undefined") || (email==null) || (email.trim().length==0)) {
          KonfettiToolbox.showIonicAlertWith18nText('INFO', 'EMAIL_NEEDED');
          return;
      }

      $scope.createCoupons = false;
      $scope.coupons = {
          count : "10",
          amount: "100"
      };
      $translate("CREATE_COUPON_TITLE").then(function (TITLE) {
      $translate("CREATE_COUPON_SUBLINE").then(function (SUBLINE) {
        $translate("OK").then(function (OK) {
        $translate("CANCEL").then(function (CANCEL) {
              var myPopup = $ionicPopup.show({
                  templateUrl: 'templates/pop-coupons.html',
                  scope: $scope,
                  title: TITLE,
                  subTitle: SUBLINE,
                  buttons: [
                      { text: CANCEL },
                      { text: OK,
                          type: 'button-positive',
                          onTap: function(e) {
                              $scope.createCoupons = true;
                          }
                      }
                  ]
              });
              myPopup.then(function(res) {
                  // if cancel button dont continue
                  if (!$scope.createCoupons) return;
                  $ionicLoading.show({
                      template: '<img src="img/spinner.gif" />'
                  });
                  ApiService.generateCoupons($rootScope.party.id, $scope.coupons.count, $scope.coupons.amount, email, AppContext.getAppLang(), function(){
                      // WIN
                      $ionicLoading.hide();
                      KonfettiToolbox.showIonicAlertWith18nText('INFO', 'CREATE_COUPON_OK');
                  }, function(){
                      // FAIL
                      $ionicLoading.hide();
                      KonfettiToolbox.showIonicAlertWith18nText('INFO', 'INTERNETPROBLEM');
                  });
              });
          });
          });
      });
      });
  };

  $scope.storeMail = function(mail) {

      if (typeof mail == "undefined") {
          KonfettiToolbox.showIonicAlertWith18nText('INFO', 'INVALID_EMAIL');
          return;
      }

      var updatedAccount = AppContext.getAccount();

      if (mail==updatedAccount.eMail) {
          console.log("email havent changed - ignore");
          return;
      }

      updatedAccount.eMail = mail;
      $ionicLoading.show({
          template: '<img src="img/spinner.gif" />'
      });
      ApiService.updateAccount(updatedAccount, function(account){
        // WIN
        $ionicLoading.hide();
        AppContext.setAccount(account);
        KonfettiToolbox.showIonicAlertWith18nText('INFO', 'EMAIL_OK');
      }, function(){
        // FAIL
        $ionicLoading.hide();
        KonfettiToolbox.showIonicAlertWith18nText('INFO', 'INTERNETPROBLEM');
      });
  };

  $scope.onButtonSwitchAccount = function() {

      $translate("INFO").then(function (TITLE) {
          $translate("SWITCH_CONFIRM").then(function (SUBLINE) {
              $ionicPopup.confirm({
                  title: TITLE,
                  template: SUBLINE
              }).then(function(res) {
                  if(res) {
                      $rootScope.resetAccount = true;
                      $state.go('tab.dash', {id: 0});
                  }
              });
          });
      });

  };

});