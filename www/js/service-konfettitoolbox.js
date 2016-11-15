angular.module('starter.konfettitoolbox', [])
.factory('KonfettiToolbox', function($rootScope, $log, $ionicPopup, $translate, $ionicLoading, $state, AppContext, ApiService, $cordovaGeolocation, PopupDialogs) {

        var arrayContainsObject = function(arr, obj) {
            for (var i=0; i < arr.length; i++) {
                if (arr[i]===obj) return true;
            };
            return false;
        };

        var wasUserActiveOnTask = function(idOfTask) {
            var arrayIds = JSON.parse(window.localStorage.getItem("activeTasksTemp"));
            if ((typeof arrayIds == "undefined") || (arrayIds==null)) arrayIds = new Array();
            return arrayContainsObject(arrayIds,idOfTask);
        };

        var setUserActiveOnTask = function(idOfTask) {
            try {
                var arrayIds = window.localStorage.getItem("activeTasksTemp");
                if ((typeof arrayIds == "undefined") || (arrayIds==null)) arrayIds = new Array();
                if (!arrayContainsObject(arrayIds,idOfTask)) arrayIds[arrayIds.length] = idOfTask;
                window.localStorage.setItem("activeTasksTemp", JSON.stringify(arrayIds));
            } catch (e) {
                console.warn("ERROR on setUserActiveOnTask : "+JSON.stringify(e));
            }
        };

        var processRedeemActions = function(actionArray, dashViewScope) {

                if (typeof dashViewScope == "undefined") {
                    dashViewScope = null;

                } 

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
                           if (dashViewScope==null){
                              $state.go('tab.dash', {id: JSON.parse(action.json)});
                           } else {
                              dashViewScope.loadPartiesAndFocus(JSON.parse(action.json));
                           }
                       } else

                       // GPS info - set if no other GPS is set yet
                       if (action.command=="gpsInfo") {

                            var gpsdata = JSON.parse(action.json);
                            if ((gpsdata.lat==0) && (gpsdata.lon==0)) {
                                $log.info("ignoring GPS from server");
                            } else {
                                $rootScope.lat  = gpsdata.lat;
                                $rootScope.lon = gpsdata.lon;
                                $rootScope.gps  = 'win';
                                var newPosition = {
                                    ts: Date.now(),
                                    lat: gpsdata.lat,
                                    lon: gpsdata.lon
                                };
                                var localState = AppContext.getLocalState();
                                localState.lastPosition = newPosition;
                                AppContext.setLocalState(localState);
                                $log.info("GPS update by server: lat("+$rootScope.lat+") long("+$rootScope.lon+")");
                            }

                       } else

                       // unkown
                       {
                           alert("UNKOWN COMMAND '"+action.command+"'");
                       }
                   }
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
            markInteractionOnRequest: function(idOfTask) {
                setUserActiveOnTask(idOfTask);
            },
            filterRequestsByInteraction: function(requestArray, userId) {
                var resultArray = [];
                for (var i = 0; i < requestArray.length; i++) {
                    // ignore if user is author of request
                    if (requestArray[i].userId===userId) continue;
                    // use if there is a chat on request
                    // TODO: server should deliver chats if related to requesting user
                    if (requestArray[i].chats.length>0) {
                        resultArray.push(requestArray[i]);
                    } else {
                        // fallback - the client remembers tasks chatted with in local storage
                        if (wasUserActiveOnTask(requestArray[i].id)) {
                            resultArray.push(requestArray[i]);
                        }
                    }
                }
                return resultArray;
            },
            filterDuplicatesFromArray : function (a) {
                var prims = {"boolean":{}, "number":{}, "string":{}}, objs = [];
                return a.filter(function(item) {
                    var type = typeof item;
                    if (type in prims)
                        return prims[type].hasOwnProperty(item) ? false : (prims[type][item] = true);
                    else
                return objs.indexOf(item) >= 0 ? false : objs.push(item);
                });
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
           processCouponActions : function(actionArray, dashViewScope) {
               processRedeemActions(actionArray,dashViewScope);
           },
           processCode : function(isRedeemCouponBool, /* optional */ successCallback ) {

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
                            //console.log('name:', res);
                            if (typeof res != "undefined") {
                                if (res.length==0) return;
                                if (isRedeemCouponBool) {
                                    // dont allow admin debug codes when entering coupon codes
                                    if ((res=="1") || (res=="2") || (res=="3") || (res=="4")) return;
                                    if ((res=="11") || (res=="22") || (res=="33") || (res=="44")) return;
                                }
                                $ionicLoading.show({
                                    template: '<img src="img/spinner.gif" />'
                                });
                                ApiService.redeemCode(res, AppContext.getAppLang(), function(result){
                                    // WIN
                                    $ionicLoading.hide();
                                    if ((typeof successCallback != "undefined") && (successCallback!=null)) {
                                        successCallback(result);
                                    } else {
                                        if ((typeof result == "undefined") || (result==null) || (result.length<=0)) {
                                            $translate("CODE_WRONG").then(function (text) {
                                                feedbackOnCode({feedbackHtml : text});
                                            });
                                        } else {
                                            feedbackOnCode(result);
                                        }
                                    }
                                }, function(){
                                    // FAIL
                                    $ionicLoading.hide();
                                    $translate("INTERNETPROBLEM").then(function (text) {
                                        feedbackOnCode({feedbackHtml : text});
                                    });
                                });
                            }
                        });
                    });
                });
           	}
                
	};
});