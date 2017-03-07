angular.module('starter.controller.dash', [])

.controller('DashCtrl', function(AppContext, $window, $rootScope, $scope, $translate, $timeout, $ionicPopup, $log, $state, $stateParams, $ionicScrollDelegate, ApiService, KonfettiToolbox, WebSocketService, $ionicLoading, RainAnimation, PopupDialogs, $cordovaDevice, $ionicHistory, $ionicPlatform, $ionicSideMenuDelegate, $ionicViewSwitcher, $cordovaGeolocation) {

        /*
         * get state parameter of controller
         */

        // set which party is in focus of dash screen
        $scope.focusPartyId = 0; // 0 = no focus
        if ((typeof $stateParams.id!="undefined") && ($stateParams.id!=0)) {
            $scope.focusPartyId = $stateParams.id;
        }

        /*
         * prepare local scope
         */

        console.log("prepare local scope");
        $scope.state = "INIT";
        $scope.onView = false;

        $scope.userId = 0;
        $scope.loadingParty = true;
        $scope.switchParty = false;

        $scope.isReviewerForThisParty = false;
        $scope.isAdminForThisParty = false;

        $rootScope.partyList = [];
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

        $ionicPlatform.registerBackButtonAction(function () {
            $ionicSideMenuDelegate.toggleLeft();
        }, 100);

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

        $scope.nopartyLogout = function() {
            if (!AppContext.isRunningWithinApp()) {
                $rootScope.resetAccount();
            } else {
                ionic.Platform.exitApp();
            }
        };

        $scope.nopartyOpenHomepage = function() {
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

        /* example for manually adding a notification
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
        */

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
                AppContext.setAccount(account,'controller-dash buttonLoginRegisterFinal');
                $scope.login.Password = "";
                console.log("Full account created");
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
                AppContext.setAccount(account,'controller-dash buttonLoginLoginFinal');
                var state = AppContext.getLocalState();
                state.introScreenShown = true;
                AppContext.setLocalState(state);
                $scope.login.Password = "";
                console.log("Login OK");
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

            if ((typeof mail == "undefined") || (mail==null) || (mail.trim().length==0)) {
                PopupDialogs.showIonicAlertWith18nText('INFO', 'EMAIL_VALID', null);
                return;
            }

            mail = mail.trim();

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

        $rootScope.updatePartyIndex = function(index) {

          if (index < 0 || index > $rootScope.partyList.length) {
            throw "IndexOutOfBounds (" + index + ")";
          }

          $scope.focusPartyId = 0;
          $scope.switchParty = true;
          $scope.actualPartyIndex = index;

          $scope.action(function() {
            $scope.switchParty = false;
          });

        }

        // back to login start, when on register, login or recover screen
        $scope.loginBack = function() {
            $scope.state = "LOGIN_START";
        };

        // when user wants to create a new request
        $scope.onNewRequest = function() {

            // check if user hast enough konfetti to start new task
            console.dir($scope.party);
            if ($scope.party.newRequestMinKonfetti>$scope.party.konfettiCount) {
                PopupDialogs.showIonicAlertWith18nText("IMPORTANT", "LOWKONFETTI", null);
                return;
            }

            $state.go('request-detail', {id: 0, area: 'top'});
        };

        // when user taps a notification
        $scope.tapNotificationMore = function($event, noti) {

            // request now public --> go to request page
            if ((noti.type==2) || (noti.type=="REVIEW_OK")) {
                //$state.go('request-detail', {id: noti.ref, area: 'top'});
                return;
            }

            // request rejected --> go to request page
            if ((noti.type==4) || (noti.type=="REVIEW_FAIL")) {
                //$state.go('request-detail', {id: noti.ref, area: 'top'});
                return;
            }

            // new chat message --> jump to chat view
            if ((noti.type==5) || (noti.type=="CHAT_NEW")) {
                $ionicViewSwitcher.nextDirection('forward');
                $state.go('chat',{id: noti.ref}); 
                return;
            }

            // rewarded --> go to request page
            if ((noti.type==7) || (noti.type=="REWARD_GOT")) {
                //$state.go('request-detail', {id: noti.ref, area: 'top'});
                return;
            }

            // support done --> go to request page
            if ((noti.type==8) || (noti.type=="SUPPORT_WIN")) {
                //$state.go('request-detail', {id: noti.ref, area: 'top'});
                return;
            }

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
            $state.go('request-detail', {id: request.id, area: 'top'});
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
                request.konfettiAdd = request.konfettiAdd +1;
                // double on each tap ... 2, 4, 8, 16, ..
                //request.konfettiAdd = request.konfettiAdd * 2;
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
            $rootScope.partyList = [];
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
                $translate("OK").then(function (OK) {
                    $scope.partyPopUp = $ionicPopup.show({
                    	cssClass: 'bigPopup',
                        templateUrl: 'templates/pop-partyinfo.html',
                        title: $scope.party.name,
                        scope: $scope,
                        buttons: [
                            { text: OK }
                        ]
                    });
                    // on close
                    $scope.partyPopUp.then(function(res) {});
                });
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

            $rootScope.topbarShowSetting = true;

            $ionicHistory.clearHistory();
            $ionicHistory.clearCache();

            $ionicHistory.nextViewOptions({
                disableBack: true
            });

            $scope.onView = true;
            $scope.userId = AppContext.getAccount().id;
            
            $scope.controllerInitDone = false;
            $scope.action();

        });

        // event when user is leaving the view
        $scope.$on('$ionicView.leave', function(e) {
            $rootScope.topbarShowSetting = false;
            $scope.onView = false;
            $scope.loadingParty = true;
        });

        // when outside event says to reload party
        $scope.$on('dash-reloadparty', function(e) {
            if ($scope.onView) $scope.reloadPartyList();
        });

        // event when app comes back from background
        $scope.$on('cordova-resume', function(e) {
            if ($scope.onView) $timeout($scope.action(),10);
        });

        $scope.$on('dash-reloadgroups',function(e) {
            $scope.triggerGPSPlugin();
            $scope.loadingParty = true;
            $timeout(function(){
                $scope.reloadPartyList();
            },6000);
        });

        // the OK button on the intro/welcome screen
        $scope.buttonIntroScreenOK = function() {

            // mark introscreen as shown
            var state = AppContext.getLocalState();
            state.introScreenShown = true;
            AppContext.setLocalState(state);

            // change state
            console.log("Intro OK Button");
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

        /*
         *  try go get GPS upadted from plugin on mobile
         */
        $scope.triggerGPSPlugin = function() {

               /*
               if (!AppContext.isRunningWithinApp()) {
                   console.log("Skipping GeoLocation Plugin on Browser ...");
                   $scope.gpsWaitCount = 100;
                   return;
               }
               */

               /*
                * START GEOLOCATION
                * http://ngcordova.com/docs/plugins/geolocation/
                */
               var posOptions = {timeout: 14000, enableHighAccuracy: false};
               $cordovaGeolocation
                   .getCurrentPosition(posOptions)
                   .then(function (position) {

                       /*
                        * Got Real GPS
                        */

                       $rootScope.lat  = position.coords.latitude;
                       $rootScope.lon = position.coords.longitude;
                       var newPosition = {
                           ts: Date.now(),
                           lat: position.coords.latitude,
                           lon: position.coords.longitude
                       };
                       var localState = AppContext.getLocalState();
                       localState.lastPosition = newPosition;
                       AppContext.setLocalState(localState);
                       $log.info("Got GPS data --> lat("+$rootScope.lat+") long("+$rootScope.lon+")");
                       if ($scope.state=="GPSWAIT") $scope.state = "INIT";

                   }, function(err) {

                       /*
                        * No LIVE GPS
                        */

                        // trigger fallback
                        console.log("Was not able to get GOPS data ... trigger fallback");
                        $scope.gpsWaitCount = 100;

                   });
        };

        // action to refresh dash data
        // TODO should allow reloading party data without entire screen
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

            // on browser if account not set - show login
            if ((!AppContext.isRunningWithinApp()) || ( window.localStorage.getItem("forcelogin")=="true")) {
                var account = AppContext.getAccount();
                if (!account.id || (account.id.length===0)) {
            	    $scope.state = "LOGIN_START";
                    return;
                }
            }

            // check if got client account
            if (AppContext.getAccount().clientId.length===0) {
                if ($scope.state != "ACCOUNTWAIT") {
                    $scope.state = "ACCOUNTWAIT";
                    ApiService.createGuestAccount(AppContext.getAppLang(), function(account){
                        // WIN
                        account.spokenLangs = [AppContext.getAppLang()];
                        AppContext.setAccount(account,'controller-dash action1');
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
                            AppContext.setAccount(account,'controller-dash action2');
                            PopupDialogs.showIonicAlertWith18nText('TITLE_IMPORTANT', 'RESETTING_SERVER', function(){
                            	$rootScope.resetAccount();
                            });
                            return;
                        } else {
                            // refreshing local account with account from server
                            $scope.checkedAccount = true;
                            console.log("account from server");
                            AppContext.setAccount(account,'controller-dash action3');
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

            try {
                window.localStorage.removeItem("forcelogin");
            } catch (e) {}

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
            /* --> DEAKCTIVATED FOR NOW
            try {
            WebSocketService.init();
            WebSocketService.receive("dash", function(message){
                console.log("GOT MESSAGE: "+JSON.stringify(message));
                if (message.command=="update-party") {
                    console.log("go update-party");
                    var data = JSON.parse(message.data);
                    var visiblePartyId = $rootScope.partyList[$scope.actualPartyIndex].id;
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
                    var visiblePartyId = $rootScope.partyList[$scope.actualPartyIndex].id;
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
            */


            if ($scope.state=="GPSWAIT") {

                // show Location picker on browser or as fallback on mobile after waiting
                if ($scope.gpsWaitCount>20) {
                    $scope.gpsWaitCount = 0;
                    PopupDialogs.locationPicker($scope, function(result){
  
                        // when CANCEL was pressed
                        if (result.cancel) {
                            $scope.triggerGPSPlugin();
                            $scope.action();
                            return;
                        }

                        // on normal result (Location from map)
                        $rootScope.lat = result.lat;
                        $rootScope.lon = result.lon;

                        // storing as last position
                        var newPosition = {
                            ts: Date.now(),
                            lat: $rootScope.lat,
                            lon: $rootScope.lon
                        };
                        var localState = AppContext.getLocalState();
                        localState.lastPosition = newPosition;
                        AppContext.setLocalState(localState);

                        // leave GPSWAIT state
                        console.log("Got GPS from LocationPicker");
                        $scope.state = "INIT";
                        $scope.action();

                    }, function(error) {
                        alert("ERROR on initial LocationPicker: "+JSON.stringify(e));
                        $scope.action();
                    }, {
                        i18nHeadline: "GPSFALLBACK_TITLE",
                        i18nSubline: "GPSFALLBACK_SUB2",
                        i18nMarker: "GPSFALLBACK_MARKER",
                        i18nCancel: "GPSFALLBACK_GPS",
                        inputComment: true,
                        startLat: 52.522011,
                        startLon: 13.412772,
                        startZoom: 9
                    });
                    return;
                }

                // count up on GPS waiting (waiting for GPS from GPS plugin)
                console.log("GPS WAIT ("+$scope.gpsWaitCount+")");
                $scope.gpsWaitCount++
                $timeout(function() {
                	$scope.action();
                },1000);
                return;

            } else {

              console.log("STATE("+$scope.state+")");

              if (($rootScope.lat==null) || ($rootScope.lon==null)) {

                // check if GPS can be reconstructed from last position
                var localState = AppContext.getLocalState();
                if ((typeof localState != "undefined") && (localState!=null) 
                 && (typeof localState.lastPosition!= "undefined") && (localState.lastPosition!=null)) {

                    $rootScope.lat  = localState.lastPosition.lat;
                    $rootScope.lon  = localState.lastPosition.lon;       
                    console.log("Got LAST GPS position lat("+$rootScope.lat+") lon("+$rootScope.lon+")");

                } else {

                    console.log("No LAST GPS position found.");

                    // check if user account is already active on parties
                    var account = AppContext.getAccount();
                    if (account.activeOnParties.length>0) {
                        console.log("User is already active on at least in group - no need for GPS");
                        $rootScope.lat  = 0;
                        $rootScope.lon  = 0;
                    } else {
                        console.log("GPS needed - still a fresh user");
                        $scope.state="GPSWAIT";
                        $scope.gpsWaitCount = 0;
                        $scope.triggerGPSPlugin();
                        $scope.action();
                        return;
                    }
                }
              }

            }

            console.log("WORK WITH GPS lat("+$rootScope.lat+") lon("+$rootScope.lon+") count("+$scope.gpsWaitCount+")");

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
                    AppContext.setAccount(account,'controller-dash action4');

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
            if ($rootScope.partyList.length===0) {
                if ($scope.state!="PARTYLISTWAIT") {
                    $scope.state = "PARTYLISTWAIT";
                    ApiService.loadPartylist($rootScope.lat, $rootScope.lon, function(list) {
                        // WIN
                        if (list.length==0) {
                            console.log("No Parties found.");
                            $scope.state = "NOPARTIES";
                            $scope.loadingParty = false;
                        } else {
                            $rootScope.partyList = list;

                            // if GPS is still not set - try to get from party
                            if (($rootScope.lat==0) && ($rootScope.lon==0)) {
                                console.log("Getting GPS from party list");
                                for (var k=0; k<$rootScope.partyList.length; k++) {
                                    if (typeof $rootScope.partyList[k].lat == "undefined") continue;
                                    if (typeof $rootScope.partyList[k].lon == "undefined") continue;
                                    if ($rootScope.partyList[k].lat == null) continue;
                                    if ($rootScope.partyList[k].lon == null) continue;
                                    if (($rootScope.partyList[k].lat == 0) && ($rootScope.partyList[k].lon == 0)) continue;
                                    $rootScope.lat = $rootScope.partyList[k].lat;
                                    $rootScope.lon = $rootScope.partyList[k].lon;
                                    console.log("GOT GPS FROM PARTY LIST: lat("+$rootScope.lat+") lon("+$rootScope.lon+")");
                                    // storing as last position
                                    var newPosition = {
                                        ts: Date.now(),
                                        lat: $rootScope.lat,
                                        lon: $rootScope.lon
                                    };
                                    var localState = AppContext.getLocalState();
                                    localState.lastPosition = newPosition;
                                    AppContext.setLocalState(localState);
                                    break;
                                }
                            }
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
            for (var i=0; i<$rootScope.partyList.length; i++) {
                if ($rootScope.partyList[i].id == $scope.focusPartyId) isFocusPartyInList=i;
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
                    $rootScope.partyList.unshift(partyObject);
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

                $scope.requestsReview = [];
                $scope.requestsPosted = [];
                $scope.requestsInteraction = [];
                $scope.requestsOpen = [];
                $scope.requestsDone = [];
                $scope.notifications = [];

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

                 $scope.$broadcast('scroll.refreshComplete');

            },function(code){
                // FAIL
                $scope.$broadcast('scroll.refreshComplete');
                $scope.loadingParty = false;
                $scope.state = "INTERNETFAIL";
                $timeout($scope.action, 5000);
            });

        };
    });
