// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers', 'starter.services', 'ngCordova', 'pascalprecht.translate'])

.run(function($rootScope, $ionicPlatform, $cordovaGeolocation, $log, $cordovaToast, $translate) {
  $ionicPlatform.ready(function() {

    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleLightContent();
    }

    /*
     * i18n SETTINGS
     */

    $rootScope.spClass = "ltr";
    $rootScope.lang = "de";
    $translate.use($rootScope.lang);

    /*
     * TEST GEOLOCATION
     * http://ngcordova.com/docs/plugins/geolocation/
     */
    var posOptions = {timeout: 10000, enableHighAccuracy: false};
    $cordovaGeolocation
          .getCurrentPosition(posOptions)
          .then(function (position) {
              var lat  = position.coords.latitude
              var long = position.coords.longitude
              $log.info("lat("+lat+") long("+long+")");
          }, function(err) {
              // error
            $log.info("GPS ERROR");
          });

    /*
     * TEST NATIVE TOAST
     * http://ngcordova.com/docs/plugins/toast/
     */
      $cordovaToast.showShortTop('APP STARTED').then(function(success) {
          $log.info("Toast OK");
      }, function (error) {
          $log.info("Toast ERROR");
      });

  });
})

.config(function($stateProvider, $urlRouterProvider, $translateProvider, $ionicConfigProvider) {

   $ionicConfigProvider.tabs.position('bottom');

  /*
   * i18n --> https://angular-translate.github.io/docs
   */

   $translateProvider.translations('en', {
            'TAB_PARTIES' : 'Parties',
            'TAB_REQUEST' : 'Request',
            'TAB_MORE' : 'More',
            'KONFETTI' : 'confetti',
            'KONFETTI-APP' : 'Konfetti App',
            'ORGAINFO_TITLE': 'Organizer',
            'ORGAINFO_SUB': 'editorial responsibility',
            'POSTSORT_MOST': 'top confetti',
            'POSTSORT_NEW': 'newest entry',
            'DASHHEADER_REVIEW': 'Please Review',
            'DASHHEADER_POSTED': 'You Posted',
            'DASHHEADER_ACTIVE': 'You Answered',
            'DASHHEADER_OPEN': 'Open Requests',
            'NOTIFICATION_REVIEWOK' : 'Your request is now public.',
            'NOTIFICATION_REVIEWFAIL' : 'Your request was rejected.',
            'NOTIFICATION_CHATREQUEST' : 'You got a chat message.',
            'NOCONTENT' : 'no request yet',
            'NEWREQUEST' : 'Publish a new Request',
            'YOURNAME' : 'Your Name',
            'YOURREQUEST' : 'Your Request',
            'PUBLICINFO' : 'Public Information',
            'PRIVATECHATS' : 'Private Chats',
            'ADDINFO' : 'add image, text, location'
        });

   $translateProvider.translations('de', {
            'TAB_PARTIES' : 'Parties',
            'TAB_REQUEST' : 'Anfrage',
            'TAB_MORE' : 'Mehr',
            'KONFETTI' : 'Konfetti',
            'KONFETTI-APP' : 'Konfetti App',
            'ORGAINFO_TITLE': 'Veranstalter',
            'ORGAINFO_SUB': 'inhaltlich verantwortlich',
            'POSTSORT_MOST': 'top konfetti',
            'POSTSORT_NEW': 'neuste posts',
            'DASHHEADER_REVIEW': 'Bitte Prüfen',
            'DASHHEADER_POSTED': 'Deine Anfragen',
            'DASHHEADER_ACTIVE': 'Deine Antworten',
            'DASHHEADER_OPEN': 'Offene Anfragen',
            'NOTIFICATION_REVIEWOK' : 'Deine Anfrage ist jetzt öffentlich.',
            'NOTIFICATION_REVIEWFAIL' : 'Deine Anfrage wurde abgelehnt.',
            'NOTIFICATION_CHATREQUEST' : 'Du hast eine Nachricht.',
            'NOCONTENT' : 'bisher keine Anfragen',
            'NEWREQUEST' : 'Neue Anfrage erstellen',
            'YOURNAME' : 'Dein Name',
            'YOURREQUEST' : 'Deine Anfrage',
            'PUBLICINFO' : 'Öffentliche Informationen',
            'PRIVATECHATS' : 'Private Chats',
            'ADDINFO' : 'Bild, Text, Ortsinformationen hinzufügen'
        });

   $translateProvider.translations('ar', {
            'TAB_PARTIES' : 'حفلات',
            'TAB_REQUEST' : 'طلب',
            'TAB_MORE' : 'مهر',
            'KONFETTI' : 'حلويات',
            'KONFETTI-APP' : 'التطبيق حلويات',
            'ORGAINFO_TITLE': 'منظم',
            'ORGAINFO_SUB': 'المسؤولية التحريرية',
            'POSTSORT_MOST': 'شعبية',
            'POSTSORT_NEW': 'جديد',
            'DASHHEADER_REVIEW': 'مراجعة',
            'DASHHEADER_POSTED': 'استفساراتك',
            'DASHHEADER_ACTIVE': 'ردكم',
            'DASHHEADER_OPEN': 'طلبات نشطة',
            'NOTIFICATION_REVIEWOK' : 'طلبك الآن العام',
            'NOTIFICATION_REVIEWFAIL' : 'وقد رفض طلبك',
            'NOTIFICATION_CHATREQUEST' : 'كنت حصلت على رسالة دردشة',
            'NOCONTENT' : 'أي طلب حتى الآن',
            'NEWREQUEST' : 'جعل طلب جديد',
            'YOURNAME' : 'اسم الدين',
            'YOURREQUEST' : 'اسم الدين',
            'PUBLICINFO' : 'معلومات عامة',
            'PRIVATECHATS' : 'دردشات خاصة',
            'ADDINFO' : 'الصورة والنص و إضافة معلومات الموقع'
        });

  $translateProvider.preferredLanguage("en");

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
    url: '/dash',
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
                  templateUrl: 'templates/tab-request.html',
                  controller: 'RequestCtrl'
              }
          }
  })

  .state('tab.request-detail', {
      url: '/request/:id',
      views: {
        'tab-chats': {
          templateUrl: 'templates/tab-request.html',
          controller: 'RequestCtrl'
        }
      }
  })

    /*
    .state('tab.chat-detail', {
      url: '/chats/:chatId',
      views: {
        'tab-chats': {
          templateUrl: 'templates/chat-detail.html',
          controller: 'ChatDetailCtrl'
        }
      }
    })
    */

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
  $urlRouterProvider.otherwise('/tab/dash');

});