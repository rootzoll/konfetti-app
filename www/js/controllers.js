angular.module('starter.controllers', [])

.controller('ChatDetailCtrl', function($rootScope, $scope, $stateParams, $state, ApiService, $window, $ionicScrollDelegate, AppContext, $translate, $ionicPopup, $interval) {

   $scope.chat = { id: $stateParams.id};
   $scope.interval = null;

   // check if id of chat is available
   if (typeof $stateParams.id==="undefined") {
       $state.go('dash', {id: 0});
       return;
   }

   $scope.back = function() {
       $window.history.back();
   };

   $scope.reload = function() {
       $scope.loadChat($scope.chat.id);
   };

   $scope.getChatPartnerImage = function() {
       if ((typeof $scope.chat.chatPartnerImageMediaID != "undefined") && ($scope.chat.chatPartnerImageMediaID!=null)) {
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
   });


   $scope.$on('$ionicView.beforeLeave', function(e){

       // stop polling
       $interval.cancel($scope.interval);

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
