angular.module('starter.controller.account', [])

.controller('AccountCtrl', function($rootScope, $scope, $state, $translate, $ionicPopup, ApiService, AppContext, $ionicLoading) {

  $scope.$on('$ionicView.enter', function(e) {
      // when no party is loaded
      if ($rootScope.party.id===0) {
          $state.go('tab.dash', {id: 0});
          return;
      }
  });

  $scope.settings = {
    enablePush: true,
    pauseChat: true
  };

  // pop up with more info in party
  $scope.showCodeRedeem = function(isRedeemCouponBool) {
    var titleKey = "MAGICCODE";
    var subKey = "REDEEM_MAGIC_SUB";
    if ((typeof isRedeemCouponBool != "undefined") && (isRedeemCouponBool)) {
        titleKey = "REDEEMCOUPON";
        subKey = "REDEEM_COUPON_SUB";
    }
    $translate(titleKey).then(function (TITLE) {
        $translate(subKey).then(function (SUB) {
            $ionicPopup.prompt({
                title: TITLE,
                template: SUB,
                // input type is number - because number codes work in all langs and alphabets
                inputType: 'number',
                inputPlaceholder: ''
            }).then(function(res) {
                console.log('name:', res);
                if (typeof res != "undefined") {
                    if (res.length==0) return;
                    $ionicLoading.show({
                        template: '<img src="img/spinner.gif" />'
                    });
                    ApiService.redeemCode(res, AppContext.getAppLang(), function(result){
                        // WIN
                        $ionicLoading.hide();
                        $scope.feedbackOnCode(result);
                    }, function(){
                        // FAIL
                        $ionicLoading.hide();
                        $translate("INTERNETPROBLEM").then(function (text) {
                            $scope.feedbackOnCode(text);
                        });
                    });
                }
            });
        });
    });
  };

  $scope.feedbackOnCode = function(result) {
      $translate("ANSWERE").then(function (HEADLINE) {
              $ionicPopup.alert({
                  title: HEADLINE,
                  template: result.feedbackHtml
              }).then(function() {
                  $scope.processRedeemActions(result.action);
              });
      });
  };

  $scope.processRedeemActions = function(actionArray) {
      if (typeof actionArray=="undefined") {
          console.warn("processRedeemActions: actionArray undefined - skip");
          return;
      }
      for (var i = 0; i < actionArray.length; i++) {

          var action = actionArray[i];
          if (typeof action == "undefined") {
              console.warn("processRedeemActions: action at index("+i+") is undefined - skip");
              continue;
          }

          // upgrade user to reviewer
          if (action.command=="reviewer") {
              var profile = AppContext.getProfile();
              if (!profile.reviewer.contains(action.partyId)) {
                  profile.reviewer.push(action.partyId);
                  AppContext.setProfile(profile);
              }
          } else

          // upgrade user to admin
          if (action.command=="admin") {
              var profile = AppContext.getProfile();
              if (!profile.admin.contains(action.partyId)) {
                  profile.admin.push(action.partyId);
                  AppContext.setProfile(profile);
              }
          } else

          // focus party in GUI
          if (action.command=="focusParty") {
              $state.go('tab.dash', {id: action.partyId});
          } else

          // unkown
          {
             alert("UNKOWN COMMAND '"+action.command+"'");
          }
      }
  };

  $scope.onButtonCoupon = function() {
      $scope.showCodeRedeem(true);
  };

  $scope.onButtonCode = function() {
      $scope.showCodeRedeem(false);
  };

});