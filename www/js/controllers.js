angular.module('starter.controllers', [])

.controller('DashCtrl', function($scope) {

        $scope.actualKonfettiCount = 1000;

        // available app languages
        $scope.langSet = [
            {code:'en', display:'EN'},
            {code:'de', display:'DE'}
        ];

        // getting app lang from settings (later)
        $scope.settingsLang = "en";

        // setting selected lang in view to setting
        $scope.actualLangSelect = $scope.langSet[0];
        for (i = 0; i < langSet.length; i++) {
            if (langSet[i].code===$scope.settingsLang) {
                $scope.actualLangSelect = langSet[i];
                break;
            }
        }

        // receiving changes lang settings --> with i18n
        $scope.selectedLang = function(selected) {
            console.log("selected lang: "+selected);
        };

    })

.controller('ChatsCtrl', function($scope, Chats) {
  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  $scope.chats = Chats.all();
  $scope.remove = function(chat) {
    Chats.remove(chat);
  };
})

.controller('ChatDetailCtrl', function($scope, $stateParams, Chats) {
  $scope.chat = Chats.get($stateParams.chatId);
})

.controller('AccountCtrl', function($scope) {
  $scope.settings = {
    enableFriends: true
  };
});
