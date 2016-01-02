angular.module('starter.controller.request', [])

.controller('RequestCtrl', function($rootScope, AppContext, $scope, $log, $state, $stateParams, $ionicTabsDelegate, $ionicScrollDelegate ,$timeout, $translate, $ionicPopup, $ionicLoading, ApiService, KonfettiToolbox) {

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
      
    if (typeof navigator.camera==="undefined") {
        alert("feature not available");
        return;
    }
      
    navigator.camera.getPicture(function(imageData) {
        // WIN
        
        // store image on profile (base64 JPEG)
        var profile = AppContext.getProfile();
        profile.imageData = imageData;
        AppContext.setProfile(profile);
        
        // set data of image in request object that is later posted to to server
        var image = document.getElementById('myImage');
        $scope.request.imageUrl = "data:image/jpeg;base64," + imageData;
        
    }, function(err) {
        // FAIL
        KonfettiToolbox.showIonicAlertWith18nText("INFO","INFO_FAILTRYAGAIN");    
    },
    // camera option ... see https://github.com/apache/cordova-plugin-camera#cameracameraoptions--object
    {targetWidth: 200, targetHeight: 200});
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
    
    if (typeof window.imagePicker==="undefined") {
        alert("feature not available");
        return;
    }
      
    window.imagePicker.getPictures(
	function(results) {
        // TODO --> use image data and continue
        alert('TODO: Image URI: ' + results[i]);
	}, function (error) {
        // FAIL
        KonfettiToolbox.showIonicAlertWith18nText("INFO","INFO_FAILTRYAGAIN");  
	}, {
		maximumImagesCount: 1,
		width: 300
	}
);
      
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
                    $ionicLoading.show({
                        template: '<img src="img/spinner.gif" />'
                    });
                    ApiService.postTextMediaItemOnRequest($scope.request.id, res, AppContext.getAppLang(), function(mediaitem) {
                        $ionicLoading.hide();
                        $scope.request.info.push(mediaitem);
                        alert("TODO CHECK: Update request locally with this request");
                    }, function() {
                    // FAIL
                        $ionicLoading.hide();
                        KonfettiToolbox.showIonicAlertWith18nText('INFO','INFO_REQUESTFAIL');
                    });
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

          // Dynamic Button Text translate
          $translate("OK").then(function (OK) {
            $translate("CANCEL").then(function (CANCEL) {
                
                var myPopup = $ionicPopup.show({
                     templateUrl: 'templates/pop-reward.html',
                     scope: $scope,
                     title: TITLE,
                     subTitle: SUBLINE,
                    buttons: [
                        { text: CANCEL },
                        { text: OK,
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
            });
            });
          });
          });
      });

  };

  $scope.buttonRequestProcess = function() {
    $ionicLoading.show({
        template: '<img src="img/spinner.gif" />'
    });
    ApiService.setStateOfRequestToProcessing($scope.request.id, function(){
        // WIN
        $ionicLoading.hide();
        $scope.request.state = "processing";
        $scope.setNoticeTextByRequestState();
    }, function() {
        // FAIL
        $ionicLoading.hide();
        KonfettiToolbox.showIonicAlertWith18nText('INFO','INFO_REQUESTFAIL');
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
          // FAIL
          $ionicLoading.hide();
          KonfettiToolbox.showIonicAlertWith18nText('INFO','INFO_REQUESTFAIL');
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
                              $ionicLoading.hide();
                              KonfettiToolbox.showIonicAlertWith18nText('INFO','INFO_REQUESTFAIL');
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
                      $ionicLoading.hide();
                      KonfettiToolbox.showIonicAlertWith18nText('INFO','INFO_REQUESTFAIL');
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
        KonfettiToolbox.showIonicAlertWith18nText('INFO','INFO_REQUESTFAIL');
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
          KonfettiToolbox.showIonicAlertWith18nText('INFO','INFO_REQUESTFAIL');
      });
  };

});