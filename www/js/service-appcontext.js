angular.module('starter.appcontext', [])

.factory('AppContext', function($log, $timeout, $cordovaDevice) {

  /*
   * APP CONFIG PARAMETER
   */

  var apiUrlLocalDevelopment = "http://localhost:8280/konfetti/api";
  var apiUrlDevelopmentServer = "http://konfettiapp.de/konfetti/api";
  var apiUrlProductionServer = "https://konfettiapp.de/konfetti/api";

  var appConfig = {

      /* APP BACKEND SERVER ---> SET ONE FROM THE ABOVE 
       * !!! ON GIT CHECKIN: SET DEVELOPMENT SERVER !!! 
       * */
      apiUrl: apiUrlProductionServer,

      /* PUSH NOTIFICATION */
      oneSignalAppId : "",
      googleProjectNumber : "" // not needed anymore
  };

  /*
   * APP DATA
   */

  // put into the app context stuff that needs to be stored
  // everything else put into rootScope
  var appContextProto = {
      version: 1,
      appLang : "", // with empty string signaling that it should be set to device lang on first start
      account : {
          id : 0,
          clientSecret : "",
          clientId : "",
          reviewerOnParties : [],
          activeOnParties : [],
          adminOnParties: [],
          spokenLangs : [],
          name: "",
          email: "",
          imageMediaID: 0,
          pushActive: false,
          pushSystem: null,
          pushID: null
      },
      localState : {
        introScreenShown: false,
        imageData: null,
        lastPartyUpdates: {},
        lastPosition : null,
        pushIDs: null,
        lastFocusedPartyID: null
      }
  };
  var appContext = JSON.parse(JSON.stringify(appContextProto));

  var isReadyOutside = false;
  var isReadyInside = false;

  var loadContext = function() {
      var jsonStr = window.localStorage.getItem("appContext");
      if ((typeof jsonStr != "undefined") && (jsonStr!=null)) appContext = JSON.parse(jsonStr);
      isReadyInside = true;
  };
  loadContext();

  return {
    getAppConfig: function() {
          return appConfig;
    },
    isReady: function() {
        //alert("inside("+isReadyInside+") outside("+isReadyOutside+")");
        return (isReadyInside && isReadyOutside);
    },
    setReady: function() {
        isReadyOutside = true;
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
    resetAccount: function(forceLoginOnApp) {
        appContext = JSON.parse(JSON.stringify(appContextProto));window.localStorage.removeItem("appContext");
        window.localStorage.removeItem("appContext");
        window.localStorage.setItem("forcelogin", forceLoginOnApp);
    },
    setAccount: function(account) {
        appContext.account = account;
        if (appContext.account.name==null) appContext.account.name = "";
        if (appContext.account.email==null) appContext.account.email = "";
        this.persistContext();
    },
    loadContext: function(win) {
        loadContext();
        win();
    },
    persistContext: function() {
        var data = JSON.stringify(appContext);
        localStorage.setItem("appContext", data);
    },
    getRunningOS: function() {
        var result = "browser";
        try {
            result = $cordovaDevice.getDevice().platform.toLowerCase();
        } catch (e) {}
        return result;
    },
    isRunningWithinApp : function() {
        try {
            return ($cordovaDevice.getDevice().platform!="Browser");
        } catch (e) {
            return false;
        }
    },
    isRunningDevelopmentEnv: function() {
        return appConfig.apiUrl==apiUrlLocalDevelopment;
    }
  };
});