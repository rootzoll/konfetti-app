angular.module('starter.controllers', [])

.controller('DashCtrl', function(AppContext, $window, $rootScope, $scope, $translate, $timeout, $ionicPopup, $log, $state, $ionicScrollDelegate, ApiService, KonfettiToolbox) {

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

            $scope.state = "PARTYWAIT";
            ApiService.loadParty($scope.partyList[$scope.actualPartyIndex].id,function(data){
                $rootScope.party = data.party;
                $scope.requestsReview = KonfettiToolbox.filterRequestsByState(data.requests, 'review');
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

.controller('RequestCtrl', function($rootScope, AppContext, $scope, $log, $state, $stateParams, $ionicTabsDelegate, $ionicScrollDelegate ,$timeout, $translate, $ionicPopup, ApiService) {

  $scope.loadingRequest = true;
  $scope.profile = AppContext.getProfile();
  $scope.state = "";

  // request data skeleton
  $scope.headlineTemp = "";
  $scope.request = {id : 0};
  $scope.userIsAuthor = false;

  // load request function
  $scope.loadRequest = function() {
    $scope.loadingRequest = true;
    ApiService.loadRequest($scope.request.id,function(req){

                // WIN
                $scope.request = req;
                $scope.loadingRequest = false;
                $scope.requestJSON = JSON.stringify($scope.request);
                $scope.userIsAuthor = (req.userId == AppContext.getAccount().userId);

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
     alert("TODO: Implement .setNewRequest()");
     $scope.state = "";
     $scope.headlineTemp = "";
     $scope.request = {id : 0};
     $scope.userIsAuthor = true;
  };

  // get request id if its a existing request
  if (typeof $stateParams.id!="undefined") {
    $scope.request.id = $stateParams.id;
    $scope.loadRequest();
  } else {
    $scope.loadingRequest = false;
    $scope.setNewRequest();
  }

  $scope.tapRequestKonfetti = function($event, request) {
    alert("TODO - upvote in detail view");
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
          $state.go('tab.dash');
          return;
      }

      /*
      // load request if needed
      if ($scope.request.id!=0) {
          $scope.userIsAuthor = false;
          $scope.loadRequest();
      } else {
          $scope.userIsAuthor = true;
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

      $scope.confettiMin = $rootScope.party.newRequestMinKonfetti;
      $scope.confettiMax = $rootScope.party.user.konfettiCount;
      $scope.confettiToSpend = $scope.confettiMin;
      */
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
      $rootScope.chatPartner = { requestTitle: $scope.request.title , userName: chat.userName, imageUrl: chat.imageUrl, spokenLangs: chat.spokenLangs};
      $state.go('tab.chat-detail', {id: chat.id});
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

.controller('AccountCtrl', function($rootScope, $scope, $state) {

  $scope.$on('$ionicView.enter', function(e) {
      // when no party is loaded
      if ($rootScope.party.id===0) {
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
       $state.go('tab.dash');
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
