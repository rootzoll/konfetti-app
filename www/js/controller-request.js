angular.module('starter.controller.request', [])

.controller('RequestCtrl', function($rootScope, AppContext, $scope, $log, $state, $stateParams, $ionicTabsDelegate, $ionicScrollDelegate ,$timeout, $translate, $ionicPopup, $ionicLoading, ApiService, KonfettiToolbox, $cordovaCamera, $cordovaGeolocation, $window, RainAnimation, leafletMapEvents, leafletData, PopupDialogs, $ionicPosition, $ionicViewSwitcher, $ionicPlatform) {

  $scope.loadingRequest = true;
  $scope.profile = null;
  $scope.state = "";

  // request data skeleton
  $scope.headline = { temp: ""};
  $scope.request = {id : 0};
  $scope.userIsAuthor = true;
  $scope.isAdmin = false;
  $scope.isReviewer = false;
  $scope.nameValid = true;
  $scope.showScrollDown = false;

  $scope.noticeTextId = "";
  $scope.noticeColor = "";

  $scope.pulsateNameInput = false;
  $scope.pulsateHeadlineInput = false;

  $scope.mediaChoosePopup = null;

  $scope.request.info = [];

  $ionicPlatform.registerBackButtonAction(function () {
    $scope.back();
  }, 100);

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

  $scope.checkUsername = function(name) {

    ApiService.checkUsernameIsFree(name, function(name, result){
        if ($scope.profile.name==name) {
            console.log("name("+name+") result("+result+")")
            $scope.nameValid = result;
        } else {
           console.log("input("+$scope.profile.name+") not anymore("+name+")");
        }
    });
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
                    if ($stateParams.area==='chats') $scope.scrollToChatSection();
                }

                if (typeof $scope.request.titleMultiLang == "undefined") $scope.request.titleMultiLang=null;

                // show scroll down button if there are chats or info items
                $scope.showScrollDown = false;
                if (($scope.request.mediaItemIds.length>0) || ($scope.request.chats.length>0)) $scope.showScrollDown = true;

    }, function(code){
                // FAIL
                $scope.state = "INTERNETFAIL";
    });
  };

  $scope.getMultiLangOnRequest = function(actualLang) {
      if ($scope.request.titleMultiLang==null) return $scope.request.title;
      if (typeof $scope.request.titleMultiLang.data == "string") $scope.request.titleMultiLang.data = JSON.parse($scope.request.titleMultiLang.data);
      if (typeof $scope.request.titleMultiLang.data[actualLang] != "undefined") return $scope.request.titleMultiLang.data[actualLang].text;
      return $scope.request.title;
  };

  $scope.scrollToChatSection = function() {
    $timeout(function(){
        var position = $ionicPosition.position(angular.element(document.getElementById('chatitems')));
        $ionicScrollDelegate.scrollTo(position.left, position.top-60, true);
    },600);
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

  };

  $scope.tapRequestKonfetti = function($event, request) {

            $event.stopPropagation();

            // check if user has konfetti at all
            if (($rootScope.party.konfettiCount<=0) && (request.konfettiAdd==0)) {
                PopupDialogs.showIonicAlertWith18nText('INFO','INFO_ZEROKONFETTI');
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
                request.konfettiAdd = request.konfettiAdd + 1;
                // on the next tap ... always double
                //request.konfettiAdd = request.konfettiAdd * 2;
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
        PopupDialogs.usernameDialog($scope, $scope.profile.name, function(data) {
          //alert(JSON.stringify(data));
          if ((!data.cancel) && (data.valid)) {
              $scope.profile.name = data.text;
              var account = AppContext.getAccount();
              account.name = data.text;
              $ionicLoading.show({
                template: '<img src="img/spinner.gif" />'
              });
              ApiService.updateAccount(account, function(updatedAccount){
                // WIN
                $ionicLoading.hide();
                AppContext.setAccount(updatedAccount,'controller-request startChat');
                // now that we got a name - call this method again
                $scope.startChat();
              },function(){
                // FAIL
                $ionicLoading.hide();
                PopupDialogs.showIonicAlertWith18nText('INFO','INFO_REQUESTFAIL');
              });
          }
        }, function(e){
            console.warn("failed $scope.startChat with: "+JSON.stringify(e));
        });
        return;
      }

      // start the chat
      ApiService.createChat($scope.request.id, AppContext.getAccount().id, $scope.request.userId, function(result) {
        // WIN
        KonfettiToolbox.markInteractionOnRequest($scope.request.id);
        $rootScope.chatPartner = { requestTitle: $scope.request.title , userName: $scope.request.userName, imageUrl: $scope.request.imageUrl, spokenLangs: $scope.request.spokenLangs};
        var dataObj = {id: result.id};
        $ionicViewSwitcher.nextDirection('forward');
        $state.go('chat-detail', dataObj);
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

      $scope.profile = AppContext.getAccount();
      if ($scope.profile.spokenLangs.length<=1) {
          $scope.profile.spokenLangs = [$rootScope.actualLang];
      }

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
          $ionicViewSwitcher.nextDirection('back');
          $state.go('dash', {id: 0});
          return;
      }

     // update confetti values
     $scope.confetti = {min: $rootScope.party.newRequestMinKonfetti, max: $rootScope.party.konfettiCount, toSpend: $rootScope.party.newRequestMinKonfetti};

  });

  $scope.back = function() {
       $ionicViewSwitcher.nextDirection('back');
       $state.go('dash', {id: $rootScope.party.id});
  };

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

      $translate("OK").then(function (OK) {
      $translate("ISPEAK").then(function (ISPEAK) {

            $rootScope.changeLang = function(lang){
                if (lang=='de') $scope.de=!$scope.de;
                if (lang=='en') $scope.en=!$scope.en;
                if (lang=='ar') $scope.ar=!$scope.ar;
            };
            $scope.initial = {};
            $scope.initial.en = $scope.profile.spokenLangs.contains("en") ? true : false;
            $scope.initial.de = $scope.profile.spokenLangs.contains("de") ? true : false;
            $scope.initial.ar = $scope.profile.spokenLangs.contains("ar") ? true : false;
            $scope.de = $scope.initial.de;
            $scope.en = $scope.initial.en;
            $scope.ar = $scope.initial.ar;

            var myPopup = $ionicPopup.show({
                      templateUrl: 'templates/pop-languages.html',
                      scope: $scope,
                      title: ISPEAK,
                      subTitle: "",
                      buttons: [
                          { text: OK
                          }
                      ]
            });
            myPopup.then(function(res) {
                $timeout(function(){
                $scope.profile.spokenLangs = [];
                if ($scope.en) $scope.profile.spokenLangs.push("en");
                if ($scope.de) $scope.profile.spokenLangs.push("de");
                if ($scope.ar) $scope.profile.spokenLangs.push("ar");
                if ($scope.profile.spokenLangs.length===0) $scope.profile.spokenLangs.push(AppContext.getAppLang());
                },10);
            });
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

    // win of getting a image data for profile picture
    var win = function(imageData,filetype) {
        if (typeof filetype == "undefined") filetype = "jpeg";
        // add data url prefix
        imageData = "data:image/"+filetype+";base64," + imageData;
        // store (local & server)
        $scope.storeSelfi(imageData);
    };

    var fail = function(error) {
        console.log("CAMERA FAIL:");
        console.dir(error);
        PopupDialogs.showIonicAlertWith18nText("INFO","INFO_FAILTRYAGAIN");
    };

    // on browser use file upload
    if (AppContext.getRunningOS()=="browser") {
        PopupDialogs.showIonicAlertWith18nText("INFO", "IMAGEUPLOAD_SELFI", function(){
            $rootScope.onUploadClick(function(imageData, filetype){
                if (imageData==null) return;
                imageData = imageData.substring(imageData.indexOf(',')+1);
                win(imageData,filetype);
            });
        });
        return;
    }

    try {
        $cordovaCamera.getPicture(options).then(win, fail);
    } catch (e) {
        alert("FAILED to access camera.");
    }

  };

  $scope.storeSelfi = function(imageDataUrl) {

      // user id will get updated once
      $ionicLoading.show({
        template: '<img src="img/spinner.gif" />'
      });
      ApiService.postImageMediaItemOnRequest(0, imageDataUrl, function(item){
          // WIN
          $ionicLoading.hide();

          // set in actual request
          $scope.request.imageMediaID = item.id;

          // store local
          var account = AppContext.getAccount();
          account.imageMediaID = item.id;
          AppContext.setAccount(account,'controller-request storeSelfi');

      }, function() {
          // FAIL
          $ionicLoading.hide();
          PopupDialogs.showIonicAlertWith18nText("INFO","INFO_FAILTRYAGAIN");
      });
  };

  $scope.addInfoItem = function() {
      $translate("ADDINFO").then(function (TITLE) {
          $translate("TEXT").then(function (TEXT) {
              $translate("IMAGE").then(function (IMAGE) {
                  $translate("LOCATION").then(function (LOCATION) {
                      $translate("DATE").then(function (DATE) {
                      $scope.mediaChoosePopup = $ionicPopup.show({
                          template: '<button class="button button-stable" style="padding:5px;width:100%;text-align:center;margin:5px;margin-left:0px;border-color:lightgrey;" ng-mousedown="addInfoText()"><i class="icon ion-document-text"></i>&nbsp;'+TEXT+'</button><br>'+
                          '<button class="button button-stable" style="padding:5px;width:100%;text-align:center;margin:5px;margin-left:0px;border-color:lightgrey;" ng-mousedown="addInfoImage()"><i class="icon ion-image"></i>&nbsp;'+IMAGE+'</button><br>'+
                          '<button class="button button-stable" style="padding:5px;width:100%;text-align:center;margin:5px;margin-left:0px;border-color:lightgrey;" ng-mousedown="addInfoLocation()"><i class="icon ion-map"></i>&nbsp;'+LOCATION+'</button>'+
                          '<button class="button button-stable" style="padding:5px;width:100%;text-align:center;margin:5px;margin-left:0px;border-color:lightgrey;" ng-mousedown="addInfoDate()"><i class="icon ion-clock"></i>&nbsp;'+DATE+'</button>',
                          title: TITLE,
                          subTitle: '',
                          scope: $scope,
                          cssClass: 'pop-additem',
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

      // win of adding a image as info to the task
      var win = function(imageData, filetype) {
          if (typeof filetype == "undefined") filetype = "jpeg";
          imageData = "data:image/"+filetype+";base64,"+imageData;
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
              PopupDialogs.showIonicAlertWith18nText('INFO','INFO_REQUESTFAIL');
          });
      }

      // on browser use file upload
      if (AppContext.getRunningOS()=="browser") {
        PopupDialogs.showIonicAlertWith18nText("INFO", "IMAGEUPLOAD_INFO", function(){
            $rootScope.onUploadClick(function(imageData,filetype){
                if (imageData==null) {
                    console.log("null on image callback");
                    return;
                }
                imageData = imageData.substring(imageData.indexOf(',')+1);
                win(imageData,filetype);
            });
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
      PopupDialogs.textInput($scope, function(result) {
          // WIN or Cancel
          if (!result.cancel) {
                    $ionicLoading.show({
                        template: '<img src="img/spinner.gif" />'
                    });
                    ApiService.postTextMediaItemOnRequest($scope.request.id, result.text, AppContext.getAppLang(), function(mediaitem) {
                          // WIN
                          $ionicLoading.hide();
                          $scope.addMediaItem(mediaitem);
                          $ionicScrollDelegate.scrollBottom(true);
                    }, function() {
                          // FAIL
                          $ionicLoading.hide();
                          PopupDialogs.showIonicAlertWith18nText('INFO','INFO_REQUESTFAIL');
                    });
          }
      }, function(e){
          // FAIL
          alert("ERROR addInfoText: "+JSON.stringify(e));
      });

  };

  $scope.addInfoLocation = function() {

           try {

           $scope.mediaChoosePopup.close();

           PopupDialogs.locationPicker($scope, function(result) {

               // WIN
               if (result.cancel) return;
               $scope.saveLocationMediaItem(result.lat,result.lon, result.comment);
               $timeout(function(){
                $ionicScrollDelegate.scrollBottom(true);
               },500);

            }, function(error){

                // FAIL
                if ((typeof error != "undefined") && (error!=null)) alert("ERROR: "+JSON.stringify(error));

            }, {
                i18nHeadline: "LOCATIONPICKER_TITLE",
                i18nMarker: "LOCATIONPICKER_MARKER",
                inputComment: true,
                startLat: 52.522011,
                startLon: 13.412772,
                startZoom: 9
            });

      } catch (e) {
          alert("ERROR on LocationPicker: "+JSON.stringify(e));
      }

  };

  $scope.saveLocationMediaItem = function(lat, lon, comment) {

      $ionicLoading.show({
          template: '<img src="img/spinner.gif" />'
      });
      ApiService.postLocationMediaItemOnRequest($scope.request.id, lat, lon, comment, function(mediaitem) {
          // WIN
          $ionicLoading.hide();
          $scope.addMediaItem(mediaitem);
      }, function() {
          // FAIL
          $ionicLoading.hide();
          PopupDialogs.showIonicAlertWith18nText('INFO','INFO_REQUESTFAIL');
      });

  };

  $scope.addInfoDate = function() {

            $scope.mediaChoosePopup.close();

            PopupDialogs.datePicker($scope, function(result){

                // when clicked cancel on date
                if (result.cancel) return;

                // WIN
                $ionicLoading.show({
                    template: '<img src="img/spinner.gif" />'
                });

                ApiService.postDateMediaItemOnRequest($scope.request.id, result.combinedDate, result.comment, function(mediaitem) {
                        // WIN
                        $ionicLoading.hide();
                        $scope.addMediaItem(mediaitem);
                        $ionicScrollDelegate.scrollBottom(true);

                     }, function() {
                        // FAIL
                        $ionicLoading.hide();
                        PopupDialogs.showIonicAlertWith18nText('INFO','INFO_REQUESTFAIL');
                });

            }, function(e) {
                // FAIL
                alert("ERROR "+JSON.stringify(e));
            });

  };

  $scope.addMediaItem = function(mediaitem) {
      if (mediaitem.id==null) {
          alert("ERROR addMediaItem: cannot add a item with id null");
          return;
      }
      if (typeof $scope.request.info == "undefined") $scope.request.info = [];
      if (typeof mediaitem.comment == "undefined") mediaitem.comment = null;
      if ((mediaitem.comment!=null) && (mediaitem.comment.trim().length==0)) mediaitem.comment = null;
      $scope.request.info.push(mediaitem);
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
                        PopupDialogs.showIonicAlertWith18nText('INFO','SELECT_LESS');
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
        PopupDialogs.showIonicAlertWith18nText('INFO','INFO_REQUESTFAIL');
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
          PopupDialogs.showIonicAlertWith18nText('INFO','INFO_REQUESTFAIL');
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
                              $ionicViewSwitcher.nextDirection('back');
                              $state.go('dash', {id: $scope.request.partyId});
                          }, function() {
                              // FAIL
                              $ionicLoading.hide();
                              PopupDialogs.showIonicAlertWith18nText('INFO','INFO_REQUESTFAIL');
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
                      $ionicViewSwitcher.nextDirection('back');
                      $state.go('dash', {id: $scope.request.partyId});
                  }, function() {
                      // FAIL
                      $ionicLoading.hide();
                      PopupDialogs.showIonicAlertWith18nText('INFO','INFO_REQUESTFAIL');
                  });
              });
          });
      });
  };

  $scope.buttonRequestApprove = function() {
      ApiService.reviewResultOnRequest($scope.request.id, true, null, null, function(){
        // WIN --> go to dash
        // todo: switch to next request to review
        $ionicViewSwitcher.nextDirection('back');
        $state.go('dash', {id: $scope.request.partyId});
      }, function() {
        // FAIL
        PopupDialogs.showIonicAlertWith18nText('INFO','INFO_REQUESTFAIL');
      });
  };

  $scope.enterUserName = function() {
      document.getElementById('headline').focus();
      PopupDialogs.usernameDialog($scope, $scope.profile.name, function(data) {
          //alert(JSON.stringify(data));
          if ((!data.cancel) && (data.valid)) $scope.profile.name = data.text;
      }, function(e){
          console.warn("failed $scope.enterUserName with: "+JSON.stringify(e));
      });
  };

  $scope.displayChat = function($event, chat) {
      if ($event!=null) $event.stopPropagation();
      $rootScope.chatPartner = { requestTitle: $scope.request.title , chatPartnerName: chat.chatPartnerName, chatPartnerImageMediaID: chat.chatPartnerImageMediaID, spokenLangs: chat.spokenLangs};
      $ionicViewSwitcher.nextDirection('forward');
      $state.go('chat-detail', {id: chat.id});
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

  $scope.infoNameUnvalid = function() {
    PopupDialogs.showIonicAlertWith18nText("IMPORTANT", "USERNAME_NOTVALID", function(){/*WIN*/});
  };

  $scope.scrollDown = function() {
      $scope.showScrollDown = false;
      $ionicScrollDelegate.scrollBy(0, 300, true);
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

      if (!$scope.nameValid) {
          $scope.infoNameUnvalid();
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
          PopupDialogs.showIonicAlertWith18nText('INFO','SELECT_LANG');
          return;
      }

      var newRequest = {
        userId: AppContext.getAccount().id,
        userName: $scope.profile.name,
        spokenLangs : $scope.profile.spokenLangs,
        partyId : $rootScope.party.id,
        konfettiCount: $scope.confetti.toSpend,
        title : $scope.headline.temp,
        imageMediaID : $scope.request.imageMediaID
      };

      $ionicLoading.show();
      ApiService.postRequest(newRequest, AppContext.getAppLang(), function(respData){

          // WIN
          $scope.entercount = 0;
          $ionicLoading.hide();

          var afterPopUpAction = function() {
              $scope.headline.temp = "";
              $rootScope.party.konfettiCount - $scope.confetti.toSpend;
              $scope.confetti.max = $scope.confetti.max - $scope.confetti.toSpend;
              $scope.confetti.toSpend = $scope.confetti.min;
              $ionicViewSwitcher.nextDirection('back');
              $state.go('dash', {id: $rootScope.party.id});
          };

          if ($rootScope.party.reviewLevel=="REVIEWLEVEL_NONE") {
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

          // make sure to attach media items if already created
          if ((typeof $scope.request.info != "undefined") && ($scope.request.info.length>0)) {
              $scope.connectMediaItemArrayToRequest(respData, $scope.request.info);
          }

      }, function() {
          // FAIL
          $ionicLoading.hide();
          PopupDialogs.showIonicAlertWith18nText('INFO','INFO_REQUESTFAIL');
      });
  };

  $scope.connectMediaItemArrayToRequest = function(request, mediaItemArray) {
        // get first media item from array
        var item = mediaItemArray.pop();
        ApiService.addMediaItemToRequest(request.id, item.id, function(){
            // WIN --> recursive call when array still contains more
            if (mediaItemArray.length>0) $scope.connectMediaItemArrayToRequest(request, mediaItemArray);
        }, function(){
            // FAIL
            console.warn("was not able to connect madia item("+item.id+") to request("+request.id+") - abort");
        });
  };

});
