angular.module('starter.popupdialogs', [])
/*
 * Costumized PopUpDIalogs
 */
.factory('PopupDialogs', function($log, $ionicPopup, $translate, $rootScope) {

		// local def --> on service is called --> showIonicAlertWith18nText
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
                            var popUp = $ionicPopup.show({
                                templateUrl: './templates/pop-GpsFallback.html',
                                title: TITLE,
                                subTitle: SUB,
                                scope: $rootScope,
                                buttons: [
                                    {
                                        text: GPS,
                                        onTap: function (e) {
                                            popUp.close();
                                            fail();
                                        }
                                    },
                                    {
                                        text: OK,
                                        type: 'button-positive',
                                        onTap: function (e) {
                                            popUp.close();
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
                                                        console.log("GPSFALLBACK_FAIL");
                                                        methodShowIonicAlertWith18nText('INFO', 'GPSFALLBACK_FAIL', function () {
                                                            methodGetFallbackLocationBySelection(win, fail);
                                                        });
                                                    });
                                                } else {
                                                    // ON EMPTY INPUT
                                                    console.log("GPSFALLBACK_NEEDED");
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


        var sendKonfettiDialog = function(partyID, maxSendAmount, listOfGreenAddresses) {
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
                                        	 
                                        	 // check valid email
                                        	 if ((typeof $rootScope.popScope.sendMail == "undefined") || ($rootScope.popScope.sendMail.length==0)) {
     											PopupDialogs.methodShowIonicAlertWith18nText("KONFETTI-APP", "EMAILUNVALID");
                                        		return false;
                                        	}
                                        	
                                        	$rootScope.popScope.sendMail = $rootScope.popScope.sendMail.toLowerCase();
                                        	if ((typeof listOfGreenAddresses != "undefined") && (listOfGreenAddresses.length>0)) {
                                        		var isListed = false;
                                        		for (var i=0; i<listOfGreenAddresses.length; i++) {
                                        			var listedMail = listOfGreenAddresses[i].toLowerCase();
                                        			if ($rootScope.popScope.sendMail==listedMail) {
                                        				isListed = true;
                                        				break;
                                        			}
                                        		}
                                        		if (!isListed) {
                                        			PopupDialogs.methodShowIonicAlertWith18nText("KONFETTI-APP", "EMAILNOTALLOWED");
                                        			return false;
                                        		}
                                        	}

                                        	$ionicLoading.show({
                                    			template: '<img src="img/spinner.gif" />'
                                			});
                                        	ApiService.sendKonfetti(partyID, $rootScope.popScope.sendMail, $rootScope.popScope.sendAmount, AppContext.getAppLang(), function(){
                                        		// WIN
                                        		$ionicLoading.hide();
                                        		PopupDialogs.methodShowIonicAlertWith18nText("KONFETTI-APP", "SENDOK");
                                        	}, function(){
                                        		// FAIL
                                        		$ionicLoading.hide();
                                        		PopupDialogs.methodShowIonicAlertWith18nText("KONFETTI-APP", "SENDFAILED");
                                        	});
                                        
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
        };   

        var locationPickerAlert = function(scope, win, fail, config) {

            $translate(config.i18nHeadline).then(function (HEADLINE) {
            $translate(config.i18nMarker).then(function (TEXT) {
            $translate("OK").then(function (OK) {
            $translate("CANCEL").then(function (CANCEL) {
                
                angular.extend(scope, {
                markerPosition: {
                    lat: config.startLat,
                    lng: config.startLon,
                    zoom: config.startZoom
                },
                markers: {
                    mainMarker: {
                        lat: config.startLat,
                        lng: config.startLon,
                        focus: true,
                        message: TEXT,
                        draggable: true
                    }   
                },
                events: { 
                    markers:{
                      enable: [ 'dragend' ]
                    }
                }
                });

                // when user ends drag of marker - update position
                scope.$on("leafletDirectiveMarker.mappick.dragend", function(event, args){
                    scope.markerPosition.lat = args.model.lat;
                    scope.markerPosition.lng = args.model.lng;
                    if (scope.markerPosition.zoom<17) scope.markerPosition.zoom++;
                });

                // when user ends drag of map - set marker to new center position
                scope.$on("leafletDirectiveMap.mappick.click", function(event, args){
                    scope.markers.mainMarker.lat = args.leafletEvent.latlng.lat;
                    scope.markers.mainMarker.lng = args.leafletEvent.latlng.lng;
                    scope.markerPosition.lat = args.leafletEvent.latlng.lat;
                    scope.markerPosition.lng = args.leafletEvent.latlng.lng;
                    if (scope.markerPosition.zoom<17) scope.markerPosition.zoom++;
                });

                scope.locationInput = {
                    cancel: false,
                    lat: 0,
                    lon: 0,
                    comment: "",
                    addDate: false
                };

                var myPopup = $ionicPopup.show({
                     templateUrl: 'templates/pop-locationpick.html',
                     scope: scope,
                     title: HEADLINE,
                     cssClass: 'pop-locationpick',
                     buttons: [
                        { text: CANCEL, onTap: function(e){
                            try {
                                scope.locationInput.cancel=true;
                                win(scope.locationInput);
                            } catch (e) {
                                fail(e);
                            }
                        } },
                        { text: OK,
                            type: 'button-positive',
                            onTap: function(e) {
                                scope.locationInput.lat = scope.markerPosition.lat;
                                scope.locationInput.lon = scope.markerPosition.lng;
                                win(scope.locationInput);
                            }
                        }
                    ]
                });

                leafletData.getMap("mappick").then(function(map) {
                    setTimeout(function(){
                        map.invalidateSize();
                    }, 200);
                  });

                myPopup.then(function(){myPopup.close();});

            });
            });
            });
            });

        };

    return {

        showIonicAlertWith18nText: function(i18nKeyTitle, i18nKeyText, win) {
            methodShowIonicAlertWith18nText(i18nKeyTitle, i18nKeyText, win);
        },
        sendKonfetti : function(partyID, maxSendAmount, listOfGreenAddresses) {
            sendKonfettiDialog(partyID, maxSendAmount, listOfGreenAddresses);    
     	},
        /*
            var exampleConfig = {
                i18nHeadline: "LOCATIONPICKER_TITLE",
                i18nMarker: "LOCATIONPICKER_MARKER",
                inputComment: true,
                startLat: 52.522011,
                startLon: 13.412772,
                startZoom: 9
            };
        */
        locationPicker : function(scope, win, fail, config) {

            // fall back config
            if (typeof config == "undefined") config = {};
            if (typeof config.i18nHeadline == "undefined") config.i18nHeadline = "LOCATIONPICKER_TITLE";
            if (typeof config.i18nMarker == "undefined") config.i18nMarker = "LOCATIONPICKER_MARKER";
            if (typeof config.inputComment == "undefined") config.inputComment = false;
            if (typeof config.startZoom == "undefined") config.startZoom = 12;
            if ((typeof config.startLat == "undefined") || (typeof config.startLon == "undefined")) {
                config.startLat = 52.522011;
                config.startLon = 13.412772;
                config.startZoom = 9;
            };

            locationPickerAlert(scope, win, fail, config);

        },
        getFallbackLocationBySelection : function(win, fail) {
            methodGetFallbackLocationBySelection(win, fail);
        },
    }

 });