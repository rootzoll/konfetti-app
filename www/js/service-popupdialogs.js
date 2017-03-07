angular.module('starter.popupdialogs', [])
/*
 * Costumized PopUpDIalogs
 */
.factory('PopupDialogs', function($log, $ionicPopup, $translate, $rootScope, ApiService, AppContext) {

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
     											methodShowIonicAlertWith18nText("KONFETTI-APP", "EMAILUNVALID");
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
                                        			methodShowIonicAlertWith18nText("KONFETTI-APP", "EMAILNOTALLOWED");
                                        			return false;
                                        		}
                                        	}

                                        	$ionicLoading.show({
                                    			template: '<img src="img/spinner.gif" />'
                                			});
                                        	ApiService.sendKonfetti(partyID, $rootScope.popScope.sendMail, $rootScope.popScope.sendAmount, AppContext.getAppLang(), function(){
                                        		// WIN
                                        		$ionicLoading.hide();
                                        		methodShowIonicAlertWith18nText("KONFETTI-APP", "SENDOK");
                                        	}, function(){
                                        		// FAIL
                                        		$ionicLoading.hide();
                                        		methodShowIonicAlertWith18nText("KONFETTI-APP", "SENDFAILED");
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
            $translate(config.i18nSubline).then(function (SUB) {
            $translate("OK").then(function (OK) {
            $translate(config.i18nCancel).then(function (CANCEL) {

                if (config.i18nSubline=="CANCEL") SUB = null;
                
                scope.mapWidthPixel = window.innerWidth - 60;

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
                        subTitle: SUB,
                        draggable: true
                    }   
                },
                events: { 
                    markers:{
                      enable: [ 'dragend' ]
                    }
                },
                defaults: {
                    tileLayer: 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                    attributionControl: true,
                    tileLayerOptions: {
                        attribution: 'OpenStreetMap',
                        detectRetina: true,
                        reuseTiles: true,
                        unloadInvisibleTiles: false,
                        updateWhenIdle: false
                    },
                    scrollWheelZoom: false
                },
                inputComment: config.inputComment
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
                     subTitle: SUB,
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
            });

        };

    var addTextDialog = function(scope, win, fail) {
          
        try {

            $translate("ADDTEXT").then(function (HEADLINE) {
            $translate("ENTERTEXT").then(function (TEXT) {
            $translate("OK").then(function (OK) {
            $translate("CANCEL").then(function (CANCEL) {
                 
                scope.textInput = {
                    cancel: false,
                    text: ""
                };

                var myPopup = $ionicPopup.show({
                     templateUrl: 'templates/pop-textinput.html',
                     scope: scope,
                     subTitle: TEXT,
                     title: HEADLINE,
                     cssClass: 'pop-textinput',
                    buttons: [
                        { text: CANCEL, onTap: function(e){
                            scope.textInput.cancel=true;
                        } },
                        { text: OK,
                            type: 'button-positive',
                            onTap: function(e) {
                            }
                        }
                    ]
                });
                
                myPopup.then(function(res) {   
                    myPopup.close();
                    win(scope.textInput);
                });
            });
            });
            });
            });

        } catch (e) {
            fail(e);
        }
  }; 

    var enterUsernameDialog = function(scope, preset, win, fail) {
          
        try {

            if (preset==null) preset = "";

            $translate("USERNAMETITLE").then(function (HEADLINE) {
            $translate("USERNAMESUB").then(function (TEXT) {
            $translate("OK").then(function (OK) {
            $translate("CANCEL").then(function (CANCEL) {
                 
                scope.textInput = {
                    cancel: false,
                    valid: preset.length>0,
                    text: preset
                };

                var scopeRef = scope;
                scope.namechange = function(actualName){

                    //console.log(actualName);
                    if (actualName==null) return;

                    // if to short its not valid
                    if (actualName.length<2) {
                        scopeRef.textInput.valid = false;
                        return;
                    }

                    // is ok if value not changing
                    if (actualName==preset) {
                        scopeRef.textInput.valid = true;
                        return;
                    }

                    // make request to check if name is still free
                    var scopeRefRef = scopeRef;
                    ApiService.checkUsernameIsFree(actualName, function(name, result){
                        // check if result is still valid for actual input
                        if (scopeRefRef.textInput.text==name) {
                            //console.log("name("+name+") result("+result+")")
                            scopeRefRef.textInput.valid = result;
                        } else {
                            //console.log("input("+scopeRefRef.textInput.text+") not anymore("+name+")");
                        }
                    });

                };

                var myPopup = $ionicPopup.show({
                     templateUrl: 'templates/pop-username.html',
                     scope: scope,
                     subTitle: TEXT,
                     title: HEADLINE,
                     cssClass: 'pop-textinput',
                    buttons: [
                        { text: CANCEL, onTap: function(e){
                            scope.textInput.cancel=true;
                        } },
                        { text: OK,
                            type: 'button-positive',
                            onTap: function(e) {
                            }
                        }
                    ]
                });
                
                myPopup.then(function(res) {   
                    myPopup.close();
                    win(scope.textInput);
                });
            });
            });
            });
            });

        } catch (e) {
            fail(e);
        }
  }; 

    var addDateDialog = function(scope, win, fail) {
          
        try {

            $translate("ADDDATE_TITLE").then(function (HEADLINE) {
            $translate("ADDDATE_SUB").then(function (TEXT) {
            $translate("OK").then(function (OK) {
            $translate("CANCEL").then(function (CANCEL) {
                 
                scope.dateInput = {
                    cancel: false,
                    date: new Date(),
                    time: new Date("2016-12-19T12:00:00.000+01:00"),
                    combinedDate: null,
                    comment: "",
                    addlocation: false
                };

                var myPopup = $ionicPopup.show({
                     templateUrl: 'templates/pop-dateinput.html',
                     scope: scope,
                     subTitle: TEXT,
                     title: HEADLINE,
                     cssClass: 'pop-dateinput',
                    buttons: [
                        { text: CANCEL, onTap: function(e){
                            scope.dateInput.cancel=true;
                        } },
                        { text: OK,
                            type: 'button-positive',
                            onTap: function(e) {
                            }
                        }
                    ]
                });
                
                myPopup.then(function(res) {   

                    myPopup.close();

                    // combine date and time to one timestring
                    var timeStr = "00:00:00.000Z\"";
                    if (scope.dateInput.time!=null) {
                        var fullDateStr = JSON.stringify(scope.dateInput.time);
                        timeStr = fullDateStr.substring(fullDateStr.indexOf('T')+1);
                    }
                    fullDateStr = JSON.stringify(scope.dateInput.date);
                    var dateStr = fullDateStr.substring(0,fullDateStr.indexOf('T'));
                    scope.dateInput.combinedDate = JSON.parse(dateStr+"T"+timeStr);

                    win(scope.dateInput);

                });
            });
            });
            });
            });

        } catch (e) {
            fail(e);
        }
  };    

    var errorDialog = function(scope, code) {
          
        try {

            scope.errorCode = code;
            scope.account = AppContext.getAccount();

            $translate("ERROR_HEAD").then(function (HEADLINE) {
            $translate("ERROR_BUTTON").then(function (OK) {
                 
                var myPopup = $ionicPopup.show({
                     templateUrl: 'templates/pop-error.html',
                     scope: scope,
                     title: HEADLINE,
                     cssClass: 'pop-dateinput',
                    buttons: [
                        { text: OK,
                            type: 'button-positive',
                            onTap: function(e) {
                            }
                        }
                    ]
                });
                
                myPopup.then(function(res) {   

                   if (typeof navigator.app != "undefined") {
                    navigator.app.exitApp();
                   } else {
                    location.reload();
                   }

                });
            });
            });

        } catch (e) {
            alert("FAIL ON ERROR DIALOG: "+JSON.stringify(e));
        }
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
            if (typeof config.i18nSubline == "undefined") config.i18nSubline = "CANCEL";
            if (typeof config.i18nMarker == "undefined") config.i18nMarker = "LOCATIONPICKER_MARKER";
            if (typeof config.i18nCancel == "undefined") config.i18nCancel = "CANCEL";          
            if (typeof config.inputComment == "undefined") config.inputComment = false;

            if (typeof config.startZoom == "undefined") config.startZoom = 12;
            if ((typeof config.startLat == "undefined") || (typeof config.startLon == "undefined")) {
                config.startLat = 52.522011;
                config.startLon = 13.412772;
                config.startZoom = 9;
            };

            locationPickerAlert(scope, win, fail, config);

        },
        datePicker : function(scope, win, fail) {
            addDateDialog(scope, win, fail);
        },
        textInput : function(scope, win, fail) {
            addTextDialog(scope, win, fail);
        },
        usernameDialog : function(scope, preset, win, fail) {
            enterUsernameDialog(scope, preset, win, fail);
        },
        errorDialog : function(scope, code) {
            errorDialog(scope, code);
        }
    }

 });