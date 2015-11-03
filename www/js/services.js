angular.module('starter.services', [])

.factory('AppContext', function($log) {

  var appContext = {
      appLang : "en",
      profile : {
          spokenLangs : ["en", "ar"],
          name : "",
          imageUrl : ""
      }
  };

  return {
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
        return appContext.profile
    },
    setProfile: function(profile) {
        appContext.profile = profile;
        this.persistContext();
    },
    loadContext: function() {
        // TODO
        $log.warn("TODO: load App Context");
    },
    persistContext: function() {
        // TODO
        $log.warn("TODO: persist App Context");
        console.dir(appContext);
    },
  };
});
