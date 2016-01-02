angular.module('starter.services', [])

.factory('AppContext', function($log, $timeout) {

  var isReady = false;

  // put into the app context stuff that needs to be stored
  // everything else put into rootScope
  var appContext = {
      appLang : "en",
      account : {
          clientId : "",
          userId : "",
          secret : ""
      },
      profile : {
          spokenLangs : ["en", "ar"],
          name : "",
          imageData : "",
          admin: [2], // ids of parties where user is admin
          reviewer: [2], // ids of parties where user is reviewer
      },
      localState : {
        introScreenShown: false
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
    getProfile: function() {
        return appContext.profile;
    },
    setProfile: function(profile) {
        appContext.profile = profile;
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
        this.persistContext();
    },
    loadContext: function(win) {
        // TODO
        $log.warn("TODO: load App Context");
        $timeout(function(){
            isReady = true;
            win();
        },500);
    },
    persistContext: function() {
        // TODO
        $log.warn("TODO: persist App Context");
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

.factory('KonfettiToolbox', function($log, $ionicPopup, $translate) {

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
           }
        };
})

.factory('MultiLangToolbox', function($log) {

     return {

            // checks on multi lang object
            langIsAvailable: function(multiLangObj, langCode) {
                return (typeof eval("multiLangObj.lang_"+langCode) != 'undefined');
            },
            setLang : function(multiLangObj, langCode, textStr, translatorid) {
                var langField = eval("multiLangObj.lang_"+langCode);
                langField = {
                    text: textStr,
                    lastUpdateTS: Date.now(),
                    translatorID: translatorid,
                };
            }

     };
})

.factory('CommonToolbox', function($log) {

        return {
            helloWorld: function(name) {
                return 'hello '+name;
            }
        };
});
