angular.module('starter.controllers', [])

.controller('DashCtrl', function(AppContext, $rootScope, $scope, $translate, $timeout, $ionicPopup, $log, $state, $ionicScrollDelegate) {

        $scope.actualKonfettiCount = 1000;
        $scope.loadingParty = false;
        $scope.actualSorting = null;

        $scope.notifications = [
            {id: 12, type:1, ref:123}
            //{id: 87, type:2, ref:655},
            //{id: 87, type:3, ref:633}
        ];

        $scope.requestsReview = [];

        $scope.requestsPosted = [
            {   id: 12,
                userId: 123,
                orgaId: 2,
                konfettiCount: 999,
                title: 'Hecke am Spielplatz schneiden',
                imageUrl: 'http://img2.timeinc.net/people/i/2011/database/110214/christian-bale-300.jpg',
                state: 'review'
            }
        ];

        $scope.requestsInteraction = [
            {   id: 13,
                userId: 124,
                orgaId: 2,
                konfettiCount: 1,
                title: 'Aufbau Grillfest bei Jannes auf dem Acker',
                imageUrl: 'http://www.mnf.uni-greifswald.de/fileadmin/Biochemie/AK_Heinicke/bilder/kontaktbilder/Fischer__Christian_II_WEB.jpg',
                state: 'open'
            }
        ];

        $scope.requestsOpen = [];

        // available app languages
        $scope.langSet = [
            {code:'en', display:'English', dir:'ltr'},
            {code:'de', display:'Deutsch', dir:'ltr'},
            {code:'ar', display:'عربي', dir:'rtl'}
        ];

        // sorting options
        $scope.sortSet = [];
        $scope.updateSortOptions = function() {
            $translate("POSTSORT_MOST").then(function (POSTSORT_MOST) {
                $translate("POSTSORT_NEW").then(function (POSTSORT_NEW) {
                    $timeout(function() {
                        console.log("RESET");
                        $scope.sortSet = [
                            {sort:'most', display:POSTSORT_MOST},
                            {sort:'new', display:POSTSORT_NEW}
                        ];
                        $scope.actualSorting = $scope.sortSet[0];
                    },10);
                });
            });
        };
        $scope.updateSortOptions();

        // the sorting of open tasks changed
        $scope.changedSorting = function(actualSorting) {
            alert("TODO");
            if ((typeof actualSorting != "undefined") && (actualSorting!=null)) {
                $scope.actualSorting = actualSorting;
            } else {
                $scope.actualSorting = $scope.sortSet[0];
            }
            $timeout(function(){
                console.dir($scope.actualSorting.sort);
            },100);
        };

        // setting selected lang in view to setting
        $scope.actualLangSelect = $scope.langSet[0];
        for (i = 0; i < $scope.langSet.length; i++) {
            if ($scope.langSet[i].code===AppContext.getAppLang) {
                $scope.actualLangSelect = $scope.langSet[i];
                break;
            }
        }

        // receiving changes lang settings --> with i18n
        $scope.selectedLang = function(selected) {
            $translate.use(selected.code);
            AppContext.setAppLang(selected.code);
            $rootScope.spClass = AppContext.getAppLangDirection();
            $scope.updateSortOptions();
        };

        // the previous party from list (closer)
        $scope.buttonPartyPrev = function() {
            $scope.loadingParty = true;
            $ionicScrollDelegate.scrollTop();
            $timeout(function(){
                $scope.loadingParty = false;
            }, 2000);
        };

        // next party in list (more far away)
        $scope.buttonPartyNext = function() {
            $scope.loadingParty = true;
            $ionicScrollDelegate.scrollTop();
            $timeout(function(){
                $scope.loadingParty = false;
            }, 2000);
        };

        $scope.tapNotificationMore = function($event, noti) {
            alert("TODO more notification id("+noti.id+")");
        };

        $scope.tapNotificationDelete = function($event, noti) {
            $event.stopPropagation();
            alert("TODO delete notification id("+noti.id+")");
        };

        $scope.tapRequestMore = function($event, request) {
            //alert("TODO more request id("+request.id+") ");
            $state.go('tab.request-detail', {id: request.id});
        };

        $scope.tapRequestKonfetti = function($event, request) {
            $event.stopPropagation();
            request.konfettiCount++;
            $scope.actualKonfettiCount--;
        };

        // pop up with more info in party orga
        $scope.showPartyInfo = function() {

            $scope.orga = {
                name: 'Helferverein Nord e.V.',
                town: 'Berlin-Pankow',
                address: 'Berliner Str. 99, 13189 Berlin, GERMANY',
                person: 'Max Mustermann',
                website: 'http://pankowhilft.blogsport.de'
            };

            $translate("ORGAINFO_TITLE").then(function (ORGAINFO_TITLE) {
                $translate("ORGAINFO_SUB").then(function (ORGAINFO_SUB) {
                    // An elaborate, custom popup
                    var myPopup = $ionicPopup.show({
                        template: '<h4>{{orga.name}}</h4><br>{{orga.address}}<br>{{orga.person}}',
                        title: ORGAINFO_TITLE,
                        subTitle: ORGAINFO_SUB,
                        scope: $scope,
                        buttons: [
                            { text: '<i class="icon ion-ios-close-outline"></i>' },
                            {
                                text: '<i class="icon ion-information-circled"></i>',
                                type: 'button-positive',
                                onTap: function(e) {
                                    window.open($scope.orga.website, "_system");
                                }
                            }
                        ]
                    });
                    myPopup.then(function(res) {
                        console.log('Tapped!', res);
                    });
                });
            });


        };

    })

