angular.module('starter.controllers', [])
.controller('ChatCtrl', function($rootScope, $scope, $stateParams, $state, ApiService, $window, $ionicScrollDelegate, AppContext, $translate, $ionicPopup, $interval, $ionicPlatform) {

     $scope.back = function() {
       if ((typeof $scope.chat.request != "undefined") && ($scope.chat.request!=null) && (typeof $scope.chat.request.id!= "undefined")) {
          $state.go('request-detail', {id: $scope.chat.request.id, area: 'top'});
       } else {
          $window.history.back();
       }
      
    };    

   $ionicPlatform.registerBackButtonAction(function () {
        $scope.back();
   }, 100);

   $scope.reload = function() {
       $scope.loadChat($scope.chat.id);
   };

   $scope.getChatPartnerImage = function() {
       if ((typeof $scope.chat != "undefined") && 
       (typeof $scope.chat.chatPartnerImageMediaID != "undefined") && ($scope.chat.chatPartnerImageMediaID!=null)) {
           return ApiService.getImageUrlFromMediaItem($scope.chat.chatPartnerImageMediaID);
       } else {
           return "./img/person.png";
       }
   };

   window.addEventListener('native.keyboardshow', function($event){
        console.log("KEYBOARD");
        console.dir($event);
   });


   $scope.$on('$ionicView.enter', function(e) {

        // check if id of chat is available
        if (typeof $stateParams.id==="undefined") {
            console.log("typeof $stateParams.id===undefined");
            $state.go('dash', {id: 0});
            return;
        }

       console.log("ENTER ChatDetailCtrl id("+$stateParams.id+")");

       $scope.chat = { id: $stateParams.id, chatPartnerImageMediaID: null};
       $scope.interval = null;
       $scope.loading = false;
       $scope.sending = false;
       $scope.senderror = false;
       $scope.chatMessage = "";
       $scope.messages = [];

       // load chat data
       $scope.loadChat($scope.chat.id, true);

       // start interval - start polling
       $scope.interval = $interval(function(){
           $scope.loadChat($scope.chat.id, false);
       }, 5000);

       // reset chat partner info (if no info from outside)
       if ((typeof $rootScope.chatPartner == "undefined") || ($rootScope.chatPartner == null)) {
           $rootScope.chatPartner = { requestTitle: "" , chatPartnerName: "", chatPartnerImageMediaID: "", spokenLangs:[]};
       }
   
   });


   $scope.$on('$ionicView.beforeLeave', function(e){

       // stop polling
       $interval.cancel($scope.interval);

       $rootScope.chatPartner = null;

   });


   $scope.loadChat = function(chatId, showErrorAlert) {
       $scope.loading = true;
       $scope.loadingText = "";
       ApiService.loadChat($stateParams.id, function(chatData) {

           $scope.chat = chatData;
		   $scope.loading = false;

           // make sure messages are sorted by timestamp
           $scope.chat.messages.sort(function(a, b){
				if (a.time==b.time) return 0;
				return (a.time>b.time) ? 1 : -1;
		   });

		   // if chat got more messages than actual - start update
           if (($scope.chat.messages.length>0) && ($scope.chat.messages.length>$scope.messages.length)) {
               $scope.messages = [];
               $scope.loadChatsItem(0);
           }

           // if still missing chat info
           if (($rootScope.chatPartner!=null) && ($rootScope.chatPartner.requestTitle=="")) {
               $rootScope.chatPartner.requestTitle = "..";
               //console.log("get more info from chat data",chatData);
               ApiService.loadRequest(chatData.partyId, chatData.requestId, function(requestData){
                   // WIN
                   //console.log("request data",requestData); 
                   $rootScope.chatPartner.requestTitle = requestData.title;
                   try {
                    if ((typeof requestData.titleMultiLang != "undefined") && (requestData.titleMultiLang!=null)) {
                        var multiLangData = JSON.parse(requestData.titleMultiLang.data);
                        if (typeof multiLangData[AppContext.getAppLang()] != "undefined") {
                            $rootScope.chatPartner.requestTitle = multiLangData[AppContext.getAppLang()].text;  
                        } else {
                            console.warn("multitext lang not found("+AppContext.getAppLang()+")",requestData.titleMultiLang.data);
                        }
                    } else {
                        console.warn("multitext data not found");
                    }
                   } catch (e) {
                       console.warn("FAIL MultiLang Title on chat");
                   }
               }, function(){
                   // FAIL
                  $rootScope.chatPartner.requestTitle = "-"; 
               });
           }

       }, function(errorCode) {
           if (showErrorAlert) {
           $translate("IMPORTANT").then(function (HEADLINE) {
               $translate("INTERNETPROBLEM").then(function (TEXT) {
                   $ionicPopup.alert({
                       title: HEADLINE,
                       template: TEXT
                   }).then(function (res) {
                       $window.history.back();
                   });
               });
           });
           }
       });
   };

   $scope.loadChatsItem = function(indexInArray) {

       $scope.loading = true;

       // for now load ALL items on chat FROM SERVER
       // TODO: later cache items in perstent app context and make paging for loading from server
       var chatMessage = $scope.chat.messages[indexInArray];
       var idToLoad = chatMessage.itemId;
       var useCache = true;

       ApiService.loadMediaItem(idToLoad, function(loadedItem){
            // success
           var appUserId = AppContext.getAccount().id;
           if (appUserId==="") appUserId = 1;
           chatMessage.isUser = (chatMessage.userId == appUserId);
           $scope.messages.push(chatMessage);
           if ($ionicScrollDelegate) $ionicScrollDelegate.scrollBottom(true);
           if ((indexInArray+1) < $scope.chat.messages.length) {
               indexInArray++;
               $scope.loadChatsItem(indexInArray);
           } else {
               $scope.loading = false;
               if ($ionicScrollDelegate) $ionicScrollDelegate.scrollBottom(true);
           }
       }, function(errorcode){}, useCache);
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
       ApiService.sendChatTextItem($scope.chat.id, $scope.chatMessage, function(chatItem) {
          // WIN
          $scope.sending = false;
          $scope.senderror = false;
          $scope.chatMessage = "";
          chatItem.isUser = true;
          console.dir(chatItem);
          if ($ionicScrollDelegate) $ionicScrollDelegate.scrollBottom(true);
       }, function(errorcode) {
          // FAIL
          $scope.senderror = true;
          $scope.sending = false;
       });
   };

});