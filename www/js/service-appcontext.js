angular.module('starter.appcontext', [])

.factory('AppContext', function($log, $timeout) {

  /*
   * APP CONFIG PARAMETER
   */

  var apiUrlLocalDevelopment = "http://localhost:9000/konfetti/api";
  var apiUrlDevelopmentServer = "http://fourcores2016.cloudapp.net:9000/konfetti/api";
  var apiUrlProductionServer = "https://konfetti-prod.testserver.de/konfetti/api";

  var appConfig = {

      /* APP BACKEND SERVER ---> SET ONE FROM THE ABOVE 
       * !!! ON GIT CHECKIN: SET DEVELOPMENT SERVER !!! 
       * */
      apiUrl: apiUrlDevelopmentServer,

      /* PUSH NOTIFICATION */
      oneSignalAppId : "",
      googleProjectNumber : ""
  };

  /*
   * APP DATA
   */

  // put into the app context stuff that needs to be stored
  // everything else put into rootScope
  var appContext = {
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
          eMail: "",
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
        pushIDs: null
      }
  };

  var isReady = false;

  var loadContext = function() {
      var jsonStr = window.localStorage.getItem("appContext");
      if ((typeof jsonStr != "undefined") && (jsonStr!=null)) appContext = JSON.parse(jsonStr);
      isReady = true;
  };
  loadContext();

  return {
    getAppConfig: function() {
          return appConfig;
    },
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
        loadContext();
        win();
    },
    persistContext: function() {
        var data = JSON.stringify(appContext);
        localStorage.setItem("appContext", data);
    },
    getRunningOS: function() {
        return (typeof window.device != "undefined") ? window.device.platform : "browser";
    },
    isRunningOnDesktopComputer: function() {
        return typeof window.device == "undefined";
    },
    isRunningWithinApp : function() {
        var osRunning = ((typeof cordova != "undefined") && (typeof cordova.platformId  != "undefined")) ? cordova.platformId : "browser";
        return osRunning!="browser";
    },
    updatePushIds : function(pushIds) {
        appContext.localState.pushIDs = pushIds;
        this.persistContext();
    },
    isRunningDevelopmentEnv: function() {
        return appConfig.apiUrl==apiUrlLocalDevelopment;
    }
  };
});