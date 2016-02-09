angular.module('starter.controller.request', [])

.controller('RequestCtrl', function($rootScope, AppContext, $scope, $log, $state, $stateParams, $ionicTabsDelegate, $ionicScrollDelegate ,$timeout, $translate, $ionicPopup, $ionicLoading, ApiService, KonfettiToolbox, $cordovaCamera, $cordovaGeolocation) {

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

  // get request id if its a existing request
  if ((typeof $stateParams.id!="undefined") && ($stateParams.id!=0)) {
    $scope.request.id = $stateParams.id;
    //console.log("LOADING REQUEST: "+$scope.request.id);
    $scope.loadRequest();
  } else {
    //console.log("SET NEW REQUEST");
    $scope.loadingRequest = false;
    $scope.setNewRequest();
  }

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
                        AppContext.setAccount((AppContext.getAccount().name=res));
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
            });
      });

  };

  $scope.takeSelfi = function() {
      
    if (typeof navigator.camera==="undefined") {
        alert("feature not available");
        return;
    }

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

    $cordovaCamera.getPicture(options).then(win, fail);

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
              imageData = "data:image/jpeg;base64,/9j/4QAYRXhpZgAASUkqAAgAAAAAAAAAAAAAAP/sABFEdWNreQABAAQAAAAjAAD/4QMdaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLwA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/PiA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjMtYzAxMSA2Ni4xNDU2NjEsIDIwMTIvMDIvMDYtMTQ6NTY6MjcgICAgICAgICI+IDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdFJlZj0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlUmVmIyIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOkY4MkE2N0I4RjgyNTExRTM4QUI3ODY1NDVDMUVGNkE4IiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOkY4MkE2N0I3RjgyNTExRTM4QUI3ODY1NDVDMUVGNkE4IiB4bXA6Q3JlYXRvclRvb2w9IkNPT0xQSVggUzkxMDBWMS4wICAgICAgICAgICAgICAiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0iOUY4MjFFMkEwOEZDQUZFQzU5RERGQjVBMDZGOUM0NjEiIHN0UmVmOmRvY3VtZW50SUQ9IjlGODIxRTJBMDhGQ0FGRUM1OURERkI1QTA2RjlDNDYxIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+/+0ASFBob3Rvc2hvcCAzLjAAOEJJTQQEAAAAAAAPHAFaAAMbJUccAgAAAgACADhCSU0EJQAAAAAAEPzhH4nIt8l4LzRiNAdYd+v/7gAOQWRvYmUAZMAAAAAB/9sAhAAOCgoKCwoOCwsOFA0LDRQYEg4OEhgbFhYXFhYbGhQXFxcXFBoaHyAjIB8aKSktLSkpPTs7Oz1AQEBAQEBAQEBAAQ8NDQ8RDxIQEBIUDhEOFBcSFBQSFyEXFxkXFyEqHhoaGhoeKiYpIyMjKSYvLyoqLy86Ojg6OkBAQEBAQEBAQED/wAARCADIASwDASIAAhEBAxEB/8QArgAAAgMBAQEBAAAAAAAAAAAABAUCAwYAAQcIAQADAQEBAQAAAAAAAAAAAAAAAQIDBAUGEAACAQMCAwUFBQYEBAYDAAABAgMAEQQhEjFBBVFhcSITgZEyFAahsUJSI8HRYnKCFfDhwjPxorIkkuJDU2MWNEQHEQABAwIEAwUGBQMEAwAAAAABABECIQMxQRIEUXEiYYGRMhOhsUJSFAXwwdHhgnKSFWIjQySiM3P/2gAMAwEAAhEDEQA/APpNQkbZG76eVSdTYaDmanUXRXUo43KwswPAg0ISvpnWhnSsjRiME2jsb3sL8aqi+p8F88YLKyOzbEJtxvt1HLWhfqs42FhJJGvpT8IHQWFh8SaDs4Vm8bJx42iycRyctA+x2Q+cHzFv1PKOyoJIzwrz7GUkr6TUJCQBY2118OdK+m/UOLm7Ue0crlQljdW3DS2gNWdTlx8lW6cJ/SlkHmYa7R2aHjVCQIcJujYsrHmLLFKrsmjhTe3jSTq+dnplPHjq0kNlEi7bBRfzHcRz7RWbgycSCWeXIEmyQlLq2wgrcecjykHuph1bPyYsSOLp07Phbd7bmBlSxBKm+pGulZmTxJrQ/Bih0x6zkTQQSzRE/KblVnXUo6m+5LfxaUDip1NFgycONykoZjKbGx4+cHWx7RpV/RM6TJgX1ykjwM1rsAhY6l2PM+bT99NJ8pceA5eRNGsSgiNYzob8FVq0lbEmmZGPS/BlOpMcZ3khQyrskKgsptoSOGlWKVYblIIPAjUVim66eplIhMcGG9onQEqWJ4SMeHc1eYmbH0fOf5vKb5WPcY2PmMrN+GNV1NTGeryjVF2fD2J6gtoXseHtqjN6j0/Ai9fNmSBORc2J7lXi3srH531nnzgRdPjGJEdPmJbPKbcwnwr7b1nZpbuuTmTGSVrlppm3N9v3CtWSWo6j9cTSAx9Jg9NeAysga+KRD/UfZWbnmyMuZp8yZ8mYDR5Dot9bKvwqPClc3V4lG2Fd5BvvbQUNEnVOquVgR5geIQWQeJ4UJ1R83UcaFVUH1HWxKr++l8/U8mViFPpBtNq8T7abRfSq46iTq+WmMOPoxnc5/b7hTrCw8bHA/tmAFPD5nK0J8F1f7qbJOOay+D9PdWzzuWIxRnjJLcf8vE02x+hdExXC5Mr9RyR/6EI3KPEJp72p58jLksfnZ3yFIuIl/Tjv2hE427zRcWPHHtSJAi23AIAB/MtvtpsEOSgEXO9MR4sMXToRw0EsgHgLIPHWro+lweoJZ9+VPxEk5MhHgvw28KPKcAOZBW33r+6pqBcdhOlu3+Hs8KaSXydOxZirSRBtx9MX5ITcrp8QobrOPggeq6XbHKv6QO1dBZPMLaX5U2A/272HnuwIsL66kcj4Up6902IxT50UZkzZLoGdtqKgF2c3IHAaVEs2ATWZy4XzcmSeSMYpmbe8QAVVUg7pDt5aX4VVl9VM3T4sKfdO2M7PDkFtw2nRQVNRWTEhxJDNH6+TKVKFtylABwbhuB5huNe4PQc7qOPPN5IBG6gmZvTADGzBU7Bfj7KzGbZpoCKbIuUj8239UqLGxH4m8OzhVU8k08jSysXkPxMx1J4UcsGHgTJ82r5SlbvHGyqCCSNHF7cOdUFjlZLyKohiOiRKpfYg4KP8zSyoqAQhO1rX1Gh/4VZaR1ZgLlRcnjp310kcO9hdt17KrAKb34k8Ptp7BBjYuOZcaQuWAExJBbXkb207rWoNA+LJEMg8TA3RCSQmNnsdo1+E3BDag3opIIUL2HxG7h9TuOuvMXoUyQSKZZJGXYdqRpfbbt7KhkZTON0OQq7QPIFGvL4ud+d65pCcixOOTUU1V8sMgJeBwAos6Ak2Hi2lA7jjC8YupOjEX1PEdlT+dmkx2jtvbQ7wACLdvbQkrkkErZey5/yq4ROB70Miww9NWJ8zG6gNuNwfsrxjlzjer3BvYFgOGvOhBIv5BblrwNXtIwhuyEktdXFrCqEWVBQjnMWQJrlmU3Xip8Q3LWr/AO4j1N/pR2t/t7fLe993buvzoeMGRt3xG9tlr7vE1d8rpew/k537Kbh2zQ+S+914Seyurq2TSDr8vUMqJcbAgEg3gThgAwBB22BIsD20CfpuXJxUGYT8wEIMVhsI/ACyjRvG9T+oOkZ5ypOo4jEx7Q0sepclOFgOVuXKlr9b67juUCmJE2uPN6gXS+zTiO25rMgaiZRJ91FKapNjYXQZSmG0E+N5RDJZpbk/E233g1m4cpJchcr05JJACr2eyjcLeYjie+qZcuTL6uMrIkkxZdt/Ti1KgDgt73U9lCesY1crL5ZD5Qpug77fsrC9NyNJ8uHPikUW2RlesYGksvwlnTy8L+Zee6rOoLkTw4ogiWKYn0Nqg7Wa17X7hyqnGxupP0ybIwoizE+jNKSDuRiD+M8jwPZRPT8rJg+UizWDxEPLGI7PtYrsu/CzeNaQjGArQSYyLDFKqDWWHDx0imQiVh+pZmv49x7qujZY8eTHkyrpN8SAfCvH8Wl6Czc/Eyp3eRCLXMrR383LS+gFAvmIilgpkQAnadSqisNBlMmEjGr9SY7U2myYFcjHjAhCoqlyWaw0JA0UXNUyZCb4/UKs4JAcdn8VBYWZlPE0/pWjeywhVuTbjxoyDAws6SLIyC9ozcQQDViObDgtdEQPUbTUDzCg8E6BAZHUJEaIQodQ2wfE7G9htC30qWP9N9YzP+4yyuJCdTLkNY9uiVqMfHaHzYWPFhbtPWcetOfb8IoxcCJgZZ75EovZ5jvtp+FfhHsFdICT8Ehw+h9HgAaOGTqsot+o36cAPi1gftp0sGc4WNpVxYb2EGKNttOHqHX3AUd6eijvUVLaLr7fuppIKPBx4dYowHKt5z5nPbdmuaJSMAHwU+wD4qnINP6SfbUl92tgewjlQmohfM3dZtPD4hUgP1NPy7ltz14rXhZY7tIwjAOu4gEacVvxFCS9Uw42NmMrDQBB5TryJ4GkSBiU4xlLAE8kY1jt4WZhbsJ/0mp8Cb/13Fj/AFLz8RSeTquVIbQQiMHUGQ6m3jYG3hVDfPTn9achSLqF8ov+XXb91Sbg5qxZlmRH2+5NmyYYmh3yBdlzcNwHDQ62486yP1H1Rpp2iSW8LixBDBNGPwqfvNNRgwspDAuCCDqTZtPNfyrQTdGx2jkjaS+S9yz6ttU/lRdAT41nKZOSZtYM59nsWdTKhx1jyIQTlBrtu1AIN7hTf7aIys3M6zlLHlTsxAPDVFFr6V7m9KlTKYGQBDZBK6iJSdt7WHM8qJ6X06TEaWWXySlSqgANZTqdeF6T9qAHozDNK8vHycI/KzkWjIYEC99w/AxtcGo4+WEksxvGSdH4Dv0rQfVSb5ceMkfANT4CkqdORACWLX1sFtw72pAoYg0VZKOSSu8XNgOYJ5qathXGiBuQVbQJusd3YBy9lCbgGIYFSOAOmnjVZjDebcGPYONUQ4ZIlEZDEjQ7U5KDpQu0heZPK3fUxYLsIAvzFeqR8epKC4I01HA60gCApCshGREpeSM+kL+Y+Wx8eNebElCgP5mIBJubk9nCoTStJGhd9xN/Lx08arWQIylTqvPjrQBmybBN4OiCTGMrO0QZrKZQLWHE3Q6eJqSS9LxIpMfZ6zAMDMpPn3C2nG3jSh5pHOrm2pA5C/HSvPVLJYnTlbnUkEp6uAHfVepJsuQdl+Kg2HdXfNz7t/qtvttv3VTqbn391dZNt963t8P+OdXpDvmpZfoUSrUt69tD7Ndb0P1FclcVnw5ER08zGQXG0a1qQBxUiRVWZ17Fx8tsJkk3gauo4buFqRxdLwswmXBzL9QsxtItg6m+4FVJ13cTVPUOsDNEPzcZiiib4I2IdnItu012jkKDOf1Yzt/6GPu8ko8pUnVQ/MAf8axM4l2OuuADHxQqs/6f6hAE6jNkqGLBZFjuGViNNlhZhpSqZIIlOzRnNm33Oo0YjcOZonO6hmtMoGQ6qgu8gJck+yhppZGUi/qzbPUlkYkgDjcE6WrCZBLDUP8ATy4lJeT9VypsFcRWCwQeQxpoWUH8f8vKh/mci20lhLILWHZy3dtDxxj1NyKdV/UbjYHTXsHfVk0EgWNmjELAWBUlb7PLfXmSONMjWxPURmU2V0CTZWO0UjCJVIs40Yd69vhVHyM+Pvn9LcqNwfVtp4MUXTxsaIhmm9NYifTDA3UjhbnprRGEY0O5pN0GrFR5rkDgNxNvdUmWnpoz5oVEORnhVkyZXGJLqWAGljtuvK9P+kPGMdiGQwOT6RPYDqrd576TJKmQAzTFY42ZBj7NSD5r+TSrosmP9KFwEiLeVoxdluPKCOznVRuSjMOAScK08UNktAubjMwjDefgo4304ijY5I5EZkcOoJB2628az+OkQSNWSTLeIsQ23Yo3ePm0tpTA5mWV2xxx46Ny+JvZa1dEZy+MjuCsWpcG5pmRYLfQXFzVU2ZiQEepKAQDcDU0tdZJDeeZnI4gnaD/AE6c6isUUeioF53tw7PitwNM3eAViyMyTyR2VnwqiNGC7N/uJzVeN/GmMePE2MJJ5WtbfI6H012nttrSo48r43qxbQxuGL/CoXieXChJ89541x4yRjR2A7ZCPxH9grGErkSTMkvhX3LaFmNwiMGAj5pNh3q7Oj6cxjbHQ+o7hYk3F9+7mbm/Cm2N0SJMUpMbZD+bemgjPIC3HvoDFw8XFi+YE0R6g3ABx5FPFR39tFfPOmGfUdfTIO74iwuRts3YPtrMTlCRFzq1B4nAE/LzWk2kBG0QdEqnEtx5e9BxLBgNImWyq0RutzZdvHePzXo7FysPKw2yIoUWZVvJGVFwfzeBoXZg5cEgy8iMvcGBlDPst+K+3XceVKd8+LN6kbbZFuAw4MOfippw1gGUiR6g8vyKtFu87MJw7hJG9RyVmhd3jWLHSM7zyG0fEPbQUD3ghu3xKpW7W1NtPLrYUYmOvVAr72EW79TGPw7v20EbRqVQGOJSRYFVCgGw79aLVswGLuci/vWUpP0kEGPFeSKhFwlwp18ljusfNd6GmYE7WKm5shZiSTcfhWrC4YG+0uBwG6Ty2++oi+5T5gpYeXyrt8w9utaqFR9RsT1KJRfyDgtu4c6WSXF7aki7Ete3daievygdV85UMOF79tBO91ZlJChdbLtBPtojglklmqeZrlm1tf765TPINyqeNvKAAKjEu4bm0RNW7TReSY439NTvCAALr2X+ynKRFBVYHFDSQndtBBI5Dj/wrwqwJAtawver1c66+a3EcfAVWiNKCgAG3UE/deh5OmxdQMjbShAsfxDQ28agqrexF72AN7WJ51NIXKl0Rnt8Rt5deHCoFGRzG4IKmzA8RTQrNkIMYkuAdWI1BW/HtozMxMNMaJ8VpJJpX22a1gLcBtoWRREQsiFPLfU8b8NOXhXO7GEAt5R8N+GtTVxwT4qrJgfHlaKQqzrx2MGA9oqqwta2vbfl2WrjcC99DwrzWrySX3zOXqAivhCNpNdxkvawHIDiTQaZzjEeTqkLQxkBShTVr8bKCxNKX+owOtLI+7HxkFmjF3Ladx23PDSkWd9T9RyOomXGkZI952R3I2ra3h7aDdGVTgyzYKXV2wWllycb0zBuCpj3dZdv5kvw140vx3yJ1cEj0WJ8zE3BHHU8TyqrN6rPkZDRsbzE7WViCSSOAtQvzWfGiY8yM0ato+w7rH4k3cq55vIUiB+MQmmUkGNHAzSzglrkRxi2vMs33CqFhMBWWOVnAB2IbW1G3XxFe5PpKxiEXozKofbMhUBDa24nuqqAT5ueuMkoSaU32EkR6DQBrc+AqQJkuBp7M0B3VCxKshVQQFXzICSbftrxc8xJsdQUS4j3mx47iL8a0/8A9XxFEbZMsyz/AAs8NrBjyF9WrO9Y6XL03qMsUhMqFbiVrDerfC3jWgiRGpI1B+DqjEh3OBY9nNcJRKG3MQAvlaw5nyqO3soOOSVfK6N6YJKsoOhPO9RT1kDemCoYWNjy7NO2iJ0zwY/mgys6jarNYsFHlJA4DspMOHfmlRqAonCOPE6ST73c+YFSFAHIm1O4cPBkmXMiuRe4UHyo1rfDWaijZ136qF4k3tYcfGnPTsjJcRwxDbGnmZgLhgTyBtSAINRyce5XA1Yh06NyT4af5VwOtr8v8cKjuNybWtoB/i9R5d/YD+ytHW7L0kA6XPPWw7v4fCpa20421P8Awt99ex4s76rE5uOIUj7fLV6dPy3BDR7SebFRbtI+I99DHggkcUJJ1NExXxvSeUhdoQLuUl+F2F7W7zV8fSTjdOM+UL5LlAEPCNSdb/xURFh50UiIjIoZwSVY8NOK8zarczOxsn1YFYmOBgZXQjUjWwJ5DtrGJjA3blwmI1MNRp3LeU5GEbVkUIEpkfjMoKONobSTreNgAm7W5PA7Utx413rB2WRof01kMSMb7fWXzBSvM7ftq6WNRGmxknzJiI8aFfhV5NdzAH8C6mrW6GpzJcZGYQjAjSKY3t8wJmk9Ts3btTTjanN5T6S1I0IiciO1SLluIGYkWeop8RPEBABZctXyIUVYozYEXAuBqQgOoozF6fDl9PdWHpSFyYXK7Sug4jmDQeT1TE2wpkFsbMm/TcKg2rKjbH1PDX76YSdXgx8qKCZiqzA6mx2W0DG34SdKLcxCQt3COrycZDieCRjcJJtA6oE6gMiMhxSyWXqmFjbPlmj9BtplJvEADfdYdtRHTp2KyF403+dwq3vfzC5PZemGdhZGT6sccqoj3JkvckDzFbX58L1jZvqzqLaK6IBoLAX00qtvFtbgjrLdWpTuLgIgQ2oh5UbHmtG/S1a3qTObHl5furl6dhxvvKXYsDdyTqDcVj5fqDPk+LJY9wJrul5suR1bDRpHbdMt7n21uQOC53PFOcow/wB1laUrcfmt+2hOqZGC+M/6ymQCyIP8qF65uk6zJGo5XvQE+K6KCeZpRwCDih42s62INyAQe824Vc49SaRrn4iPtoeO3rqDxDfdrUFb8QYgnWqZSi1jchipBtcWOhr2JZEa5U2GptqKoXKZAV0INXY2YiEh9yhtNy6mhk3KtiyjiSuoF0JuANDUclDJkiQL6e9VcX7/AMRtxqnI9EyN6Tk/l3cST4cPbXbiUDKNumwqTe1u+pbNGqijNAyTtGG32IBddQL9tRyOSD4UGp5Xq5HEm5gCXYBYlRbA246Lzqp42Rv1QQ35Txv4UJEqiykD+L7PGpbBbjVgta4YXIvYAg+FQuLfCP8AOm6S1vU0EEhSKQzlAqFQbi5FmCvpoKhLmRStNFKAPL5pwPPZR/tbl7eyn3UWTrSrDhdOSKRWJWSV1Qm/xbgmnvpRjvnYkrwsoRlBjKWDRstrXvztxBrOY0ku4BzClLvl2jg+dhiZMUN6cc58w9Q+bZpc3qMnVc6VDjNkfpksZNbbi/xdxq+bLigx2x42VgX9SVQCY99ttwTwvQuZh7cZZQpBlN1FiEtb4OFi1KLHBwP9WaFHI6jn5MK4s8hmjh1UE66DtNMfpl2i61iCYei4YowcWbzqduvYSa86N0GXqoZbnp6QqozJHO4SW+Fk08rDiRe1PMD6YwYY3fKkyJ5JGLxrAhj2qp8hJsdSNTarMCRQuqiKg071fkSnCjEU4Z55HcLKgDGDeLhbfF5+7hQWfN0KabCXObIeaKARDHVQhu3nu0jE20p3kZ6wnWCUmFAZGcKWsOBZieNKZczBDNN/b1GRIDKruoJJOm46k3JNa3DcmKwFTq7HOPd2K7VuyCNVzUwZnLsMBz7UkyJum/KTRYWN6WRFt/7mSRi97+a6iya91POpYPp9JGdKyNHAEYsrXdgbKRvGlBlJ4HffOjK/FfThRAeYXcLm3C9TbIyFsGyGUW+HdEBbwtXMbkWETEFjiKPgvQGwcAwPpuKiXUezBIM9YA0suM5kxTAu3cPPdvNt07DWwiy/pyCGINlhzsXyhiSCVGllA50vGVJyy3HduiP+mprly30ynJ/lib/TWk90JRhExYWww/HcpH2yYci5j2IqT6i+m4WZLepIhtbZzHHVzVT/AFxgILQYxNuG5lUf8tVl3kBMkiNrqZceEn2nbVZxsZ9Xjw3P8WMg/wClhU+tHgkft135gfFQk+vJibRQxKSbC5ZuNC5P1h1qNyj2iNr+VBz8aLPTsDcHGHgllNwQsiaj+SSq83FgymL5GHEzNoWjlkTh/wCKj1o5kqf8feJYCJ70a2TlZfSMfJjlVpZYA+U7aSg89ltOFB5nSsoYQlhIfJdo1SJDqqPfc0jcgul6nC6wxJAMZmgjAAi9bcpA5HcgNqJPUwZC8mJMeO0LMq7b8eHGuQOLhkDbAlKRLk9xXabF8WfSEJGgchvBWdJxcrpbRmMwSziOzO5coJHP6hVxz0t4UZHn5zZ80qwwJk+mkcmQ/qrE6KdyrGxba1r8hSqPqCrvLx5BkcWDDbtFuHkBsamvUYVjKq2QrEkhpE3AE632rpxqxdusWlB9L4nzPy4LE7adNVgyEenAeUcpcVHrXTMvqkOTIwhWdtsscakpeVfKT5/zoLH2UB07pU8PSVyJjtyDvaaCU2lCA2Tj3cqZ/P8ATWEcLTywwDyzMVYuyEa7fL5Tequq5PT5Ix/b8oyebzRTHaSoU28zAX15VY1zOkztxiZjqfAfEVMfUtzFwWrjiLGIhQtgPBFYwyIokly5IkgRCVKH9S+0hBKOQPd7a+abtK3GW/8A2+MgzUlxlRDNHceojhdpVm4uBytSHN6VEs2NDjQ+WfVZgzEFb2ud/C1b7TbzFmc2gIxmfLJ3o65t5J7kKSErkXYhgA/akm6mX05r13BH/wAt/cDRTfTsytLObjp8TlLuVWZio/8Ab+K1/wAVqM6T04Y3WIJJojiS495PSY39RWQ22XPxC97dlBmGZjg+HFSNtc06umkjFnqSMW8VVkqH+psgHgsZ+4V7lxqQg7zRo6bM/U5+ph4jj5DelEPUXfcWuzJxC99D9VWbDyxj3jksEItZ1O48m8K1tW5TIiKUWEizlZtwVyZrDRA5Hut+2qjDKqCRkYR8mI0pznyYIWUpCDKt0lIGxLMRbZY3vQMWTLHOs5HqhVACS6govLzdlXetG1PRIiRDVjgpjLUHAI5qrHwpZ2QH9NJASjsDZgNNKJzemjp7oskiyb13Bl8uh5EHWtT0f6d6n1TBwMnGWOGONG27nALbmPmAsaC+qvpjqmKxzJ1QwgXdkYMQALXsbGqHo+lJ3Nz4eCXVqHy5rMHbe6nv3dlERKJceyi7F/O44W7apVFEBYaja37KL6WhmhaO4AViddezW1YEK1LC6tkdKllfGSEsyhFZ1LMB2p+2hny4Zi8+QzyZchZpHIXaSeFgtjXnVQRlspG0rYWoaSEqBfnQyFMPAX3MX2nU2AvfsGtE+r07bf0JuHxbl49tV5cCpAjjQ6D7KD1pskvrf996JDkiTHhjjxFF5WaOT1LHja3lryWf6DeZvVxSJb3PkkX3bWrI5ImWAqRuXj5RV2YsiliVLrcWtYkXA7KoxHNJ+Sfyr/8AzuRnLq6M4IY/rc+fE60RB036T6vKuLj9RyZZtpEcbOSdoGtvUjsdKwcjSC5KtpqQRwFOfpGVl65hzH/aJYX/AJlIA9tGgMh1qOmxTTSrjIxj6TgAwsmu6YqTYSHgQLa07ADQS5L3JsSo7AOAqiVERDDCu1dx0HMsd7knxofJ6gYMZ4yl0VT5hx3HgKoRYADMqXrXJVyYuM6xPlIGRv1J2Y2BAvpxFIs75aTqUjYqhY12s2pIL8EF+wcabZ+WidJiEws6L5gdbtxv7KzOZK2LhOT/APkS/FbjvkHD+hKzvTOlnrLpC6tlbBuGch0WR6ku7BZ/rmY02bsH+ygCxju7fbXmdOY5mS2kaIBoDYbR2g0JlH1MvcBYFgAOwCwA+ymGbHhM05d5BmGQDaBeP0gqi/8ANUijNkCiUjLVKQrKUfa5Q0sKB3DOd25RwGoYX5dlXdEUP1bHA4bjrw4A0A5LZXqR3YKVsw7rC9O+i4U4y4c9oz6LySKZf4rXC+7WlMgRLnJG3JN62MOuPvTnqCSDFyWGm0XFu21CnH6MQbZBXaBuAmYa27zRGfLIYspNNtiL+w1lplJjmJGpKjvHOosEESpmur7iJCdsvjHLmtJj4GBkZEePFmurSkKtpt3Huq7N6OmIZU/ujq0Sh2vY+W+38S9tJfpaG/WcRtLCVfsDGnf1MQZcgnW8YA9korVo5geC4hO4CwnIcpFDZPTMnHEZ/uiu0iLJs2i6qwuu7TnQ5i6lDEuYZlkxVlSJmYbdxY2ITttz7KY9J6TJ1CQPISmIlhJJzYgDyJ39p5V59TSje8EQCY2GFjijHAEEMx99OzYF4z6YxjCEp4VLLp3F82NEY3bs7kpREus6YvjRe9VV8bHZsezS7gqADjekMnU+pQ29ZNlzYFgRc++mnV3doZtpsbKVPZe376TZiRtnRY88hixY1HnPhxF+N+F6jb2rM7Nyco9UJCMcGr+Ctd9f3Nq/bjC5IRnb1Fuasj63nPKIkjV3OgANqZAfUBf026czPYGwIIseBvwsaTvEj5UUfTm/XZgqMCeJ56j31ssLouJNAJJsl49gWNWsXMn8bEsLbjwA5UGxZIpHqfu0+OKyjv8AdAvO5LTlg794KVN0vrGRGVmwhGp/iUv7hXs/Surt6YMF4lBVkJ0IItfb29lN5egYyyemmRJfmWS3+qqX6Gii65D3/l/89OEDEaY0GPiou7iNyQnc1TIDYgU7ghcXpvU4cmWR4BMji3psfwsu0gEjThpQz9LyRKx2SJFIwaS5DObaeU28vso4dMyQxVMjwvvH3PU4un9RdyseR5hxtJKvD+o1HokFxKv47Vv9bAxAlbGl3Adq4/KUHHiZYyp5ZUvCwtGvJb8+FBjpmS8360TyG485I22HC1N3xeqI2mS+4f8AzN/qQ16uN1F3C5GXLCtmcMrI48v5gUWqj6kOrVgOH7rIy29zojGUTIiglw5xWey+j5UskkccbKWIJZyNhseVtb1HF6RmxTwjJjilxo2O5GY2APH4bN36VZk9VyEnYfPKnYrxqxt2tpxNeL1nK5ZWLJ/NER9xqJ3rsi5IPaRI+1bw2u1YAi4//wBLfudfQOl9RxcWCOCLIxceONQqR7HAAHLVr1T13KTOx3gZsbJidSrbHdGsewgmsQvUeoOCyDHlA47GYV7/AHLLU2fGjJHECQX+0VPrz4R/ub3q/wDH2TUTux529XtilE8MSNJEqvHCNyjdqRr+awvRXSkEIf0n3631A0NH/wB0lbR8NyO5lb9tR/uGOLhsaRL8bRcf/DT+oOcPCQKzl9tj8N7++3KCTdThnkyvUEZsbXt29tV5kZLx2UkC9yBpxpzM/TZrGVZEIFgdsiWHsqGW+BkQwRQ5IxxjhgoJJDbm3HduH3Vcb0TiJx5x/RYz2NyPlnauf03A/wD5MgchYzHGJNxQEXCanhS/YPUvsb07/Dzt40fk+t5RE20gG/f76D9bK3bd7buywvWq40/6xIemZBxZZd8yhS229trDTU2qnqfUH9SSOAtuJ27h2kDs7BW46T1PMy/qvquBlFZcPGD+lAyKVjAKhPw86eZGRHjOljFFdCdpQXOo18q0yWFUxFywC+MJhZ01/TgyJT/DG7X+yth9F9EOHkTdSzlYT4yhUjsbxs41LKdbgVqMrrU0UdopXmm4KsagX0/i76VxZOb04zS5BiWOZw59UPudiNQ+38QqROL1K0Ni61I493vTmWUKokQhwQNhB0uaDaL1iqOQVj1On4uWvdS/+55WV5Isf1YmuwnicBGbmLuBqKn85NjxEyY0y2/EzJsv2kg3rXXBvMNSxNm8C5tyERm1EJ13MvJFjgjZDeSQnhpqb+2wrKZfUJ8gh3NwhLKh7TxPiadTyFseWQqGkyQXuwuRHwQDs3atWex8WXKQ7GVV3Wuxt/lXMLgMpuQ0WiF2z2042rIESZXRKcojEijIdQJZ1cEhNwuTxv2UVn+V5X5s1gfCmWL0WJZFeadWA1ZIQ0hJHhpRcvR8SViziZ0JvtbZGNe83NRK7AEVfkt7W0vGJOjSSzaqd6SYeOZWjWKPZJJZFUXbcx0B8Sa1BkKTRdJgQfK9KVnyZ+b5DDYf6bmw7aHjxsSEgosasOBZ2kI8NtrVaJ40AW5dVO5YlAjQsOBbmayu3oyahaILPSpzWlj7ZcjcjcnKPSdWmLn2qjKBYzqBq24Ae+s0ZCY/TFl3WLEngRytWlBZpLn4jqSfGry2OvGMM3Mi37qVm7oejuXxZdW92nrmDS0mAIZnx7wkXQs+DpucuTMBKFO6ysFPwkcWHfR3Wes4WbFIYbmVxYLxAu26/DlR/qw8ogPd+6oSSIdPS/x7BWh3I+X2rlH2ou5ugfw/dWp9cYcOOkMHTpV9JAsal023A4mwvqdTSDqHUh1CWWVVMJke+xjcncOA299NSVHGK3jcfeK83p+Qe80DeEAgRZ+1P/Dg19Z+3R+6qz9zY8gAu5iUgc72FIsjJycsq2VIZnRVRGfiqLqFFuVP5JWdy7cTyGgFtABXsS+tKsaot24nsHM1nbvaAQzgl8WXTutl6xjLWIGEdPl1foqfpzpwJbLkGsgKx90d7O39R8o9tai9toGg0vbhcUrgysrGBCYquoa20syMFAsl/KVsO6jYOrRzPsaFoiNLsV2+03rsjKnNeLctuSKxEaBw3f3o4NuNy5dhbjXMe3Q8qGl6hj45BmdUB4EglfaygioP1HFnjDwzI224tcDXwNqsOSspQERiueULA01rspsO/uqvB6pH6hkK3vcEAjSnf0zCcwS5k6KYlJjhFgQx/G1u7hTqXpvTSrNJiwkDW4QA/YKZYEgivNIlxEA0A4ZrItIrtdbkE8+81V1fJEePkS3te0CHuHmf7af9SxOmYmA2V8uI5jpCisRdjw0vWG+qZzHCmKD5lWzntZ/M96zuGgAzW22i0pTOFsLJyuZZXkP4zf8AdUSulWrExdY1FySAz8hc/cKsfFZXKlrIFd9x5hW26eNMClFkSSSTiaovog8mQf5R99BTGH5qb5jeBuaxjsSTfS+7lTHpKhVyQDcBlAPC411pbmADLlv+Y1hD/wB1zkF3Xx/0dt/VL3lWYi488hEpeCMAXkRtEN7XYE329tMljMONPCJC/psyCSxUkaajdrzpGVQKG4m+vO1N+nXbAYMSbM3HsAFqd9tILYSCn7fqNy5EE9VmY70Hku0DARzSJx3DeT7qqjzp/UW8jOLi4bUH31LqDXlVmHxDdtGg1oPcC24C3dWhjE5Bc0b1yLETkP5FNHZD55BcHiLlRe/aK708b1bfMC3p777T8X/tXvf+qnP0106HPymaViIsZVYrtDB9xIKMG5Wqdun/AP3T0fRX5H1PQ9G3ltstb31WT9ihuvT2svoz5OOqyyxqPVK3L+iylvy3Y0gh+QZlObPKk0hJ4jaddTpr76lPkJjYWe75sbk40ixKspdtxGn4RWXfLyMLGw5XYZHzaFyrDa6sG28eYPEGlcjIh4gSbIrbbXIRJEyYaviiHW/gm6Rjj/tgpa1iwtrbvrpsnHcGSSNHU6XcAjTlrXzuLrMD3PpSJxuQNw08KufqMciXAmZD/wDG5B+y1YG7MUNshd8dvtpdUdzE8dVCtFkZfT4WIiewHCMMLDwAvSzqOZHlw+jvZUJG4qupHMXcj7qTt1PDQlSXDDQqUIt76vjmikVZLkIwuAdD7RWUp3B1adPCi7LdrbTBgJi8QOoCT07lfL6cgZlRybEkswAsB2KK9gtiBHjxYREPMY9twSRz3E1W0qFGG7kbCpFgy2AJsNedZ6iBQraVoEsYigauIB4FHDO+aCQxYaRykrtZXYG4NyLcPNU5pPI08vT4L7trSHf8V76Le1B4EsMOVDNKGMKG7MovY8vGj+q5mHJiLBAzSu7h1I1AHuFVqJBJlEHgw/Rc8xGF63aFuZjP4gblOPU7eKCyMuKZBGuNDAAbholIPhck8aXSY292f1nDH4LWG3w0q4q4tdWAbVdDqO6vfTmPCNz/AEn91ZmZBckDuC6/StadPwu/mOPN1CECJAjyF3A8pe+5te7s76nv7q9XHyiSqxSagXG09ulQyUmxIxLkxtHGWChjpqeVS4lIAEGUsnGKNcLcTqlERjh2Ae9FdOa/UMVSAQZVBFbNocqFCxnxo0B2pIYbktf8XsrCw9ShgiF0ZwTqyKAR2XN9T4Uwg6rg5jn5vMdHPAS3Fz/XZa67RnbBiYGp7l5e7hb3U4zjehEQjpIxljlFG/UQadMNI5Vy5RvLNGAuhttuopQem5agNIuxTcgnXhTuHCxXuRIJQR5SpAsfzaca6TpUOwkvJbu832VE4mZMiGft4LosTjZhG1GTiL1MTV60CRnAAG5nuCL6C331fjxxYznaQwcWZ73sO6jXxog2xma5GlwALfbXgxIzwjY+LfuFZs2I9q6TN2rTlj4qQlEZ3A7rgAAghR37kvVE0ss1rQAuuqOrA2Pesi6jtoqPElXSOMgHkA37aIXDyLf7EhPdpVxuRHAc1yXYg4zx7R7igL4xQDJxWViPORHdSf6G4VNMPEN3x90RYEHbcAgi1iHHZRn9uzDwhAPaxFcelTLq5jj7y9qDurY/5Ij+Sy9O0fMYS5iL+9UYXUs3CCdPin9BIl/SUojRlb8iQLHXhemS9c6qo19CS35kdD/ys1CHFgVNsmTirbiWNyfG5qDS4C6N1CP+hS376PrYZT1chq/JR9NtyMPAS/JWZubkdQmjkylSGHHG4IrFgzcbm4FqxnVciCUTGdN0kxLQPbUEHbbdyFta0PUMqD0Wix5vUaWyCQqVFjq979gpF1JpMPJMOKgyoUA2ykBgdO7TSrjuNUoZkgyY9NBTPmg7a2Lc4DXEFqiMpF8aju9qReVSCSQLHhrc1KMBg4P5b0+xsLCycaOTNkC5ExJeEAaAHygaaaUbDgdCxCQs0il7EjjcDhbymlPfwi40XJEFumJIp2rCP2+RI62ia+Q6v7f3STpML/J5GRa0ZkVATzNjwryfpEU7GQZSxSyDdsfh7DT+Q9FK29WZyPhBvYfZUsROkzssOPFPLMwJ2KTc7RqeIrmO6kZGcLd0GVGEf1XoGxD0IWrgJjaq5jp78aYrINgPESrNvtwaEFte8EUzw8WSLBEj6LLIQoa27RRuJA5VqP7bHoBgy3PANIBz2837arn6ekccs0mAFWBQ0heUEgcdBc8a1lfvTjpO3u82A/Nc9iG3s3dcLrv06SY5/wAliJthjEZU71Y7vKSQPGoNHCICALy8goP23FbGB8HI9ERYkKNOzqgkYi3pgE3OvG+lVZuXBhzCIY0Et1DBlvbXT8QvyqvXutq9C4z/ADxUHaRlPQJ1Y9OgYCnzLOx5mb01EbGmaIyjzFDa9uF70N87J6/zNz8xu9T1Pxb/AM1MesZEeVFGfRSEoTbZpe9Jdpvaxv2c629afoGenqHwuOPFY/Tj6sW61Hf5cfFPscZUbYeRlei+LlqW2BnLBWDKNwPfRHUMbInETQn1YsaMRKn/AKlhrqOenZWn6D9KwmCJc3Icz4zPHDYjb6Eim8VjyJJNLOt4DdNbJZGtjYkljuB9UgqhVlI051vIyd41DVBWFr0TExuOJGXTIdvFKejSYkSyR5pZEeOQXT4gSCVv+2nUPp4nR0y8hyqrGrLEODHaKXh1nUGSNZVYcWUXIPfxqMuPC6bGW6fk3Nt926uHcmN7QC8BAnVm4K9Sxs7tnWYShPWzE0w8UhQSZ2Z5j5pWLOewc62UfVEAWKHAiO0BVX4jYC35aW4PTonyFjx40iLfHIBwXnxNS6j9TQ9PLdP6JEssy6SZJF9edvzU7tqO4MRpOi2GAcj3FTC3DawlK8RO5cLkglk1fK6g0bgYESXG250tuFqql6l1SNRtgWHaLFkTdpa2utZKfqPXJzuny2UniBYUOczqincMt2I5E3BpQ2EYESgBGUag6ipO/wBsaG3KQ5OPaVqm6vnOVb1EPp6LaNQBqG+HtuKrbqfUS+/17PuVgQqixW4W2mlrmk+H1FsvcsoC5cYu1tN60bcEAg6HUUSNyJYk+K7rUdtcgJwhAxI+VFJ1LqKKEXJb0xYhCAVFjfQHhUz1jqZ//ZI8FUfsoLjw1qQSU8EY+w1lO3GZBnETIDDUHp3rT07YfojWuCtbqPUWYk5Ul7AXFhpx5CremRy9R6njY88xcMWt6p3AMVKhgvaL6UH6E9z5bcOJA++ium4EU07NlTGGGBDIxibz3vtABW9uNaWLcI3ImMIiuUQufdiP09xgI9OLLOZzD5qWFEAWJzEChNj6ZK7teF7XqzC+ZYhIpxGHbYDIf072vYghqr6jjjF6hk4271BE5Ae1rg+YE++ienS4i47CdBMyyESRs+w+jKmxpI2/MhF7V6cpSlIykXJxXz+GC8+amxpmSWFY5oyVcJuhdWBsb+kbfZTODrs+PYpmyKeccqiQe8bWpPPkCfJknZ2MjsWEhAN7cGK99VyTTTzepK4kY2G4CxNjpejTaMDqB1uNPBs6q43rsSBGREcw/wCWC3GJ17MdAN2Gsn4t28m/2US3U+qhfUWaNwCCYoYxuYc9pdrVm+g9Gi6iZsnI3yFCFSNbgAtzO3kKE6os2BlTYiyt6Ytz4qdRe1cc9lZlLURJyXxce1bR3kh5oW59pFf09i0mX13PMoXHXIVSBvLgKBf+c20FdJmp+PqGS/8AK4H/AEikUuZJAwVcRZxtB3sW42qo9WzSdseFGGPAbWJrl+mgagQD8SF6+qzA6ZW7kjGnTZ/NOnzMXsnlPa8r/vqhsmIny46f1bnP2mlbZ/WBxSKHxCj/AKjVD9Rz/wAedEncCv8ApBpjbDKUO5yq+ptx/wCC6P6miPaQnJmkPwoq/wAsYH7Kg0k/MsPeKRPnyH4uon2Fv2LV3ymS4uZ2Ite+4nSqNmIxm38T+ycd5OT+nYEmx/3I08HR02Q6fp72Af40to47GJ7Kg0qLoWA8SBQYwyCCzk2PC5qUfTYpchRK5Cu1mcLuIHco409Nug1H+1Tr3Mdc/TgH6i8yWYdgRWPmYkeTE80g9JXBexBNql1HqmDLks0En6QAVTbU2Fr2Aq0fT3TxG22eeaYaqiY7KHANmsW7O3lVo6H06NHm+XzZEjBYhvTj2gcyCSSB2itRbizVbHELmluLhuC48IkDQ2mTe1kqOZHv2m9ibKQCb1PH6u2DOJoHKzopUMAD8WhrtiX3WG4XtXnog67NfCs4ygC4B8V0zhemDEzjXHoenCroiT6q6k7Bw77hwKhRz3dnbVOR1jq84McrySRPq0bEW082u0a6156ZHID2gV6ZI4Y3mmIZEBbYD8RGipp2tV+qTQDGlZFY/TCAMpTA01eMIBm7lRD1XqUUfpQwoE3+oCy3YNbZoTwuKjlZfVMyYzzqgkYAEhQoNtOApZJ1DqBN2kZAeCgbR7NKI6dlSSO6TO0ml1ub+PGtJCYjURYZYrkt3LM7oAne1SfqJEfcuyGyAqmVhe91AHZVfrPtvf8AdRWaPU2BfKRfQ6g0J8s9rcuHDW9DjRgH4Mo0/wDc06pc9R1eXivqizS+soa6EjRuI493bTYQwdW6aIctC0cy7ZCh18rcG9opUxAddRYggj7ajjdVj6eGQ3WJCdF1Ivr7a3BXEnCdA6MAfSj9NmN3IJuT2kNcfZQE/wBJYbuWGWYl/KFT9tUS/WXTUA3u7dn6RNLMr6/6el/SxppSP4VT/qJqTCJxAWsNxeh5ZyGWKp+rcTF6H01I8LLds3Nf0wp2G6D420AIA7udY7amJH6aC8h+JuZojP6pP1nqj5842KqhIIr3CIOA8eZpblMTe/gfCnGMYigZTcu3LhGuRm3Feus5USaBH1RmNtwGhKjiR31BHa9m9tWmVpNGPjawvYWUdwAryGIvLa/lsSW5WHP31SheeoYJY51+KMi/ep4itFFNYAR22MA6GwJseNZrINhbnpVgmyRjaSuFQAIAbWBNY3bWtiKFdmz3noCUZAyjKobitI009tXIHu+6h5MkL8coHi/+dZovK/xOzeJJqPp91ZjbcZexdEvuvy2vGX7J6+dijd+st+7X7qt6J9RP0rLXMjQSttKSA3sytyNuHDSs96ZqyFpYX3xmx4EEXBHYQeNawtiOZK5L+7nebVGIZ8O1HdQlmzsqfNcK0mQ7SPsN1BJ4AcgBpQhUKisTd2Pw2uAO2/ber8URPKTJuiuDtEZt5v5mvpVzq5kRJI96PoJFIuLntXQ1qK4LlR/0v0nC6pPlNnuyYmHGHdVbbvZ22KC/ECg+sYKdN6k+NFIZIbLLE7fFsfVQe8Vq/p/pnUOhZIz8ZE6hiZiGObGBCT+Uh7qreVit6zf1RkZGf1iXMnxZMJWCpHE67SqILC/K/M0yCCQcQWQCCARgapx9PfU8PTGcsDHHMirLYbmDL+JAbA37KT9b6mOq9VkyIk2LKVSJDxCqLDd38zSdWPaQKJxdiEyb90vDssPCs5zYEtVbWbWuYBIEcSXyzTszJahOodWOLjNjY6bcmf4p76rH+VRyv215Hcncx1+6lbJ83lPI3+2DZR3DSsbW3A6pCuQXdu/uU5f7dqTRzkM+SDILm5ux7eNRYbTYix79Kbl44RtRRcaXql5S+jBWB5HWuheYgUF9Kf8ATZBJiBSdYzt7dOIpIYrNuiBK815j/Kj+lS2laM6bxw7xrWN+Lw5VXb9vu6LwHz9P6Jo+wDiTqOAt99ENjTwT7VjczR2cFLnbz5DiKGLbWRrX2urAHu1ouTq+e4IEpQE38uhHdfsrikJuNIHeWXsSnJ2AiQRXUozdQzZHPqzSM9tjbma9vy6W0ocyOTe+trXvy9tVFx2/tqLOo1OlajUcSSszK3AUEYDsDKcjvsbXke6oFr8Tr31RLkxKp8wJPIGqWzYxwv7v32qhalwWMt5aGMx3V9yLJFVZTW2RcLD1Hvy/KD7NaDPUTfyC7cr2ovpmP/cupYuLkPcZk6jIc6XQeZ+HDQWrW3aIkCclybneRnbMIP1YnCiCkySwI2BoeYNjp38xQ6N6E25CdvAdtjWx65iR5GTuhxkgwyGTG2rZmjXy72PPdxFZGBAzANqAbe6tyMivPBIIILEIvHZ8h9jAiEfE5ubE8Bp21b8sm/ZuH5d1ztrxDkKdrRuqi4NwLW9lqKs9t9/1Ldn2VjqL+UNwVapPqq/HNbyQeVTbUEa0vzMUu557h7NKbbLxmwva+p0qMkIIVuNj99aqVjcrBkUMLeZToeNLJ8Q3DDgdDW+kxFL6gEEW9ooVukRPvRl05WHI0IWBWNoWII0I+yqiocFTxreN0GKRb7bupt2C9Lcn6OMjerj5CxqeW0nTtAFDoWUXEYn4rDvF6IZ4oIyiDzNq7nVmI4e6tGn0WQwE3UGKtw9OO1z2ec0XH9H9HCsknqzSn4ZGe3tCrYaUaghliIIWypdig72Pl76ar0HOMQQAMjEa8LEHgaNyOn/IzGEoFK2KsvMcmU086V1BJwIJiFyToj20e3Jv4vvqdbqzBg+Kz8f0rOwG4jd2fu7aKj+kwfifhx04ezjWsCBQbgLbt+E8vZXtu3iOF9D7GpuVCzkf0viqLsS1FJ0HBj4RAnvpuRc6aHnyP+dUud1wvAf44Uk1nvqDpkP9uL46ASQMHO0aleDcOysmuQ8bDuIIPhrqOdfQZpDtv/wPdesh1TpADl8MEKdTE2gX+VuyqiWSKc4H1hjSLGucjwunwyxn1IrmwZmi0cE2/Ca0sfVcTqMwbHyI8qNlRDEGUljr5pIZbFQnMAa18t+TywT+mQRXqxSqQXUEjt41TuXOaQDUGS031NFj42dAqQRoJMdHe0XpBnYtdtn4eFJJZIww9OJV048daEledpA7Oz2FrOxaw7PNyqJYkajWk6bIwZUhil1BsLLbtOleRJ6ca9p5/fQ0IZjs/ANbCr52KqQNTbQeNNJFdL6TmdZnaHEQOyqWEZYIWCkbvM3AC+po7P8Apw4JKTLHIoNi8JYOvjuJ1rU9Jmj6R9JoMaeNpsprLMoA2b7Bwza7mUg0M3SHjlIDCRSGLya62F7Eubk0k1gZ4nxp2hc3K8GH4lYXVh41HFlKzgqLFdQOVxTPr0ISbFP4mgUt7Ga32UkKm9IhwycZGMhIYhNpOpaiy2I/MR+yqH6mx+HaveoJPvagNtdtNIQiMAFrLcXpYzl4t7kQ+dK2m5vftH2VS0ztx49p1++vAh7KkIXPAU1kSTjVQLuefurwm/HWikwZn4KaITo2Q3K1CSXxkXGlrUwwMh4MyCRL7l3AW7xUJOjZyeaNPUH8PGqDFkowBikV1Nx5Tf7KaFr8bqUKdKy8mSRpEjUhN9reowtHGjcSeZ7qSYOJGYI90YZ7XLXIa518KhFjdS6g6LOsnoRncd42Dvsump8Kdx4e0fDtH2UiUBDNj7tLOAQAbWYfZavflk/Obfl2tej1iZRwP7PtqWtuBvw/xyqWTdapR5SDpqaiAWi8uhtpfuqS8WA431royfMGPAmqSXN8AfTSx/fXMALPbTgT3GvYwNpA/CbV4q3WxNyNCaELrANe2jcfEVEIFYi2jXYdgPMVZtDJY23cDbtrwqWj42bv7RQhVhR/ttz1Xw9teWLaOPOh0P7f31ZqyhwNR779lRIBUOOI4/tFIoQubhR5sW0gLLGfIxHBuw9oPOstNE8EpSQbJENivYeVu7sNbPUgPHc9q9vd40F1Pp8eYgmjAORGLLfg6/kapIWkJtQobpfUjkbceVwchtEe2j/wt/FTMgi4PlJJ0PD2VkLNG17FWBsQdCCOR7CK0XTs6SfH2zWcgWUmwLa8PGgHiicGqMEYVJ8qi/HQ/sNVPGXJA5cjow56GiNTcE7hzRtGFx31wUONDvUW8rX3Dlyqlml8sBckW9o0YcxppS/IwSbhde2w91xT1kJNuO3kfKwI1qtoQ/It38GFJCyk+Hpw/aKBlw7ctPePfWvkxFckmwvwIIDDxAoGbpwuSLEcyBY+0GmhZOXEIPCg5YGU8K1kvTSeF/Zr9lBzYFh5QSDz/wDLTdCQ4w27r1HJbzX42ING5OI8fmReHIdlAyncAw5aGmMELWYvUBPixwOyb4jdQAQnau7xBpzHNFb5RJjlZ+ZeKBiBtgisDK5I+EnmTWEws2KNFiyY2kRf9uSM2dR+Ug6EUfN1sRYsmP0+E4yTDbNM5vK6/kW3wrQEKnrk0ef1iRcXzQR2hhI/EkQ27/bxoP8Atst9VPtpl0PBZi2Q623iy8rL3X43rRLhqQAFv3AXN/6taRNULJJ0eZvwm3heiY+hkW9TS+mv+VaYY47de8kn3LYip+i1uBA4ECyj/HspOUJFH0SEcvG+n30UnSolFwot28aZbLC2lhpcDd7b8KmEB+Kxblubj2af50kIEYAXkB/j+GrBh91u3lx8daNClPhvw1sNotXDU3FieYAJJv3mhCFGODyue4E/5VL0wOA0PK9/+mimC8bgD+MnQDwqGw/huw0Fx5V99NCoMZFzbW3HQc/fUfTHFSRb3e9quKsOFuF7L5jx7ajIVX4r7tdGNCFQ0bHv8NT+6vLSX2+bwuKkWk/CpI567RXm82tZeHw9/ChC0QsJGsdTyt++pLfebnvH+BXV1NC4bRIQB8QvfjciuA2udbKRceNdXUIXDaHJ1IbXnxry4DaXAb2cK6uoQvdVJuRtbhcXsf8AOom6kH8LGxtYWP7q6upIXnlQlr2Q8QQTr2+2pag34KeI0GvbpXV1JNLOqdNWe+TELyWHqKvF1HZf8QrP29N9y/CeDcCQP2iurqkrWLtVaTpfUIskLFkEDI4I9h5/E8mpgysvxaAaB/8AhXV1UMKrOTPRRZmGpGgsdyixqt9RZtRwBBuw8bV1dTUqIS4vqRxuPKfsqBjAPI966n211dQhQaC9/LuHuI7tKrbFX8Iv3qNb11dQhUTdNimQ3UHsa/mFJMr6UeUlsZ/Me0WU+NdXUckIWH6PztwLZcMS8wAzMB4aUyxPpPCjcvkPJmMuoUgRqD3r+KurqOrNNOlhijULEojUfhQXt4qansQr5hcDhre3dt4iurqElypckLqP4BcX+8VHYvxXWx5sS3ie0V1dQhe7CwuLsPcLctRY++olCpuQEPaBcknlcfurq6hC4oSPg0OgZiAPcLiuINrajnZBp+0V1dQhRK6WYBeV21P2/vrtkgOgZtdSNB7q6uoQuYNt1sAOIRbH/HsqG0X3KADexLi5Arq6mhUusZ7XOvw6DT7Kj6Tfw7eznbx4V1dQhf/Z";
              alert("USING MOCK IMAGE");
          } else {
              imageData = "data:image/jpeg;base64,"+imageData;
          }

          /*
          console.log("GOT PICTURE");
          console.dir(imageData);
          */

          $ionicLoading.show({
              template: '<img src="img/spinner.gif" />'
          });
          ApiService.postImageMediaItemOnRequest($scope.request.id, imageData, function(mediaitem) {
              // WIN
              $ionicLoading.hide();
              $scope.addMediaItem(mediaitem);
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
                      var posOptions = {timeout: 10000, enableHighAccuracy: false};
                      $cordovaGeolocation
                          .getCurrentPosition(posOptions)
                          .then(function (position) {
                              $ionicLoading.hide();
                              $scope.saveLocationMediaItem(position.coords.latitude,position.coords.longitude);
                          }, function(err) {
                              $ionicLoading.hide();
                              KonfettiToolbox.showIonicAlertWith18nText('INFO','INFO_REQUESTFAIL');
                          });
                  }
              });
          });
      });

  };

  $scope.saveLocationMediaItem = function(lat, lon) {

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
        title : $scope.headline.temp
      };

      $ionicLoading.show();
      ApiService.postRequest(newRequest, AppContext.getAppLang(), function(){
          // WIN
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