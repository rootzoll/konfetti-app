angular.module('starter.controllers', [])

.controller('DashCtrl', function($rootScope, $scope, $translate, $timeout, $ionicPopup, $log) {

        $scope.actualKonfettiCount = 1000;
        $scope.loadingParty = false;
        $scope.actualSorting = null;

        $scope.notifications = [
            {id: 12, type:1, ref:123},
            {id: 87, type:2, ref:655},
            {id: 87, type:3, ref:633}
        ];

        $scope.testData = {text:'TTTTEEESSSTT'};

        // available app languages
        $scope.langSet = [
            {code:'en', display:'English', dir:'ltr'},
            {code:'de', display:'Deutsch', dir:'ltr'},
            {code:'ar', display:'عربي', dir:'rtl'}
        ];

        // sorting options
        $scope.sortSet = [];
        $scope.updateSortOptions = function() {
            $translate("POSTSORT_MOST").then(function (POSTSORT_MOST) {
                $translate("POSTSORT_NEW").then(function (POSTSORT_NEW) {
                    $timeout(function() {
                        console.log("RESET");
                        $scope.sortSet = [
                            {sort:'most', display:POSTSORT_MOST},
                            {sort:'new', display:POSTSORT_NEW}
                        ];
                        $scope.actualSorting = $scope.sortSet[0];
                    },10);
                });
            });
        };
        $scope.updateSortOptions();

        // the sorting of open tasks changed
        $scope.changedSorting = function(actualSorting) {
            alert("TODO");
            if ((typeof actualSorting != "undefined") && (actualSorting!=null)) {
                $scope.actualSorting = actualSorting;
            } else {
                $scope.actualSorting = $scope.sortSet[0];
            }
            $timeout(function(){
                console.dir($scope.actualSorting.sort);
            },100);
        };

        // setting selected lang in view to setting
        $scope.actualLangSelect = $scope.langSet[0];
        for (i = 0; i < $scope.langSet.length; i++) {
            if ($scope.langSet[i].code===$rootScope.lang) {
                $scope.actualLangSelect = $scope.langSet[i];
                break;
            }
        }

        // receiving changes lang settings --> with i18n
        $scope.selectedLang = function(selected) {
            $translate.use(selected.code);
            $rootScope.spClass = selected.dir;
            $scope.updateSortOptions();
        };

        // the previous party from list (closer)
        $scope.buttonPartyPrev = function() {
            $scope.loadingParty = true;
            $timeout(function(){
                $scope.loadingParty = false;
            }, 2000);
        };

        // next party in list (more far away)
        $scope.buttonPartyNext = function() {
            $scope.loadingParty = true;
            $timeout(function(){
                $scope.loadingParty = false;
            }, 2000);
        };

        $scope.tapNotificationMore = function($event) {
            alert("TODO more info");
        };

        $scope.tapNotificationDelete = function($event) {
            console.dir(event);
            $event.stopPropagation();
            alert("TODO delete");
        };

        // pop jup with more info in party orga
        $scope.showPartyInfo = function() {

            $scope.orga = {
                name: 'Helferverein Nord e.V.',
                town: 'Berlin-Pankow',
                address: 'Berliner Str. 99, 13189 Berlin, GERMANY',
                person: 'Max Mustermann',
                website: 'http://pankowhilft.blogsport.de'
            };

            $translate("ORGAINFO_TITLE").then(function (ORGAINFO_TITLE) {
                $translate("ORGAINFO_SUB").then(function (ORGAINFO_SUB) {
                    // An elaborate, custom popup
                    var myPopup = $ionicPopup.show({
                        template: '<h4>{{orga.name}}</h4><br>{{orga.address}}<br>{{orga.person}}',
                        title: ORGAINFO_TITLE,
                        subTitle: ORGAINFO_SUB,
                        scope: $scope,
                        buttons: [
                            { text: '<i class="icon ion-ios-close-outline"></i>' },
                            {
                                text: '<i class="icon ion-information-circled"></i>',
                                type: 'button-positive',
                                onTap: function(e) {
                                    window.open($scope.orga.website, "_system");
                                }
                            }
                        ]
                    });
                    myPopup.then(function(res) {
                        console.log('Tapped!', res);
                    });
                });
            });


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
