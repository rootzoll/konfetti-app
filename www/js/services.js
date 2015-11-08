angular.module('starter.services', [])

.factory('AppContext', function($log, $timeout) {

  var isReady = false;

  // put into the app context stuff that needs to be stored
  // everything else put into rootScope
  var appContext = {
      appLang : "en",
      account : {
          clientId : "",
          secret : ""
      },
      profile : {
          spokenLangs : ["en", "ar"],
          name : "",
          imageUrl : ""
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
            },
        };
 });
