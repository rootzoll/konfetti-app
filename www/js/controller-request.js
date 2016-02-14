angular.module('starter.controller.request', [])

.controller('RequestCtrl', function($rootScope, AppContext, $scope, $log, $state, $stateParams, $ionicTabsDelegate, $ionicScrollDelegate ,$timeout, $translate, $ionicPopup, $ionicLoading, ApiService, KonfettiToolbox, $cordovaCamera, $cordovaGeolocation, $window) {

  $scope.loadingRequest = true;
  $scope.profile = AppContext.getAccount();
  $scope.state = "";

  // request data skeleton
  $scope.headline = { temp: ""};
  $scope.request = {id : 0};
  $scope.userIsAuthor = true;
  $scope.isAdmin = false;
  $scope.isReviewer = false;

  $scope.noticeTextId = "";
  $scope.noticeColor = "";

  $scope.mediaChoosePopup = null;

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

  $scope.deleteItemFromRequest = function(itemid) {
      var removeLocal = function() {
          for (var i=0; i<$scope.request.info.length; i++) {
              if ($scope.request.info[i].id == itemid) {
                  $scope.request.info.splice(i,1);
                  break;
              }
          }
          for (var i=0; i<$scope.request.mediaItemIds.length; i++) {
              if ($scope.request.mediaItemIds[i] == itemid) {
                  $scope.request.mediaItemIds.splice(i,1);
                  break;
              }
          }
      };
      // remove from request on server
      if ($scope.request.id>0) {
          ApiService.deleteItemFromRequest($scope.request.id, itemid, function() {
              removeLocal();
          }, function(){});
      } else {
          removeLocal();
      }
  };

  $scope.reviewFail = function(itemid) {
      $scope.deleteItemFromRequest(itemid);
  };

  $scope.reviewMediaItemOk = function(itemid) {
    // set public on server
    ApiService.makeMediaItemPublic($scope.request.id, itemid, function(){
       for (var i=0; i<$scope.request.info.length; i++) {
           if ($scope.request.info[i].id==itemId) $scope.request.info[i].reviewed = 0;
       }
    },function(){}
    );
  };

  // load request function
  $scope.loadRequest = function() {
    $scope.loadingRequest = true;
    ApiService.loadRequest(0, $scope.request.id, function(req){

                // WIN
                $scope.request = req;
                $scope.loadingRequest = false;
                $scope.requestJSON = JSON.stringify($scope.request);
                $scope.userIsAuthor = (req.userId == AppContext.getAccount().userId);
                $scope.isAdmin = AppContext.getAccount().adminOnParties.contains($scope.request.partyId);
                $scope.isReviewer = AppContext.getAccount().reviewerOnParties.contains($scope.request.partyId);
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

     var account = AppContext.getAccount();
     if ((account.imageMediaID != null) && (account.imageMediaID>0)) {
         $scope.request.imageMediaID = account.imageMediaID;
         $scope.request.imageUrl = ApiService.getImageUrlFromMediaItem(account.imageMediaID);
     }

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

     $scope.confetti = {min: $rootScope.party.newRequestMinKonfetti, max: $rootScope.party.konfettiCount, toSpend: $rootScope.party.newRequestMinKonfetti};
  };

  $scope.tapRequestKonfetti = function($event, request) {

            $event.stopPropagation();
            if ($rootScope.party.konfettiCount<=0) return;

            // block further tapping when reporting to server
            if (typeof request.blockTap === "undefined") request.blockTap = false;
            if (request.blockTap) return;

            // count up confetti to add
            request.konfettiAdd++;
            $rootScope.party.konfettiCount--;
            request.lastAdd = Date.now();

            $timeout(function() {
                if ((Date.now() - request.lastAdd) < 999) return;
                request.blockTap = true;
                // Make SERVER REQUEST
                ApiService.upvoteRequest($rootScope.party.id, request.id, request.konfettiAdd, function(){
                    // WIN -> update sort
                    request.konfettiCount += request.konfettiAdd;
                    request.konfettiAdd = 0;
                    request.blockTap = false;
                }, function(){
                    // FAIL -> put konfetti back
                    $rootScope.party.konfettiCount -= request.konfettiAdd;
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
                    if (typeof res != "undefined") {
                        $scope.profile.name = res;
                        var account = AppContext.getAccount();
                        account.name = res;
                        AppContext.setAccount(account);
                        $scope.startChat();
                    }
                });
              });
          });
          return;
      }

      ApiService.createChat($scope.request.id, AppContext.getAccount().userId, $scope.request.userId, function(result) {
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
  $scope.entercount = 0;
  $scope.$on('$ionicView.enter', function(e) {

      $scope.entercount++;

      // get request id if its a existing request
      if ((typeof $stateParams.id!="undefined") && ($stateParams.id!=0)) {
          // --> EXISTING REQUESTS
          $rootScope.tabRequestTitle = 'TAB_REQUEST';
          $scope.request.id = $stateParams.id;
          $scope.loadRequest();
      } else {
          // --> NEW REQUEST
          $rootScope.tabRequestTitle = 'TAB_REQUEST_NEW';
          if ($scope.entercount==1) {
              $scope.request.id = 0;
              $scope.loadingRequest = false;
              $scope.setNewRequest();
          }
      }

      // when no party is loaded
      if ($rootScope.party.id===0) {
          $state.go('tab.dash', {id: 0});
          return;
      }

      // make sure lang seletor is set correct
      $timeout(function(){
          $rootScope.setActualLangOnSelector();
      },100);

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
            });
      });

  };

  $scope.takeSelfi = function() {

      var options = {
          quality: 70,
          destinationType: 0, //Camera.DestinationType.DATA_URL
          sourceType: 1, // Camera.PictureSourceType.CAMERA
          allowEdit: true,
          encodingType: 0, //Camera.EncodingType.JPEG
          targetWidth: 200,
          targetHeight: 200,
          saveToPhotoAlbum: false,
          correctOrientation:true
      };

    var win = function(imageData) {
        // add data url prefix
        imageData = "data:image/jpeg;base64," + imageData;
        // store (local & server)
        $scope.storeSelfi(imageData);
    };

    var fail = function(error) {
        console.log("CAMERA FAIL:");
        console.dir(error);
        KonfettiToolbox.showIonicAlertWith18nText("INFO","INFO_FAILTRYAGAIN");
    };

    try {
        $cordovaCamera.getPicture(options).then(win, fail);
    } catch (e) {
        alert("FAILED to access camera.");
    }

  };

  $scope.back = function() {
      $window.history.back();
  };

  $scope.storeSelfi = function(imageDataUrl) {

      // user id will get updated once 

      ApiService.postImageMediaItemOnRequest(0, imageDataUrl, function(item){
          // WIN

          // set in actual request
          $scope.request.imageUrl = imageData;

          // store local
          var account = AppContext.getAccount();
          account.imageMediaID = item.id;
          AppContext.setAccount(account);

      }, function() {
          // FAIL
          KonfettiToolbox.showIonicAlertWith18nText("INFO","INFO_FAILTRYAGAIN");
      });
  };

  $scope.addInfoItem = function() {
      $translate("ADDINFO").then(function (TITLE) {
          $translate("TEXT").then(function (TEXT) {
              $translate("IMAGE").then(function (IMAGE) {
                  $translate("LOCATION").then(function (LOCATION) {
                      $scope.mediaChoosePopup = $ionicPopup.show({
                          template: '<button class="button button-stable" style="padding:5px;width:100%;text-align:center;margin:5px;margin-left:0px;" ng-mousedown="addInfoText()"><i class="icon ion-document-text"></i>&nbsp;'+TEXT+'</button><br>'+
                          '<button class="button button-stable" style="padding:5px;width:100%;text-align:center;margin:5px;margin-left:0px;" ng-mousedown="addInfoImage()"><i class="icon ion-image"></i>&nbsp;'+IMAGE+'</button><br>'+
                          '<button class="button button-stable" style="padding:5px;width:100%;text-align:center;margin:5px;margin-left:0px;" ng-mousedown="addInfoLocation()"><i class="icon ion-map"></i>&nbsp;'+LOCATION+'</button>',
                          title: TITLE,
                          subTitle: '',
                          scope: $scope,
                          buttons: []
                      });
                  });
              });
          });
      });
  };

  $scope.addInfoImage = function() {

      $scope.mediaChoosePopup.close();

      var options = {
          quality: 50,
          destinationType: 0, //Camera.DestinationType.DATA_URL
          sourceType: 0, // Camera.PictureSourceType.PHOTOLIBRARY
          allowEdit: true,
          encodingType: 0, //Camera.EncodingType.JPEG
          targetWidth: 300,
          targetHeight: 300,
          saveToPhotoAlbum: false,
          correctOrientation:true
      };

      $cordovaCamera.getPicture(options).then(function(imageData) {

          if ((imageData==null) && (AppContext.getRunningOS()=="browser")) {
              imageData = "data:image/png;base64,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";
              alert("USING MOCK IMAGE");
          } else {
              imageData = "data:image/jpeg;base64,"+imageData;
          }

          //console.log("GOT PICTURE");
          //console.dir(imageData);

          $ionicLoading.show({
              template: '<img src="img/spinner.gif" />'
          });
          ApiService.postImageMediaItemOnRequest($scope.request.id, imageData, function(mediaitem) {
              // WIN
              $ionicLoading.hide();
              //alert("JSON:"+JSON.stringify(mediaitem));
              $scope.addMediaItem(mediaitem);
              $ionicScrollDelegate.scrollBottom(true);
          }, function() {
              // FAIL
              $ionicLoading.hide();
              KonfettiToolbox.showIonicAlertWith18nText('INFO','INFO_REQUESTFAIL');
          });

      }, function(err) {
          console.dir(err);
          alert("FAIL:"+err);
      });

  };

  $scope.addInfoText = function() {
      $scope.mediaChoosePopup.close();
      $translate("ADDTEXT").then(function (HEADLINE) {
          $translate("ENTERTEXT").then(function (TEXT) {
              $ionicPopup.prompt({
                  title: HEADLINE,
                  template: TEXT,
                  inputType: 'text',
                  inputPlaceholder: ''
              }).then(function(res) {
                  if (typeof res != "undefined") {  
                    $ionicLoading.show({
                        template: '<img src="img/spinner.gif" />'
                    });
                    ApiService.postTextMediaItemOnRequest($scope.request.id, res, AppContext.getAppLang(), function(mediaitem) {
                          // WIN
                          $ionicLoading.hide();
                          $scope.addMediaItem(mediaitem);
                          $ionicScrollDelegate.scrollBottom(true);
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
      $scope.mediaChoosePopup.close();
      $translate("INFO").then(function (HEADLINE) {
          $translate("USELOCATION").then(function (TEXT) {
              var confirmPopup = $ionicPopup.confirm({
                  title: HEADLINE,
                  template: TEXT
              });
              confirmPopup.then(function(res) {
                  if(res) {

                      // user fake data on browser
                      if (AppContext.getRunningOS()=="browser") {
                          alert("USING MOCK LOCATION");
                          $scope.saveLocationMediaItem(53.55340,9.992196);
                          return;
                      }

                      $ionicLoading.show({
                          template: '<img src="img/spinner.gif" />'
                      });
                      var posOptions = {timeout: 10000, enableHighAccuracy: true};
                      $cordovaGeolocation
                          .getCurrentPosition(posOptions)
                          .then(function (position) {
                              $ionicLoading.hide();
                              $rootScope.lat = position.coords.latitude;
                              $rootScope.lon = position.coords.longitude;
                              $scope.saveLocationMediaItem(position.coords.latitude,position.coords.longitude);
                              $ionicScrollDelegate.scrollBottom(true);
                          }, function(err) {
                              $ionicLoading.hide();
                              if (($rootScope.lon!=null) && ($rootScope.lon!=0)
                                  && ($rootScope.lat!=null) && ($rootScope.lat!=0)) {
                                  // use backup start coordinates
                                  $scope.saveLocationMediaItem($rootScope.lat,$rootScope.lon);
                              } else {
                                  KonfettiToolbox.showIonicAlertWith18nText('INFO','INFO_REQUESTFAIL');
                              }
                          });
                  }
              });
          });
      });

  };

  $scope.saveLocationMediaItem = function(lat, lon) {

      console.log("saveLocationMediaItem("+lat+","+lon+")");

      $ionicLoading.show({
          template: '<img src="img/spinner.gif" />'
      });
      ApiService.postLocationMediaItemOnRequest($scope.request.id, lat, lon, function(mediaitem) {
          // WIN
          $ionicLoading.hide();
          $scope.addMediaItem(mediaitem);
      }, function() {
          // FAIL
          $ionicLoading.hide();
          KonfettiToolbox.showIonicAlertWith18nText('INFO','INFO_REQUESTFAIL');
      });

  };

  $scope.addMediaItem = function(mediaitem) {
      if (typeof $scope.request.info == "undefined") $scope.request.info = [];
      $scope.request.info.push(mediaitem);
      if (typeof $scope.request.mediaItemIds == "undefined") $scope.request.mediaItemIds = [];
      $scope.request.mediaItemIds.push(mediaitem.id);
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
        konfettiCount: $scope.confetti.toSpend,
        title : $scope.headline.temp,
        mediaItemIds : $scope.request.mediaItemIds
      };

      $ionicLoading.show();
      ApiService.postRequest(newRequest, AppContext.getAppLang(), function(){
          // WIN
          $scope.entercount = 0;
          $ionicLoading.hide();
          $translate("THANKYOU").then(function (HEADLINE) {
              $translate("SUBMITINFO").then(function (TEXT) {
                  $ionicPopup.alert({
                      title: HEADLINE,
                      template: TEXT
                  }).then(function(res) {
                      $scope.headline.temp = "";
                      $rootScope.party.konfettiCount - $scope.confetti.toSpend;
                      $scope.confetti.max = $scope.confetti.max - $scope.confetti.toSpend;
                      $scope.confetti.toSpend = $scope.confetti.min;
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