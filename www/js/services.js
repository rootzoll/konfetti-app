angular.module('starter.services', [])

.factory('AppContext', function($log, $timeout) {

  /*
   * APP CONFIG PARAMETER
   */

  var apiUrlLocalDevelopment = "http://localhost:9000/konfetti/api";
  var apiUrlDevelopmentServer = "http://fourcores2016.cloudapp.net:9000/konfetti/api";
  var apiUrlProductionServer = "https://konfetti-prod.testserver.de/konfetti/api";

  var appConfig = {

      /* APP BACKEND SERVER ---> SET ONE FROM THE ABOVE */
      apiUrl: apiUrlDevelopmentServer,

      /* PUSH NOTIFICATION */
      oneSignalAppId : "",
      googleProjectNumber : ""
  };

  /*
   * APP DATA
   */

  // put into the app context stuff that needs to be stored
  // everything else put into rootScope
  var appContext = {
      version: 1,
      appLang : "en",
      account : {
          id : 0,
          clientSecret : "",
          clientId : "",
          reviewerOnParties : [],
          activeOnParties : [],
          adminOnParties: [],
          spokenLangs : [],
          name: "",
          eMail: "",
          imageMediaID: 0,
          pushActive: false,
          pushSystem: null,
          pushID: null
      },
      localState : {
        introScreenShown: false,
        imageData: null,
        lastPartyUpdates: {},
        lastPosition : null,
        pushIDs: null
      }
  };

  var isReady = false;

  var loadContext = function() {
      var jsonStr = window.localStorage.getItem("appContext");
      if ((typeof jsonStr != "undefined") && (jsonStr!=null)) appContext = JSON.parse(jsonStr);
      isReady = true;
  };
  loadContext();

  return {
    getAppConfig: function() {
          return appConfig;
    },
    isReady: function() {
        return isReady;
    },
    getAppLang: function() {
      return appContext.appLang;
    },
    getAppLangDirection: function() {
        return (appContext.appLang === 'ar') ? 'rtl' : 'ltr';
    },
    setAppLang: function(value) {
      if (!isReady)
      appContext.appLang = value;
      this.persistContext();
    },
    getLocalState: function() {
        return appContext.localState;
    },
    setLocalState: function(state) {
        appContext.localState = state;
        this.persistContext();
    },
    getAccount: function() {
        return appContext.account;
    },
    setAccount: function(account) {
        appContext.account = account;
        if (appContext.account.name==null) appContext.account.name = "";
        if (appContext.account.eMail==null) appContext.account.eMail = "";
        this.persistContext();
    },
    loadContext: function(win) {
        loadContext();
        win();
    },
    persistContext: function() {
        var data = JSON.stringify(appContext);
        localStorage.setItem("appContext", data);
    },
    getRunningOS: function() {
        return (typeof window.device != "undefined") ? window.device.platform : "browser";
    },
    isRunningOnDesktopComputer: function() {
        // TODO differ between mobile and desktop browser in more detail later
        return typeof window.device == "undefined";
    },
    isRunningWithinApp : function() {
        var osRunning = ((typeof cordova != "undefined") && (typeof cordova.platformId  != "undefined")) ? cordova.platformId : "browser";
        return osRunning!="browser";
    },
    updatePushIds : function(pushIds) {
        appContext.localState.pushIDs = pushIds;
        this.persistContext();
    },
    isRunningDevelopmentEnv: function() {
        return appConfig.apiUrl==apiUrlLocalDevelopment;
    }
  };
})

