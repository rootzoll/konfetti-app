angular.module('starter.controller.dash', [])

.controller('DashCtrl', function(AppContext, $window, $rootScope, $scope, $translate, $timeout, $ionicPopup, $log, $state, $stateParams, $ionicScrollDelegate, ApiService, KonfettiToolbox, WebSocketService, $ionicLoading) {

        /*
         * get state parameter of controller
         */

        // set which party is in focus of dash screen
        var focusPartyId = 0; // 0 = no focus
        if ((typeof $stateParams.id!="undefined") && ($stateParams.id!=0)) {
            focusPartyId = $stateParams.id;
        }

        $rootScope.resetAccount = false;
        
        /*
         * prepare local scope
         */

        $scope.state = "INIT";

        $scope.userId = 0;
        $scope.loadingParty = true;

        $scope.isReviewerForThisParty = false;
        $scope.isAdminForThisParty = false;

        $scope.actualSorting = null;

        $scope.partyList = [];
        $scope.actualPartyIndex = 0;

        // collector of notifications to be added to next load of party notifications
        $scope.globalNotifications = [];

        $scope.requestsReview = [];
        $scope.requestsPosted = [];
        $scope.requestsInteraction = [];
        $scope.requestsOpen = [];
        $scope.requestsDone = [];
        $scope.notifications = [];
        $scope.showNotifications = false;
        $scope.updatesOnParty = false;

        $scope.lastPartyRefreshID = 0;
        $scope.lastPartyRefreshStart = 0;

        $scope.checkedAccount = false;

        $scope.showLogOutOption = !AppContext.isRunningWithinApp();

        // sorting options
        $scope.sortSet = [
            {sort:'most', display:'most'},
            {sort:'new', display:'new'}
        ];
        $scope.actualSorting = $scope.sortSet[0].sort;

        $scope.login = {
            Email: "",
            Password: ""
        };


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

        // redeem button
        $scope.onButtonCoupon = function() {
            KonfettiToolbox.processCode(true);
        };

        $scope.buttonLoginRegister = function() {
            $timeout(function(){
                $scope.login.Password = "";
                $scope.state = "LOGIN_REGISTER";
            },10);
        };

        $scope.addLogoutNotification = function() {
            var notification = {
                id : -1,
                userId : 0,
                partyId : 0,
                type : 9,
                ref : null,
                ts : Date.now()
            };
            $scope.globalNotifications.push(notification);
        };

        $scope.buttonLoginRegisterFinal = function(mail,pass) {

            if (typeof mail == "undefined") {
                KonfettiToolbox.showIonicAlertWith18nText('INFO', 'EMAIL_VALID', null);
                $scope.login.Password = "";
                return;
            }
            if (typeof pass == "undefined") return;

            // password needs to be at least 8 chars long
            if (pass.length<8) {
                KonfettiToolbox.showIonicAlertWith18nText('INFO','PASSWORD_LENGTH',null);
                $scope.login.Password = "";
                return;
            }

            $ionicLoading.show({
                template: '<img src="img/spinner.gif" />'
            });
            ApiService.createAccount(mail, pass, AppContext.getAppLang(), function(account) {
                // WIN
                $ionicLoading.hide();
                AppContext.setAccount(account);
                $scope.login.Password = "";
                $rootScope.resetAccount = false;
                $scope.addLogoutNotification();
                $scope.state = "INIT";
                $scope.action();
            }, function(errorcode) {
                // FAIL
                $ionicLoading.hide();
                if ((typeof errorcode != "undefined") || (errorcode==1)) {
                    // email already in use
                    $scope.login.Password = "";
                    $scope.loginEmail = "";
                    KonfettiToolbox.showIonicAlertWith18nText('INFO', 'REGISTER_FAILMAIL', function(){
                        $scope.state = "LOGIN_START";
                    });
                } else {
                    KonfettiToolbox.showIonicAlertWith18nText('INFO', 'REGISTER_FAIL', function(){});
                    $scope.login.Password = "";
                }
            });
        };

        $scope.buttonLoginLogin = function() {
            $timeout(function(){
                $scope.login.Password = "";
                $scope.state = "LOGIN_LOGIN";
            },10);
        };

        $scope.buttonLoginLoginFinal = function(mail,pass) {

            if (typeof mail == "undefined") {
                KonfettiToolbox.showIonicAlertWith18nText('INFO', 'EMAIL_VALID', null);
                $scope.login.Password = "";
                return;
            }
            if (typeof pass == "undefined") return;

            $ionicLoading.show({
                template: '<img src="img/spinner.gif" />'
            });
            ApiService.login(mail, pass, function(account) {
                // WIN
                $ionicLoading.hide();
                $scope.addLogoutNotification();
                AppContext.setAccount(account);
                $scope.login.Password = "";
                $rootScope.resetAccount = false;
                $scope.state = "INIT";
                $scope.action();
            }, function() {
                // FAIL
                $ionicLoading.hide();
                $scope.login.Password = "";
                KonfettiToolbox.showIonicAlertWith18nText('INFO', 'LOGIN_FAIL', function(){
                });
            });
        };

        $scope.buttonLoginRecover = function() {
            $scope.state = "LOGIN_RECOVER";
        };

        $scope.buttonLoginRecoverFinal = function(mail) {

            if (typeof mail == "undefined") {
                KonfettiToolbox.showIonicAlertWith18nText('INFO', 'EMAIL_VALID', null);
                return;
            }

            $ionicLoading.show({
                template: '<img src="img/spinner.gif" />'
            });
            ApiService.recoverPassword(mail, function() {
                // WIN
                $ionicLoading.hide();
                KonfettiToolbox.showIonicAlertWith18nText('INFO', 'RECOVER_WIN', function(){
                    $scope.state = "LOGIN_LOGIN";
                });
            }, function() {
                // FAIL
                $ionicLoading.hide();
                KonfettiToolbox.showIonicAlertWith18nText('INFO', 'RECOVER_FAIL', function(){
                });
            });
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

        // receiving changes lang settings --> with i18n
        // overwriting rootScope
        $scope.selectedLang = function(selected) {
            $rootScope.selectedLang(selected);
            $rootScope.setActualLangOnSelector();
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

        // back to login start, when on register, login or recover screen
        $scope.loginBack = function() {
            $scope.state = "LOGIN_START";
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
            if (noti.type==4) {
                $state.go('tab.request-detail', {id: noti.ref, area: 'top'});
                return;
            }

            // new chat message --> go to request page - scroll down to chats
            if (noti.type==5) {
                $state.go('tab.request-detail', {id: noti.ref, area: 'chats'});
                return;
            }

            // rewarded --> go to request page
            if (noti.type==7) {
                $state.go('tab.request-detail', {id: noti.ref, area: 'top'});
                return;
            }

            // support done --> go to request page
            if (noti.type==8) {
                $state.go('tab.request-detail', {id: noti.ref, area: 'top'});
                return;
            }

            // logout reminder --> flash option
            if (noti.type==9) {
                document.getElementById('deleteAccount').classList.add("animationPulsateSimple");
                $timeout(function(){
                    document.getElementById('deleteAccount').classList.remove("animationPulsateSimple");
                },2000);
                return;
            }

        };

        $scope.resetAccount = function() {
            localStorage.clear();
            location.reload();
        };

        $scope.determineIfToShowNotificationPanel = function(){
            // check if there is at least one notification with id>0 to display
            $scope.showNotifications = false;
            for (var i = 0; i < $scope.notifications.length; i++) {
                if ($scope.notifications[i].id!=0) {
                    $scope.showNotifications = true;
                    break;
                }
            }
        };

        // when user taps the delete button on a notification
        $scope.tapNotificationDelete = function($event, noti) {
            if ((typeof $event != "undefined") && ($event!=null)) $event.stopPropagation();

            document.getElementById('notification-'+noti.id).classList.add("animationFadeOut");
            if (noti.id<0) {
                $timeout(function(){
                    document.getElementById('notification-'+noti.id).classList.add("hide");
                    noti.id = 0;
                    $scope.determineIfToShowNotificationPanel();
                },1000);
                return;
            }
            ApiService.markNotificationAsRead( noti.id,
            function(){
                // WIN

                // set id = 0
                // --> not displaying it anymore
                $timeout(function(){
                    document.getElementById('notification-'+noti.id).classList.add("hide");
                    noti.id = 0;
                    $scope.determineIfToShowNotificationPanel();
                },200);

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

            // prevent double refresh clicks
            if ($scope.partyList.length>0) {
                var actualParty = $scope.partyList[$scope.actualPartyIndex].id;
                var actualTS = new Date().getTime();
                var diff = actualTS - $scope.lastPartyRefreshStart;
                if ((diff<2000) && (actualParty==$scope.lastPartyRefreshID)) {
                    console.log("no update - there needs to be a 2sec pause on update in same party");
                    return;
                }
                $scope.lastPartyRefreshID = actualParty;
                $scope.lastPartyRefreshStart = new Date().getTime();
            }

            focusPartyId = $rootScope.party.id;
            $scope.partyList = [];
            $scope.actualPartyIndex = 0;
            $scope.updatesOnParty = false;
            $log.info("TODO: Also UPDATE GPS coordinates later");
            $ionicScrollDelegate.scrollTop(true);
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

            // reset account on enter when flag is set
            if ($rootScope.resetAccount) {
                AppContext.setAccount({clientId:""});
                localStorage.clear();
            }

            $scope.userId = AppContext.getAccount().id;
            $scope.controllerInitDone = true;
            $scope.action();
        });

        // the OK button on the intro/welcome screen
        $scope.buttonIntroScreenOK = function() {
            var state = AppContext.getLocalState();
            state.introScreenShown = true;
            AppContext.setLocalState(state);
            $scope.state = "INIT";
            $scope.action();
        };

        // action to refresh dash data
        $scope.action = function() {

            // show loading spinner
            $scope.loadingParty = true;

            // reset party data in view
            $rootScope.party = { id:0 };
            $scope.requestsReview = [];
            $scope.requestsPosted = [];
            $scope.requestsInteraction = [];
            $scope.requestsOpen = [];
            $scope.requestsDone = [];
            $scope.notifications = [];

            // check if account init on startup is already done
            if (!AppContext.isReady()) {
                $timeout($scope.action, 300);
                return;
            }

            // display login on browsers
            if (($scope.state==="LOGIN_REGISTER") || ($scope.state==="LOGIN_LOGIN") || ($scope.state==="LOGIN_RECOVER")) return;
            alert(!AppContext.isRunningWithinApp());
            alert($rootScope.resetAccount);
            alert(AppContext.getAccount().clientId.length===0);
            if (((!AppContext.isRunningWithinApp() || ($rootScope.resetAccount))) && (AppContext.getAccount().clientId.length===0)) {
                $scope.state = "LOGIN_START";
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
                    ApiService.createAccount(null, null, AppContext.getAppLang(), function(account){
                        // WIN
                        account.spokenLangs = [AppContext.getAppLang()];
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
            } else {
                // check if account is still valid and if maybe server had reset
                if (!$scope.checkedAccount) {
                    ApiService.readAccount(AppContext.getAccount(), function(account){
                        // WIN
                        if ((account==null) || (account.id==0)) {
                            account.clientId = "";
                            AppContext.setAccount(account);
                            // TODO ionic optional dialog multi lang
                            alert("The server was reset - starting as a fresh user.");
                            $scope.resetAccount();
                            return;
                        } else {
                            // refreshing local account with account from server
                            $scope.checkedAccount = true;
                            AppContext.setAccount(account);
                            $timeout($scope.action, 5000);
                            return;
                        }
                    }, function() {
                        // FAIL
                        $log.info("FAIL - no account");
                        $scope.state = "INTERNETFAIL";
                        $timeout($scope.action, 5000);
                        return;
                    });
                    return;
                }
            }

            // make sure websocket is connected & listen on incoming
            WebSocketService.init();
            WebSocketService.receive("dash", function(message){
                console.log("GOT MESSAGE: "+JSON.stringify(message));
                if (message.command=="update-party") {
                    console.log("go update-party");
                    var data = JSON.parse(message.data);
                    var visiblePartyId = $scope.partyList[$scope.actualPartyIndex].id;
                    if (data.party==visiblePartyId) {
                        if ((data.state!="review") || ($scope.isReviewerForThisParty) || ($scope.isAdminForThisParty))
                        $timeout(function(){
                            if (typeof data.konfetti != "undefined") {
                                // check if konfetti amount is different
                                for (var i=0; i < $scope.requestsOpen.length; i++) {
                                    if (($scope.requestsOpen[i].id==data.request) && ($scope.requestsOpen[i].konfettiCount!=data.konfetti)) {
                                        $scope.updatesOnParty = true;
                                        break;
                                    }
                                }
                            } else {
                                $scope.updatesOnParty = true;
                            }
                        },10);
                    }
                    return;
                }
                if (message.command=="update-chat") {
                    var data = JSON.parse(message.data);
                    var visiblePartyId = $scope.partyList[$scope.actualPartyIndex].id;
                    // only when chat is on actual visible party
                    if (data.party==visiblePartyId) {
                        // only when user is party of chat
                        if (data.users.contains(AppContext.getAccount().id)) {
                            $timeout(function(){
                                $scope.updatesOnParty = true;
                            },10);
                        } else {
                            console.log("update-chat: on party but contains not user("+AppContext.getAccount().id+")");
                        }
                    } else {
                        console.log("update-chat: not on visible party("+visiblePartyId+")");
                    }
                    return;
                }

                console.log("Unkown WebSocket message with command("+message.command+")");
                return;
            });

            // check if GPS is available
            if ($scope.gps==='wait') {
                $scope.state = "GPSWAIT";
                $timeout($scope.action, 300);
                return;
            }

            // check if GPS is failed
            //$rootScope.gps = 'fail';
            if ($scope.gps==='fail') {
                $scope.state = "GPSFAIL";
                KonfettiToolbox.getFallbackLocationBySelection(function(lat, lon) {
                    // WIN
                    $scope.action();
                }, function() {
                    // FAIL
                    KonfettiToolbox.updateGPS();
                    $scope.action();
                });
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
                            if (typeof navigator.app != "undefined") navigator.app.exitApp();
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
            $rootScope.party.id = 0;
            ApiService.loadParty($scope.partyList[$scope.actualPartyIndex].id,function(data){
                $scope.isReviewerForThisParty = (AppContext.getAccount().reviewerOnParties.indexOf(data.id) > -1);
                $scope.isAdminForThisParty = (AppContext.getAccount().adminOnParties.indexOf(data.id) > -1);
                $rootScope.isAdminForThisParty = $scope.isAdminForThisParty;
                $rootScope.party = data;
                if ($scope.isAdminForThisParty || $scope.isReviewerForThisParty) $scope.requestsReview = KonfettiToolbox.filterRequestsByState(data.requests, 'review');
                $scope.requestsPosted = KonfettiToolbox.filterRequestsByAuthor(data.requests,AppContext.getAccount().id);
                $scope.requestsInteraction = KonfettiToolbox.filterRequestsByInteraction(data.requests,AppContext.getAccount().id);
                $scope.requestsOpen = KonfettiToolbox.filterRequestsByState(data.requests, 'open');
                $scope.requestsDone = KonfettiToolbox.filterRequestsByState(data.requests, 'done');
                $scope.notifications = data.notifications;
                $scope.notifications = $scope.notifications.concat($scope.globalNotifications);
                $scope.globalNotifications = [];
                $scope.loadingParty = false;
                $scope.sortRequests();
                $scope.state = "OK";
                $scope.updatesOnParty = false;
                $scope.showNotifications = ($scope.notifications.length>0);
                $rootScope.initDone = true;
            },function(code){
                // FAIL
                $scope.loadingParty = false;
                $scope.state = "INTERNETFAIL";
                $timeout($scope.action, 5000);
            });

        };
    });