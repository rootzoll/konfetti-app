angular.module('starter.api', [])

    .factory('ApiService', function($log, $timeout, AppContext, $http) {

        // the possible API servers for app
        var apiUrlBaseLocalhost  = "http://localhost:9000/konfetti/api";
        var apiUrlBaseDevServer  = "http://fourcores2016.cloudapp.net:9000/konfetti/api";
        var apiUrlBaseProdServer = "https://konfetti-prod.testserver.de/konfetti/api";

        // SET HERE THE SERVER YOU WANT TO TALK TO FOM THE OPTIONS ABOVE
        var activeServerUrl = apiUrlBaseDevServer;

        var getBasicHttpHeaderConfig = function() {
            var account = AppContext.getAccount();
            var basicConfig = {
                timeout: 6000,
                cache: false,
                headers: {
                    'X-CLIENT-ID': account.clientId+'',
                    'X-CLIENT-SECRET': account.clientSecret+''
                }
            };
            return basicConfig;
        };

        return {
            runningDevelopmentEnv: function () {
                return activeServerUrl==apiUrlBaseLocalhost;
            },
            createAccount: function(win, fail) {

                // CONFIG
                var config = getBasicHttpHeaderConfig();
                config.method = 'POST';
                config.url = activeServerUrl+'/account';
                // WIN
                var successCallback = function(response) {
                    win(response.data);
                };
                $http(config).then(successCallback, fail);

            },
            updateAccount: function(accountObj, win, fail) {

                // CONFIG
                var config = getBasicHttpHeaderConfig();
                config.method = 'PUT';
                config.url = activeServerUrl+'/account/'+accountObj.id;
                config.data = accountObj;
                // WIN
                var successCallback = function(response) {
                    response.data.clientId = accountObj.clientId;
                    response.data.clientSecret = accountObj.clientSecret;
                    win(response.data);
                };
                $http(config).then(successCallback, fail);

            },
            readAccount: function(accountObj, win, fail) {

                // CONFIG
                var config = getBasicHttpHeaderConfig();
                config.method = 'GET';
                config.url = activeServerUrl+'/account/'+accountObj.id;
                // WIN
                var successCallback = function(response) {
                    response.data.clientId = accountObj.clientId;
                    response.data.clientSecret = accountObj.clientSecret;
                    win(response.data);
                };
                $http(config).then(successCallback, fail);

            },
            // build the public URL for media
            getImageUrlFromMediaItem: function(mediaItemID) {
                return activeServerUrl+"/media/"+mediaItemID+"/image";
            },
            // api URL
            getApiUrlBase: function() {
                return activeServerUrl;
            },
            // gets called once a user starts a chat
            createChat: function(requestId, hostId, partnerId, win, fail) {

                var chatObj = {
                    requestId : requestId,
                    hostId : hostId,
                    members : [partnerId]
                };

                // CONFIG
                var config = getBasicHttpHeaderConfig();
                config.method = 'POST';
                config.url = activeServerUrl+'/chat';
                config.data = chatObj;
                // WIN
                var successCallback = function(response) {
                    win(response.data);
                };
                $http(config).then(successCallback, fail);

            },
            // gets called once a user starts a chat
            loadChat: function(chatId, win, fail) {

                // CONFIG
                var config = getBasicHttpHeaderConfig();
                config.method = 'GET';
                config.url = activeServerUrl+'/chat/'+chatId;
                // WIN
                var successCallback = function(response) {
                    win(response.data);
                };
                $http(config).then(successCallback, fail);

            },
            // post a chat text message to a chat
            sendChatTextItem: function(chatId, text, win, fail) {

                var mediaObj = {
                    type : 'java.lang.String',
                    data : text
                };

                var messageObj = {
                    chatId : chatId,
                    itemId : 0
                };

                // CONFIG
                var config = getBasicHttpHeaderConfig();
                config.method = 'POST';
                config.url = activeServerUrl+'/media';
                config.data = mediaObj;

                // WIN - second step
                var successCallback2 = function(response) {
                    win(response.data);
                };

                // WIN
                var successCallback = function(response) {
                    messageObj.itemId = response.data.id;
                    var config2 = getBasicHttpHeaderConfig();
                    config2.method = 'POST';
                    config2.url = activeServerUrl+'/chat/'+chatId+"/message";
                    config2.data = messageObj;
                    $http(config2).then(successCallback2, fail);
                };

                $http(config).then(successCallback, fail);

            },
            // clients sends a text with a given language code ('de', 'ar', ...)
            // and server creates a multi lang media item from it by using autotranslate
            // returns just empty object with the id of the media item, so that translation can be done async by backend pipeline
            createMediaItemAutoTranslate: function(text, langCode, win, fail) {

                var mediaObjJson = "{type:'de.konfetti.data.mediaitem.MultiLang',data:{"+langCode+":{text:'"+text+"',translator:0}}}";
                var mediaObj = JSON.parse(mediaObjJson);

                // CONFIG
                var config = getBasicHttpHeaderConfig();
                config.method = 'POST';
                config.url = activeServerUrl+'/media';
                config.data = mediaObj;
                // WIN
                var successCallback = function(response) {
                    win(response.data);
                };
                $http(config).then(successCallback, fail);

            },
            loadPartylist: function(lat, lon, win, fail) {

                // CONFIG
                var config = getBasicHttpHeaderConfig();
                config.method = 'GET';
                config.url = activeServerUrl+'/party?lat='+encodeURIComponent(lat)+'&lon='+encodeURIComponent(lon);
                // WIN
                var successCallback = function(response) {

                    for (var i=0; i<response.data.length; i++) {
                        var party = response.data[i];
                        if (typeof party.requests == "undefined") party.requests = [];
                        if (typeof party.notifications == "undefined") party.notifications = [];
                        if (party.requests == null) party.requests = [];
                        if (party.notifications == null) party.notifications = [];
                    }

                    win(response.data);
                };
                $http(config).then(successCallback, fail);

            },
            loadParty: function(partyId, win, fail) {

                var localState = AppContext.getLocalState();
                if (typeof localState.lastPartyUpdates[partyId] == "undefined") localState.lastPartyUpdates[partyId] = 0;

                // CONFIG
                var config = getBasicHttpHeaderConfig();
                config.method = 'GET';
                config.url = activeServerUrl+'/party/'+partyId+'?lastTS='+localState.lastPartyUpdates[partyId];
                // WIN
                var successCallback = function(response) {

                    if (typeof response.data.requests == "undefined") response.data.requests = [];
                    if (typeof response.data.notifications == "undefined") response.data.notifications = [];
                    if (response.data.requests == null) response.data.requests = [];
                    if (response.data.notifications == null) response.data.notifications = [];

                    // go thru requests and optimize data
                    for (var i=0; i<response.data.requests.length; i++) {
                        var multiLangTitle = response.data.requests[i].titleMultiLang;
                        if ((typeof multiLangTitle == "undefined") || (multiLangTitle==null)) continue;
                        response.data.requests[i].titleMultiLang.data = JSON.parse(multiLangTitle.data);
                    }

                    // remember highest notification TS
                    var newLastNotiTS = localState.lastPartyUpdates[partyId];
                    if (typeof response.data.notifications != "undefined") {
                       for (var i=0; i < response.data.notifications.length; i++) {
                           if (response.data.notifications[i].timeStamp>newLastNotiTS) newLastNotiTS = response.data.notifications[i].timeStamp;
                       }
                       localState.lastPartyUpdates[partyId] = newLastNotiTS;
                       AppContext.setLocalState(localState);
                    }

                    win(response.data);
                };
                $http(config).then(successCallback, fail);

            },
            loadRequest: function(partyId, requestId, win, fail) {

                // CONFIG
                var config = getBasicHttpHeaderConfig();
                config.method = 'GET';
                config.url = activeServerUrl+'/party/'+partyId+'/request/'+requestId;
                // WIN
                var successCallback = function(response) {
                    win(response.data);
                };
                $http(config).then(successCallback, fail);

            },
            loadMediaItem: function(itemId, win, fail){

                // CONFIG
                var config = getBasicHttpHeaderConfig();
                config.method = 'GET';
                config.url = activeServerUrl+'/media/'+itemId;
                // WIN
                var successCallback = function(response) {
                    win(response.data);
                };
                $http(config).then(successCallback, fail);

            },
            upvoteRequest: function(partyId, requestId, confettiCount, win, fail) {

                // CONFIG
                var config = getBasicHttpHeaderConfig();
                config.method = 'GET';
                config.url = activeServerUrl+'/party/'+partyId+'/request/'+requestId+'?upvoteAmount='+confettiCount;
                // WIN
                var successCallback = function(response) {
                    win(response.data);
                };
                $http(config).then(successCallback, fail);

            },
            makeMediaItemPublic: function(requestId, mediaId, win, fail) {

                // CONFIG
                var config = getBasicHttpHeaderConfig();
                config.method = 'GET';
                config.url = activeServerUrl+'/party/action/request/'+requestId+'?action=publicMedia&json='+mediaId;
                // WIN
                var successCallback = function(response) {
                    win(response.data);
                };
                $http(config).then(successCallback, fail);

            },
            deleteItemFromRequest: function(requestId, mediaId, win, fail) {

                // CONFIG
                var config = getBasicHttpHeaderConfig();
                config.method = 'GET';
                config.url = activeServerUrl+'/party/action/request/'+requestId+'?action=deleteMedia&json='+mediaId;
                // WIN
                var successCallback = function(response) {
                    win(response.data);
                };
                $http(config).then(successCallback, fail);

            },
            generateCoupons: function(partyId, count, amount, email, lang, win, fail) {

                // CONFIG
                var config = getBasicHttpHeaderConfig();
                config.method = 'GET';
                config.timeout = 60000;
                config.url = activeServerUrl+'/account/coupons/'+partyId+'?count='+count+'&amount='+amount+'&email='+encodeURIComponent(email)+'&locale='+lang;
                // WIN
                var successCallback = function(response) {
                    win();
                };
                $http(config).then(successCallback, fail);

            },
            // post a request
            postRequest: function(requestObj, langCode, win, fail) {

                // CONFIG
                var config = getBasicHttpHeaderConfig();
                config.method = 'POST';
                config.url = activeServerUrl+'/party/'+requestObj.partyId+'/'+langCode+'/request';
                config.data = requestObj;
                // WIN
                var successCallback = function(response) {
                    win(response.data);
                };
                $http(config).then(successCallback, fail);
            },
            // delete a request or a part of a request
            // mediaitemId = if 0 or null its the complete request
            // if a mediaitemId is given then just a part of the request gets deleted
            deleteRequest: function(requestId, mediaitemId, win, fail) {

                // CONFIG
                var config = getBasicHttpHeaderConfig();
                config.method = 'DELETE';
                config.url = activeServerUrl+'/party/0/request/'+requestId;
                // WIN
                var successCallback = function(response) {
                    win(response.data);
                };
                $http(config).then(successCallback, fail);
            },
            postTextMediaItemOnRequest: function(requestId, text, langCode, win, fail) {

                var mediaObj = {
                    type : 'java.lang.String',
                    data : text
                };

                // CONFIG
                var config = getBasicHttpHeaderConfig();
                config.method = 'POST';
                config.url = activeServerUrl+'/media';
                config.data = mediaObj;
                // WIN
                var successCallback = function(response) {
                    if (requestId>0) {
                        // add media item to request
                        var config2 = getBasicHttpHeaderConfig();
                        config2.method = 'GET';
                        config2.url = activeServerUrl+'/party/action/request/'+requestId+"?action=addMedia&json="+response.data.id;
                        var orgResponse = response;
                        $http(config2).then(function(){
                            win(orgResponse.data);
                        }, fail);
                    } else {
                        win(response.data);
                    }
                };
                $http(config).then(successCallback, fail);
            },
            postImageMediaItemOnRequest: function(requestId, base64, win, fail) {

                var mediaObj = {
                    type : 'Image',
                    data : base64
                };

                // CONFIG
                var config = getBasicHttpHeaderConfig();
                config.method = 'POST';
                config.url = activeServerUrl+'/media';
                config.data = mediaObj;
                // WIN
                var successCallback = function(response) {
                    if (requestId>0) {
                        // add media item to request
                        var config2 = getBasicHttpHeaderConfig();
                        config2.method = 'GET';
                        config2.url = activeServerUrl+'/party/action/request/'+requestId+"?action=addMedia&json="+response.data.id;
                        var orgResponse = response;
                        $http(config2).then(function(){
                            win(orgResponse.data);
                        }, fail);
                    } else {
                        win(response.data);
                    }
                };
                $http(config).then(successCallback, fail);
            },
            postLocationMediaItemOnRequest: function(requestId, lat, lon, win, fail) {

                var mediaObj = {
                    type : 'Location',
                    data : JSON.stringify({lat:lat,lon:lon})
                };

                // CONFIG
                var config = getBasicHttpHeaderConfig();
                config.method = 'POST';
                config.url = activeServerUrl+'/media';
                config.data = mediaObj;
                // WIN
                var successCallback = function(response) {
                    if (requestId>0) {
                        // add media item to request
                        var config2 = getBasicHttpHeaderConfig();
                        config2.method = 'GET';
                        config2.url = activeServerUrl+'/party/action/request/'+requestId+"?action=addMedia&json="+response.data.id;
                        var orgResponse = response;
                        $http(config2).then(function(){
                            win(orgResponse.data);
                        }, fail);
                    } else {
                        win(response.data);
                    }
                };
                $http(config).then(successCallback, fail);
            },
            rewardRequest: function(requestId, arrayOfRewardGetterUserIds, win, fail) {

                var json = JSON.stringify(arrayOfRewardGetterUserIds);

                // CONFIG
                var config = getBasicHttpHeaderConfig();
                config.method = 'GET';
                config.url = activeServerUrl+'/party/action/request/'+requestId+"?action=reward&json="+json;
                // WIN
                var successCallback = function(response) {
                    win(response.data);
                };
                $http(config).then(successCallback, fail);
            },
            // a chat belonging to a request should no longer be shown
            // to author - dont delete chat, can get visible again if
            // chat partner send new message if foreverMute = false
            muteChatOnRequest: function(requestId, chatId, foreverMute, win, fail) {

                // CONFIG
                var config = getBasicHttpHeaderConfig();
                config.method = 'GET';
                config.url = activeServerUrl+'/party/action/request/'+requestId+"?action=muteChat&json="+chatId;
                // WIN
                var successCallback = function(response) {
                    win(response.data);
                };
                $http(config).then(successCallback, fail);

            },
            setStateOfRequestToProcessing: function(requestId, win, fail) {

                // CONFIG
                var config = getBasicHttpHeaderConfig();
                config.method = 'GET';
                config.url = activeServerUrl+'/party/action/request/'+requestId+"?action=processing";
                // WIN
                var successCallback = function(response) {
                    win(response.data);
                };
                $http(config).then(successCallback, fail);
            },
            setStateOfRequestToReOpen: function(requestId, win, fail) {

                // CONFIG
                var config = getBasicHttpHeaderConfig();
                config.method = 'GET';
                config.url = activeServerUrl+'/party/action/request/'+requestId+"?action=open";
                // WIN
                var successCallback = function(response) {
                    win(response.data);
                };
                $http(config).then(successCallback, fail);
            },
            // set the review result on a request
            // mediaItemId - if rejection is targeted at a sub element of the request (0 or null = the request itself)
            // messageStr - just optional in case reviewer likes to chat back the reason
            reviewResultOnRequest : function(requestId, allowRequestBool, mediaItemId, messageStr, win, fail) {

                var action = "rejected";
                if (allowRequestBool) action = "open";

                // CONFIG
                var config = getBasicHttpHeaderConfig();
                config.method = 'GET';
                config.url = activeServerUrl+'/party/action/request/'+requestId+"?action="+action;
                // WIN
                var successCallback = function(response) {
                    win(response.data);
                };
                $http(config).then(successCallback, fail);

            },
            markNotificationAsRead: function(notificationId, win, fail) {

                // CONFIG
                var config = getBasicHttpHeaderConfig();
                config.method = 'GET';
                config.url = activeServerUrl+'/party/0/notification/'+notificationId+"?action=delete";
                // WIN
                var successCallback = function(response) {
                    win(response.data);
                };
                $http(config).then(successCallback, fail);

            },
            redeemCode: function(codeStr, langCode, win, fail) {

                // CONFIG
                var config = getBasicHttpHeaderConfig();
                config.method = 'GET';
                config.url = activeServerUrl+'/account/redeem/'+codeStr;
                // WIN
                var successCallback = function(response) {
                    win(response.data);
                };
                $http(config).then(successCallback, fail);

            }

        };

    })

    /*
     * WebSocket Connection to API
     */

    .service("WebSocketService", function($q, $timeout, ApiService) {

        var service = {}, listener = $q.defer(), socket = {
            client: null,
            stomp: null
        };

        service.RECONNECT_TIMEOUT = 30000;
        service.SOCKET_URL = ApiService.getApiUrlBase()+"/websocket";
        service.CHAT_TOPIC = "/out/updates";
        service.CHAT_BROKER = "/in/websocket";

        service.isConnected = false;

        service.listener = null;

        service.init = function(username, password) {
            initialize(username, password);
        };

        // service.receive(function(message){..})
        service.receive = function(listenerName, onReceive) {
            service.listener = onReceive;
        };

        service.send = function(data) {
            var id = Math.floor(Math.random() * 1000000);
            socket.stomp.send(service.CHAT_BROKER, {
                priority: 9
            }, JSON.stringify({
                command: "ping",
                data: data
            }));
        };

        var reconnect = function() {
            $timeout(function() {
                service.isConnected = false;
                initialize();
            }, this.RECONNECT_TIMEOUT);
        };

        var startListener = function(frame) {

            service.isConnected = true;

            console.log("CHECK FOR USER INFO LATER:");
            console.dir(frame);

            var suffix = "";
            if ((typeof frame != "undefined") && (typeof frame.headers['queue-suffix'] != "undefined"))
                suffix = frame.headers['queue-suffix'];

            socket.stomp.subscribe(service.CHAT_TOPIC+suffix, function(data) {
                if (service.listener!=null) service.listener(JSON.parse(data.body));
            });
        };

        var initialize = function(user, pass) {
            if (service.isConnected) return;
            socket.client = new SockJS(service.SOCKET_URL);
            socket.stomp = Stomp.over(socket.client);
            socket.stomp.connect(user,pass,startListener);
            socket.stomp.onclose = reconnect;
        };

        return service;
    });