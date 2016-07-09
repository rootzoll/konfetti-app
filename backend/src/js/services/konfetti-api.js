angular.module('RDash').factory('KonfettiApi', ['$http', '$uibModal', KonfettiApi]);

function KonfettiApi($http, $uibModal) {

    // available server options
    var apiUrlLocalDevelopment = "http://localhost:9000/konfetti/api";
    var apiUrlDevelopmentServer = "http://fourcores2016.cloudapp.net:9000/konfetti/api";
    var apiUrlProductionServer = "https://konfetti-prod.testserver.de/konfetti/api";

    // SET WHICH SERVER SHOULD BE ACTIVE

    var apiUrl = apiUrlDevelopmentServer; // choose from above

    // SECURITY TESTING
    if (apiUrlProductionServer.indexOf("https")!=0) {
        alert("SECURITY EXCEPTION: PRODUCTION API NEEDS TO RUN ON HTTPS !!");
        return {};
    }

    var adminPassword = "";

    var waitForPassword = function(win) {
        if (adminPassword!="") {
            win();
            return;
        }
        var modalInstance = $uibModal.open({
            animation: true,
            backdrop: 'static',
            template: '<div style="width: 200px;margin: 12px;">Backend Admin Password:'+
            ' <input ng-model="password" type="password" style="margin-top: 10px;" onkeypress="(window.event.charCode==13)?document.getElementById(\'login\').click():void(0);"/>'+
            '<button ng-click="setPassword(password)" id="login" type="button" class="btn btn-primary btn-md" style="margin-top:12px;">'+
            'Login</button></div>',
            size: 'sm',
            controller: ['$scope',function($scope) {
                $scope.password = "";
                $scope.setPassword = function(pass) {
                    if (pass=="") return;
                    adminPassword = pass;
                    modalInstance.close();
                    win();
                };
            }]
        });
    };

    var modalAlert = function(text, win) {
        var modalInstance = $uibModal.open({
            animation: true,
            template: '<div style="width: 280px; margin: 12px;padding: 8px;">' + text +
            '<br><button ng-click="close()" type="button" class="btn btn-primary btn-md" style="margin-top:12px;">'+
            'OK</button></div>',
            size: 'sm',
            controller: ['$scope',function($scope) {
                $scope.close = function(pass) {
                    modalInstance.close();
                    if (typeof win != "undefined") win();
                };
            }]
        });
    };

    var getBasicHttpHeaderConfig = function() {
        var basicConfig = {
            timeout: 6000,
            cache: false,
            headers: {
                'X-ADMIN-PASSWORD': adminPassword+''
            }
        };
        return basicConfig;
    };

    var isPasswordWrong = function(err) {
        if ((typeof err != "undefined") && (err != null)) {
            if ((typeof err.data != "undefined") && (err.data != null)) {
                if ((typeof err.data.message != "undefined") && (err.data.message != null)) {
                    if (err.data.message.indexOf("FAIL-PASSWORD")==0) {
                        adminPassword = "";
                        return true;
                    }
                }
            }
        }
        return false;
    };

    return {
        isRunningDevelopmentServer: function() {
            if (apiUrlProductionServer==apiUrl) return false;
            return true;
        },
        loadDashBoardInfo : function(win, fail) {

            var request = function(win, fail) {
                var config = getBasicHttpHeaderConfig();
                config.method = 'GET';
                config.url = apiUrl+'/party/dashboard';
                var successCallback = function(response) {
                    win(response.data);
                };
                var failCallback = function(err) {
                    if (isPasswordWrong(err)) {
                        // try again - recursive
                        modalAlert("PASSWORD IS WRONG", function(){
                            waitForPassword(function(){
                                request(win, fail);
                            });
                        });
                    } else {
                        fail();
                    }
                };
                $http(config).then(successCallback, failCallback);
            };

            waitForPassword(function(){
                request(win, fail);
            });

        },
        loadAllUsers : function(win, fail) {

            var request = function(win, fail) {
                var config = getBasicHttpHeaderConfig();
                config.method = 'GET';
                config.url = apiUrl + '/account';
                // WIN
                var successCallback = function (response) {
                    win(response.data);
                };
                var failCallback = function (err) {
                    if (isPasswordWrong(err)) {
                        // try again - recursive
                        modalAlert("PASSWORD IS WRONG", function () {
                            waitForPassword(function () {
                                request(win, fail);
                            });
                        });
                    } else {
                        fail();
                    }
                };
                $http(config).then(successCallback, failCallback);
            };

            waitForPassword(function(){
                request(win, fail);
            });

        },
        loadAllParties : function(win, fail) {

            var request = function(win, fail) {
                var config = getBasicHttpHeaderConfig();
                config.method = 'GET';
                config.url = apiUrl + '/party';
                // WIN
                var successCallback = function (response) {
                    win(response.data);
                };
                var failCallback = function (err) {
                    if (isPasswordWrong(err)) {
                        // try again - recursive
                        modalAlert("PASSWORD IS WRONG", function () {
                            waitForPassword(function () {
                                request(win, fail);
                            });
                        });
                    } else {
                        fail();
                    }
                };
                $http(config).then(successCallback, failCallback);
            };

            waitForPassword(function(){
                request(win, fail);
            });

        },
        loadParty : function(partyId, win, fail) {

            var request = function(win, fail) {
                var config = getBasicHttpHeaderConfig();
                config.method = 'GET';
                config.url = apiUrl + '/party/' + partyId;
                // WIN
                var successCallback = function (response) {
                    win(response.data);
                };
                var failCallback = function (err) {
                    if (isPasswordWrong(err)) {
                        // try again - recursive
                        modalAlert("PASSWORD IS WRONG", function () {
                            waitForPassword(function () {
                                request(win, fail);
                            });
                        });
                    } else {
                        fail();
                    }
                };
                $http(config).then(successCallback, failCallback);
            };

            waitForPassword(function(){
                request(win, fail);
            });

        },
        createParty : function(party, win, fail) {

            var request = function(win, fail) {
                var config = getBasicHttpHeaderConfig();
                config.method = 'POST';
                config.url = apiUrl + '/party';
                config.data = party;
                // WIN
                var successCallback = function (response) {
                    win(response.data);
                };
                var failCallback = function (err) {
                    if (isPasswordWrong(err)) {
                        // try again - recursive
                        modalAlert("PASSWORD IS WRONG", function () {
                            waitForPassword(function () {
                                request(win, fail);
                            });
                        });
                    } else {
                        fail();
                    }
                };
                $http(config).then(successCallback, failCallback);
            };

            waitForPassword(function(){
                request(win, fail);
            });
        },
        generateKonfetti : function(partyId, count, amount, win, fail) {

            var request = function(win, fail) {

                var config = getBasicHttpHeaderConfig();
                config.method = 'GET';
                config.url = apiUrl + '/account/coupons-admin/'+partyId+'?count='+count+'&amount='+amount;
               
                // WIN
                var successCallback = function (response) {
                    win(response.data);
                };
                var failCallback = function (err) {
                    if (isPasswordWrong(err)) {
                        // try again - recursive
                        modalAlert("PASSWORD IS WRONG", function () {
                            waitForPassword(function () {
                                request(win, fail);
                            });
                        });
                    } else {
                        fail();
                    }
                };
                $http(config).then(successCallback, failCallback);
            };

            waitForPassword(function(){
                request(win, fail);
            });
        },
        generateCodes : function(partyId, count, type, win, fail) {

            var request = function(win, fail) {

                var config = getBasicHttpHeaderConfig();
                config.method = 'GET';
                config.url = apiUrl + '/account/codes-admin/'+partyId+'?count='+count+'&type='+type;
               
                // WIN
                var successCallback = function (response) {
                    win(response.data);
                };
                var failCallback = function (err) {
                    if (isPasswordWrong(err)) {
                        // try again - recursive
                        modalAlert("PASSWORD IS WRONG", function () {
                            waitForPassword(function () {
                                request(win, fail);
                            });
                        });
                    } else {
                        fail();
                    }
                };
                $http(config).then(successCallback, failCallback);
            };

            waitForPassword(function(){
                request(win, fail);
            });
        },
        updateParty : function(party, win, fail) {

            var request = function(win, fail) {
                var config = getBasicHttpHeaderConfig();
                config.method = 'PUT';
                config.url = apiUrl + '/party';
                config.data = party;
                // WIN
                var successCallback = function (response) {
                    win(response.data);
                };
                var failCallback = function (err) {
                    if (isPasswordWrong(err)) {
                        // try again - recursive
                        modalAlert("PASSWORD IS WRONG", function () {
                            waitForPassword(function () {
                                request(win, fail);
                            });
                        });
                    } else {
                        fail();
                    }
                };
                $http(config).then(successCallback, failCallback);
            };

            waitForPassword(function(){
                request(win, fail);
            });
        },
        deleteParty : function(party, win, fail) {

            var request = function(win, fail) {
                var config = getBasicHttpHeaderConfig();
                config.method = 'DELETE';
                config.url = apiUrl + '/party/'+ party.id;
                // WIN
                var successCallback = function (response) {
                    win();
                };
                var failCallback = function (err) {
                    if (isPasswordWrong(err)) {
                        // try again - recursive
                        modalAlert("PASSWORD IS WRONG", function () {
                            waitForPassword(function () {
                                request(win, fail);
                            });
                        });
                    } else {
                        fail();
                    }
                };
                $http(config).then(successCallback, failCallback);
            };

            waitForPassword(function(){
                request(win, fail);
            });
        },
        modalAlert : function(text, win) {
            modalAlert(text, win);
        },
        logout : function() {
            adminPassword = "";
        }
    };

}