angular.module('starter.services', [])

.factory('AppContext', function($log, $timeout) {

  var isReady = false;

  // put into the app context stuff that needs to be stored
  // everything else put into rootScope
  var appContext = {
      version: 1,
      appLang : "en",
      account : {
          id : 0,
          clientSecret : "",
          clientId : "",
          reviewerOnParties : [],
          activeOnParties : [],
          adminOnParties: [],
          spokenLangs : [],
          name: "",
          eMail: "",
          imageMediaID: 0,
          pushActive: false,
          pushSystem: null,
          pushID: null
      },
      localState : {
        introScreenShown: false,
        imageData: null
      }
  };

  return {
    isReady: function() {
        return isReady;
    },
    getAppLang: function() {
      return appContext.appLang;
    },
    getAppLangDirection: function() {
        return (appContext.appLang === 'ar') ? 'rtl' : 'ltr';
    },
    setAppLang: function(value) {
      appContext.appLang = value;
      this.persistContext();
    },
    getLocalState: function() {
        return appContext.localState;
    },
    setLocalState: function(state) {
        appContext.localState = state;
        this.persistContext();
    },
    getAccount: function() {
        return appContext.account;
    },
    setAccount: function(account) {
        appContext.account = account;
        if (appContext.account.name==null) appContext.account.name = "";
        if (appContext.account.eMail==null) appContext.account.eMail = "";
        this.persistContext();
    },
    loadContext: function(win) {

        // turn off
        if (typeof window.device == "undefined") {
            console.warn("RESETTING THE ACCOUNT PERSISTENCE");
            isReady = true;
            win();
            return;
        }

        var jsonStr = window.localStorage.getItem("appContext");
        if ((typeof jsonStr != "undefined") && (jsonStr!=null)) appContext = JSON.parse(jsonStr);
        isReady = true;
        win();
    },
    persistContext: function() {
        var data = JSON.stringify(appContext);
        localStorage.setItem("appContext", data);
    },
    getRunningOS: function() {
        return (typeof window.device != "undefined") ? window.device.platform : "browser";
    }
  };
})

.factory('DataCache', function($log) {

        var dataMap = [
            {key: 'test', val:'test'}
        ];

        return {
            putData: function(keyStr, valObj) {
                var keyIndex = this.getKeyIndex(keyStr);
                if (keyIndex>=0) dataMap.splice(keyIndex, 1);
                dataMap.push({key: keyStr, val:valObj});
                return;
            },
            getData: function(keyStr) {
                var keyIndex = this.getKeyIndex(keyStr);
                if (keyIndex>=0) return dataMap[keyIndex].val;
                return;
            },
            getKeyIndex: function(key) {
                var ki = -1;
                for (i = 0; i < dataMap.length; i++) {
                    if (dataMap[i].key===key) {
                        ki = i;
                        break;
                    }
                }
                return ki;
            }
        };
 })

.factory('KonfettiToolbox', function($log, $ionicPopup, $translate, $ionicLoading, $state, AppContext, ApiService) {

        return {
            filterRequestsByState: function(requestArray, state) {
                var resultArray = [];
                for (var i = 0; i < requestArray.length; i++) {
                    if (requestArray[i].state===state) resultArray.push(requestArray[i]);
                }
                return resultArray;
            },
            filterRequestsByAuthor: function(requestArray, authorUserId) {
                var resultArray = [];
                for (var i = 0; i < requestArray.length; i++) {
                    if (requestArray[i].userId===authorUserId) resultArray.push(requestArray[i]);
                }
                return resultArray;
            },
            filterRequestsByInteraction: function(requestArray, userId) {
                var resultArray = [];
                for (var i = 0; i < requestArray.length; i++) {
                    // ignore if user is author of request
                    if (requestArray[i].userId===userId) continue;
                    // use if there is a chat on request
                    // server should just deliver chats if related to requesting user
                    if (requestArray[i].chats.length>0) resultArray.push(requestArray[i]);
                }
                return resultArray;
            },
            showIonicAlertWith18nText: function(i18nKeyTitle, i18nKeyText) {
                $translate(i18nKeyTitle).then(function (TITLE) {
                    $translate(i18nKeyText).then(function (TEXT) {
                        $ionicPopup.alert({
                            title: TITLE,
                            template: TEXT
                        }).then(function(res) {
                        });                    
                    });
                });                   
           },
           processCode : function(isRedeemCouponBool) {

               var processRedeemActions = function(actionArray) {

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

                       // upgrade user profile
                       if ((action.command=="updateUser") && (typeof action.json != "undefined")) {
                           // keep local clientID and clientSecret
                           var updatedAccountData = JSON.parse(action.json);
                           var oldAccountData = AppContext.getAccount();
                           updatedAccountData.clientId = oldAccountData.clientId;
                           updatedAccountData.clientSecret = oldAccountData.clientSecret;
                           AppContext.setAccount(updatedAccountData);
                       } else

                       // focus party in GUI
                       if (action.command=="focusParty") {
                           $state.go('tab.dash', {id: JSON.parse(action.json)});
                       } else

                       // unkown
                       {
                           alert("UNKOWN COMMAND '"+action.command+"'");
                       }
                   }
               };

               var feedbackOnCode = function(result) {
                   $translate("ANSWERE").then(function (HEADLINE) {
                       $ionicPopup.alert({
                           title: HEADLINE,
                           template: result.feedbackHtml
                       }).then(function() {
                           processRedeemActions(result.actions);
                       });
                   });
               };


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
                                    feedbackOnCode(result);
                                }, function(){
                                    // FAIL
                                    $ionicLoading.hide();
                                    $translate("INTERNETPROBLEM").then(function (text) {
                                        feedbackOnCode(text);
                                    });
                                });
                            }
                        });
                    });
                });
            }
        };
});;
