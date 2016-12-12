// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('starter', [
							'ionic', 
							'starter.controllers', 
                            'starter.filters',
							'starter.controller.dash', 
							'starter.controller.request', 
							'starter.controller.account', 
							'starter.services', 
							'starter.api', 
							'starter.appcontext', 
							'starter.rainanimation',
							'starter.konfettitoolbox',
                            'starter.popupdialogs',
							'ngCordova', 
							'pascalprecht.translate',
                            'leaflet-directive'])

.run(function(AppContext, ApiService, $rootScope, $ionicPlatform, $cordovaGlobalization, $cordovaGeolocation, $log, $cordovaToast, $cordovaDevice, $translate, KonfettiToolbox, $timeout, $ionicPopup, $cordovaStatusbar) {

  $ionicPlatform.ready(function() {


 try {
     alert("PLATTFORM: "+JSON.stringify($cordovaDevice.getPlatform()));
 } catch (e) {
     alert("ERROR ON USING NG CORDOVA");
 }

    // Init Settings
    $rootScope.initDone = false;
    $rootScope.tabRequestTitle = 'TAB_REQUEST';
    $rootScope.animationRainIsRunning = false;

    // import GIT build version (from latest 'ionic build' run)
    $rootScope.latestGitVersion = window.appGitVersion;
    if ($rootScope.os=="browser") {
        $rootScope.latestGitVersion = $rootScope.latestGitVersion + "+"
    }

    // set running os info
    $rootScope.os = "browser";
    try {
        if (ionic.Platform.isAndroid()) $rootScope.os = "android";
        if (ionic.Platform.isIOS()) $rootScope.os = "ios";
        ionic.Platform.fullScreen();
    } catch (e) {
        alert("FAIL set running os info: "+e);
    }

    // if running in APP init plugins
    if ($rootScope.os!="browser") {

        // STATUS BAR
        try {
            $cordovaStatusbar.hide();
            console.log("PLUGIN statusbar: OK");
        } catch (e) {
            alert("PLUGIN statusbar: MISSING (ok when running in browser) --> cordova plugin add cordova-plugin-statusbar");
        }

        // KEYBOARD
        // Hide the accessory bar by default 
        // (remove this to show the accessory bar above the keyboard for form inputs)
        try {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(false);
            cordova.plugins.Keyboard.disableScroll(true);
            console.log("PLUGIN Keyboard: OK");  
        } catch (e) {
            alert("PLUGIN keyboard: MISSING (ok when running on browser) --> cordova plugin add ionic-plugin-keyboard"); 
        }

    }

    /*
     * GLOBAL LANGUAGE SELECTOR (displayed in every tab)
     */

    // available app languages (order in international priority)
    $rootScope.langSet = [
          {code:'en', display:'English', dir:'ltr'},
          {code:'de', display:'Deutsch', dir:'ltr'},
          {code:'ar', display:'عربي', dir:'rtl'}
    ];
    $rootScope.actualLang = AppContext.getAppLang();

    // setting selected lang in view to setting
    // should be called on every view enter
    $rootScope.select = {};
    for (i = 0; i < $rootScope.langSet.length; i++) {
        $rootScope.select.actualLang = $rootScope.langSet[i];
        if ($rootScope.langSet[i].code===AppContext.getAppLang()) break;
    }

    // receiving changes lang settings from selector --> with i18n
    $rootScope.selectedLang = function(selected) {
          $timeout(function(){
            $rootScope.actualLang = selected.code;
            $translate.use(selected.code);
            AppContext.setAppLang(selected.code);
            $rootScope.spClass = AppContext.getAppLangDirection();
            $rootScope.select.actualLang = selected;
          },10);
    };

    // called when button in top right is pressed
    $rootScope.languageSelectionDialog = function() {
        var sendPop = $ionicPopup.show({
                    templateUrl: './templates/pop-selectlanguage.html',
                    scope: $rootScope,
                    cssClass: 'pop-selectlanguage'
                });
        $rootScope.selectedLangDialog = function(lang) {
            sendPop.close();
            $rootScope.selectedLang(lang);
        }
        sendPop.then(function(){sendPop.close();});
    };

    // upload images on browser - call on rootScope if needed
    $rootScope.onUploadClick = function(callback) {
        $rootScope.onUploadClickCallback = callback;
        $("#hidden-imageupload").click();
    }
    $(document).on('change','#hidden-imageupload',function(ev){
        if ($rootScope.onUploadClickCallback==null) {
            console.warn("no call back for file upload");
            return;
        }
        var file = $("#hidden-imageupload")[0].files[0];
        $timeout(function() {
            if (typeof file != "undefined") {

                // limit filesize to max 1MB
                if (file.size>(1024*1024)) {
                    alert("file too big - max. 1MB");
                    $rootScope.onUploadClickCallback(null);
                    $rootScope.onUploadClickCallback=null; 
                    return;
                }

                // read file and make callback
                var reader  = new FileReader();
                reader.addEventListener("load", function () {
                    var filetype = "jpeg";
                    if (reader.result.indexOf('data:image/png')>=0) filetype = "png";
                    $rootScope.onUploadClickCallback(reader.result,filetype);
                }, false);
                reader.readAsDataURL(file);

            } else {
                $rootScope.onUploadClickCallback(null);
                $rootScope.onUploadClickCallback=null;  
            }
        },10);
    });
    $rootScope.onUploadClickCallback = null;

    /*
     * GET LANGUAGE OF DEVICE
     * http://ngcordova.com/docs/plugins/globalization/
     */
    var gotLang = false;
    var setLocale = function(lang) {

        // check if changed
        if (AppContext.getAppLang() == "") {
            $log.info("switching to lang(" + lang + ")");
            AppContext.setAppLang(lang);
            $translate.use(AppContext.getAppLang());
            $rootScope.spClass = AppContext.getAppLangDirection();
            $rootScope.langSet.forEach(function(langSet){
                if (langSet.code==lang) $rootScope.selectedLang(langSet);
            });
        } else {
            $log.info("already running lang(" + lang + ") ... no need to switch");
        }
    };

    var isLangSupported = function(lang) {
        for (var i=0; i < $rootScope.langSet.length; i++) {
            var availableLang = $rootScope.langSet[i];
            if (availableLang.code == lang) {
                return true;
            }
        }
        return false;
    };

    if (AppContext.getRunningOS()!="browser") {
    	
        try {

    	// running as app
        $cordovaGlobalization.getLocaleName().then(
            function (result) {
                // WIN
                if (!gotLang) {

                    gotLang = true;

                    // check available lang
                    var lange = result.value.substr(0, 2);
                    if (!isLangSupported(lange)) {
                        $log.warn("lang '" + lange + "' not available ... using 'en'");
                        lang = "en";
                    }

                    setLocale(lang);

                } else {
                    $log.warn("double call prevent of $cordovaGlobalization.getLocaleName()");
                }

            },
            function (err) {
                // FAIL
                $log.info("cordovaGlobalization: FAIL " + err);
                setLocale("en");
            }
        );

        } catch (e) {
            alert("FAILED to process $cordovaGlobalization - make sure plugin is installed: cordova plugin add cordova-plugin-globalization");
        }

        } else {
            //On browser check lang setting differently
            var lang = navigator.language.substr(0, 2);
            if (!isLangSupported(lang)) {
                $log.warn("lang '" + lang + "' not available ... using 'en'");
                lang = "en";
            }
            setLocale(lang);
        }

    /*
     * Start GPS
     */

    $rootScope.lat  = 0;
    $rootScope.lon = 0;
    KonfettiToolbox.updateGPS();

    /*
     * Push Notification --> https://documentation.onesignal.com/docs/phonegap-sdk-installation
     */

    if ((typeof window.plugins != "undefined") && (typeof window.plugins.OneSignal != "undefined")) {

        try {

            if ((AppContext.getAppConfig().oneSignalAppId.trim().length>0) && (AppContext.getAppConfig().googleProjectNumber.trim().length>0)) {

                /*
                 * TODO: react more detailed to push notifications in app
                 * EXAMPLE DATA: {"message":"...", "additionalData":{"notification":999},"isActive":false}
                 */

                var notificationOpenedCallback = function(jsonData) {
                    //alert('didReceiveRemoteNotificationCallBack: ' + JSON.stringify(jsonData));
                };

                window.plugins.OneSignal.init(
                    AppContext.getAppConfig().oneSignalAppId,
                    {googleProjectNumber: AppContext.getAppConfig().googleProjectNumber},
                    notificationOpenedCallback
                );

                // Show an alert box if a notification comes in when the user is in your app.
                window.plugins.OneSignal.enableInAppAlertNotification(true);

                // getting the push id
                window.plugins.OneSignal.getIds(function(ids){
                    AppContext.updatePushIds(ids);
                });

            } else {
              console.log("OneSignal-Plugin found, but missing Push Config under services.js");
            }

        } catch (e) {
            alert("exception: "+JSON.stringify(e));
        }

    }

    /*
     * App Context
     */
    try {
        AppContext.loadContext(function(){
            /*
             * i18n SETTINGS
             */
            $translate.use(AppContext.getAppLang());
            $rootScope.spClass = AppContext.getAppLangDirection();
        });
    } catch (e) {
        alert("FAIL i18n SETTINGS: "+e);
    }

    // global scope data
    $rootScope.party = {id:0};

  });
})