.controller('RequestCtrl', function(AppContext, $scope, $log, $stateParams, $ionicTabsDelegate, $timeout, $translate, $ionicPopup) {

  $scope.title = "";
  $scope.profile = AppContext.getProfile();

  // request data skeleton
  $scope.request = {
    id : 0,
    author : $scope.profile.id,
    profile_name : '',
    profile_imageUrl : '',
    profile_spokenLangs : [],
    headline : {
        'en' : '',
        'de' : '',
        'ar' : ''
    },
    confetti : 0,
    info: [],
    chats : []
  };

  // orga data skeleton
  $scope.orga = {
    name: 'Helferverein Nord e.V.',
    town: 'Berlin-Pankow',
    address: 'Berliner Str. 99, 13189 Berlin, GERMANY',
    person: 'Max Mustermann',
    website: 'http://pankowhilft.blogsport.de'
  };

  // get request id if its a existing request
  if (typeof $stateParams.id!="undefined") $scope.request.id = $stateParams.id;

  // change title based on situation
  $scope.headerTitle= "";
  if ($scope.request==0) {
        $translate("NEWREQUEST").then(function (NEWREQUEST) {
                $timeout(function() {
                    $scope.headerTitle = NEWREQUEST;
                },10);
        });
  } else {
        $translate("TAB_REQUEST").then(function (TAB_REQUEST) {
                $timeout(function() {
                    $scope.headerTitle = TAB_REQUEST;
                },10);
        });
  }

  // when re-entering the view
  $scope.$on('$ionicView.enter', function(e) {

  });

  $scope.confettiMin = 1;
  $scope.confettiMax = 12345;
  $scope.confettiToSpend = $scope.confettiMin;

  // pop pup to choose languages
  $scope.editSpokenLanguage = function() {

      $scope.addRemoveLang = function(addRemove, value) {
          if (addRemove===0) {
              // remove
              var i = $scope.profile.spokenLangs.indexOf(value);
              if(i != -1) $scope.profile.spokenLangs.splice(i, 1);
          } else {
              // add
              $scope.profile.spokenLangs.push(value);
          }
      };

    // An elaborate, custom popup
      $translate("ISPEAK").then(function (ISPEAK) {

            $scope.en = $scope.profile.spokenLangs.contains("en") ? 1 : 0;
            $scope.de = $scope.profile.spokenLangs.contains("de") ? 1 : 0;
            $scope.ar = $scope.profile.spokenLangs.contains("ar") ? 1 : 0;

            var myPopup = $ionicPopup.show({
                      templateUrl: 'templates/pop-languages.html',
                      scope: $scope,
                      title: ISPEAK,
                      subTitle: "",
                      buttons: [
                          { text: '<i class="icon ion-ios-close-outline"></i>'
                          }
                      ]
            });
            myPopup.then(function(res) {
                if ($scope.profile.spokenLangs.length===0) $scope.profile.spokenLangs.push(AppContext.getAppLang());
                AppContext.setProfile($scope.profile);
            });

      });

  };

  $scope.takeSelfi = function() {
    alert("TODO: take Selfi");
  }

})

.controller('ChatDetailCtrl', function($scope, $stateParams, Chats) {
  $scope.chat = Chats.get($stateParams.chatId);
})

.controller('AccountCtrl', function($scope) {
  $scope.settings = {
    enableFriends: true
  };
});
