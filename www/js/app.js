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
                            //'logglyLogger',
                            'leaflet-directive'])

.run(function(AppContext, ApiService, $rootScope, $ionicPlatform, $cordovaGlobalization, $cordovaGeolocation, $log, $cordovaToast, $cordovaDevice, $translate, KonfettiToolbox, $timeout, $ionicPopup, $cordovaStatusbar, $state, $ionicSideMenuDelegate) {

  $rootScope.appInitDone = false;
  $rootScope.topbarShowSetting = false;

  $rootScope.ABOUTKONFETTI_HEAD = "";
  $rootScope.ABOUTKONFETTI_BODY = "";
  $rootScope.TAB_PARTIES = "";
  $rootScope.LOGOUT = "";
  $rootScope.SETTINGS = "";

  if ((typeof $ionicPlatform == "undefined") || ($ionicPlatform == null)) {
      alert("ERROR: $ionicPlatform --> UNDEFINED/NULL");
  }

  $ionicPlatform.ready(function() {

    // fix to https://github.com/rootzoll/konfetti-app/issues/137
    $rootScope.someMaterialUiElementsNotWorking = false;
    try {
        $rootScope.someMaterialUiElementsNotWorking = 
        ($cordovaDevice.getPlatform()=="Android") && ($cordovaDevice.getVersion()=="4.2.2");
        //alert("("+$cordovaDevice.getPlatform()+") ("+$cordovaDevice.getVersion()+") ("+$rootScope.someMaterialUiElementsNotWorking+")");
    } catch (e) {}
    
    // display status bar on ios
    try {
        $cordovaStatusbar.overlaysWebView(true);
        $cordovaStatusbar.show();
    } catch (e) {}

    // translate side menu strings (is needed manually because side rendered before ionic ready)
    $timeout(function(){
    $translate("ABOUTKONFETTI_HEAD").then(function (ABOUTKONFETTI_HEAD) {
          $translate("ABOUTKONFETTI_BODY").then(function (ABOUTKONFETTI_BODY) {
              $translate("KONFETTI").then(function (TAB_PARTIES) {
                  $translate("LOGOUT").then(function (LOGOUT) {
                    $translate("GLOBALSETTINGS").then(function (SETTINGS) {
                      $rootScope.SETTINGS = SETTINGS;
                      $rootScope.ABOUTKONFETTI_HEAD = ABOUTKONFETTI_HEAD;
                      $rootScope.ABOUTKONFETTI_BODY = ABOUTKONFETTI_BODY;
                      $rootScope.TAB_PARTIES = TAB_PARTIES;
                      $rootScope.LOGOUT = LOGOUT;
                    });
                  });
              });
          });
      });  
    },1700);

    // Init Settings
    $rootScope.focusPartyId = 0;
    $rootScope.initDone = false;
    $rootScope.tabRequestTitle = 'TAB_REQUEST';
    $rootScope.animationRainIsRunning = false;

    $rootScope.resetAccount = function() {
        localStorage.clear();
        location.reload();
    };

    $rootScope.reloadGroups = function() {
        $ionicSideMenuDelegate.toggleLeft();
        $timeout(function(){
            $rootScope.$broadcast("dash-reloadgroups");
        },800);
        $state.go('dash', {id: 0});
    };

    // set running os info
    $rootScope.os = "browser";
    try {
        $rootScope.os = AppContext.getRunningOS();
        console.log("RUNNING $rootScope.os --> "+$rootScope.os);
        ionic.Platform.fullScreen();
    } catch (e) {
        console.log("running browser ...");
    }
    //if (!AppContext.isRunningWithinApp()) alert("RunningOS: "+$rootScope.os+" isApp("+AppContext.isRunningWithinApp()+")");

    // import GIT build version (from latest 'ionic build' run)
    $rootScope.latestGitVersion = window.appGitVersion;
    if ($rootScope.os=="browser") {
        $rootScope.latestGitVersion = $rootScope.latestGitVersion + "+"
    }

    // if running in APP init plugins
    if ($rootScope.os!="browser") {

        // make sure on iOS that splash screen gets hidden
        setTimeout(function() {
            try {
                navigator.splashscreen.hide();
            } catch (e) {}
        }, 2000);

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
    $rootScope.langSet = window.i18nData;
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

                // limit filesize to max 750KB
                if (file.size>(750*1024)) {
                    alert("file too big - max. 750KB");
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
        if ((typeof AppContext.getAppLang() == "undefined") || (AppContext.getAppLang() == "")) {
            console.log("switching to lang(" + lang + ")");
            AppContext.setAppLang(lang);
            $translate.use(AppContext.getAppLang());
            $rootScope.spClass = AppContext.getAppLangDirection();
            $rootScope.langSet.forEach(function(langSet){
                if (langSet.code==lang) $rootScope.selectedLang(langSet);
            });
        } else {
            console.log("already running lang(" + AppContext.getAppLang() + ") ... no need to switch");
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

    if ($rootScope.os!="browser") {

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
                        lange = "en";
                    }

                    setLocale(lange);

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

    // when running on browser ..
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
     * Set GPS basiscs
     */

    $rootScope.lat  = null;
    $rootScope.lon  = null;

    document.addEventListener("resume", function(){
        $rootScope.$broadcast('cordova-resume');
    }, false);

    /*
     * Restore Local State
     */

    var localState = AppContext.getLocalState();
    if ((typeof localState != "undefined") && (typeof localState.lastFocusedPartyID != "undefined") && (localState.lastFocusedPartyID!=null)) {
        console.log("FOKUS PARTY --> ",localState.lastFocusedPartyID);
        $rootScope.focusPartyId = localState.lastFocusedPartyID;
    } else {
       console.log("NO FOKUS PARTY");   
    }

    /*
     * Push Notification --> https://documentation.onesignal.com/docs/cordova-sdk-setup
     * run one account is ready (new created or checked on init loop)
     */

    $rootScope.notificationOpenedCallback = function (jsonData) {

        if (typeof jsonData == "undefined") {
            console.warn("notificationOpenedCallback: jsonData is undefnied");
            return;
        }

        if (jsonData == null) {
            console.warn("notificationOpenedCallback: jsonData is undefnied");
            return;
        }

        if ((typeof jsonData.notification == "undefined") || (jsonData.notification == null)) {
            console.warn("notificationOpenedCallback: jsonData.notification missing");
            return;
        }

        if ((typeof jsonData.notification.isAppInFocus == "undefined") || (jsonData.notification.isAppInFocus == null)) {
            console.warn("notificationOpenedCallback: notification.isAppInFocus missing");
            return;
        }

        if ((typeof jsonData.notification.payload == "undefined") ||
            (typeof jsonData.notification.payload.additionalData == "undefined") || (jsonData.notification.payload.additionalData == null)) {
            console.warn("notificationOpenedCallback: json.notification.payload.additionalData missing");
            return;
        }

        var wasAppOpenOnNotification = jsonData.notification.isAppInFocus;
        var payload = jsonData.notification.payload;
        if (typeof payload.rawPayload != "undefined") payload.rawPayload = null;
        
        //alert('TODO: notificationOpenedCallback - appWasOpen('+wasAppOpenOnNotification+'): ' + JSON.stringify(payload));
        //console.log(JSON.stringify(jsonData));
    
        // only react on notification if the app was closed 
        if (!wasAppOpenOnNotification) {
            
            // On Review OK or FAIL
            if ((payload.additionalData.type=="REVIEW_OK") || (payload.additionalData.type=="REVIEW_FAIL")) {
                console.log("Pushnotification REVIEW_OK --> go to party ("+payload.additionalData.partyID+")");
                $state.go('dash', {id: payload.additionalData.partyID});
            } else

            // On Review Waiting
            if (payload.additionalData.type=="REVIEW_WAITING") {
                console.log("Pushnotification REVIEW_WAITING --> go to task ("+payload.additionalData.requestID+")");
                $state.go('request-detail', {id: payload.additionalData.requestID, area: 'top'});
            } else

            // On New Chat
            if (payload.additionalData.type=="CHAT_NEW") {
                console.log("Pushnotification CHAT_NEW --> go to chat ("+payload.additionalData.chatID+") on request ("+payload.additionalData.requestID+") on party ("+payload.additionalData.partyID+")");
                $state.go('chat', {id: payload.additionalData.chatID});
            } else
            
            // On New Transfere Received
            if ((payload.additionalData.type=="TRANSFER_RECEIVED") || (payload.additionalData.type=="PAYBACK")) {
                console.log("Pushnotification TRANSFER_RECEIVED --> go to party ("+payload.additionalData.partyID+")");
                $state.go('dash', {id: payload.additionalData.partyID});
            } else

            // On Reward on Task
            if (payload.additionalData.type=="SUPPORT_WIN") {
                console.log("Pushnotification SUPPORT_WIN --> go to task ("+payload.additionalData.requestID+")");
                $state.go('request-detail', {id: payload.additionalData.requestID, area: 'top'});
            } else

            // On Task Supported go Done
            if (payload.additionalData.type=="REWARD_GOT") {
                console.log("Pushnotification REWARD_GOT --> go to task ("+payload.additionalData.requestID+")");
                $state.go('request-detail', {id: payload.additionalData.requestID, area: 'top'});
            } else

            {
                alert("TODO Notification:"+payload.additionalData.type);
            }

        } else {
            // just ignore notifications when app is open - will display alert
            console.log("ignore push notificaton - will see notification on group list"); 
            $rootScope.$broadcast('dash-reloadparty');
        }

    };

    /* TODO: remove after debug 
    $timeout(function () { $rootScope.notificationOpenedCallback(JSON.parse("{\"action\":{\"type\":0},\"notification\":{\"isAppInFocus\":false,\"shown\":true,\"androidNotificationId\":-372898719,\"displayType\":1,\"payload\":{\"notificationID\":\"b5ffa6ec-21cf-4ca2-bf9d-0cd3742c8f8c\",\"body\":\"Your task is now public\",\"additionalData\":{\"requestID\":38,\"notificationID\":188,\"partyID\":1,\"type\":\"REVIEW_OK\"},\"lockScreenVisibility\":1,\"fromProjectNumber\":\"641694372085\",\"priority\":0,\"rawPayload\":\"{\\\"google.sent_time\\\":1484651028978,\\\"custom\\\":\\\"{\\\\\\\"a\\\\\\\":{\\\\\\\"requestID\\\\\\\":38,\\\\\\\"notificationID\\\\\\\":188,\\\\\\\"partyID\\\\\\\":1,\\\\\\\"type\\\\\\\":\\\\\\\"REVIEW_OK\\\\\\\"},\\\\\\\"i\\\\\\\":\\\\\\\"b5ffa6ec-21cf-4ca2-bf9d-0cd3742c8f8c\\\\\\\"}\\\",\\\"from\\\":\\\"641694372085\\\",\\\"alert\\\":\\\"Your task is now public\\\",\\\"google.message_id\\\":\\\"0:1484651028990886%39a6ade7f9fd7ecd\\\",\\\"collapse_key\\\":\\\"do_not_collapse\\\",\\\"notificationId\\\":-372898719}\"}}}")); }, 10000);
    */

    $rootScope.$on('account-ready', function(event, args) {

      if ((typeof window.plugins != "undefined") && (typeof window.plugins.OneSignal != "undefined")) {

          try {

            if (AppContext.getAppConfig().oneSignalAppId.trim().length>0) {

                /*
                 * TODO: react more detailed to push notifications in app
                 * EXAMPLE DATA: {"message":"...", "additionalData":{"notification":999},"isActive":false}
                 */

                var notificationOpenedCallback = 

                window.plugins.OneSignal
                    .startInit(AppContext.getAppConfig().oneSignalAppId)
                    .handleNotificationOpened($rootScope.notificationOpenedCallback)
                    .endInit();

                // getting the push id
                window.plugins.OneSignal.getIds(function(ids){

                    // check valid return values
                    if ((typeof ids.userId == "undefined") || (ids.userId==null) || (ids.userId.length<=3)) {
                        alert("Exception on PushRegistration: Invalid IDs ("+JSON.stringify(ids)+")");
                        console.warn("Exception on PushRegistration: Invalid IDs ("+JSON.stringify(ids)+")");
                        return;
                    }

                    //alert("Registered OneSignal UserId:"+ids.userId);
                    //console.log("Registered OneSignal IDs:"+JSON.stringify(ids));

                    // check if storing in user is needed
                    var account = AppContext.getAccount();
                    if ((typeof account.pushID == "undefined") || (typeof account.pushID == null) || (account.pushID != ids.userId)) {

                        account.pushActive = true;
                        account.pushSystem = "onesignal";
                        account.pushID = ids.userId;

                        // update on server
                        ApiService.updateAccount(account,function(result){
                            // WIN
                            AppContext.setAccount(account,'app.js storePushID');
                        }, function(e) {
                            // FAIL
                            alert("ERROR: FAILED TO STORE PUSHID");
                        });

                    }

                });

            } else {
              //alert("OneSignal-Plugin found, but missing Push Config under services.js");
              console.log("OneSignal-Plugin found, but missing Push Config under services.js");
            }

        } catch (e) {
            alert("Exception on PushRegistration: "+JSON.stringify(e));
        }

      } else {
        //alert("PlugIn: No Onesignal");
        console.log("PlugIn: No Onesignal");
      }

    });

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

    // just shoe logout option on browser
    $rootScope.showLogOutOption = !AppContext.isRunningWithinApp();

    // always keep as last in this block
    AppContext.setReady();
    $rootScope.appInitDone = true;

  });
})

.config(function($stateProvider, $urlRouterProvider, $translateProvider, $ionicConfigProvider
){//,LogglyLoggerProvider) {

  /*
   * i18n --> https://angular-translate.github.io/docs
   * https://angular-translate.github.io/docs/#/guide
   */

    // import translation from /www/locale/i18n-data.js
    // see project https://github.com/rootzoll/angular-translate-sheet-export

    var langSet = [];
    if (typeof window.i18nData != "undefined") {
        console.log("window.i18nData",window.i18nData);
        for (var t=0; t < window.i18nData.i18n.length; t++) {
            var lang = window.i18nData.i18n[t].locale;
            console.log("Importing language '"+lang+"' ...");
            $translateProvider.translations(lang, window.i18nData.i18n[t].translations);
            langSet.push({"code":lang,"display":window.i18nData.i18n[t].displayname,"dir":window.i18nData.i18n[t].direction});
        }
        window.i18nData = langSet;
    } else {
        alert("missing window.i18nData import from /www/locale/i18n-data.js");
    }

    /*
    $translateProvider.useStaticFilesLoader({
        prefix: 'locale/lang-',
        suffix: '.json'
    });
    */

    $translateProvider.preferredLanguage("en");
    $translateProvider.useSanitizeValueStrategy('escape');

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

	  .state('dash', {
		    url: '/dash/:id',
	      templateUrl: 'templates/tab-dash.html',
	      controller: 'DashCtrl'
	  })

	  .state('request', {
		    url: '/request',
        templateUrl:'templates/tab-request.html',
        controller: 'RequestCtrl'
	  })

	  .state('request-detail', {
	      url: '/request/:id/:area',
        templateUrl: 'templates/tab-request.html',
        controller: 'RequestCtrl'
	  })

	  .state('chat', {
	      url: '/chats/:id',
        templateUrl: 'templates/tab-chat.html',
        controller: 'ChatCtrl'
	  })

	  .state('account', {
	    url: '/account',
      templateUrl: 'templates/tab-account.html',
      controller: 'AccountCtrl'
	  });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('dash/0');

  //configure loggly so it logs console errors to the loggly cloud
  //LogglyLoggerProvider.inputToken( '653b3d37-f931-403d-b192-c8d08be6afb7' ).sendConsoleErrors(true);
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
