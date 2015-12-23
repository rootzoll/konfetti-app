angular.module('starter.controllers', [])

.controller('DashCtrl', function(AppContext, $window, $rootScope, $scope, $translate, $timeout, $ionicPopup, $log, $state, $stateParams, $ionicScrollDelegate, ApiService, KonfettiToolbox) {

        // check if id of chat is available

        var focusPartyId = 0; // 0 = no focus
        if (typeof $stateParams.id!="undefined") {
            focusPartyId = $stateParams.id;
            //console.log("The Party with id("+focusPartyId+") is marked for focus.");
        }

        $scope.userId = 0;
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
        $scope.showNotifications = false;

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

        $scope.onNewRequest = function() {
            $state.go('tab.request-detail', {id: 0, area: 'top'});
        };

        $scope.tapNotificationMore = function($event, noti) {

            // media item info --> ignore tap
            if (noti.type==1) {
                return;
            }

            // request now public --> go to request page
            if (noti.type==2) {
                $state.go('tab.request-detail', {id: noti.ref, area: 'top'});
                return;
            }

            // request rejected --> go to request page
            if (noti.type==3) {
                $state.go('tab.request-detail', {id: noti.ref, area: 'top'});
                return;
            }

            // new chat message --> go to request page - scroll down to chats
            if (noti.type==4) {
                $state.go('tab.request-detail', {id: noti.ref, area: 'chats'});
                return;
            }

        };

        $scope.tapNotificationDelete = function($event, noti) {
            if ((typeof $event != "undefined") && ($event!=null)) $event.stopPropagation();

            document.getElementById('notification-'+noti.id).classList.add("animationFadeOut");
            ApiService.markNotificationAsRead( noti.id,
            function(){
                // WIN

                // set id = 0
                // --> not displaying it anymore
                noti.id = 0;

                // check if there is at least one notification with id>0 to display
                $scope.showNotifications = false;
                for (var i = 0; i < $scope.notifications.length; i++) {
                    if ($scope.notifications[i].id>0) {
                        $scope.showNotifications = true;
                        break;
                    }
                }

            }, function(){
                // FAIL
                document.getElementById('notification-'+noti.id).classList.remove("animationFadeOut");
                $log.warn("Was not able to mark notification as read.");
            });
        };

        $scope.tapRequestMore = function($event, request) {
            $state.go('tab.request-detail', {id: request.id, area: 'top'});
        };

        $scope.tapRequestKonfetti = function($event, request) {
            $event.stopPropagation();

            if ($rootScope.party.user.konfettiCount<=0) {
                if (request.konfettiAdd===0) {
                    log.info("TODO: show dialog that confetti is zero and tell how to earn it");
                }
                return;
            }

            // block further tapping when reporting to server
            if (typeof request.blockTap === "undefined") request.blockTap = false;
            if (request.blockTap) return;

            // count up confetti to add
            request.konfettiAdd++;
            $rootScope.party.user.konfettiCount--;
            request.lastAdd = Date.now();

            $timeout(function() {
                if ((Date.now() - request.lastAdd) < 999) return;
                request.blockTap = true;
                // Make SERVER REQUEST
                document.getElementById('openRequestCard'+request.id).classList.add("pulse");
                ApiService.upvoteRequest(request.id, request.konfettiAdd, function(){
                    // WIN -> update sort
                    document.getElementById('openRequestCard'+request.id).classList.remove("pulse");
                    request.konfettiCount += request.konfettiAdd;
                    request.konfettiAdd = 0;
                    request.blockTap = false;
                    $scope.sortRequests(request.id);
                }, function(){
                    // FAIL -> put konfetti back
                    document.getElementById('openRequestCard'+request.id).classList.remove("pulse");
                    $rootScope.party.user.konfettiCount -= request.konfettiAdd;
                    request.konfettiAdd = 0;
                    request.blockTap = false;
                });

            },1000);
        };

        $scope.reloadPartyList = function() {
            $scope.partyList = [];
            $scope.actualPartyIndex = 0;
            $log.info("TODO: Also UPDATE GPS coordinates later");
            $scope.action();
        };

        // pop up with more info in party
        $scope.showPartyInfo = function() {
            $translate("PARTYINFO_TITLE").then(function (TITLE) {
                $translate("PARTYINFO_SUB").then(function (SUB) {
                    // An elaborate, custom popup
                    var myPopup = $ionicPopup.show({
                        template: '<div style="text-align:center;"><h4>{{party.name}}</h4><br>{{party.detailText}}<br><br>{{party.contact}}</div>',
                        title: TITLE,
                        subTitle: SUB,
                        scope: $scope,
                        buttons: [
                            {
                                text: '<i class="icon ion-information-circled"></i>',
                                type: 'button-positive',
                                onTap: function(e) {
                                    if ($rootScope.party.contact.lastIndexOf('http', 0) === 0) {
                                        window.open($rootScope.party.contact, "_system");
                                    } else
                                    if ($rootScope.party.contact.lastIndexOf('mailto:', 0) === 0) {
                                        window.open($rootScope.party.contact, "_system");
                                    } else
                                    {
                                        window.open("mailto:"+$rootScope.party.contact, "_system");
                                    }
                                }
                            },
                            { text: '<i class="icon ion-ios-close-outline"></i>' }
                        ]
                    });
                    myPopup.then(function(res) {});
                });
            });
        };

        $scope.$on('$ionicView.enter', function(e) {
            $scope.userId = AppContext.getProfile().userId;
            $scope.controllerInitDone = true;
            $scope.action();
        });

        $scope.buttonIntroScreenOK = function() {
            var state = AppContext.getLocalState();
            state.introScreenShown = true;
            AppContext.setLocalState(state);
            $scope.action();
        };

        $scope.action = function() {

            $scope.loadingParty = true;

            $rootScope.party = { id:0 };
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

            // display intro message
            if (!AppContext.getLocalState().introScreenShown) {
                $scope.state = "INTRO";
                // show intro part of view
                // --> button press AppContext.getLocalState.introScreenShown = true
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

            // check if focusPartyId is in partylist
            var isFocusPartyInList = 0;
            for (var i=0; i<$scope.partyList.length; i++) {
                if ($scope.partyList[i].id == focusPartyId) isFocusPartyInList=i;
            }
            if (focusPartyId>0) {
                if (isFocusPartyInList===0) {
                    // add to list
                    var partyObject = {
                        id: focusPartyId,
                        lat: 0,
                        lon: 0,
                        meter: 0,
                        new: 1
                    };
                    $scope.partyList.unshift(partyObject);
                }
                // set focus index
                $scope.actualPartyIndex = isFocusPartyInList;
            }

            $scope.state = "PARTYWAIT";
            ApiService.loadParty($scope.partyList[$scope.actualPartyIndex].id,function(data){
                var isReviewerForThisParty = (AppContext.getProfile().reviewer.indexOf(data.party.id) > -1);
                var isAdminForThisParty = (AppContext.getProfile().admin.indexOf(data.party.id) > -1);
                console.log("party("+data.party.id+") isAdmin("+isAdminForThisParty+") isReviewer("+isReviewerForThisParty+")");
                $rootScope.party = data.party;
                if (isAdminForThisParty || isReviewerForThisParty) $scope.requestsReview = KonfettiToolbox.filterRequestsByState(data.requests, 'review');
                $scope.requestsPosted = KonfettiToolbox.filterRequestsByAuthor(data.requests,AppContext.getAccount().userId);
                $scope.requestsInteraction = KonfettiToolbox.filterRequestsByInteraction(data.requests,AppContext.getAccount().userId);
                $scope.requestsOpen = KonfettiToolbox.filterRequestsByState(data.requests, 'open');
                $scope.notifications = data.notifications;
                $scope.loadingParty = false;
                $scope.sortRequests();
                $scope.state = "";
                $scope.showNotifications = ($scope.notifications.length>0);
            },function(code){
                // FAIL
                $scope.state = "INTERNETFAIL";
                $timeout($scope.action, 5000);
            });

        };
    })

.controller('RequestCtrl', function($rootScope, AppContext, $scope, $log, $state, $stateParams, $ionicTabsDelegate, $ionicScrollDelegate ,$timeout, $translate, $ionicPopup, $ionicLoading, ApiService) {

  $scope.loadingRequest = true;
  $scope.profile = AppContext.getProfile();
  $scope.state = "";

  // request data skeleton
  $scope.headline = { temp: ""};
  $scope.request = {id : 0};
  $scope.userIsAuthor = false;
  $scope.isAdmin = false;
  $scope.isReviewer = false;

  $scope.noticeTextId = "";
  $scope.noticeColor = "";

  $scope.setNoticeTextByRequestState = function() {

            /*
             * make sure some explaining text is displayed
             * so the user is understanding the state of the request
             * according to his role (public, author, reviewer, admin)
             */

            $scope.noticeColor = "";
            $scope.noticeTextId = "";

            // when in review and user is author
            if (($scope.request.state=='review') && ($scope.userIsAuthor)) {
                $scope.noticeColor = "#ffc900";
                $scope.noticeTextId = "EXPLAIN_REVIEW_USER";
            }

            // when in review and user is reviewer/admin
            if (($scope.request.state=='review') && ($scope.isReviewer || $scope.isAdmin)) {
                $scope.noticeColor = "#ffc900";
                $scope.noticeTextId = "EXPLAIN_REVIEW_ADMIN";
            }

            // when got rejected
            if (($scope.request.state=='rejected')) {
                $scope.noticeColor = "red";
                $scope.noticeTextId = "EXPLAIN_REJECTED";
            }

            // when open and user is author
            if (($scope.request.state=='open') && ($scope.userIsAuthor)) {
                $scope.noticeColor = "green";
                $scope.noticeTextId = "EXPLAIN_OPEN_AUTHOR";
            }

            // when open and user is public
            if (($scope.request.state=='open') && (!$scope.userIsAuthor)) {
                $scope.noticeColor = "green";
                $scope.noticeTextId = "EXPLAIN_OPEN_PUBLIC";
            }

            // when open and user is public
            if (($scope.request.state=='processing') && ($scope.userIsAuthor)) {
                $scope.noticeColor = "green";
                $scope.noticeTextId = "EXPLAIN_PROCESSING_AUTHOR";
            }

            // when is in the process of doing and user id author
            if (($scope.request.state=='processing') && (!$scope.userIsAuthor)) {
                $scope.noticeColor = "green";
                $scope.noticeTextId = "EXPLAIN_PROCESSING_PUBLIC";
            }

            // when done and user is not author
            if (($scope.request.state=='done') && (!$scope.userIsAuthor)) {
                $scope.noticeColor = "green";
                $scope.noticeTextId = "EXPLAIN_DONE_PUBLIC";
            }

            // when done and user is author
            if (($scope.request.state=='done') && ($scope.userIsAuthor)) {
                $scope.noticeColor = "green";
                $scope.noticeTextId = "EXPLAIN_DONE_AUTHOR";
            }
  };

  // load request function
  $scope.loadRequest = function() {
    $scope.loadingRequest = true;
    ApiService.loadRequest($scope.request.id,function(req){

                // WIN
                $scope.request = req;
                $scope.loadingRequest = false;
                $scope.requestJSON = JSON.stringify($scope.request);
                $scope.userIsAuthor = (req.userId == AppContext.getAccount().userId);
                $scope.isAdmin = AppContext.getProfile().admin.contains($scope.request.partyId);
                $scope.isReviewer = AppContext.getProfile().reviewer.contains($scope.request.partyId);
                if (AppContext.getRunningOS()=="browser") console.log("isAuthor("+$scope.userIsAuthor+") isReviewer("+$scope.isReviewer+") isAdmin("+$scope.isAdmin+")");

                //alert("userid("+req.userId +") isAuthor("+$scope.userIsAuthor+")");

                $scope.setNoticeTextByRequestState();

                // get anchor
                if (typeof $stateParams.area!="undefined") {
                    if ($stateParams.area==='chats') $timeout(function(){
                        $ionicScrollDelegate.scrollBottom(true);
                    },500);
                }

    }, function(code){
                // FAIL
                $scope.state = "INTERNETFAIL";
                $timeout(function(){
                    $scope.loadRequest();
                },5000);
    });
  };

  // set new request function
  $scope.setNewRequest = function() {

     $scope.state = "";
     $scope.headline = { temp: ""};
     $scope.request = {id : 0};
     $scope.userIsAuthor = true;

     $scope.noticeColor = "";
     $scope.noticeTextId = "";

     // just for better debug in browser
     if (typeof $rootScope.party.newRequestMinKonfetti == "undefined") {
          $rootScope.party.newRequestMinKonfetti = 1;
          console.warn("IF NOT DEV-MODE: MISSING newRequestMinKonfetti - setting DEV-DEFAULT");
     }
     if (typeof $rootScope.party.user == "undefined") {
         $rootScope.party.user = {konfettiCount:  10};
         console.warn("IF NOT DEV-MODE: MISSING party.user - setting DEV-DEFAULT");
     }

     $scope.confettiMin = $rootScope.party.newRequestMinKonfetti;
     console.dir($rootScope.party);
     $scope.confettiMax = $rootScope.party.user.konfettiCount;
     $scope.confettiToSpend = $scope.confettiMin;
  };

  // get request id if its a existing request
  if ((typeof $stateParams.id!="undefined") && ($stateParams.id!=0)) {
    $scope.request.id = $stateParams.id;
    console.log("LOADING REQUEST: "+$scope.request.id);
    $scope.loadRequest();
  } else {
    console.log("SET NEW REQUEST");
    $scope.loadingRequest = false;
    $scope.setNewRequest();

  }

  $scope.tapRequestKonfetti = function($event, request) {

            $event.stopPropagation();
            if ($rootScope.party.user.konfettiCount<=0) return;

            // block further tapping when reporting to server
            if (typeof request.blockTap === "undefined") request.blockTap = false;
            if (request.blockTap) return;

            // count up confetti to add
            request.konfettiAdd++;
            $rootScope.party.user.konfettiCount--;
            request.lastAdd = Date.now();

            $timeout(function() {
                if ((Date.now() - request.lastAdd) < 999) return;
                request.blockTap = true;
                // Make SERVER REQUEST
                ApiService.upvoteRequest(request.id, request.konfettiAdd, function(){
                    // WIN -> update sort
                    request.konfettiCount += request.konfettiAdd;
                    request.konfettiAdd = 0;
                    request.blockTap = false;
                }, function(){
                    // FAIL -> put konfetti back
                    $rootScope.party.user.konfettiCount -= request.konfettiAdd;
                    request.konfettiAdd = 0;
                    request.blockTap = false;
                });

            },1000);
  };

  $scope.startChat = function() {

      // make sure user has entered name before first chat
      if ($scope.profile.name.length<=0) {
          $translate("IMPORTANT").then(function (HEADLINE) {
              $translate("ENTERNAME").then(function (TEXT) {
                $ionicPopup.prompt({
                    title: HEADLINE,
                    template: TEXT,
                    inputType: 'text',
                    inputPlaceholder: ''
                }).then(function(res) {
                    console.log('name:', res);
                    if (typeof res != "undefined") {
                        $scope.profile.name = res;
                        AppContext.setProfile($scope.profile);
                        $scope.startChat();
                    }
                });
              });
          });
          return;
      }

      ApiService.createChat($scope.request.id, function(result) {
        // WIN
        $rootScope.chatPartner = { requestTitle: $scope.request.title , userName: $scope.request.userName, imageUrl: $scope.request.imageUrl, spokenLangs: $scope.request.spokenLangs};
        var dataObj = {id: result.id};
        $state.go('tab.chat-detail', dataObj);
      }, function(errorCode) {
        // FAIL
          $translate("IMPORTANT").then(function (HEADLINE) {
              $translate("INTERNETPROBLEM").then(function (TEXT) {
                  $ionicPopup.alert({
                      title: HEADLINE,
                      template: TEXT
                  }).then(function(res) {});
              });
          });
      });

      // END of startChat()
    };

  // when re-entering the view
  //$scope.reenter = false;
  $scope.$on('$ionicView.enter', function(e) {

      // when no party is loaded
      if ($rootScope.party.id===0) {
          $state.go('tab.dash', {id: 0});
          return;
      }

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
      $translate("ADDINFO").then(function (TITLE) {

          $scope.add = {type: "text", ok: false};

          var myPopup = $ionicPopup.show({
              templateUrl: 'templates/pop-addinfo.html',
              scope: $scope,
              title: TITLE,
              subTitle: "",
              buttons: [
                  { text: 'Cancel' },
                  { text: 'Add',
                    type: 'button-positive',
                    onTap: function(e) {
                        $scope.add.ok = true;
                    }
                  }
              ]
          });
          myPopup.then(function(res) {
              if (!$scope.add.ok) return;
              if ($scope.add.type=='image') $scope.addInfoImage();
              if ($scope.add.type=='text') $scope.addInfoText();
              if ($scope.add.type=='location') $scope.addInfoLocation();
          });
      });
  };

  $scope.addInfoImage = function() {
      alert("TODO: Pick Image from Galarie");
  };

  $scope.addInfoText = function() {
      $translate("ADDTEXT").then(function (HEADLINE) {
          $translate("ENTERTEXT").then(function (TEXT) {
              $ionicPopup.prompt({
                  title: HEADLINE,
                  template: TEXT,
                  inputType: 'text',
                  inputPlaceholder: ''
              }).then(function(res) {
                  console.log('name:', res);
                  if (typeof res != "undefined") {
                    // TODO
                    alert('TODO: Post text media item to request ('+$scope.request.id+'):'+res);
                  }
              });
          });
      });
  };

  $scope.addInfoLocation = function() {
      alert("TODO: Show Map Location Picker");
  };

  $scope.buttonRequestDone = function() {

      $translate("REWARDKONFETTI").then(function (TITLE) {
          $translate("SELECTREWARD").then(function (SUBLINE) {

          $scope.rewardDialog = false;

          var latestChat = null;
          var latestTimestamp = 0;
          for (var i = 0; i < $scope.request.chats.length; i++) {
              $scope.request.chats[i].reward = false;
              if ($scope.request.chats[i].lastActivity > latestTimestamp) {
                  latestTimestamp = $scope.request.chats[i].lastActivity;
                  latestChat = $scope.request.chats[i];
              }
          };

          // preselect the chat with the latest activity to get reward
          if (latestChat!=null) latestChat.reward = true;

          // TODO: Dynamic Button Text translate
          var myPopup = $ionicPopup.show({
              templateUrl: 'templates/pop-reward.html',
              scope: $scope,
              title: TITLE,
              subTitle: SUBLINE,
              buttons: [
                  { text: 'Cancel' },
                  { text: 'OK',
                      type: 'button-positive',
                      onTap: function(e) {
                          $scope.rewardDialog = true;
                      }
                  }
              ]
          });
          myPopup.then(function(res) {

              // if cancel button dont continue
              if (!$scope.rewardDialog) return;

              // create array of selected user ids to grant reward to
              var rewardUserIds = [];
              for (var i = 0; i < $scope.request.chats.length; i++) {
                  if ($scope.request.chats[i].reward) {
                      rewardUserIds.push($scope.request.chats[i].userId);
                  }
              };
              if (rewardUserIds.length==0) {
                  return;
              }
              $ionicLoading.show({
                  template: '<img src="img/spinner.gif" />'
              });
              ApiService.rewardRequest($scope.request.id, rewardUserIds, function() {
                  $ionicLoading.hide();
                  $scope.request.state='done';
                  $scope.setNoticeTextByRequestState();
              }, function() {
                  // FAIL
                  $ionicLoading.hide();
              });
              alert("TODO:  Mark request as done id("+$scope.request.id+") - payout konfetti to selected partners ("+JSON.stringify(rewardUserIds)+")");
          });
         });
      });

  };

  $scope.buttonRequestProcess = function() {
    alert("TODO: Mark request as processing id("+$scope.request.id+") - block further chats");
    $ionicLoading.show({
        template: '<img src="img/spinner.gif" />'
    });
    ApiService.setStateOfRequestToProcessing($scope.request.id, function(){
        // WIN
        $ionicLoading.hide();
        $scope.request.state = "processing";
        $scope.setNoticeTextByRequestState();
    }, function() {
        // FAIL - TODO
        $ionicLoading.hide();
        alert("FAIL");
    });
  };

  $scope.buttonRequestReopen = function() {
      $ionicLoading.show({
          template: '<img src="img/spinner.gif" />'
      });
      ApiService.setStateOfRequestToReOpen($scope.request.id, function(){
          // WIN
          $ionicLoading.hide();
          $scope.request.state = "open";
          $scope.setNoticeTextByRequestState();
      }, function() {
          // FAIL - TODO
          $ionicLoading.hide();
          alert("FAIL");
      });
  };

  $scope.buttonRequestDelete = function() {
          $translate("IMPORTANT").then(function (HEADLINE) {
              $translate("CONFIRM_DELETE_AUTHOR").then(function (TEXT) {
                  var confirmPopup = $ionicPopup.confirm({
                      title: HEADLINE,
                      template: TEXT
                  }).then(function(res) {
                      if(res) {
                          $ionicLoading.show({
                              template: '<img src="img/spinner.gif" />'
                          });
                          ApiService.deleteRequest($scope.request.id, 0, function() {
                              // WIN --> go to dash
                              $ionicLoading.hide();
                              $state.go('tab.dash', {id: $scope.request.partyId});
                          }, function() {
                              // FAIL
                              alert("TODO: FAIL delete("+$scope.request.id+")");
                              $ionicLoading.hide();
                          });
                      }
                  });
              });
          });
  };

  $scope.buttonRequestReject = function() {
      $translate("IMPORTANT").then(function (HEADLINE) {
          $translate("ENTERREASON").then(function (TEXT) {
              $ionicPopup.prompt({
                  title: HEADLINE,
                  template: TEXT,
                  inputType: 'text',
                  inputPlaceholder: ''
              }).then(function(res) {
                  var response = null;
                  if (res.length>0) response = res;
                  $ionicLoading.show({
                      template: '<img src="img/spinner.gif" />'
                  });
                  ApiService.reviewResultOnRequest($scope.request.id, false, null, response, function() {
                      // WIN --> go to dash
                      // todo: switch to next request to review
                      $ionicLoading.hide();
                      $state.go('tab.dash', {id: $scope.request.partyId});
                  }, function() {
                      // FAIL
                      alert("TODO: FAIL reject("+$scope.request.id+")");
                      $ionicLoading.hide();
                  });
              });
          });
      });
  };

  $scope.buttonRequestApprove = function() {
      ApiService.reviewResultOnRequest($scope.request.id, true, null, null, function(){
        // WIN --> go to dash
        // todo: switch to next request to review
        $state.go('tab.dash', {id: $scope.request.partyId});
      }, function() {
        // FAIL
          alert("TODO: FAIL approve("+$scope.request.id+")");
      });
  };

  $scope.displayChat = function($event, chat) {
      $event.stopPropagation();
      $rootScope.chatPartner = { requestTitle: $scope.request.title , userName: chat.userName, imageUrl: chat.imageUrl, spokenLangs: chat.spokenLangs};
      $state.go('tab.chat-detail', {id: chat.id});
      return;
  };

  $scope.removeChat = function($event, chat) {
      $event.stopPropagation();
      if (($scope.request.chats.length==1) && ($scope.request.state==='processing')) {
          return;
      }
      $ionicLoading.show({
          template: '<img src="img/spinner.gif" />'
      });
      ApiService.muteChatOnRequest($scope.request.id, chat.id, false, function() {
          $ionicLoading.hide();
          document.getElementById('chat-id-'+chat.id).classList.add("animationFadeOut");
          $timeout(function() {
              $scope.request.chats.splice($scope.request.chats.indexOf(chat), 1);
          },1000);
      }, function() {
          // FAIL
          $ionicLoading.hide();
      });
      return;
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

      if ($scope.headline.temp.length<4) {
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

      var newRequest = {
        userId: AppContext.getAccount().userId,
        userName: $scope.profile.name,
        spokenLangs : $scope.profile.spokenLangs,
        partyId : $rootScope.party.id,
        konfettiCount: $scope.confettiToSpend,
        title : $scope.headline.temp
      };

      $ionicLoading.show();
      ApiService.postRequest(newRequest, function(){
          // WIN
          $ionicLoading.hide();
          $translate("THANKYOU").then(function (HEADLINE) {
              $translate("SUBMITINFO").then(function (TEXT) {
                  $ionicPopup.alert({
                      title: HEADLINE,
                      template: TEXT
                  }).then(function(res) {
                      $scope.headline.temp = "";
                      $rootScope.party.user.konfettiCount - $scope.confettiToSpend;
                      $state.go('tab.dash', {id: 0});
                  });
              });
          });
      }, function() {
          // FAIL
          $ionicLoading.hide();
          alert("TODO: Fail handling");
      });
  };

})

.controller('AccountCtrl', function($rootScope, $scope, $state, $translate, $ionicPopup, ApiService, AppContext, $ionicLoading) {

  $scope.$on('$ionicView.enter', function(e) {
      // when no party is loaded
      if ($rootScope.party.id===0) {
          $state.go('tab.dash', {id: 0});
          return;
      }
  });

  $scope.settings = {
    enablePush: true,
    pauseChat: true
  };

  // pop up with more info in party
  $scope.showCodeRedeem = function(isRedeemCouponBool) {
    var titleKey = "MAGICCODE";
    var subKey = "REDEEM_MAGIC_SUB";
    if ((typeof isRedeemCouponBool != "undefined") && (isRedeemCouponBool)) {
        titleKey = "REDEEMCOUPON";
        subKey = "REDEEM_COUPON_SUB";
    }
    $translate(titleKey).then(function (TITLE) {
        $translate(subKey).then(function (SUB) {
            $ionicPopup.prompt({
                title: TITLE,
                template: SUB,
                // input type is number - because number codes work in all langs and alphabets
                inputType: 'number',
                inputPlaceholder: ''
            }).then(function(res) {
                console.log('name:', res);
                if (typeof res != "undefined") {
                    if (res.length==0) return;
                    $ionicLoading.show({
                        template: '<img src="img/spinner.gif" />'
                    });
                    ApiService.redeemCode(res, AppContext.getAppLang(), function(result){
                        // WIN
                        $ionicLoading.hide();
                        $scope.feedbackOnCode(result);
                    }, function(){
                        // FAIL
                        $ionicLoading.hide();
                        $translate("INTERNETPROBLEM").then(function (text) {
                            $scope.feedbackOnCode(text);
                        });
                    });
                }
            });
        });
    });
  };

  $scope.feedbackOnCode = function(result) {
      $translate("ANSWERE").then(function (HEADLINE) {
              $ionicPopup.alert({
                  title: HEADLINE,
                  template: result.feedbackHtml
              }).then(function() {
                  $scope.processRedeemActions(result.action);
              });
      });
  };

  $scope.processRedeemActions = function(actionArray) {
      if (typeof actionArray=="undefined") {
          console.warn("processRedeemActions: actionArray undefined - skip");
          return;
      }
      for (var i = 0; i < actionArray.length; i++) {

          var action = actionArray[i];
          if (typeof action == "undefined") {
              console.warn("processRedeemActions: action at index("+i+") is undefined - skip");
              continue;
          }

          // upgrade user to reviewer
          if (action.command=="reviewer") {
              var profile = AppContext.getProfile();
              if (!profile.reviewer.contains(action.partyId)) {
                  profile.reviewer.push(action.partyId);
                  AppContext.setProfile(profile);
              }
          } else

          // upgrade user to admin
          if (action.command=="admin") {
              var profile = AppContext.getProfile();
              if (!profile.admin.contains(action.partyId)) {
                  profile.admin.push(action.partyId);
                  AppContext.setProfile(profile);
              }
          } else

          // focus party in GUI
          if (action.command=="focusParty") {
              $state.go('tab.dash', {id: action.partyId});
          } else

          // unkown
          {
             alert("UNKOWN COMMAND '"+action.command+"'");
          }
      }
  };

  $scope.onButtonCoupon = function() {
      $scope.showCodeRedeem(true);
  };

  $scope.onButtonCode = function() {
      $scope.showCodeRedeem(false);
  };

})

.controller('ChatDetailCtrl', function($rootScope, $scope, $stateParams, $state, ApiService, $window, $ionicScrollDelegate, AppContext, $translate, $ionicPopup, $ionicHistory) {

   // TODO: remove after testing
   ApiService.createMediaItemAutoTranslate("test text", "de", function(){
        //alert("WIN");
   }, function(){
        alert("FAIL");
   });

   $scope.loading = false;
   $scope.sending = false;
   $scope.senderror = false;
   $scope.chatMessage = "";
   $scope.messages = [];

   // check if id of chat is available
   if (typeof $stateParams.id==="undefined") {
       $state.go('tab.dash', {id: 0});
       return;
   }

   window.addEventListener('native.keyboardshow', function($event){
        console.log("KEYBOARD");
        console.dir($event);
   });

   // load chat data
   $scope.chat = { id: $stateParams.id};
   $scope.loading = true;
   $scope.loadingText = "";
   ApiService.loadChat($stateParams.id, function(chatData) {
       $scope.chat = chatData;
       // TODO: make sure that message array is ordered
       $scope.loading = false;
       if ($scope.chat.messages.length>0) $scope.loadChatsItem(0);
   }, function(errorCode) {
       $translate("IMPORTANT").then(function (HEADLINE) {
       $translate("INTERNETPROBLEM").then(function (TEXT) {
           $ionicPopup.alert({
               title: HEADLINE,
               template: TEXT
           }).then(function(res) {
               $ionicHistory.goBack();
           });
       });
       });
   });

   $scope.loadChatsItem = function(indexInArray) {

       $scope.loading = true;
       //console.log("loadChatsItem("+indexInArray+")");

       // for now load ALL items on chat FROM SERVER
       // TODO: later cache items in perstent app context and make paging for loading from server
       var chatMessage = $scope.chat.messages[indexInArray];
       var idToLoad = chatMessage.itemId;
       ApiService.loadMediaItem(idToLoad, function(loadedItem){
            // success
           // TODO: cache item
           var appUserId = AppContext.getAccount().userId;
           if (appUserId==="") appUserId = 1;
           chatMessage.isUser = (chatMessage.userId == appUserId);
           $scope.messages.push(chatMessage);
           if ($ionicScrollDelegate) $ionicScrollDelegate.scrollBottom(true);
           if ((indexInArray+1) < $scope.chat.messages.length) {
               indexInArray++;
               $scope.loadChatsItem(indexInArray);
           } else {
               $scope.loading = false;
           }
       }, function(errorcode){});
   };

   $scope.sendChatMessage = function() {
       if ($scope.sending) {
           console.log("ignore send because sending still in process");
           return;
       }
       $scope.chatMessage = $scope.chatMessage.trim();
       if ($scope.chatMessage.length===0) {
           console.log("ignore send because empty message");
           return;
       }
       $scope.sending = true;
       ApiService.sendChatTextItem($scope.chat, $scope.chatMessage, function(chatItem) {
          // WIN
          $scope.sending = false;
          $scope.senderror = false;
          $scope.chatMessage = "";
          chatItem.isUser = true;
          console.dir(chatItem);
          $scope.messages.push(chatItem);
          if ($ionicScrollDelegate) $ionicScrollDelegate.scrollBottom(true);
       }, function(errorcode) {
          // FAIL
          $scope.senderror = true;
          $scope.sending = false;
       });
   };

});