.config(function($stateProvider, $urlRouterProvider, $translateProvider, $ionicConfigProvider) {

   $ionicConfigProvider.tabs.position('bottom');

  /*
   * i18n --> https://angular-translate.github.io/docs
   * https://angular-translate.github.io/docs/#/guide
   */

    // translation files are within dierctory www/locale/
    $translateProvider.useStaticFilesLoader({
        prefix: 'locale/lang-',
        suffix: '.json'
    });

    $translateProvider.preferredLanguage("en");
    $translateProvider.useSanitizeValueStrategy('escape');

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

  // setup an abstract state for the tabs directive
    .state('tab', {
    url: '/tab',
    abstract: true,
    templateUrl: 'templates/tabs.html'
  })

  // Each tab has its own nav history stack:

  .state('tab.dash', {
    url: '/dash/:id',
    views: {
      'tab-dash': {
        templateUrl: 'templates/tab-dash.html',
        controller: 'DashCtrl'
      }
    }
  })

  .state('tab.request', {
          url: '/request',
          views: {
              'tab-chats': {
                  templateUrl:'templates/tab-request.html',
                  controller: 'RequestCtrl'
              }
          }
  })

  .state('tab.request-detail', {
      url: '/request/:id/:area',
      views: {
        'tab-chats': {
          templateUrl: 'templates/tab-request.html',
          controller: 'RequestCtrl'
        }
      }
  })

  .state('tab.chat-detail', {
      url: '/chats/:id',
      views: {
        'tab-chats': {
          templateUrl: 'templates/chat-detail.html',
          controller: 'ChatDetailCtrl'
        }
      }
  })

  .state('tab.account', {
    url: '/account',
    views: {
      'tab-account': {
        templateUrl: 'templates/tab-account.html',
        controller: 'AccountCtrl'
      }
    }
  });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/tab/dash/0');

});

Array.prototype.contains = function(obj) {
    var i = this.length;
    while (i--) {
        if (this[i] == obj) {
            return true;
        }
    }
    return false;
};

function cloneObject(obj) {
    if (obj === null || typeof obj !== 'object') {return obj;}
    var temp = obj.constructor();
    for (var key in obj) {
        temp[key] = cloneObject(obj[key]);
    }
    return temp;
}