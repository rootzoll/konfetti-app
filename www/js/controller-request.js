angular.module('starter.controller.request', [])

.controller('RequestCtrl', function($rootScope, AppContext, $scope, $log, $state, $stateParams, $ionicTabsDelegate, $ionicScrollDelegate ,$timeout, $translate, $ionicPopup, $ionicLoading, ApiService, KonfettiToolbox, $cordovaCamera, $cordovaGeolocation, $window, RainAnimation) {

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
  
  $scope.pulsateNameInput = false;
  $scope.pulsateHeadlineInput = false;

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
            if (($scope.request.state=='STATE_REVIEW') && ($scope.userIsAuthor)) {
                $scope.noticeColor = "#ffc900";
                $scope.noticeTextId = "EXPLAIN_REVIEW_USER";
            }

            // when in review and user is reviewer/admin
            if (($scope.request.state=='STATE_REVIEW') && ($scope.isReviewer || $scope.isAdmin)) {
                $scope.noticeColor = "#ffc900";
                $scope.noticeTextId = "EXPLAIN_REVIEW_ADMIN";
            }

            // when got rejected
            if (($scope.request.state=='STATE_REJECTED')) {
                $scope.noticeColor = "red";
                $scope.noticeTextId = "EXPLAIN_REJECTED";
            }

            // when open and user is author
            if (($scope.request.state=='STATE_OPEN') && ($scope.userIsAuthor)) {
                $scope.noticeColor = "green";
                $scope.noticeTextId = "EXPLAIN_OPEN_AUTHOR";
            }

            // when open and user is public
            if (($scope.request.state=='STATE_OPEN') && (!$scope.userIsAuthor)) {
                $scope.noticeColor = "green";
                $scope.noticeTextId = "EXPLAIN_OPEN_PUBLIC";
            }

            // when open and user is public
            if (($scope.request.state=='STATE_PROCESSING') && ($scope.userIsAuthor)) {
                $scope.noticeColor = "green";
                $scope.noticeTextId = "EXPLAIN_PROCESSING_AUTHOR";
            }

            // when is in the process of doing and user id author
            if (($scope.request.state=='STATE_PROCESSING') && (!$scope.userIsAuthor)) {
                $scope.noticeColor = "green";
                $scope.noticeTextId = "EXPLAIN_PROCESSING_PUBLIC";
            }

            // when done and user is not author
            if (($scope.request.state=='STATE_DONE') && (!$scope.userIsAuthor)) {
                $scope.noticeColor = "green";
                $scope.noticeTextId = "EXPLAIN_DONE_PUBLIC";
            }

            // when done and user is author
            if (($scope.request.state=='STATE_DONE') && ($scope.userIsAuthor)) {
                $scope.noticeColor = "green";
                $scope.noticeTextId = "EXPLAIN_DONE_AUTHOR";
            }
  };

  $scope.getImageUrlFromMediaId = function(mediaId) {
    if ((typeof mediaId != "undefined") && (mediaId!=null)) {
        return ApiService.getImageUrlFromMediaItem(mediaId);
    } else {
        return "./img/person.png";
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
           if ($scope.request.info[i].id==itemId) $scope.request.info[i].reviewed == 'REVIEWED_PUBLIC';
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
                $scope.userIsAuthor = (req.userId == AppContext.getAccount().id);
                $scope.isAdmin = AppContext.getAccount().adminOnParties.contains($scope.request.partyId);
                $scope.isReviewer = AppContext.getAccount().reviewerOnParties.contains($scope.request.partyId);
                if (AppContext.getRunningOS()=="browser") console.log("isAuthor("+$scope.userIsAuthor+") isReviewer("+$scope.isReviewer+") isAdmin("+$scope.isAdmin+")");

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

            // check if user has konfetti at all
            if (($rootScope.party.konfettiCount<=0) && (request.konfettiAdd==0)) {
                KonfettiToolbox.showIonicAlertWith18nText('INFO','INFO_ZEROKONFETTI');
                return;
            }

            // check enough konfetti available for next tap
            if (($rootScope.party.konfettiCount-request.konfettiAdd)<0) {
                return;
            }

            // block further tapping when reporting to server
            if (typeof request.blockTap === "undefined") request.blockTap = false;
            if (request.blockTap) return;

            // count up confetti to add
            $rootScope.party.konfettiCount = $rootScope.party.konfettiCount + request.konfettiAdd;
            if (request.konfettiAdd==0) {
                // on first tap start with 1
                request.konfettiAdd = 1;
            } else {
                // on the next tap ... always double
                request.konfettiAdd = request.konfettiAdd * 2;
            }
            $rootScope.party.konfettiCount = $rootScope.party.konfettiCount - request.konfettiAdd;
            request.lastAdd = Date.now();
           
            $timeout(function() {
                if ((Date.now() - request.lastAdd) < 999) return;
                request.blockTap = true;
                // Make SERVER REQUEST
                ApiService.upvoteRequest($rootScope.party.id, request.id, request.konfettiAdd, function(){
                    // WIN -> update sort
                    request.konfettiCount += request.konfettiAdd;
                    request.konfettiAmountSupport += request.konfettiAdd;
                    request.konfettiAdd = 0;
                    request.blockTap = false;
                    try {
                    	RainAnimation.makeItRainKonfetti(2);
                    } catch (e) {
                        console.log("konfetti animation failed: "+JSON.stringify(e));
                        console.dir(e);
                    }
                }, function(){
                    // FAIL -> put konfetti back
                    $rootScope.party.konfettiCount += request.konfettiAdd;
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
                        $ionicLoading.show({
                            template: '<img src="img/spinner.gif" />'
                        });
                        ApiService.updateAccount(account, function(updatedAccount){
                            // WIN
                            $ionicLoading.hide();
                            AppContext.setAccount(updatedAccount);
                            // now that we got a name - call this method again
                            $scope.startChat();
                        },function(){
                            // FAIL
                            $ionicLoading.hide();
                            KonfettiToolbox.showIonicAlertWith18nText('INFO','INFO_REQUESTFAIL');
                        });
                    }
                });
              });
          });
          return;
      }

      ApiService.createChat($scope.request.id, AppContext.getAccount().id, $scope.request.userId, function(result) {
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

    // on browser use file upload
    if (AppContext.getRunningOS()=="browser") {
        // TODO i18n
        alert("select profile image: mostly square, max 1MB, JPEG");
        $rootScope.onUploadClick(function(imageData){
            if (imageData==null) return;
            imageData = imageData.substring(imageData.indexOf(',')+1);    
            win(imageData);
        });
        return;
    }

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
          $scope.request.imageMediaID = item.id;

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
                      $translate("DATE").then(function (DATE) {
                      $scope.mediaChoosePopup = $ionicPopup.show({
                          template: '<button class="button button-stable" style="padding:5px;width:100%;text-align:center;margin:5px;margin-left:0px;" ng-mousedown="addInfoText()"><i class="icon ion-document-text"></i>&nbsp;'+TEXT+'</button><br>'+
                          '<button class="button button-stable" style="padding:5px;width:100%;text-align:center;margin:5px;margin-left:0px;" ng-mousedown="addInfoImage()"><i class="icon ion-image"></i>&nbsp;'+IMAGE+'</button><br>'+
                          '<button class="button button-stable" style="padding:5px;width:100%;text-align:center;margin:5px;margin-left:0px;" ng-mousedown="addInfoLocation()"><i class="icon ion-map"></i>&nbsp;'+LOCATION+'</button>'+
                          '<button class="button button-stable" style="padding:5px;width:100%;text-align:center;margin:5px;margin-left:0px;" ng-mousedown="addInfoDate()"><i class="icon ion-clock"></i>&nbsp;'+DATE+'</button>',
                          title: TITLE,
                          subTitle: '',
                          scope: $scope,
                          buttons: []
                      });
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

      var win = function(imageData) {
          imageData = "data:image/jpeg;base64,"+imageData;
          $ionicLoading.show({
              template: '<img src="img/spinner.gif" />'
          });
          ApiService.postImageMediaItemOnRequest($scope.request.id, imageData, function(mediaitem) {
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

      // on browser use file upload
      if (AppContext.getRunningOS()=="browser") {
        // TODO: i18n
        alert("select image: mostly square, max 1MB, JPEG");
        $rootScope.onUploadClick(function(imageData){
            if (imageData==null) {
                console.log("null on image callback");
                return;
            }
            imageData = imageData.substring(imageData.indexOf(',')+1);    
            win(imageData);
        });
        return;
      }

      // get image from device
      $cordovaCamera.getPicture(options).then(win, function(err) {
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

  $scope.addInfoDate = function() {
            $scope.mediaChoosePopup.close();
            $translate("ADDDATE_TITLE").then(function (HEADLINE) {
                $translate("ADDDATE_SUB").then(function (TEXT) {
                    $ionicPopup.prompt({
                        title: HEADLINE,
                        template: TEXT,
                        inputType: 'datetime-local'
                    }).then(function(res) {
                        var jsonDate = JSON.stringify(res).trim();
                        if ((typeof jsonDate!="undefined") && (jsonDate.length>2)) {
                             $ionicLoading.show({
                             template: '<img src="img/spinner.gif" />'
                             });
                            ApiService.postDateMediaItemOnRequest($scope.request.id, res, function(mediaitem) {
                                // WIN
                                $ionicLoading.hide();
                                mediaitem.data = new Date(mediaitem.data.substr(1,mediaitem.data.length-2));
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

          // find latest chat for pre select
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
                          rewardUserIds.push($scope.request.chats[i].chatPartnerId);
                    }

                    if ((rewardUserIds.length>$scope.request.konfettiCount) && ($scope.request.konfettiCount>0)) {
                        KonfettiToolbox.showIonicAlertWith18nText('INFO','SELECT_LESS');
                        return;
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
                    $scope.request.state='STATE_DONE';
                    $scope.setNoticeTextByRequestState();
                    $ionicScrollDelegate.scrollTop(true);
                }, function() {
                  // FAIL
                  $ionicLoading.hide();
                  $ionicScrollDelegate.scrollTop(true);
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
        $scope.request.state = "STATE_PROCESSING";
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
          $scope.request.state = "STATE_OPEN";
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
      if ($event!=null) $event.stopPropagation();
      $rootScope.chatPartner = { requestTitle: $scope.request.title , chatPartnerName: chat.chatPartnerName, chatPartnerImageMediaID: chat.chatPartnerImageMediaID, spokenLangs: chat.spokenLangs};
      $state.go('tab.chat-detail', {id: chat.id});
      return;
  };

  $scope.continueChat = function() {
      $scope.displayChat(null,$scope.request.chats[0]);
  };

  $scope.removeChat = function($event, chat) {
      $event.stopPropagation();
      if (($scope.request.chats.length==1) && ($scope.request.state==='STATE_PROCESSING')) {
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
		if ($scope.pulsateNameInput) {
			$translate("IMPORTANT").then(function (HEADLINE) {
              $translate("ENTERNAME").then(function (TEXT) {
                  $ionicPopup.alert({
                      title: HEADLINE,
                      template: TEXT
                  }).then(function(res) {});
             });
          });
		} else {
			$scope.pulsateNameInput = true;
			$timeout(function(){
				$scope.pulsateNameInput = false;
			},1500);
		}      	
        return;
      }

      if ($scope.headline.temp.length<4) {
      	
      	if (($scope.headline.temp.length>0) || ($scope.pulsateHeadlineInput)) {
      		$translate("IMPORTANT").then(function (HEADLINE) {
              $translate("ENTERREQUEST").then(function (TEXT) {
                  $ionicPopup.alert({
                      title: HEADLINE,
                      template: TEXT
                  }).then(function(res) {});
              });
          });	
      	} else {
     		$scope.pulsateHeadlineInput = true;
			$timeout(function(){
				$scope.pulsateHeadlineInput = false;
			},1500);
      	}
      
        return;
      }

      if ($scope.profile.spokenLangs.length==0) {
          KonfettiToolbox.showIonicAlertWith18nText('INFO','SELECT_LANG');
          return;
      }

      var newRequest = {
        userId: AppContext.getAccount().id,
        userName: $scope.profile.name,
        spokenLangs : $scope.profile.spokenLangs,
        partyId : $rootScope.party.id,
        konfettiCount: $scope.confetti.toSpend,
        title : $scope.headline.temp,
        mediaItemIds : $scope.request.mediaItemIds,
        imageMediaID : $scope.request.imageMediaID
      };

      $ionicLoading.show();
      ApiService.postRequest(newRequest, AppContext.getAppLang(), function(){
          // WIN
          $scope.entercount = 0;
          $ionicLoading.hide();

          var afterPopUpAction = function() {
              $scope.headline.temp = "";
              $rootScope.party.konfettiCount - $scope.confetti.toSpend;
              $scope.confetti.max = $scope.confetti.max - $scope.confetti.toSpend;
              $scope.confetti.toSpend = $scope.confetti.min;
              $state.go('tab.dash', {id: $rootScope.party.id});
          };

          if ($rootScope.party.reviewLevel==0) {
              // no review needed
              $translate("THANKYOU").then(function (HEADLINE) {
                  $translate("SUBMITINFO_NOREVIEW").then(function (TEXT) {
                      $ionicPopup.alert({
                          title: HEADLINE,
                          template: TEXT
                      }).then(function(res) {
                          afterPopUpAction();
                      });
                  });
              });
          } else {
              // show review info
              $translate("THANKYOU").then(function (HEADLINE) {
                  $translate("SUBMITINFO").then(function (TEXT) {
                      $ionicPopup.alert({
                          title: HEADLINE,
                          template: TEXT
                      }).then(function(res) {
                          afterPopUpAction();
                      });
                  });
              });
          }
          
          RainAnimation.makeItRainKonfetti(2);
          
      }, function() {
          // FAIL
          $ionicLoading.hide();
          KonfettiToolbox.showIonicAlertWith18nText('INFO','INFO_REQUESTFAIL');
      });
  };

});