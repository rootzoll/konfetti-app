angular.module('starter.konfettitoolbox', [])
.factory('KonfettiToolbox', function($rootScope, $log, $ionicPopup, $translate, $ionicLoading, $state, AppContext, ApiService, $cordovaGeolocation) {

        var methodShowIonicAlertWith18nText = function(i18nKeyTitle, i18nKeyText, win) {
            $translate(i18nKeyTitle).then(function (TITLE) {
                $translate(i18nKeyText).then(function (TEXT) {
                    $ionicPopup.alert({
                        title: TITLE,
                        template: TEXT
                    }).then(function(res) {
                        if ((typeof win != "undefined") && (win!=null)) win();
                    });
                });
            });
        };

        var methodGetFallbackLocationBySelection = function(win, fail) {
            $translate("GPSFALLBACK_TITLE").then(function (TITLE) {
                $translate("GPSFALLBACK_SUB").then(function (SUB) {
                    $translate("GPSFALLBACK_GPS").then(function (GPS) {
                        $translate("OK").then(function (OK) {
                            $rootScope.popScope = {
                                zipCode: "",
                                country: "germany"
                            };
                            $ionicPopup.show({
                                templateUrl: './templates/pop-GpsFallback.html',
                                title: TITLE,
                                subTitle: SUB,
                                scope: $rootScope,
                                buttons: [
                                    {
                                        text: GPS,
                                        onTap: function (e) {
                                            fail();
                                        }
                                    },
                                    {
                                        text: OK,
                                        type: 'button-positive',
                                        onTap: function (e) {
                                            if (($rootScope.popScope.zipCode.trim().length == 0) && (ApiService.runningDevelopmentEnv())) {

                                                // WORK WITH FAKE TEST DATA ON DEVELOPMENT
                                                $rootScope.lat = 52.52;
                                                $rootScope.lon = 13.13;
                                                $rootScope.gps = 'win';
                                                win($rootScope.lat, $rootScope.lon);

                                            } else {

                                                // TRY TO RESOLVE ZIP CODE TO GPS
                                                if ($rootScope.popScope.zipCode.trim().length > 2) {
                                                    $rootScope.popScope.zipCode = $rootScope.popScope.zipCode.trim();
                                                    ApiService.getGPSfromZIP($rootScope.popScope.zipCode, $rootScope.popScope.country, function (lat, lon) {
                                                        // WIN
                                                        $rootScope.lat = lat;
                                                        $rootScope.lon = lon;
                                                        $rootScope.gps = 'win';
                                                        var newPosition = {
                                                            ts: Date.now(),
                                                            lat: lat,
                                                            lon: lon
                                                        };
                                                        var localState = AppContext.getLocalState();
                                                        localState.lastPosition = newPosition;
                                                        AppContext.setLocalState(localState);
                                                        win(lat, lon);
                                                    }, function () {
                                                        // FAIL
                                                        methodShowIonicAlertWith18nText('INFO', 'GPSFALLBACK_FAIL', function () {
                                                            methodGetFallbackLocationBySelection(win, fail);
                                                        });
                                                    });
                                                } else {
                                                    // ON EMPTY INPUT
                                                    methodShowIonicAlertWith18nText('INFO', 'GPSFALLBACK_NEEDED', function () {
                                                        methodGetFallbackLocationBySelection(win, fail);
                                                    });
                                                }
                                            }

                                        }
                                    }
                                ]
                            });
                        });
                    });
                });
            });
        };

        return {
            filterRequestsByState: function(requestArray, state) {
                var resultArray = [];
                for (var i = 0; i < requestArray.length; i++) {
                    if (requestArray[i].state===state) resultArray.push(requestArray[i]);
                }
                return resultArray;
            },
            filterRequestsByAuthor: function(requestArray, authorUserId) {
                var resultArray = [];
                for (var i = 0; i < requestArray.length; i++) {
                    if (requestArray[i].userId===authorUserId) resultArray.push(requestArray[i]);
                }
                return resultArray;
            },
            filterRequestsByInteraction: function(requestArray, userId) {
                var resultArray = [];
                for (var i = 0; i < requestArray.length; i++) {
                    // ignore if user is author of request
                    if (requestArray[i].userId===userId) continue;
                    // use if there is a chat on request
                    // server should just deliver chats if related to requesting user
                    if (requestArray[i].chats.length>0) resultArray.push(requestArray[i]);
                }
                return resultArray;
            },
            showIonicAlertWith18nText: function(i18nKeyTitle, i18nKeyText, win) {
                methodShowIonicAlertWith18nText(i18nKeyTitle, i18nKeyText, win);
            },
           getFallbackLocationBySelection : function(win, fail) {
               methodGetFallbackLocationBySelection(win, fail);
           },
           updateGPS : function() {
               /*
                * START GEOLOCATION
                * http://ngcordova.com/docs/plugins/geolocation/
                */
               var posOptions = {timeout: 14000, enableHighAccuracy: false};
               if (ApiService.runningDevelopmentEnv()) posOptions.timeout = 1000;
               $rootScope.gps  = 'wait';
               $rootScope.lat  = 0;
               $rootScope.lon = 0;
               $cordovaGeolocation
                   .getCurrentPosition(posOptions)
                   .then(function (position) {

                       /*
                        * Got Real GPS
                        */

                       $rootScope.lat  = position.coords.latitude;
                       $rootScope.lon = position.coords.longitude;
                       $rootScope.gps  = 'win';
                       var newPosition = {
                           ts: Date.now(),
                           lat: position.coords.latitude,
                           lon: position.coords.longitude
                       };
                       var localState = AppContext.getLocalState();
                       localState.lastPosition = newPosition;
                       AppContext.setLocalState(localState);
                       $log.info("lat("+$rootScope.lat+") long("+$rootScope.lon+")");


                   }, function(err) {

                       /*
                        * No LIVE GPS
                        */

                       // no live GPS - try to use last one
                       var localState = AppContext.getLocalState();
                       if ((localState.lastPosition!=null) && (typeof localState.lastPosition.ts != "undefined")) {
                           $log.info("no live GPS ... using last position lat("+localState.lastPosition.lat+") lon("+localState.lastPosition.lon+")");
                           $rootScope.lat  = localState.lastPosition.lat;
                           $rootScope.lon = localState.lastPosition.lon;
                           $rootScope.gps  = 'win';
                       } else {

                           if (!ApiService.runningDevelopmentEnv()) {

                               $log.info("GPS ERROR");
                               $rootScope.gps  = 'fail';

                           } else {

                               $rootScope.lat  = 52.5;
                               $rootScope.lon = 13.5;
                               $rootScope.gps  = 'win';
                               console.log("DEV Use Fake-GPS ...");

                           }

                       }

                   });
           },
           processCode : function(isRedeemCouponBool) {

               var processRedeemActions = function(actionArray) {

                   if (typeof actionArray=="undefined") {
                       console.warn("processRedeemActions: actionArray undefined - skip");
                       return;
                   }
                   for (var i = 0; i < actionArray.length; i++) {

                       var action = actionArray[i];
                       if (typeof action == "undefined") {
                           console.warn("processRedeemActions: action at index("+i+") is undefined - skip");
                           continue;
                       }

                       // upgrade user profile
                       if ((action.command=="updateUser") && (typeof action.json != "undefined")) {
                           // keep local clientID and clientSecret
                           var updatedAccountData = JSON.parse(action.json);
                           var oldAccountData = AppContext.getAccount();
                           updatedAccountData.clientId = oldAccountData.clientId;
                           updatedAccountData.clientSecret = oldAccountData.clientSecret;
                           AppContext.setAccount(updatedAccountData);
                       } else

                       // focus party in GUI
                       if (action.command=="focusParty") {
                           $state.go('tab.dash', {id: JSON.parse(action.json)});
                       } else

                       // unkown
                       {
                           alert("UNKOWN COMMAND '"+action.command+"'");
                       }
                   }
               };

               var feedbackOnCode = function(result) {
                   $translate("ANSWERE").then(function (HEADLINE) {
                       $ionicPopup.alert({
                           title: HEADLINE,
                           template: result.feedbackHtml
                       }).then(function() {
                           processRedeemActions(result.actions);
                       });
                   });
               };


                var titleKey = "MAGICCODE";
                var subKey = "REDEEM_MAGIC_SUB";
                if ((typeof isRedeemCouponBool != "undefined") && (isRedeemCouponBool)) {
                    titleKey = "REDEEMCOUPON";
                    subKey = "REDEEM_COUPON_SUB";
                }
                $translate(titleKey).then(function (TITLE) {
                    $translate(subKey).then(function (SUB) {
                        $ionicPopup.prompt({
                            title: TITLE,
                            template: SUB,
                            // input type is number - because number codes work in all langs and alphabets
                            inputType: 'number',
                            inputPlaceholder: ''
                        }).then(function(res) {
                            console.log('name:', res);
                            if (typeof res != "undefined") {
                                if (res.length==0) return;
                                $ionicLoading.show({
                                    template: '<img src="img/spinner.gif" />'
                                });
                                ApiService.redeemCode(res, AppContext.getAppLang(), function(result){
                                    // WIN
                                    $ionicLoading.hide();
                                    feedbackOnCode(result);
                                }, function(){
                                    // FAIL
                                    $ionicLoading.hide();
                                    $translate("INTERNETPROBLEM").then(function (text) {
                                        feedbackOnCode(text);
                                    });
                                });
                            }
                        });
                    });
                });
           	},
            
        	sendKonfetti : function(partyID, maxSendAmount, listOfGreenAddresses) {
                $translate("SENDKONFETTI").then(function (TITLE) {
                	var translateKey = "SENDKONFETTI_SUB_ALL";
                	if ((typeof  listOfGreenAddresses != "undefined") && (listOfGreenAddresses!=null) && ( listOfGreenAddresses.length>0)) translateKey = "SENDKONFETTI_SUB_LIST";
                    $translate(translateKey).then(function (SUB) {
                    $translate("CANCEL").then(function (CANCEL) {
                        $translate("OK").then(function (OK) {
                            $rootScope.popScope = {
                                sendAmount: 1,
                                sendMail: ""
                            };
                            var sendPop = $ionicPopup.show({
                                templateUrl: './templates/pop-sendkonfetti.html',
                                title: TITLE,
                                subTitle: SUB,
                                scope: $rootScope,
                                buttons: [
                                    {
                                        text: CANCEL,
                                        onTap: function (e) {
                                        }
                                    },
                                    {
                                        text: OK,
                                        type: 'button-positive',
                                        onTap: function (e) {
                                        	 if ((typeof $rootScope.popScope.sendMail == "undefined") || ($rootScope.popScope.sendMail.length==0)) {
                                        		alert("eMail is not valid");
                                        		return false;
                                        	}
                                        	alert("TODO SEND TO SERVER: ("+$rootScope.popScope.sendAmount+"/"+$rootScope.popScope.sendMail+")");
                                        	return true;
                                        }
                                    }
                                ]
                            }); // END ionic pop
                            
                            sendPop.then(function(){sendPop.close();});
                        }); // END translate OK
                    });	// END translate CANCEL
                    });// END translate SUB
                }); // END translate TITLE
     		} // END sendKonfetti         
	};
});