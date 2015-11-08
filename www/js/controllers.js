angular.module('starter.controllers', [])

.controller('DashCtrl', function(AppContext, $window, $rootScope, $scope, $translate, $timeout, $ionicPopup, $log, $state, $ionicScrollDelegate, ApiService) {

        $scope.loadingParty = true;
        $scope.state = "init";

        $scope.actualSorting = null;

        $scope.partyList = [];
        $scope.actualPartyIndex = 0;

        $scope.requestsReview = [];
        $scope.requestsPosted = [];
        $scope.requestsInteraction = [];
        $scope.requestsOpen = [];
        $scope.notifications = [];

        // available app languages
        $scope.langSet = [
            {code:'en', display:'English', dir:'ltr'},
            {code:'de', display:'Deutsch', dir:'ltr'},
            {code:'ar', display:'عربي', dir:'rtl'}
        ];

        // sorting options
        $scope.sortSet = [
            {sort:'most', display:'most'},
            {sort:'new', display:'new'}
        ];
        $scope.actualSorting = $scope.sortSet[0].sort;
        $scope.updateSortOptions = function() {
            $translate("POSTSORT_MOST").then(function (POSTSORT_MOST) {
                $translate("POSTSORT_NEW").then(function (POSTSORT_NEW) {
                    $scope.sortSet[0].display = POSTSORT_MOST;
                    $scope.sortSet[1].display = POSTSORT_NEW;
                });
            });
        };
        $scope.updateSortOptions();

        // the sorting of open tasks changed
        $scope.changedSorting = function(actualSorting) {
            if ((typeof actualSorting != "undefined") && (actualSorting!=null)) {
                $scope.actualSorting = actualSorting;
            } else {
                $scope.actualSorting = $scope.sortSet[0].sort;
            }
            $timeout(function(){
                console.dir("trigger sorting: "+$scope.actualSorting);
                $scope.sortRequests();
            },100);
        };

        $scope.sortRequests = function(changedRequestId) {
            var sortFunctionMost = function(a,b) {
                return (b.konfettiCount+b.konfettiAdd) - (a.konfettiCount+a.konfettiAdd);
            };
            var sortFunctionNew = function(a,b) {
                return (b.time) - (a.time);
            };
            var sortFunction = sortFunctionMost;
            if ($scope.actualSorting==='new') sortFunction = sortFunctionNew;

            if ((typeof changedRequestId != "undefined") && ($scope.actualSorting!='new')) {

                // get index of request in focus
                var requestChangedIndex = 0;
                for (i = 0; i < $scope.requestsOpen.length; i++) {
                    if ($scope.requestsOpen[i].id===changedRequestId) {
                        requestChangedIndex = i;
                        break;
                    }
                }

                // find out if array changed in sorting and when then
                // find the top most changed in ranking
                var topMostChangedIndex = -1;
                var newSortedArray = $scope.requestsOpen.slice();
                newSortedArray.sort(sortFunction);
                for (i = 0; i < $scope.requestsOpen.length; i++) {
                    if ($scope.requestsOpen[i].id!=newSortedArray[i].id) {
                        topMostChangedIndex = i;
                        break;
                    }
                }

                // if there is a change - animate
                if (topMostChangedIndex>=0) {

                    if ((requestChangedIndex-topMostChangedIndex)>1) {
                        // move more than one position
                        document.getElementById('openRequestCard'+changedRequestId).classList.add("animationFadeUp");
                        document.getElementById('openRequestCard'+$scope.requestsOpen[topMostChangedIndex].id).classList.add("animationFadeDown");
                        $timeout(function(){
                            document.getElementById('openRequestCard'+changedRequestId).classList.remove("animationFadeUp");
                            document.getElementById('openRequestCard'+$scope.requestsOpen[topMostChangedIndex].id).classList.remove("animationFadeDown");
                            $scope.requestsOpen = newSortedArray;
                        },810);
                    } else {
                        // just one position
                        document.getElementById('openRequestCard'+changedRequestId).classList.add("animationMoveUp");
                        document.getElementById('openRequestCard'+$scope.requestsOpen[topMostChangedIndex].id).classList.add("animationMoveDown");
                        $timeout(function(){
                            document.getElementById('openRequestCard'+changedRequestId).classList.remove("animationMoveUp");
                            document.getElementById('openRequestCard'+$scope.requestsOpen[topMostChangedIndex].id).classList.remove("animationMoveDown");
                            $scope.requestsOpen = newSortedArray;
                        },810);
                    }

                }
            } else {
                $scope.requestsOpen.sort(sortFunction);
            }

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
            $scope.action();
        };

        // the previous party from list (closer)
        $scope.buttonPartyPrev = function() {
            $scope.actualPartyIndex--;
            if ($scope.actualPartyIndex<0) $scope.actualPartyIndex = $scope.partyList.length-1;
            $scope.action();
        };

        // next party in list (more far away)
        $scope.buttonPartyNext = function() {
            $scope.actualPartyIndex++;
            if ($scope.actualPartyIndex>=$scope.partyList.length) $scope.actualPartyIndex = 0;
            $scope.action();
        };

        $scope.loadDataForSelectedParty = function() {
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
            if ($rootScope.orga.konfettiCount<=0) {
                if (request.konfettiAdd===0) {
                    log.info("TODO: show dialog that confetti is zero and tell how to earn it");
                }
                return;
            }
            request.konfettiAdd++;
            $rootScope.orga.konfettiCount--;
            request.lastAdd = Date.now();
            $timeout(function() {
                if ((Date.now() - request.lastAdd) < 999) return;
                // Make SERVER REQUEST
                document.getElementById('openRequestCard'+request.id).classList.add("pulse");
                ApiService.upvoteRequest(request.id, request.konfettiAdd, function(){
                    // WIN -> update sort
                    document.getElementById('openRequestCard'+request.id).classList.remove("pulse");
                    request.konfettiCount += request.konfettiAdd;
                    request.konfettiAdd = 0;
                    $scope.sortRequests(request.id);
                }, function(){
                    // FAIL -> put konfetti back
                    document.getElementById('openRequestCard'+request.id).classList.remove("pulse");
                    $rootScope.orga.konfettiCount -= request.konfettiAdd;
                    request.konfettiAdd = 0;
                });

            },1000);
        };

        $scope.reloadPartyList = function() {
            $scope.partyList = [];
            $scope.actualPartyIndex = 0;
            $log.info("TODO: Also UPDATE GPS coordinates later");
            $scope.action();
        };

        // pop up with more info in party orga
        $scope.showPartyInfo = function() {
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
                                    window.open($rootScope.orga.website, "_system");
                                }
                            }
                        ]
                    });
                    myPopup.then(function(res) {});
                });
            });

        };

        $scope.$on('$ionicView.enter', function(e) {
            $scope.action();
        });

        $scope.action = function() {

            $scope.loadingParty = true;

            $rootScope.orga = { id:0 };
            $scope.requestsReview = [];
            $scope.requestsPosted = [];
            $scope.requestsInteraction = [];
            $scope.requestsOpen = [];
            $scope.notifications = [];

            // check if account init on startup is already done
            if (!AppContext.isReady()) {
                $timeout($scope.action, 300);
                return;
            }

            // check if got client account
            if (AppContext.getAccount().clientId.length===0) {
                if ($scope.state != "ACCOUNTWAIT") {
                    $scope.state = "ACCOUNTWAIT";
                    ApiService.createAccount(function(account){
                        // WIN
                        AppContext.setAccount(account);
                        $scope.action();
                    },function(code){
                        // FAIL
                        $log.info("FAIL - no account");
                        $scope.state = "INTERNETFAIL";
                        $timeout($scope.action, 5000);
                    });
                }
                return;
            }

            // check if GPS is available
            if ($rootScope.gps==='wait') {
                $scope.state = "GPSWAIT";
                $timeout($scope.action, 300);
                return;
            }

            // check if GPS is failed
            //$rootScope.gps = 'fail';
            if ($rootScope.gps==='fail') {
                $scope.state = "GPSFAIL";
                return;
            }

            // load party list (just once when app starts)
            if ($scope.partyList.length===0) {
                if ($scope.state!="PARTYLISTWAIT") {
                    $scope.state = "PARTYLISTWAIT";
                    ApiService.loadPartylist($rootScope.lat, $rootScope.lon, function(list) {
                        // WIN;
                        $scope.partyList = list;
                        $scope.action();
                    }, function(code) {
                        // FAIL
                        $scope.state = "INTERNETFAIL";
                        $timeout($scope.action, 5000);
                    });
                }
                return;
            }

            $scope.state = "PARTYWAIT";
            ApiService.loadParty($scope.partyList[$scope.actualPartyIndex].id,function(data){
                $rootScope.orga = data.orga;
                $scope.requestsReview = data.requestsReview;
                $scope.requestsPosted = data.requestsPosted;
                $scope.requestsInteraction = data.requestsInteraction;
                $scope.requestsOpen = data.requestsOpen;
                $scope.notifications = data.notifications;
                $scope.loadingParty = false;
                $scope.sortRequests();
                $scope.state = "";
            },function(code){
                // FAIL
                $scope.state = "INTERNETFAIL";
                $timeout($scope.action, 5000);
            });

        }

    })

