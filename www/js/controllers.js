angular.module('starter.controllers', [])

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
