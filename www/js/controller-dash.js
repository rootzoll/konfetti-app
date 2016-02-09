angular.module('starter.controller.dash', [])

.controller('DashCtrl', function(AppContext, $window, $rootScope, $scope, $translate, $timeout, $ionicPopup, $log, $state, $stateParams, $ionicScrollDelegate, ApiService, KonfettiToolbox) {

        /*
         * get state parameter of controller
         */

        // set which party is in focus of dash screen
        var focusPartyId = 0; // 0 = no focus
        if ((typeof $stateParams.id!="undefined") && ($stateParams.id!=0)) {
            focusPartyId = $stateParams.id;
        }
        
        /*
         * prepare local scope
         */

        $scope.userId = 0;
        $scope.loadingParty = true;
        $scope.state = "init";

        $scope.actualSorting = null;

        $scope.partyList = [];
        $scope.actualPartyIndex = 0;

        $scope.requestsReview = [];
        $scope.requestsPosted = [];
        $scope.requestsInteraction = [];
        $scope.requestsOpen = [];
        $scope.notifications = [];
        $scope.showNotifications = false;

        // available app languages
        $scope.langSet = [
            {code:'en', display:'English', dir:'ltr'},
            {code:'de', display:'Deutsch', dir:'ltr'},
            {code:'ar', display:'عربي', dir:'rtl'}
        ];
        $scope.actualLang = AppContext.getAppLang();

        // sorting options
        $scope.sortSet = [
            {sort:'most', display:'most'},
            {sort:'new', display:'new'}
        ];
        $scope.actualSorting = $scope.sortSet[0].sort;
        
         /*
         * controller logic
         */       
        
        // update displayed text on sort options based on actual lang
        $scope.updateSortOptions = function() {
            $translate("POSTSORT_MOST").then(function (POSTSORT_MOST) {
                $translate("POSTSORT_NEW").then(function (POSTSORT_NEW) {
                    $scope.sortSet[0].display = POSTSORT_MOST;
                    $scope.sortSet[1].display = POSTSORT_NEW;
                });
            });
        };
        $scope.updateSortOptions();

        // the sorting of open tasks changed
        $scope.changedSorting = function(actualSorting) {
            if ((typeof actualSorting != "undefined") && (actualSorting!=null)) {
                $scope.actualSorting = actualSorting;
            } else {
                $scope.actualSorting = $scope.sortSet[0].sort;
            }
            $timeout(function(){
                console.dir("trigger sorting: "+$scope.actualSorting);
                $scope.sortRequests();
            },100);
        };

        // sort the open requests based on points
        // set changedRequestId if there is a request in user focus
        $scope.sortRequests = function(changedRequestId) {
            var sortFunctionMost = function(a,b) {
                return (b.konfettiCount+b.konfettiAdd) - (a.konfettiCount+a.konfettiAdd);
            };
            var sortFunctionNew = function(a,b) {
                return (b.time) - (a.time);
            };
            var sortFunction = sortFunctionMost;
            if ($scope.actualSorting==='new') sortFunction = sortFunctionNew;

            if ((typeof changedRequestId != "undefined") && ($scope.actualSorting!='new')) {

                // get index of request in focus
                var requestChangedIndex = 0;
                for (i = 0; i < $scope.requestsOpen.length; i++) {
                    if ($scope.requestsOpen[i].id===changedRequestId) {
                        requestChangedIndex = i;
                        break;
                    }
                }

                // find out if array changed in sorting and when then
                // find the top most changed in ranking
                var topMostChangedIndex = -1;
                var newSortedArray = $scope.requestsOpen.slice();
                newSortedArray.sort(sortFunction);
                for (i = 0; i < $scope.requestsOpen.length; i++) {
                    if ($scope.requestsOpen[i].id!=newSortedArray[i].id) {
                        topMostChangedIndex = i;
                        break;
                    }
                }

                // if there is a change - animate
                if (topMostChangedIndex>=0) {

                    if ((requestChangedIndex-topMostChangedIndex)>1) {
                        // move more than one position
                        document.getElementById('openRequestCard'+changedRequestId).classList.add("animationFadeUp");
                        document.getElementById('openRequestCard'+$scope.requestsOpen[topMostChangedIndex].id).classList.add("animationFadeDown");
                        $timeout(function(){
                            document.getElementById('openRequestCard'+changedRequestId).classList.remove("animationFadeUp");
                            document.getElementById('openRequestCard'+$scope.requestsOpen[topMostChangedIndex].id).classList.remove("animationFadeDown");
                            $scope.requestsOpen = newSortedArray;
                        },810);
                    } else {
                        // just one position
                        document.getElementById('openRequestCard'+changedRequestId).classList.add("animationMoveUp");
                        document.getElementById('openRequestCard'+$scope.requestsOpen[topMostChangedIndex].id).classList.add("animationMoveDown");
                        $timeout(function(){
                            document.getElementById('openRequestCard'+changedRequestId).classList.remove("animationMoveUp");
                            document.getElementById('openRequestCard'+$scope.requestsOpen[topMostChangedIndex].id).classList.remove("animationMoveDown");
                            $scope.requestsOpen = newSortedArray;
                        },810);
                    }

                }
            } else {
                $scope.requestsOpen.sort(sortFunction);
            }

        };

        // setting selected lang in view to setting
        $scope.setActualLangOnSelector = function() {
            $scope.actualLangSelect = $scope.langSet[0];
            for (i = 0; i < $scope.langSet.length; i++) {
                if ($scope.langSet[i].code===AppContext.getAppLang()) {
                    $scope.actualLangSelect = $scope.langSet[i];
                    break;
                }
            }
        };

        // receiving changes lang settings --> with i18n
        $scope.selectedLang = function(selected) {
            $scope.actualLang = selected.code;
            $translate.use(selected.code);
            AppContext.setAppLang(selected.code);
            $rootScope.spClass = AppContext.getAppLangDirection();
            $scope.updateSortOptions();
            $scope.action();
        };

        // the previous party from list (closer)
        $scope.buttonPartyPrev = function() {
            $scope.actualPartyIndex--;
            if ($scope.actualPartyIndex<0) $scope.actualPartyIndex = $scope.partyList.length-1;
            $scope.action();
        };

        // next party in list (more far away)
        $scope.buttonPartyNext = function() {
            $scope.actualPartyIndex++;
            if ($scope.actualPartyIndex>=$scope.partyList.length) $scope.actualPartyIndex = 0;
            $scope.action();
        };

        // when user wants to create a new request
        $scope.onNewRequest = function() {
            $state.go('tab.request-detail', {id: 0, area: 'top'});
        };

        // when user taps a notification
        $scope.tapNotificationMore = function($event, noti) {

            // media item info --> ignore tap
            if (noti.type==1) {
                return;
            }

            // request now public --> go to request page
            if (noti.type==2) {
                $state.go('tab.request-detail', {id: noti.ref, area: 'top'});
                return;
            }

            // request rejected --> go to request page
            if (noti.type==3) {
                $state.go('tab.request-detail', {id: noti.ref, area: 'top'});
                return;
            }

            // new chat message --> go to request page - scroll down to chats
            if (noti.type==4) {
                $state.go('tab.request-detail', {id: noti.ref, area: 'chats'});
                return;
            }

        };

        // when user taps the delete button on a notification
        $scope.tapNotificationDelete = function($event, noti) {
            if ((typeof $event != "undefined") && ($event!=null)) $event.stopPropagation();

            document.getElementById('notification-'+noti.id).classList.add("animationFadeOut");
            ApiService.markNotificationAsRead( noti.id,
            function(){
                // WIN

                // set id = 0
                // --> not displaying it anymore
                noti.id = 0;

                // check if there is at least one notification with id>0 to display
                $scope.showNotifications = false;
                for (var i = 0; i < $scope.notifications.length; i++) {
                    if ($scope.notifications[i].id>0) {
                        $scope.showNotifications = true;
                        break;
                    }
                }

            }, function(){
                // FAIL
                document.getElementById('notification-'+noti.id).classList.remove("animationFadeOut");
                $log.warn("Was not able to mark notification as read.");
            });
        };

        // when the user taps a request for more information
        $scope.tapRequestMore = function($event, request) {
            $state.go('tab.request-detail', {id: request.id, area: 'top'});
        };

        // when user taps on a request to add more konfetti to it
        $scope.tapRequestKonfetti = function($event, request) {
            $event.stopPropagation();

            // check if enough konfetti available
            if ($rootScope.party.konfettiCount<=0) {
                if (request.konfettiAdd===0) {
                    KonfettiToolbox.showIonicAlertWith18nText('INFO','INFO_ZEROKONFETTI');
                }
                return;
            }

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
                document.getElementById('openRequestCard'+request.id).classList.add("pulse");
                ApiService.upvoteRequest($rootScope.party.id, request.id, request.konfettiAdd, function(){
                    // WIN -> update sort
                    document.getElementById('openRequestCard'+request.id).classList.remove("pulse");
                    request.konfettiCount += request.konfettiAdd;
                    request.konfettiAdd = 0;
                    request.blockTap = false;
                    $scope.sortRequests(request.id);
                }, function(){
                    // FAIL -> put konfetti back
                    document.getElementById('openRequestCard'+request.id).classList.remove("pulse");
                    $rootScope.party.konfettiCount -= request.konfettiAdd;
                    request.konfettiAdd = 0;
                    request.blockTap = false;
                });

            },1000);
        };

        // when user pressed the reload button
        $scope.reloadPartyList = function() {
            $scope.partyList = [];
            $scope.actualPartyIndex = 0;
            $log.info("TODO: Also UPDATE GPS coordinates later");
            $scope.action();
        };

        // pop up with more info in party
        $scope.showPartyInfo = function() {
            $translate("PARTYINFO_TITLE").then(function (TITLE) {
                $translate("PARTYINFO_SUB").then(function (SUB) {
                    // An elaborate, custom popup
                    var myPopup = $ionicPopup.show({
                        template: '<div style="text-align:center;"><h4>{{party.name}}</h4><br>{{party.detailText}}<br><br>{{party.contact}}</div>',
                        title: TITLE,
                        subTitle: SUB,
                        scope: $scope,
                        buttons: [
                            {
                                text: '<i class="icon ion-information-circled"></i>',
                                type: 'button-positive',
                                onTap: function(e) {
                                    if ($rootScope.party.contact.lastIndexOf('http', 0) === 0) {
                                        window.open($rootScope.party.contact, "_system");
                                    } else
                                    if ($rootScope.party.contact.lastIndexOf('mailto:', 0) === 0) {
                                        window.open($rootScope.party.contact, "_system");
                                    } else
                                    {
                                        window.open("mailto:"+$rootScope.party.contact, "_system");
                                    }
                                }
                            },
                            { text: '<i class="icon ion-ios-close-outline"></i>' }
                        ]
                    });
                    myPopup.then(function(res) {});
                });
            });
        };

        // event when user is (re-)entering the view
        $scope.$on('$ionicView.enter', function(e) {
            $scope.userId = AppContext.getAccount().userId;
            $scope.controllerInitDone = true;
            $scope.action();
            $timeout(function(){
                $scope.setActualLangOnSelector();
            },100);
        });

        // the OK button on the intro/welcome screen
        $scope.buttonIntroScreenOK = function() {
            var state = AppContext.getLocalState();
            state.introScreenShown = true;
            AppContext.setLocalState(state);
            $scope.action();
        };

        // action to refresh dash data
        $scope.action = function() {

            // show spinner
            $scope.loadingParty = true;

            // reset party data in view
            $rootScope.party = { id:0 };
            $scope.requestsReview = [];
            $scope.requestsPosted = [];
            $scope.requestsInteraction = [];
            $scope.requestsOpen = [];
            $scope.notifications = [];

            // check if account init on startup is already done
            if (!AppContext.isReady()) {
                $timeout($scope.action, 300);
                return;
            }
            
            // display intro message
            if (!AppContext.getLocalState().introScreenShown) {
                $scope.state = "INTRO";
                // show intro part of view
                // --> button press AppContext.getLocalState.introScreenShown = true
                return;
            }

            // check if got client account
            if (AppContext.getAccount().clientId.length===0) {
                if ($scope.state != "ACCOUNTWAIT") {
                    $scope.state = "ACCOUNTWAIT";
                    ApiService.createAccount(function(account){
                        // WIN
                        AppContext.setAccount(account);
                        $scope.action();
                    },function(code){
                        // FAIL
                        $log.info("FAIL - no account");
                        $scope.state = "INTERNETFAIL";
                        $timeout($scope.action, 5000);
                    });
                }
                return;
            }

            // check if GPS is available
            if ($rootScope.gps==='wait') {
                $scope.state = "GPSWAIT";
                $timeout($scope.action, 300);
                return;
            }

            // check if GPS is failed
            //$rootScope.gps = 'fail';
            if ($rootScope.gps==='fail') {
                $scope.state = "GPSFAIL";
                return;
            }

            // load party list (just once when app starts)
            if ($scope.partyList.length===0) {
                if ($scope.state!="PARTYLISTWAIT") {
                    $scope.state = "PARTYLISTWAIT";
                    ApiService.loadPartylist($rootScope.lat, $rootScope.lon, function(list) {
                        // WIN;
                        $scope.partyList = list;
                        if ($scope.partyList.length==0) {
                            alert("no parties in your area - maybe a server error - try again later");
                            navigator.app.exitApp();
                        } else {
                            $scope.action();
                        }
                    }, function(code) {
                        // FAIL
                        $scope.state = "INTERNETFAIL";
                        $timeout($scope.action, 5000);
                    });
                }
                return;
            }

            // check if focusPartyId is in partylist
            var isFocusPartyInList = 0;
            for (var i=0; i<$scope.partyList.length; i++) {
                if ($scope.partyList[i].id == focusPartyId) isFocusPartyInList=i;
            }
            if (focusPartyId>0) {
                if (isFocusPartyInList===0) {
                    // add to list
                    var partyObject = {
                        id: focusPartyId,
                        lat: 0,
                        lon: 0,
                        meter: 0,
                        new: 1
                    };
                    $scope.partyList.unshift(partyObject);
                }
                // set focus index
                $scope.actualPartyIndex = isFocusPartyInList;
                focusPartyId = 0;
            }

            // make API call to load party data
            $scope.state = "PARTYWAIT";
            ApiService.loadParty($scope.partyList[$scope.actualPartyIndex].id,function(data){
                var isReviewerForThisParty = (AppContext.getAccount().reviewerOnParties.indexOf(data.id) > -1);
                var isAdminForThisParty = (AppContext.getAccount().adminOnParties.indexOf(data.id) > -1);
                //console.log("party("+data.id+") isAdmin("+isAdminForThisParty+") isReviewer("+isReviewerForThisParty+")");
                $rootScope.party = data;
                if (isAdminForThisParty || isReviewerForThisParty) $scope.requestsReview = KonfettiToolbox.filterRequestsByState(data.requests, 'review');
                $scope.requestsPosted = KonfettiToolbox.filterRequestsByAuthor(data.requests,AppContext.getAccount().userId);
                $scope.requestsInteraction = KonfettiToolbox.filterRequestsByInteraction(data.requests,AppContext.getAccount().userId);
                $scope.requestsOpen = KonfettiToolbox.filterRequestsByState(data.requests, 'open');
                $scope.notifications = data.notifications;
                $scope.loadingParty = false;
                $scope.sortRequests();
                $scope.state = "";
                $scope.showNotifications = ($scope.notifications.length>0);
            },function(code){
                // FAIL
                $scope.loadingParty = false;
                $scope.state = "INTERNETFAIL";
                $timeout($scope.action, 5000);
            });

        };
    });