.factory('DataCache', function($log) {

        var dataMap = [
            {key: 'test', val:'test'}
        ];

        return {
            putData: function(keyStr, valObj) {
                var keyIndex = this.getKeyIndex(keyStr);
                if (keyIndex>=0) dataMap.splice(keyIndex, 1);
                dataMap.push({key: keyStr, val:valObj});
                return;
            },
            getData: function(keyStr) {
                var keyIndex = this.getKeyIndex(keyStr);
                if (keyIndex>=0) return dataMap[keyIndex].val;
                return;
            },
            getKeyIndex: function(key) {
                var ki = -1;
                for (i = 0; i < dataMap.length; i++) {
                    if (dataMap[i].key===key) {
                        ki = i;
                        break;
                    }
                }
                return ki;
            }
        };
 })
 
 .factory('RainAnimation', function($log, $document, $window, $timeout) {
       
        // basic values
       	var retina = window.devicePixelRatio,
		PI = Math.PI,
        sqrt = Math.sqrt,
		round = Math.round,
		random = Math.random,
		cos = Math.cos,
		sin = Math.sin,
		rAF = $window.requestAnimationFrame,
		cAF = $window.cancelAnimationFrame || $window.cancelRequestAnimationFrame;
       
		// initial state       
       	var isRaining = false,
		speed = 50,
        duration = (1.0 / speed),
        confettiRibbonCount = 2,
        ribbonPaperCount = 30,
        ribbonPaperDist = 8.0,
        ribbonPaperThick = 6.0,
        confettiPaperCount = 33,
        DEG_TO_RAD = PI / 180,
        RAD_TO_DEG = 180 / PI,
        colors = [
            ["#FCCB6E", "#169597"],
            ["#E57225", "#91272D"],
            ["#E3147E", "#7CBE80"],
            ["#E2E589", "#DF1421"]
        ];
        
		function Vector2(_x, _y) {
        this.x = _x, this.y = _y;
        this.Length = function() {
            return sqrt(this.SqrLength());
        }
        this.SqrLength = function() {
            return this.x * this.x + this.y * this.y;
        }
        this.Add = function(_vec) {
            this.x += _vec.x;
            this.y += _vec.y;
        }
        this.Sub = function(_vec) {
            this.x -= _vec.x;
            this.y -= _vec.y;
        }
        this.Div = function(_f) {
            this.x /= _f;
            this.y /= _f;
        }
        this.Mul = function(_f) {
            this.x *= _f;
            this.y *= _f;
        }
        this.Normalize = function() {
            var sqrLen = this.SqrLength();
            if (sqrLen != 0) {
                var factor = 1.0 / sqrt(sqrLen);
                this.x *= factor;
                this.y *= factor;
            }
        }
        this.Normalized = function() {
            var sqrLen = this.SqrLength();
            if (sqrLen != 0) {
                var factor = 1.0 / sqrt(sqrLen);
                return new Vector2(this.x * factor, this.y * factor);
            }
            return new Vector2(0, 0);
        }
				}
				Vector2.Lerp = function(_vec0, _vec1, _t) {
        return new Vector2((_vec1.x - _vec0.x) * _t + _vec0.x, (_vec1.y - _vec0.y) * _t + _vec0.y);
				}
				Vector2.Distance = function(_vec0, _vec1) {
        return sqrt(Vector2.SqrDistance(_vec0, _vec1));
				}
				Vector2.SqrDistance = function(_vec0, _vec1) {
        var x = _vec0.x - _vec1.x;
        var y = _vec0.y - _vec1.y;
        return (x * x + y * y + z * z);
				}
				Vector2.Scale = function(_vec0, _vec1) {
        return new Vector2(_vec0.x * _vec1.x, _vec0.y * _vec1.y);
				}
				Vector2.Min = function(_vec0, _vec1) {
        return new Vector2(Math.min(_vec0.x, _vec1.x), Math.min(_vec0.y, _vec1.y));
				}
				Vector2.Max = function(_vec0, _vec1) {
        return new Vector2(Math.max(_vec0.x, _vec1.x), Math.max(_vec0.y, _vec1.y));
				}
				Vector2.ClampMagnitude = function(_vec0, _len) {
        var vecNorm = _vec0.Normalized;
        return new Vector2(vecNorm.x * _len, vecNorm.y * _len);
				}
				Vector2.Sub = function(_vec0, _vec1) {
        return new Vector2(_vec0.x - _vec1.x, _vec0.y - _vec1.y, _vec0.z - _vec1.z);
				}

				function EulerMass(_x, _y, _mass, _drag) {
        this.position = new Vector2(_x, _y);
        this.mass = _mass;
        this.drag = _drag;
        this.force = new Vector2(0, 0);
        this.velocity = new Vector2(0, 0);
        this.AddForce = function(_f) {
            this.force.Add(_f);
        }
        this.Integrate = function(_dt) {
            var acc = this.CurrentForce(this.position);
            acc.Div(this.mass);
            var posDelta = new Vector2(this.velocity.x, this.velocity.y);
            posDelta.Mul(_dt);
            this.position.Add(posDelta);
            acc.Mul(_dt);
            this.velocity.Add(acc);
            this.force = new Vector2(0, 0);
        }
        this.CurrentForce = function(_pos, _vel) {
            var totalForce = new Vector2(this.force.x, this.force.y);
            var speed = this.velocity.Length();
            var dragVel = new Vector2(this.velocity.x, this.velocity.y);
            dragVel.Mul(this.drag * this.mass * speed);
            totalForce.Sub(dragVel);
            return totalForce;
        }
				}

				function ConfettiPaper(_x, _y) {
        this.pos = new Vector2(_x, _y);
        this.rotationSpeed = (random() * 600 + 800);
        this.angle = DEG_TO_RAD * random() * 360;
        this.rotation = DEG_TO_RAD * random() * 360;
        this.cosA = 1.0;
        this.size = 5.0;
        this.oscillationSpeed = (random() * 1.5 + 0.5);
        this.xSpeed = 40.0;
        this.ySpeed = (random() * 60 + 50.0);
        this.corners = new Array();
        this.time = random();
        var ci = round(random() * (colors.length - 1));
        this.frontColor = colors[ci][0];
        this.backColor = colors[ci][1];
        for (var i = 0; i < 4; i++) {
            var dx = cos(this.angle + DEG_TO_RAD * (i * 90 + 45));
            var dy = sin(this.angle + DEG_TO_RAD * (i * 90 + 45));
            this.corners[i] = new Vector2(dx, dy);
        }
        this.Update = function(_dt) {
            this.time += _dt;
            this.rotation += this.rotationSpeed * _dt;
            this.cosA = cos(DEG_TO_RAD * this.rotation);
            this.pos.x += cos(this.time * this.oscillationSpeed) * this.xSpeed * _dt
            this.pos.y += this.ySpeed * _dt;
            if (this.pos.y > ConfettiPaper.bounds.y) {
                this.pos.x = random() * ConfettiPaper.bounds.x;
                this.pos.y = 0;
            }
        }
        this.Draw = function(_g) {
            if (this.cosA > 0) {
                _g.fillStyle = this.frontColor;
            } else {
                _g.fillStyle = this.backColor;
            }
            _g.beginPath();
            _g.moveTo((this.pos.x + this.corners[0].x * this.size) * retina, (this.pos.y + this.corners[0].y * this.size * this.cosA) * retina);
            for (var i = 1; i < 4; i++) {
                _g.lineTo((this.pos.x + this.corners[i].x * this.size) * retina, (this.pos.y + this.corners[i].y * this.size * this.cosA) * retina);
            }
            _g.closePath();
            _g.fill();
        }
				}
				ConfettiPaper.bounds = new Vector2(0, 0);

				function ConfettiRibbon(_x, _y, _count, _dist, _thickness, _angle, _mass, _drag) {
        this.particleDist = _dist;
        this.particleCount = _count;
        this.particleMass = _mass;
        this.particleDrag = _drag;
        this.particles = new Array();
        var ci = round(random() * (colors.length - 1));
        this.frontColor = colors[ci][0];
        this.backColor = colors[ci][1];
        this.xOff = (cos(DEG_TO_RAD * _angle) * _thickness);
        this.yOff = (sin(DEG_TO_RAD * _angle) * _thickness);
        this.position = new Vector2(_x, _y);
        this.prevPosition = new Vector2(_x, _y);
        this.velocityInherit = (random() * 2 + 4);
        this.time = random() * 100;
        this.oscillationSpeed = (random() * 2 + 2);
        this.oscillationDistance = (random() * 40 + 40);
        this.ySpeed = (random() * 40 + 80);
        for (var i = 0; i < this.particleCount; i++) {
            this.particles[i] = new EulerMass(_x, _y - i * this.particleDist, this.particleMass, this.particleDrag);
        }
        this.Update = function(_dt) {
            var i = 0;
            this.time += _dt * this.oscillationSpeed;
            this.position.y += this.ySpeed * _dt;
            this.position.x += cos(this.time) * this.oscillationDistance * _dt;
            this.particles[0].position = this.position;
            var dX = this.prevPosition.x - this.position.x;
            var dY = this.prevPosition.y - this.position.y;
            var delta = sqrt(dX * dX + dY * dY);
            this.prevPosition = new Vector2(this.position.x, this.position.y);
            for (i = 1; i < this.particleCount; i++) {
                var dirP = Vector2.Sub(this.particles[i - 1].position, this.particles[i].position);
                dirP.Normalize();
                dirP.Mul((delta / _dt) * this.velocityInherit);
                this.particles[i].AddForce(dirP);
            }
            for (i = 1; i < this.particleCount; i++) {
                this.particles[i].Integrate(_dt);
            }
            for (i = 1; i < this.particleCount; i++) {
                var rp2 = new Vector2(this.particles[i].position.x, this.particles[i].position.y);
                rp2.Sub(this.particles[i - 1].position);
                rp2.Normalize();
                rp2.Mul(this.particleDist);
                rp2.Add(this.particles[i - 1].position);
                this.particles[i].position = rp2;
            }
            if (this.position.y > ConfettiRibbon.bounds.y + this.particleDist * this.particleCount) {
                this.Reset();
            }
        }
        this.Reset = function() {
            this.position.y = -random() * ConfettiRibbon.bounds.y;
            this.position.x = random() * ConfettiRibbon.bounds.x;
            this.prevPosition = new Vector2(this.position.x, this.position.y);
            this.velocityInherit = random() * 2 + 4;
            this.time = random() * 100;
            this.oscillationSpeed = random() * 2.0 + 1.5;
            this.oscillationDistance = (random() * 40 + 40);
            this.ySpeed = random() * 40 + 80;
            var ci = round(random() * (colors.length - 1));
            this.frontColor = colors[ci][0];
            this.backColor = colors[ci][1];
            this.particles = new Array();
            for (var i = 0; i < this.particleCount; i++) {
                this.particles[i] = new EulerMass(this.position.x, this.position.y - i * this.particleDist, this.particleMass, this.particleDrag);
            }
        }
        this.Draw = function(_g) {
            for (var i = 0; i < this.particleCount - 1; i++) {
                var p0 = new Vector2(this.particles[i].position.x + this.xOff, this.particles[i].position.y + this.yOff);
                var p1 = new Vector2(this.particles[i + 1].position.x + this.xOff, this.particles[i + 1].position.y + this.yOff);
                if (this.Side(this.particles[i].position.x, this.particles[i].position.y, this.particles[i + 1].position.x, this.particles[i + 1].position.y, p1.x, p1.y) < 0) {
                    _g.fillStyle = this.frontColor;
                    _g.strokeStyle = this.frontColor;
                } else {
                    _g.fillStyle = this.backColor;
                    _g.strokeStyle = this.backColor;
                }
                if (i == 0) {
                    _g.beginPath();
                    _g.moveTo(this.particles[i].position.x * retina, this.particles[i].position.y * retina);
                    _g.lineTo(this.particles[i + 1].position.x * retina, this.particles[i + 1].position.y * retina);
                    _g.lineTo(((this.particles[i + 1].position.x + p1.x) * 0.5) * retina, ((this.particles[i + 1].position.y + p1.y) * 0.5) * retina);
                    _g.closePath();
                    _g.stroke();
                    _g.fill();
                    _g.beginPath();
                    _g.moveTo(p1.x * retina, p1.y * retina);
                    _g.lineTo(p0.x * retina, p0.y * retina);
                    _g.lineTo(((this.particles[i + 1].position.x + p1.x) * 0.5) * retina, ((this.particles[i + 1].position.y + p1.y) * 0.5) * retina);
                    _g.closePath();
                    _g.stroke();
                    _g.fill();
                } else if (i == this.particleCount - 2) {
                    _g.beginPath();
                    _g.moveTo(this.particles[i].position.x * retina, this.particles[i].position.y * retina);
                    _g.lineTo(this.particles[i + 1].position.x * retina, this.particles[i + 1].position.y * retina);
                    _g.lineTo(((this.particles[i].position.x + p0.x) * 0.5) * retina, ((this.particles[i].position.y + p0.y) * 0.5) * retina);
                    _g.closePath();
                    _g.stroke();
                    _g.fill();
                    _g.beginPath();
                    _g.moveTo(p1.x * retina, p1.y * retina);
                    _g.lineTo(p0.x * retina, p0.y * retina);
                    _g.lineTo(((this.particles[i].position.x + p0.x) * 0.5) * retina, ((this.particles[i].position.y + p0.y) * 0.5) * retina);
                    _g.closePath();
                    _g.stroke();
                    _g.fill();
                } else {
                    _g.beginPath();
                    _g.moveTo(this.particles[i].position.x * retina, this.particles[i].position.y * retina);
                    _g.lineTo(this.particles[i + 1].position.x * retina, this.particles[i + 1].position.y * retina);
                    _g.lineTo(p1.x * retina, p1.y * retina);
                    _g.lineTo(p0.x * retina, p0.y * retina);
                    _g.closePath();
                    _g.stroke();
                    _g.fill();
                }
            }
        }
        this.Side = function(x1, y1, x2, y2, x3, y3) {
            return ((x1 - x2) * (y3 - y2) - (y1 - y2) * (x3 - x2));
        }
				}
				ConfettiRibbon.bounds = new Vector2(0, 0);
				confetti = {};
				confetti.Context = function(id) {
        var i = 0;
        var canvas = document.getElementById(id);
        var canvasParent = canvas.parentNode;
        var canvasWidth = canvasParent.offsetWidth;
        var canvasHeight = canvasParent.offsetHeight;
        canvas.width = canvasWidth * retina;
        canvas.height = canvasHeight * retina;
        var context = canvas.getContext('2d');
        var interval = null;
        var confettiRibbons = new Array();
        ConfettiRibbon.bounds = new Vector2(canvasWidth, canvasHeight);
        for (i = 0; i < confettiRibbonCount; i++) {
            confettiRibbons[i] = new ConfettiRibbon(random() * canvasWidth, -random() * canvasHeight * 2, ribbonPaperCount, ribbonPaperDist, ribbonPaperThick, 45, 1, 0.05);
        }
        var confettiPapers = new Array();
        ConfettiPaper.bounds = new Vector2(canvasWidth, canvasHeight);
        for (i = 0; i < confettiPaperCount; i++) {
            confettiPapers[i] = new ConfettiPaper(random() * canvasWidth, random() * canvasHeight);
        }
        this.resize = function() {
            canvasWidth = canvasParent.offsetWidth;
            canvasHeight = canvasParent.offsetHeight;
            canvas.width = canvasWidth * retina;
            canvas.height = canvasHeight * retina;
            ConfettiPaper.bounds = new Vector2(canvasWidth, canvasHeight);
            ConfettiRibbon.bounds = new Vector2(canvasWidth, canvasHeight);
        }
        this.start = function() {
            this.stop()
            var context = this;
            this.update();
        }
        this.stop = function() {
            cAF(this.interval);
        }
        this.update = function() {
            var i = 0;
            context.clearRect(0, 0, canvas.width, canvas.height);
            for (i = 0; i < confettiPaperCount; i++) {
                confettiPapers[i].Update(duration);
                confettiPapers[i].Draw(context);
            }
            for (i = 0; i < confettiRibbonCount; i++) {
                confettiRibbons[i].Update(duration);
                confettiRibbons[i].Draw(context);
            }
            this.interval = rAF(function() {
                confetti.update();
            });
        }
		}
		
		var confetti = new confetti.Context('confetti');
		$window.addEventListener('resize', function(event) {
                	confetti.resize();
		});
       
        return {
        	// call this method to trigger the konfetti rain animation
            makeItRainKonfetti: function(durationInSeconds) {
            	
            	// make sure animation is just running once
    			if (isRaining) {
    				return;
    			}
    			isRaining = true;
            		
            	// show canvas and start animation
    			document.getElementById("confetti").style.display = "initial";
    			document.getElementById("confetti").className = "fadein";
    			confetti.start();
				
    			// set timer when animation should fade out
    			$timeout(function() {
        			document.getElementById("confetti").className = "fadeout";
        			$timeout(function() {
            			document.getElementById("confetti").style.display = "none";
            			confetti.stop();
            			isRaining = false;
        			}, 500);
    			}, durationInSeconds * 1000);
            	
                return;
            }
        };
 })

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
                                                    })
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
            }
        };
});