.controller('RequestCtrl', function($rootScope, AppContext, $scope, $log, $state, $stateParams, $ionicTabsDelegate, $timeout, $translate, $ionicPopup, ApiService) {

  $scope.title = "";
  $scope.loadingRequest = true;
  $scope.profile = AppContext.getProfile();
  $scope.state = "";

  // request data skeleton
  $scope.request = {id : 0};

  // get request id if its a existing request
  if (typeof $stateParams.id!="undefined") {
      $scope.request.id = $stateParams.id;
  } else {
      $scope.loadingRequest = false;
  }

  $scope.loadRequest = function() {
    $scope.loadingRequest = true;
    ApiService.loadRequest($scope.request.id,function(req){
                // WIN
                $scope.request = req;
                $scope.loadingRequest = false;
    }, function(code){
                // FAIL
                $scope.state = "INTERNETFAIL";
                $timeout(function(){
                    $scope.loadRequest();
                },5000);
    });
  };

  // when re-entering the view
  $scope.reenter = false;
  $scope.$on('$ionicView.enter', function(e) {

      // when no party is loaded
      if ($rootScope.orga.id===0) {
          $state.go('tab.dash');
          return;
      }

      // clean request data skeleton
      if (($scope.reenter) || ($scope.request.id===0)){
          $scope.request = {
              id : 0,
              author : $scope.profile.id,
              profile_name : '',
              profile_imageUrl : '',
              profile_spokenLangs : [],
              headline : {
                  'en' : '',        // TODO: headline als info data field - jeder text braucht meta wer übersetzer, sprache, ...
                  'de' : '',
                  'ar' : ''
              },
              confetti : 0,
              info: [],
              chats : []
          };
      }

      // load request if needed
      if ($scope.request.id!=0) {
          $scope.loadRequest();
      }

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

      $scope.confettiMin = 1;
      $scope.confettiMax = 12345;
      $scope.confettiToSpend = $scope.confettiMin;
      $scope.headline = "";

      // always keep as last in in this section
      $scope.reenter = true;
  });

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
                          { text: '<i class="icon ion-android-done"></i>'
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
  };

  $scope.addInfoItem = function() {
      alert("TODO: add info items -> popup with select type and than second popup to enter");
  };

  $scope.displayChat = function($event, chat) {
      $event.stopPropagation();
      alert("TODO: Show Chat with id("+chat.id+")");
  };

  $scope.submitRequest = function() {

      if ($scope.profile.name.length===0) {
          $translate("IMPORTANT").then(function (HEADLINE) {
              $translate("ENTERNAME").then(function (TEXT) {
                  $ionicPopup.alert({
                      title: HEADLINE,
                      template: TEXT
                  }).then(function(res) {});
              });
          });
          return;
      }

      alert($scope.headline);
      if ($scope.headline.length<4) {
          $translate("IMPORTANT").then(function (HEADLINE) {
              $translate("ENTERREQUEST").then(function (TEXT) {
                  $ionicPopup.alert({
                      title: HEADLINE,
                      template: TEXT
                  }).then(function(res) {});
              });
          });
          return;
      }

      $translate("THANKYOU").then(function (HEADLINE) {
          $translate("SUBMITINFO").then(function (TEXT) {
              $ionicPopup.alert({
                  title: HEADLINE,
                  template: TEXT
              }).then(function(res) {
                  alert("TODO: make sure submitted task appears under 'you posted' in dash with waiting for review");
                  $state.go('tab.dash');
              });
          });
      });
  };

})

.controller('ChatDetailCtrl', function($rootScope, $scope, $stateParams, Chats) {
  $scope.chat = Chats.get($stateParams.chatId);
})

.controller('AccountCtrl', function($rootScope, $scope, $state) {

  $scope.$on('$ionicView.enter', function(e) {
      // when no party is loaded
      if ($rootScope.orga.id===0) {
          $state.go('tab.dash');
          return;
      }
  });

  $scope.settings = {
    enablePush: true,
    pauseChat: true
  };

  $scope.onButtonCoupon = function() {
      alert("TODO: PopUp to enter number-COUPON-code (no text because different alphabet)");
  };

  $scope.onButtonCode = function() {
      alert("TODO: PopUp to enter number-MAGICCODE-code (activate features, add privileges, ...)");
  };

});
