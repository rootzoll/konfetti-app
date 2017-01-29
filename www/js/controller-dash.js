angular.module('starter.controller.dash', [])

.controller('DashCtrl', function(AppContext, $window, $rootScope, $scope, $translate, $timeout, $ionicPopup, $log, $state, $stateParams, $ionicScrollDelegate, ApiService, KonfettiToolbox, WebSocketService, $ionicLoading, RainAnimation, PopupDialogs, $cordovaDevice) {

        /*
         * get state parameter of controller
         */

        // set which party is in focus of dash screen
        $scope.focusPartyId = 0; // 0 = no focus
        if ((typeof $stateParams.id!="undefined") && ($stateParams.id!=0)) {
            $scope.focusPartyId = $stateParams.id;
        }

        $rootScope.resetAccount = false;
        
        /*
         * prepare local scope
         */

        $scope.state = "INIT";
        $scope.onView = false;

        $scope.userId = 0;
        $scope.loadingParty = true;
        $scope.switchParty = false;

        $scope.isReviewerForThisParty = false;
        $scope.isAdminForThisParty = false;

        $scope.partyList = [];
        $scope.actualPartyIndex = 0;

        $scope.gpsWaitCount = 0;

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
        $scope.continueFlag = false;

        $scope.checkedAccount = false;

        $scope.showLogOutOption = false;
        
        $scope.hasKonfettiToSpend = true;
        $scope.amountKonfettiToSpend = 0;
        $scope.sendKonfettiWhiteList = [];  

        $scope.dashPartypanelClass = "";

        // sorting options
        $scope.actualSorting = "POSTSORT_MOST"; // or "POSTSORT_NEW"

        $scope.login = {
            Email: "",
            Password: "",
            free: true
        };

        /*
         * controller logic
         */      

        $scope.checkEmail = function(email) {

            //console.log("checkEmail ",$scope.login);

            // as long as input field does not return a valid email
            if (typeof email == "undefined") {
                //console.log("email not valid --> not free");
                $scope.login.free = false;
                return;
            }

            ApiService.checkEMailIsFree(email, function(name, result){
                if ($scope.login.Email==name) {
                    // check that a dot is behind @
                    if (name) {
                        var atPos = name.indexOf('@');
                        var dotPos = name.indexOf('.',atPos);
                        if (dotPos<atPos) {
                            $scope.login.free = false;
                            return;
                        }
                    }
                    $scope.login.free = result;
                } else {
                    //console.log("input("+$scope.login.Email+") not anymore("+name+")");
                }

            });
        };

        // redeem button --> when konfetti on party is zero
        $scope.onButtonCoupon = function() {
            KonfettiToolbox.processCode(true, function(result){
                console.dir(result);
                if (result.actions.length>0) {
                    $scope.reloadPartyList();
                    PopupDialogs.showIonicAlertWith18nText('INFO','CODE_CORRECT',null);
                } else {
                    PopupDialogs.showIonicAlertWith18nText('INFO','CODE_WRONG',null);
                }
            });
        };
        
        $scope.getKonfetti = function() {
        	$scope.partyPopUp.close();
        	$scope.onButtonCoupon();
        };

        $scope.buttonLoginRegister = function() {
            $timeout(function(){
                $scope.login.Password = "";    
                $scope.state = "LOGIN_REGISTER";
            },10);
        };

        $scope.openChangeSortDialog = function() {
            if ($scope.actualSorting=="POSTSORT_MOST") {
                $scope.actualSorting="POSTSORT_NEW";
            } else {
                $scope.actualSorting="POSTSORT_MOST";
            }
            $scope.sortRequests();
        };
        
        $scope.tapOnPartyContact = function() {
        	if ($rootScope.party.contact.lastIndexOf('http', 0) === 0) {
               	// open link in browser
               	window.open($rootScope.party.contact, "_system");
            } else
            if ($rootScope.party.contact.lastIndexOf('mailto:', 0) === 0) {
            	// open email client
            	window.open($rootScope.party.contact, "_system");
            } else
            {
            	// assume its an email and open mail client
            	window.open("mailto:"+$rootScope.party.contact, "_system");
            }
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
                PopupDialogs.showIonicAlertWith18nText('INFO', 'EMAIL_VALID', null);
                $scope.login.Password = "";
                return;
            }
            if (typeof pass == "undefined") return;

            // password needs to be at least 8 chars long
            if (pass.length<8) {
                PopupDialogs.showIonicAlertWith18nText('INFO','PASSWORD_LENGTH',null);
                $scope.login.Password = "";
                return;
            }

            $ionicLoading.show({
                template: '<img src="img/spinner.gif" />'
            });
            ApiService.createFullAccount(mail, pass, AppContext.getAppLang(), function(account) {
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
                if ((typeof errorcode != "undefined") && (errorcode.status==400)) {
                    // email already in use
                    $scope.login.Password = "";
                    $scope.loginEmail = "";
                    PopupDialogs.showIonicAlertWith18nText('INFO', 'REGISTER_FAILMAIL', function(){
                        $scope.state = "LOGIN_START";
                    });
                } else {
                    PopupDialogs.showIonicAlertWith18nText('INFO', 'REGISTER_FAIL', function(){});
                    $scope.login.Password = "";
                }
            });
        };

        $scope.buttonLoginLogin = function() {
            $timeout(function(){
                $scope.login.Password = "";
                $scope.login.free = true; 
                $scope.state = "LOGIN_LOGIN";
            },10);
        };

        $scope.buttonLoginLoginFinal = function(mail,pass) {

            if (typeof mail == "undefined") {
                PopupDialogs.showIonicAlertWith18nText('INFO', 'EMAIL_VALID', null);
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
                var state = AppContext.getLocalState();
                state.introScreenShown = true;
                AppContext.setLocalState(state);
                $scope.login.Password = "";
                $rootScope.resetAccount = false;
                $scope.state = "INIT";
                $scope.action();
            }, function() {
                // FAIL
                $ionicLoading.hide();
                $scope.login.Password = "";
                PopupDialogs.showIonicAlertWith18nText('INFO', 'LOGIN_FAIL', function(){
                });
            });
        };

        $scope.buttonLoginRecover = function() {
            $scope.state = "LOGIN_RECOVER";
        };

        $scope.buttonLoginRecoverFinal = function(mail) {

            if (typeof mail == "undefined") {
                PopupDialogs.showIonicAlertWith18nText('INFO', 'EMAIL_VALID', null);
                return;
            }

            $ionicLoading.show({
                template: '<img src="img/spinner.gif" />'
            });
            ApiService.recoverPassword(mail, function() {
                // WIN
                $ionicLoading.hide();
                PopupDialogs.showIonicAlertWith18nText('INFO', 'RECOVER_WIN', function(){
                    $scope.state = "LOGIN_LOGIN";
                });
            }, function() {
                // FAIL
                $ionicLoading.hide();
                PopupDialogs.showIonicAlertWith18nText('INFO', 'RECOVER_FAIL', function(){
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
            if ($scope.actualSorting==='POSTSORT_NEW') sortFunction = sortFunctionNew;

            if ((typeof changedRequestId != "undefined") && ($scope.actualSorting!='POSTSORT_NEW')) {

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
            $scope.updateSortOptions();
            $scope.action();
        };

        // the previous party from list (closer)
        $scope.buttonPartyPrev = function() {

            if ($scope.actualPartyIndex==0) {
                $scope.dashPartypanelClass = "wiggle";
                $timeout(function(){
                    $scope.dashPartypanelClass = "";
                },700);
                return;
            }

            $scope.switchParty = true;
            $scope.dashPartypanelClass = "bounceOutRight";
            $timeout(function(){
                $scope.dashPartypanelClass = "";
                $scope.actualPartyIndex--;
                if ($scope.actualPartyIndex<0) $scope.actualPartyIndex = $scope.partyList.length-1;
                $scope.action(function(){
                    $scope.switchParty = false;
                    $scope.dashPartypanelClass = "bounceInLeft";
                    $timeout(function(){
                        $scope.dashPartypanelClass = "";
                    },700);
                });
            },700);
        };

        // next party in list (more far away)
        $scope.buttonPartyNext = function() {

            if ($scope.actualPartyIndex==($scope.partyList.length-1)) {
                $scope.dashPartypanelClass = "wiggle";
                $timeout(function(){
                    $scope.dashPartypanelClass = "";
                },700);
                return;
            }
        
            $scope.switchParty = true;
            $scope.dashPartypanelClass = "bounceOutLeft";
            $timeout(function(){
                $scope.dashPartypanelClass = "";
                $scope.actualPartyIndex++;
                if ($scope.actualPartyIndex>=$scope.partyList.length) $scope.actualPartyIndex = 0;
                $scope.action(function(){
                    $scope.switchParty = false;
                    $scope.dashPartypanelClass = "bounceInRight";
                    $timeout(function(){
                        $scope.dashPartypanelClass = "";
                    },700);
                });
            },700);
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

            // request now public --> go to request page
            if ((noti.type==2) || (noti.type=="REVIEW_OK")) {
                $state.go('tab.request-detail', {id: noti.ref, area: 'top'});
                return;
            }

            // request rejected --> go to request page
            if ((noti.type==4) || (noti.type=="REVIEW_FAIL")) {
                $state.go('tab.request-detail', {id: noti.ref, area: 'top'});
                return;
            }

            // new chat message --> go to request page - scroll down to chats
            if ((noti.type==5) || (noti.type=="CHAT_NEW")) {
                $state.go('tab.request-detail', {id: noti.ref, area: 'chats'});
                return;
            }

            // rewarded --> go to request page
            if ((noti.type==7) || (noti.type=="REWARD_GOT")) {
                $state.go('tab.request-detail', {id: noti.ref, area: 'top'});
                return;
            }

            // support done --> go to request page
            if ((noti.type==8) || (noti.type=="SUPPORT_WIN")) {
                $state.go('tab.request-detail', {id: noti.ref, area: 'top'});
                return;
            }

            // logout reminder --> flash option
            if ((noti.type==9) || (noti.type=="LOGOUT_REMINDER")) {
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

            // client generated notifications ... just dont show anymore
            if (noti.id<0) {
                $timeout(function(){
                    document.getElementById('notification-'+noti.id).classList.add("hide");
                    noti.id = 0;
                    $scope.determineIfToShowNotificationPanel();
                },1000);
                return;
            }

            // server generated notifications - mark as done
            $timeout(function(){
                    document.getElementById('notification-'+noti.id).classList.add("hide");
                    noti.id = 0; // not displaying anymore
                    $scope.determineIfToShowNotificationPanel();
            },200);
            ApiService.markNotificationAsRead( noti.id,
            function(){
                // WIN
            }, function(){
                // FAIL
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

            // check if user has konfetti at all
            if ((request.konfettiAdd===0) && ($rootScope.party.konfettiCount==0)) {
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

            // calc konfetti to add
            $rootScope.party.konfettiCount += request.konfettiAdd;
            if (request.konfettiAdd==0) {
                // start with 1 konfetti per tap
                request.konfettiAdd = 1;
            } else {
                // double on each tap ... 2, 4, 8, 16, ..
                request.konfettiAdd = request.konfettiAdd * 2;
            }
            $rootScope.party.konfettiCount -= request.konfettiAdd;
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
                    $scope.konfettiAddAmountPerTap = 0;
                    $scope.sortRequests(request.id);
                    try {
                    	RainAnimation.makeItRainKonfetti(2);
                    } catch (e) {
                        alert("konfetti animation failed: "+JSON.stringify(e));
                        console.dir(e);
                    }
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
                var actualParty = 0;
                if (typeof $scope.partyList[$scope.actualPartyIndex] != "undefined") {
                    actualParty = $scope.partyList[$scope.actualPartyIndex].id;
                } else {
                    actualParty = $rootScope.party.id;
                }
                var actualTS = new Date().getTime();
                var diff = actualTS - $scope.lastPartyRefreshStart;
                if ((diff<2000) && (actualParty==$scope.lastPartyRefreshID)) {
                    console.log("no update - there needs to be a 2sec pause on update in same party");
                    return;
                }
                $scope.lastPartyRefreshID = actualParty;
                $scope.lastPartyRefreshStart = new Date().getTime();
            }

            $scope.focusPartyId = $rootScope.party.id;
            $scope.partyList = [];
            $scope.actualPartyIndex = 0;
            $scope.updatesOnParty = false;
            $log.info("TODO: Also UPDATE GPS coordinates later");
            $ionicScrollDelegate.scrollTop(true);
            $scope.action();
        };

		// send confetti to an email address
		$scope.sendKonfetti = function() {
			$scope.partyPopUp.close();
			PopupDialogs.sendKonfetti($scope.party.id, $scope.party.sendKonfettiMaxAmount, $scope.party.sendKonfettiWhiteList);
		};

        // pop up with more info in party
        $scope.partyinfo_youhavekonfetti = "";
        $scope.partyinfo_youcanspendkonfetti = "";        
        $scope.showPartyInfo = function() {
          $translate("YOUHAVEKONFETTI").then(function (LINE1) {
          	$scope.partyinfo_youhavekonfetti = LINE1.replace("XXXX", $scope.party.konfettiCount);
            $translate("KONFETTISENDNOTICE").then(function (LINE2) {
            	$scope.partyinfo_youcanspendkonfetti = LINE2.replace("XXXX", $scope.amountKonfettiToSpend); 
                $translate("PARTYINFO_SUB").then(function (SUB) {
                    $scope.partyPopUp = $ionicPopup.show({
                    	cssClass: 'bigPopup',
                        templateUrl: 'templates/pop-partyinfo.html',
                        title: $scope.party.name,
                        subTitle: SUB,
                        scope: $scope,
                        buttons: [
                            { text: '<i class="icon ion-ios-close-outline"></i>' }
                        ]
                    });
                    // on close
                    $scope.partyPopUp.then(function(res) {});
                });
            });
          });
        };

        // should reload/load party list and focus the party with the given id
        $scope.loadPartiesAndFocus = function(partyId) {
            $scope.focusPartyId = partyId;
            if ($scope.state=="INTRO") $scope.buttonIntroScreenOK();
        };

        // event when user is (re-)entering the view
        $scope.$on('$ionicView.enter', function(e) {

            $scope.onView = true;

            // reset account on enter when flag is set
            if ($rootScope.resetAccount) {
                AppContext.setAccount({clientId:""});
                localStorage.clear();
            }

            $scope.userId = AppContext.getAccount().id;
            $scope.controllerInitDone = true;
            $scope.action();
        });

        // event when user is leaving the view
        $scope.$on('$ionicView.leave', function(e) {
            $scope.onView = false;
        });

        // event when app comes back from background
        $scope.$on('cordova-resume', function(e) {
            if ($scope.onView) $timeout($scope.action(),10);
        });

        // the OK button on the intro/welcome screen
        $scope.buttonIntroScreenOK = function() {
            KonfettiToolbox.updateGPS();
            var state = AppContext.getLocalState();
            state.introScreenShown = true;
            AppContext.setLocalState(state);
            $scope.state = "INIT";
            $scope.action();
        };

        // the REDEEM COUPON button on the intro/welcome screen
        $scope.buttonIntroScreenCoupon = function() {
            KonfettiToolbox.processCode(true, function(result){
                //console.log("RESULT CODES");
                //console.dir(result.actions);
                if (result.actions.length>0) {
                    // code worked
                    PopupDialogs.showIonicAlertWith18nText('WELCOME_PARTY', 'CODE_CORRECT', function(){
                        KonfettiToolbox.processCouponActions(result.actions, $scope, function(){
                            $scope.buttonIntroScreenOK();
                        });
                    });
                } else {
                    // code wrong
                    PopupDialogs.showIonicAlertWith18nText('REDEEMCOUPON', 'CODE_WRONG', function(){
                    });
                }
            });
        };

        // action to refresh dash data
        $scope.action = function(whenReadyCallback) {        	

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

            //alert("Account("+JSON.stringify(AppContext.getAccount())+")");

            // display login on browsers
            if (($scope.state==="LOGIN_REGISTER") || ($scope.state==="LOGIN_LOGIN") || ($scope.state==="LOGIN_RECOVER")) return;
            if (((!AppContext.isRunningWithinApp() || ($rootScope.resetAccount))) && (!AppContext.getAccount().clientId || (AppContext.getAccount().clientId.length===0))) {
            	$scope.state = "LOGIN_START";
                return;
            }
            
            // check if got client account
            if (AppContext.getAccount().clientId.length===0) {
                if ($scope.state != "ACCOUNTWAIT") {
                    $scope.state = "ACCOUNTWAIT";
                    ApiService.createGuestAccount(AppContext.getAppLang(), function(account){
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
                            PopupDialogs.showIonicAlertWith18nText('TITLE_IMPORTANT', 'RESETTING_SERVER', function(){
                            	$scope.resetAccount();
                            });
                            return;
                        } else {
                            // refreshing local account with account from server
                            $scope.checkedAccount = true;
                            AppContext.setAccount(account);
                            $timeout($scope.action, 1000);
                            $rootScope.$broadcast('account-ready');
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
                } else {
                	console.log("OK  scope.checkedAccount == true");
                }
            }

            $scope.showLogOutOption = !AppContext.isRunningWithinApp();

            // display intro message
            if (!AppContext.getLocalState().introScreenShown) {
                $scope.state = "INTRO";
                // show intro part of view
                // --> button press AppContext.getLocalState.introScreenShown = true
                RainAnimation.makeItRainKonfetti(1.5);
                $scope.continueFlag = false;
                $timeout(function() {
                	$scope.continueFlag = true;
                },3000);
                return;
            }

            if ($scope.state == "INTRO") {
                console.log("wait for intro to finsh");
                $timeout(function() {
                	$scope.action();
                },1000);
                return;
            }

            // make sure websocket is connected & listen on incoming
            try {
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
            } catch (e) {
                console.error("Websockets init failed: "+JSON.stringify(e));
            }

            // check if GPS is available
            if ($rootScope.gps==='wait') {

                if ($scope.state != "INTRO") $scope.gpsWaitCount++;

                if ($scope.gpsWaitCount>20) {
                    $rootScope.gps='fail';
                    $scope.gpsWaitCount = 0;
                } else {
                    $scope.state = "GPSWAIT";
                    $timeout($scope.action, 300);
                    return;
                }
            }

            // check if GPS is failed
            if ($rootScope.gps==='fail') {

                $scope.state = "GPSFAIL";
                
                PopupDialogs.locationPicker($scope, function(result){
                    // WIN

                    // when CANCEL was pressed
                    if (result.cancel) {
                        KonfettiToolbox.updateGPS();
                        $timeout(function(){
                            $scope.action();
                        }, 5000);
                        return;
                    }

                    // on normal result
                    $rootScope.lat = result.lat;
                    $rootScope.lon = result.lon;
                    $rootScope.gps = 'win';
                    $scope.action();

                }, function(error) {
                    alert("ERROR on initial LocationPicker: "+JSON.stringify(e));
                }, {
                i18nHeadline: "GPSFALLBACK_TITLE",
                i18nSubline: "GPSFALLBACK_SUB2",
                i18nMarker: "GPSFALLBACK_MARKER",
                i18nCancel: "GPSFALLBACK_GPS",
                inputComment: false,
                startLat: 52.522011,
                startLon: 13.412772,
                startZoom: 9
            });

                return;
            }

            if ($scope.state === "PUSHWAIT") {
                $timeout($scope.action, 300);
                return;
            }

            // check if pushID needs to be updates on user account
            var localPushIds = AppContext.getLocalState().pushIDs;
            if ((typeof localPushIds != "undefined") && (localPushIds!=null)) {

                //alert("GOT LOCAL PUSH - CHECK ACCOUNT");

                var accountPushId = AppContext.getAccount().pushID;
                if ((typeof accountPushId == "undefined") || (accountPushId!=localPushIds.userId)) {

                    //alert("UPDATE PUSH: "+localPushIds.userId);

                    // update PUSHID local
                    var account = AppContext.getAccount();
                    account.pushActive = true;
                    account.pushSystem = AppContext.getRunningOS();
                    account.pushID = localPushIds.userId;
                    AppContext.setAccount(account);

                    // update Account on server
                    ApiService.updateAccount(account, function(){
                        // WIN
                        //alert("WIN PUSH");
                        $scope.state = "PUSHOK";
                        $scope.action();
                    }, function(){
                        // FAIL
                        //alert("FAIL PUSH");
                        $scope.state = "PUSHOK";
                        $scope.action();
                    });
                    $scope.state = "PUSHWAIT";
                    return;
                } else {
                    //alert("PUSH IS UP TO DATE");
                }
            } else {
                //alert("NO LOCAL PUSH DATA");
            }

            // load party list (just once when app starts)
            if ($scope.partyList.length===0) {
                if ($scope.state!="PARTYLISTWAIT") {
                    $scope.state = "PARTYLISTWAIT";
                    ApiService.loadPartylist($rootScope.lat, $rootScope.lon, function(list) {
                        // WIN;
                        $scope.partyList = list;
                        if ($scope.partyList.length==0) {
                            PopupDialogs.errorDialog($scope, "controller-dash-1");
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

            // check if $scope.focusPartyId is in partylist
            var isFocusPartyInList = -1;
            for (var i=0; i<$scope.partyList.length; i++) {
                if ($scope.partyList[i].id == $scope.focusPartyId) isFocusPartyInList=i;
            }
            if ($scope.focusPartyId>0) {
                if (isFocusPartyInList===-1) {
                    // add to list
                    var partyObject = {
                        id: $scope.focusPartyId,
                        lat: 0,
                        lon: 0,
                        meter: 0,
                        new: 1
                    };
                    $scope.partyList.unshift(partyObject);
                }
                // set focus index
                $scope.actualPartyIndex = isFocusPartyInList;
                $scope.focusPartyId = 0;
            }

            // make API call to load party data
            $scope.state = "PARTYWAIT";

            $rootScope.party.id = 0;

            // set partyid to load ... if $rootScope.focusPartyId is set force this one
            var partyToLoad = 0;
            if (typeof $scope.partyList[$scope.actualPartyIndex] != "undefined") {
                partyToLoad = $scope.partyList[$scope.actualPartyIndex].id;
            }
            if ($rootScope.focusPartyId > 0) {

                partyToLoad = $rootScope.focusPartyId;

                // set the correct actualPartyIndex (if available)          
                $scope.actualPartyIndex = 0;
                for (var i=0; i<$scope.partyList.length; i++) {
                    if ($scope.partyList[i].id == $rootScope.focusPartyId) {
                        $scope.actualPartyIndex=i;
                        break;
                    }
                }
                $rootScope.focusPartyId = 0;
            }


            ApiService.loadParty(partyToLoad,function(data){
                $scope.isReviewerForThisParty = (AppContext.getAccount().reviewerOnParties.indexOf(data.id) > -1);
                $scope.isAdminForThisParty = (AppContext.getAccount().adminOnParties.indexOf(data.id) > -1);
                $rootScope.isAdminForThisParty = $scope.isAdminForThisParty;
                $rootScope.party = data;
                if ($scope.isAdminForThisParty || $scope.isReviewerForThisParty) $scope.requestsReview = KonfettiToolbox.filterRequestsByState(data.requests, 'STATE_REVIEW');
                $scope.requestsPosted = KonfettiToolbox.filterRequestsByAuthor(data.requests,AppContext.getAccount().id);
                $scope.requestsInteraction = KonfettiToolbox.filterRequestsByInteraction(data.requests,AppContext.getAccount().id);
                $scope.requestsOpen = KonfettiToolbox.filterRequestsByState(data.requests, 'STATE_OPEN');
                $scope.requestsDone = KonfettiToolbox.filterRequestsByState(data.requests, 'STATE_DONE');
                $scope.notifications = data.notifications;
                $scope.notifications = $scope.notifications.concat($scope.globalNotifications);
                $scope.globalNotifications = [];
                $scope.sortRequests();
                $scope.state = "OK";
                $scope.updatesOnParty = false;
                $scope.showNotifications = ($scope.notifications.length>0);
                $rootScope.initDone = true;

                // remember as last focused party
                var localState = AppContext.getLocalState();
                localState.lastFocusedPartyID = partyToLoad;
                AppContext.setLocalState(localState);

                // spendable konfetti
                $scope.hasKonfettiToSpend =  false;
        		$scope.amountKonfettiToSpend = 0;    
        		$scope.sendKonfettiWhiteList = [];                   
                if (typeof data.sendKonfettiMode != "undefined") {
                	
        			if (data.sendKonfettiMode!="SENDKONFETTIMODE_DISABLED") {
                		$scope.hasKonfettiToSpend =  true;
        				$scope.amountKonfettiToSpend = data.sendKonfettiMaxAmount;
        				$scope.sendKonfettiWhiteList = data.sendKonfettiWhiteList;
        			}
        			
                } else {
                	console.log("MISSING sendKonfettiMode on party data");
         		}
                
                // rain konfetti if there is a konfetti reward notification
                try {
                	if ((typeof data.notifications != "undefined") && (data.notifications.length > 0)) {
                		for (var n=0; n<data.notifications.length; n++) {
                			if ((typeof data.notifications[n] != "undefined") && (data.notifications[n].type==7)) {
                				RainAnimation.makeItRainKonfetti(2);
                			}
                		}
                	}
                } catch (e) {
                	alert("FAIL on checking for reward notification");
                }

                // delay a bit so that UI can build up with data
                if (typeof whenReadyCallback == "undefined") {
                    $timeout(function() {
                        $scope.loadingParty = false;
                    },800);
                } else {
                   $scope.loadingParty = false;
                   whenReadyCallback(); 
                }
                
            },function(code){
                // FAIL
                $scope.loadingParty = false;
                $scope.state = "INTERNETFAIL";
                $timeout($scope.action, 5000);
            });

        };
    });