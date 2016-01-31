angular.module('starter.api', [])

    .factory('ApiService', function($log, $timeout, MultiLangToolbox, AppContext, MockData, $http) {

        // the possible API servers for app
        var apiUrlJustUseMock    = "mock";
        var apiUrlBaseLocalhost  = "http://localhost:9000/konfetti/api";
        var apiUrlBaseDevServer  = "https://konfetti-dev.testserver.de/konfetti/api";
        var apiUrlBaseProdServer = "https://konfetti-prod.testserver.de/konfetti/api";

        // SET HERE THE SERVER YOU WANT TO TALK TO FOM THE OPTIONS ABOVE
        var activeServerUrl = apiUrlBaseLocalhost;

        var errorPossibility = 0.0;
        var supportedLangs = ['de','en','ar'];
        var chatItemIdCounter = 123;

        var isRunningMock = function() {
            return activeServerUrl===apiUrlJustUseMock;
        };

        var fallbackToMockOnBrowserOrFail = function(mockCallback, fail, err) {
            if (AppContext.getRunningOS()==='browser') {
                console.warn("FAILED REQUEST to '"+activeServerUrl+"' - Fallback to FakeData");
                activeServerUrl = apiUrlJustUseMock;
                mockCallback();
            } else {
                fail(err);
            }
        };

        var getBasicHttpHeaderConfig = function() {
            var account = AppContext.getAccount();
            var basicConfig = {
                timeout: 6000,
                headers: {
                    'X-CLIENT-ID': account.clientId+'',
                    'X-CLIENT-SECRET': account.clientSecret+''
                }
            };
            return basicConfig;
        };

        return {
            createAccount: function(win, fail) {

                // ### MOCK MODE ###

                var mockCallback = function() {
                    context.userId = 1;
                    context.clientId = 1;
                    win({
                        clientId: 2,
                        clientSecret: "6dd615a7-1c1e-490a-ba6b-8f008bd25d31",
                        userId: 2})
                };
                if (isRunningMock()) {
                    $timeout(function(){mockCallback();},1000);
                    return;
                }

                // ### SERVER MODE ###

                // CONFIG
                var config = getBasicHttpHeaderConfig();
                config.method = 'POST';
                config.url = activeServerUrl+'/account';
                // WIN
                var successCallback = function(response) {
                    win(response.data);
                };
                // FAIL
                var errorCallback = function(response) {
                    fallbackToMockOnBrowserOrFail(mockCallback, fail, response);
                };
                $http(config).then(successCallback, errorCallback);

            },
            // gets called once a user starts a chat
            createChat: function(requestId, hostId, partnerId, win, fail) {

                // ### MOCK MODE ###

                var mockCallback = function() {
                    win(MockData.getMockData('chat1'));
                };
                if (activeServerUrl===apiUrlJustUseMock)
                {
                    $timeout(function(){mockCallback();},1000);
                    console.warn("TODO: service-api createChat() CREATE SERVER CALL");
                    return;
                }

                // ### SERVER MODE ###

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
                    console.dir(response.data);
                    win(response.data);
                };
                // FAIL
                var errorCallback = function(response) {
                    console.warn("FAIL createChat:");
                    console.dir(response);
                    fallbackToMockOnBrowserOrFail(mockCallback, fail, response);
                };
                $http(config).then(successCallback, errorCallback);

            },
            // gets called once a user starts a chat
            loadChat: function(chatId, win, fail) {

                // ### MOCK MODE ###

                var mockCallback = function() {
                    win(MockData.getMockData('chat2'));
                };
                if (activeServerUrl===apiUrlJustUseMock)
                {
                    $timeout(function(){mockCallback();},1000);
                    console.warn("TODO: service-api loadChat() CREATE SERVER CALL");
                    return;
                }

                // ### SERVER MODE ###

                // CONFIG
                var config = getBasicHttpHeaderConfig();
                config.method = 'GET';
                config.url = activeServerUrl+'/chat/'+chatId;
                // WIN
                var successCallback = function(response) {
                    console.dir(response.data);
                    win(response.data);
                };
                // FAIL
                var errorCallback = function(response) {
                    console.warn("FAIL loadChat:");
                    console.dir(response);
                    fallbackToMockOnBrowserOrFail(mockCallback, fail, response);
                };
                $http(config).then(successCallback, errorCallback);

            },
            // return an empty chat item (no server request)
            getChatTItemPrototype : function() {
                return cloneObject(MockData.getMockData('chatItemPrototype'));
            },
            // post a chat text message to a chat
            sendChatTextItem: function(chatId, text, win, fail) {

                // ### MOCK MODE ###

                var mockCallback = function() {
                    // return stored chat item with id - this one just fake
                    var itemObj = cloneObject(MockData.getMockData('chatItemPrototype'));
                    itemObj.id = chatItemIdCounter++;
                    itemObj.userId = context.userId;
                    itemObj.time = Date.now();
                    win(itemObj);
                };
                if (activeServerUrl===apiUrlJustUseMock)
                {
                    $timeout(function() {mockCallback();},1000);
                    console.warn("TODO: service-api sendChatTextItem() CREATE SERVER CALL");
                    return;
                }

                // ### SERVER MODE ###

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
                // FAIL
                var errorCallback = function(response) {
                    console.warn("FAIL postTextMediaItemOnRequest:");
                    console.dir(response);
                    fallbackToMockOnBrowserOrFail(mockCallback, fail, response);
                };
                // WIN - second step
                var successCallback2 = function(response) {
                    console.log("WIN result of 2nd call");
                    console.dir(response.data);
                    win(response.data);
                };
                // WIN
                var successCallback = function(response) {
                    console.log("WIN result of 1st call");
                    console.dir(response.data);
                    messageObj.itemId = response.data.id;

                    var config2 = getBasicHttpHeaderConfig();
                    config2.method = 'POST';
                    config2.url = activeServerUrl+'chat/'+chatId+"/message";
                    config2.data = messageObj;
                    $http(config2).then(successCallback2, errorCallback);
                };

                $http(config).then(successCallback, errorCallback);

            },
            // clients sends a text with a given language code ('de', 'ar', ...)
            // and server creates a multi lang media item from it by using autotranslate
            // returns just empty object with the id of the media item, so that translation can be done async by backend pipeline
            createMediaItemAutoTranslate: function(text, langCode, win, fail) {

                // ### MOCK MODE ###

                var mockCallback = function() {
                    // return stored chat item with id - this one just fake
                    var itemObj = cloneObject(MockData.getMockData('mediaItemPrototype'));
                    itemObj.id = Date.now();
                    win(itemObj);

                    // simulate persistence
                    itemObj.lastUpdateTS = Date.now;
                    itemObj.type = "de.konfetti.data.mediaitem.MultiLang";

                    itemObj.langs = [langCode];
                    var comStr = "itemObj.lang_"+langCode+"='"+text+"';";
                    console.log("COMMAND:"+comStr);
                    eval(comStr);
                    console.log("DYNAMIC MULTILANG OBJECT");
                    console.dir(itemObj);

                    alert("TODO: simulate instant auto translation");
                    // go thru all supported languages
                    for (var i=0; i<supportedLangs.length; i++) {
                        // check if item has translaton
                        var lang = supportedLangs[i];

                        console.log(lang);

                        if (MultiLangToolbox.langIsAvailable(itemObj,lang)) {
                            console.log("GOT "+lang);
                        } else {
                            console.log("NOT "+lang);
                        }
                    }
                };
                if (activeServerUrl===apiUrlJustUseMock)
                {
                    $timeout(function(){mockCallback();},1000);
                    console.warn("TODO: service-api createMediaItemAutoTranslate() CREATE SERVER CALL");
                    return;
                }

                var mediaObjJson = "{type:'de.konfetti.data.mediaitem.MultiLang',data:{"+langCode+":{text:'"+text+"',translator:0}}}";
                console.log("mediaobjJSON: "+mediaObjJson);
                var mediaObj = JSON.parse(mediaObjJson);

                // CONFIG
                var config = getBasicHttpHeaderConfig();
                config.method = 'POST';
                config.url = activeServerUrl+'/media';
                config.data = mediaObj;
                // WIN
                var successCallback = function(response) {
                    console.dir(response.data);
                    win(response.data);
                };
                // FAIL
                var errorCallback = function(response) {
                    console.dir(response);
                    console.warn("FAIL createMediaItemAutoTranslate");
                    fallbackToMockOnBrowserOrFail(mockCallback, fail, response);
                };
                $http(config).then(successCallback, errorCallback);

            },
            loadPartylist: function(lat, lon, win, fail) {

                // ### MOCK MODE ###

                var mockCallback = function() {
                    // one user can have multiple accounts=clients bound to user profile
                    // no login up front - multiple clients can be bound to one user within settings option
                    win([
                        {id: 1, lat: 2.34234, lon: 1.432423, meter: 566, new: 0}, // new = had no interaction yet
                        {id: 2, lat: 3.342, lon: 3.222, meter: 40000, new: 1}
                    ]);
                };
                if (activeServerUrl===apiUrlJustUseMock)
                {
                    $timeout(function(){mockCallback();},1000);
                    return;
                }

                // ### SERVER MODE ###

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
                // FAIL
                var errorCallback = function(response) {
                    console.dir(response);
                    console.warn("FAIL loadPartylist");
                    fallbackToMockOnBrowserOrFail(mockCallback, fail, response);
                };
                $http(config).then(successCallback, errorCallback);

            },
            loadParty: function(partyId, win, fail) {

                // ### MOCK MODE ###

                var addLastPostedRequest = function(partyId, requests) {
                    var r = MockData.getLastPostedRequest();
                    if ((r!=null) && (r.partyId==partyId)) {
                        requests.push(r);
                    }
                    return requests;
                };

                var mockCallback = function() {
                    // one user can have multiple accounts=clients bound to user profile
                    // no login up front - multiple clients can be bound to one user within settings option
                    if (partyId===1) {
                        var requests = [
                            MockData.getMockData('request11'),
                            MockData.getMockData('request14')
                        ];
                        requests = addLastPostedRequest(1, requests);
                        var party = MockData.getMockData('party1');
                        party.requests = requests;
                        party.notifications = MockData.getMockData('welcomeNotifaction');
                        win(party);
                    } else
                    if (partyId===2) {
                        var requests = [
                            MockData.getMockData('request12'),
                            MockData.getMockData('request13')
                        ];
                        requests = addLastPostedRequest(2, requests);
                        var party = MockData.getMockData('party2');
                        party.requests = requests;
                        party.notifications = MockData.getMockData('sampleNotifactions');
                        win(party);
                    } else {
                        fail(323);
                    }
                };
                if (activeServerUrl===apiUrlJustUseMock)
                {
                    $timeout(function(){mockCallback();},1000);
                    console.warn("TODO: service-api loadParty() CREATE SERVER CALL");
                    return;
                }

                // ### SERVER MODE ###

                // CONFIG
                var config = getBasicHttpHeaderConfig();
                config.method = 'GET';
                config.url = activeServerUrl+'/party/'+partyId;
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

                    //console.log("Result loadParty:");
                    //console.dir(response.data);
                    win(response.data);
                };
                // FAIL
                var errorCallback = function(response) {
                    console.dir(response);
                    console.warn("FAIL loadParty");
                    fallbackToMockOnBrowserOrFail(mockCallback, fail, response);
                };
                $http(config).then(successCallback, errorCallback);

            },
            loadRequest: function(partyId, requestId, win, fail) {

                // ### MOCK MODE ###

                var mockCallback = function() {
                    if (requestId==11) {
                        win(MockData.getMockData('request11'));
                    } else
                    if (requestId==12) {
                        win(MockData.getMockData('request12'));
                    } else
                    if (requestId==13) {
                        win(MockData.getMockData('request13'));
                    } else
                    if (requestId==999) {
                        win(MockData.getLastPostedRequest());
                    } else
                    if (requestId==14) {
                        win(MockData.getMockData('request14'));
                    } else {
                        $log.warn("Request("+requestId+") not found");
                        fail(353);
                    }
                };
                if (activeServerUrl===apiUrlJustUseMock)
                {
                    $timeout(function(){mockCallback();},1000);
                    console.warn("TODO: service-api loadRequest() CREATE SERVER CALL");
                    return;
                }

                // ### SERVER MODE ###

                // CONFIG
                var config = getBasicHttpHeaderConfig();
                config.method = 'GET';
                config.url = activeServerUrl+'/party/'+partyId+'/request/'+requestId;
                // WIN
                var successCallback = function(response) {
                    console.dir(response.data);
                    win(response.data);
                };
                // FAIL
                var errorCallback = function(response) {
                    console.dir(response);
                    console.warn("FAIL loadRequest");
                    fallbackToMockOnBrowserOrFail(mockCallback, fail, response);
                };
                $http(config).then(successCallback, errorCallback);

            },
            loadMediaItem: function(itemId, win, fail){

                // ### MOCK MODE ###

                var mockCallback = function() {

                        // default
                        var item = cloneObject(MockData.getMockData('mediaItemPrototype'));
                        item.id = itemId;
                        item.reviewed = 1;
                        item.type = "java.lang.String";
                        item.data = "[TODO LOADING "+itemId+"]";

                        // itemId 111
                        if (itemId==111) {
                            item = MockData.getMockData('mediaItemText111');
                        }

                        // deliver back
                        win(item);
                };
                if (activeServerUrl===apiUrlJustUseMock)
                {
                    $timeout(function(){mockCallback();},1000);
                    console.warn("TODO: service-api loadMediaItem() CREATE SERVER CALL");
                    return;
                }

                // ### SERVER MODE ###

                // CONFIG
                var config = getBasicHttpHeaderConfig();
                config.method = 'GET';
                config.url = activeServerUrl+'/media/'+itemId;
                // WIN
                var successCallback = function(response) {
                    //console.dir(response.data);
                    win(response.data);
                };
                // FAIL
                var errorCallback = function(response) {
                    console.dir(response);
                    console.warn("FAIL loadMediaItem");
                    fallbackToMockOnBrowserOrFail(mockCallback, fail, response);
                };
                $http(config).then(successCallback, errorCallback);

            },
            upvoteRequest: function(partyId, requestId, confettiCount, win, fail) {

                // ### MOCK MODE ###

                var mockCallback = function() {
                    if (Math.random()>errorPossibility) {
                        win();
                    } else {
                        // fail gets an error code (number) that is displays in user feedback for support
                        fail(235);
                    }
                };
                if (activeServerUrl===apiUrlJustUseMock)
                {
                    $timeout(function(){mockCallback();},1000);
                    console.warn("TODO: service-api upvoteRequest() CREATE SERVER CALL");
                    return;
                }

                // ### SERVER MODE ###

                // CONFIG
                var config = getBasicHttpHeaderConfig();
                config.method = 'GET';
                config.url = activeServerUrl+'/party/'+partyId+'/request/'+requestId+'?upvoteAmount='+confettiCount;
                // WIN
                var successCallback = function(response) {
                    //console.dir(response.data);
                    win(response.data);
                };
                // FAIL
                var errorCallback = function(response) {
                    console.dir(response);
                    console.warn("FAIL loadRequest");
                    fallbackToMockOnBrowserOrFail(mockCallback, fail, response);
                };
                $http(config).then(successCallback, errorCallback);

            },
            // post a
            postRequest: function(requestObj, langCode, win, fail) {

                // ### MOCK MODE ###

                var mockCallback = function() {
                    requestObj.state = "review";
                    requestObj.id = 999;
                    requestObj.userId = 1;
                    requestObj.time = Date.now();
                    MockData.putlastPostedRequest(requestObj);
                    win(requestObj);
                };
                if (activeServerUrl===apiUrlJustUseMock)
                {
                    $timeout(function(){mockCallback();},1000);
                    console.warn("TODO: service-api postRequest() CREATE SERVER CALL");
                    return;
                }

                // ### SERVER MODE ###

                // CONFIG
                var config = getBasicHttpHeaderConfig();
                config.method = 'POST';
                config.url = activeServerUrl+'/party/'+requestObj.partyId+'/'+langCode+'/request';
                config.data = requestObj;
                // WIN
                var successCallback = function(response) {
                    //console.dir(response.data);
                    win(response.data);
                };
                // FAIL
                var errorCallback = function(response) {
                    console.warn("FAIL postRequest:");
                    console.dir(response);
                    fallbackToMockOnBrowserOrFail(mockCallback, fail, response);
                };
                $http(config).then(successCallback, errorCallback);
            },
            // delete a request or a part of a request
            // mediaitemId = if 0 or null its the complete request
            // if a mediaitemId is given then just a part of the request gets deleted
            deleteRequest: function(requestId, mediaitemId, win, fail) {

                // ### MOCK MODE ###

                var mockCallback = function() {
                    win();
                };
                if (activeServerUrl===apiUrlJustUseMock)
                {
                    $timeout(function(){mockCallback();},1000);
                    console.warn("TODO: service-api deleteRequest() CREATE SERVER CALL");
                    return;
                }

                // ### SERVER MODE ###

                // CONFIG
                var config = getBasicHttpHeaderConfig();
                config.method = 'DELETE';
                config.url = activeServerUrl+'/party/0/request/'+requestId;
                // WIN
                var successCallback = function(response) {
                    console.dir(response.data);
                    win(response.data);
                };
                // FAIL
                var errorCallback = function(response) {
                    console.warn("FAIL deleteRequest:");
                    console.dir(response);
                    fallbackToMockOnBrowserOrFail(mockCallback, fail, response);
                };
                $http(config).then(successCallback, errorCallback);
            },
            postTextMediaItemOnRequest: function(requestId, text, langCode, win, fail) {

                // ### MOCK MODE ###

                var mockCallback = function() {
                    var result = MockData.getMockData("mediaItemText1");
                    result.id = 898;
                    result.type = "java.lang.String";
                    result.text = text;
                    win(result);
                };
                if (activeServerUrl===apiUrlJustUseMock)
                {
                    $timeout(function(){mockCallback();},1000);
                    console.warn("TODO: service-api postTextMediaItemOnRequest() CREATE SERVER CALL");
                    return;
                }

                // ### SERVER MODE ###

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
                    console.dir(response.data);
                    win(response.data);
                };
                // FAIL
                var errorCallback = function(response) {
                    console.warn("FAIL postTextMediaItemOnRequest:");
                    console.dir(response);
                    fallbackToMockOnBrowserOrFail(mockCallback, fail, response);
                };
                $http(config).then(successCallback, errorCallback);
            },
            rewardRequest: function(requestId, arrayOfRewardGetterUserIds, win, fail) {

                // ### MOCK MODE ###

                var mockCallback = function() {
                    win();
                };
                if (activeServerUrl===apiUrlJustUseMock)
                {
                    $timeout(function(){mockCallback();},1000);
                    console.warn("TODO: service-api rewardRequest() CREATE SERVER CALL");
                    return;
                }

                // ### SERVER MODE ###

                var json = JSON.stringify(arrayOfRewardGetterUserIds);

                // CONFIG
                var config = getBasicHttpHeaderConfig();
                config.method = 'GET';
                config.url = activeServerUrl+'/party/action/request/'+requestId+"?action=reward&json="+json;
                // WIN
                var successCallback = function(response) {
                    console.dir(response.data);
                    win(response.data);
                };
                // FAIL
                var errorCallback = function(response) {
                    console.warn("FAIL rewardRequest:");
                    console.dir(response);
                    fallbackToMockOnBrowserOrFail(mockCallback, fail, response);
                };
                $http(config).then(successCallback, errorCallback);
            },
            // a chat belonging to a request should no longer be shown
            // to author - dont delete chat, can get visible again if
            // chat partner send new message if foreverMute = false
            muteChatOnRequest: function(requestId, chatId, foreverMute, win, fail) {

                // ### MOCK MODE ###

                var mockCallback = function() {
                    win();
                };
                if (activeServerUrl===apiUrlJustUseMock)
                {
                    $timeout(function(){mockCallback();},1000);
                    console.warn("TODO: service-api muteChatOnRequest() CREATE SERVER CALL");
                    return;
                }

                // ### SERVER MODE ###

                // CONFIG
                var config = getBasicHttpHeaderConfig();
                config.method = 'GET';
                config.url = activeServerUrl+'/party/action/request/'+requestId+"?action=muteChat&json="+chatId;
                // WIN
                var successCallback = function(response) {
                    console.dir(response.data);
                    win(response.data);
                };
                // FAIL
                var errorCallback = function(response) {
                    console.warn("FAIL muteChatOnRequest:");
                    console.dir(response);
                    fallbackToMockOnBrowserOrFail(mockCallback, fail, response);
                };
                $http(config).then(successCallback, errorCallback);

            },
            setStateOfRequestToProcessing: function(requestId, win, fail) {

                // ### MOCK MODE ###

                var mockCallback = function() {
                    win();
                };
                if (activeServerUrl===apiUrlJustUseMock)
                {
                    $timeout(function(){mockCallback();},1000);
                    console.warn("TODO: service-api setStateOfRequestToProcessing() CREATE SERVER CALL");
                    return;
                }

                // ### SERVER MODE ###

                // CONFIG
                var config = getBasicHttpHeaderConfig();
                config.method = 'GET';
                config.url = activeServerUrl+'/party/action/request/'+requestId+"?action=processing";
                // WIN
                var successCallback = function(response) {
                    console.dir(response.data);
                    win(response.data);
                };
                // FAIL
                var errorCallback = function(response) {
                    console.warn("FAIL setStateOfRequestToProcessing:");
                    console.dir(response);
                    fallbackToMockOnBrowserOrFail(mockCallback, fail, response);
                };
                $http(config).then(successCallback, errorCallback);
            },
            setStateOfRequestToReOpen: function(requestId, win, fail) {

                // ### MOCK MODE ###

                var mockCallback = function() {
                    win();
                };
                if (activeServerUrl===apiUrlJustUseMock)
                {
                    $timeout(function(){mockCallback();},1000);
                    console.warn("TODO: service-api setStateOfRequestToReOpen() CREATE SERVER CALL");
                    return;
                }

                // ### SERVER MODE ###

                // CONFIG
                var config = getBasicHttpHeaderConfig();
                config.method = 'GET';
                config.url = activeServerUrl+'/party/action/request/'+requestId+"?action=open";
                // WIN
                var successCallback = function(response) {
                    console.dir(response.data);
                    win(response.data);
                };
                // FAIL
                var errorCallback = function(response) {
                    console.warn("FAIL setStateOfRequestToReOpen:");
                    console.dir(response);
                    fallbackToMockOnBrowserOrFail(mockCallback, fail, response);
                };
                $http(config).then(successCallback, errorCallback);
            },
            // set the review result on a request
            // mediaItemId - if rejection is targeted at a sub element of the request (0 or null = the request itself)
            // messageStr - just optional in case reviewer likes to chat back the reason
            reviewResultOnRequest : function(requestId, allowRequestBool, mediaItemId, messageStr, win, fail) {

                // ### MOCK MODE ###

                var mockCallback = function() {
                    win();
                };
                if (activeServerUrl===apiUrlJustUseMock)
                {
                    $timeout(function(){mockCallback();},1000);
                    console.warn("TODO: service-api reviewResultOnRequest() CREATE SERVER CALL");
                    return;
                }

                // ### SERVER MODE ###

                var action = "reject";
                if (allowRequestBool) action = "open";

                // CONFIG
                var config = getBasicHttpHeaderConfig();
                config.method = 'GET';
                config.url = activeServerUrl+'/party/action/request/'+requestId+"?action="+action;
                // WIN
                var successCallback = function(response) {
                    console.dir(response.data);
                    win(response.data);
                };
                // FAIL
                var errorCallback = function(response) {
                    console.warn("FAIL setStateOfRequestToReOpen:");
                    console.dir(response);
                    fallbackToMockOnBrowserOrFail(mockCallback, fail, response);
                };
                $http(config).then(successCallback, errorCallback);

            },
            markNotificationAsRead: function(notificationId, win, fail) {

                // ### MOCK MODE ###

                var mockCallback = function() {
                    win();
                };
                if (activeServerUrl===apiUrlJustUseMock)
                {
                    $timeout(function(){mockCallback();},1000);
                    console.warn("TODO: service-api markNotificationAsRead() CREATE SERVER CALL");
                    return;
                }

                // ### SERVER MODE ###

                var json = JSON.stringify(arrayOfRewardGetterUserIds);

                // CONFIG
                var config = getBasicHttpHeaderConfig();
                config.method = 'GET';
                config.url = activeServerUrl+'/party/0/notification/'+notificationId+"?action=delete";
                // WIN
                var successCallback = function(response) {
                    console.dir(response.data);
                    win(response.data);
                };
                // FAIL
                var errorCallback = function(response) {
                    console.warn("FAIL markNotificationAsRead:");
                    console.dir(response);
                    fallbackToMockOnBrowserOrFail(mockCallback, fail, response);
                };
                $http(config).then(successCallback, errorCallback);

            },
            redeemCode: function(codeStr, langCode, win, fail) {

                // ### MOCK MODE ###

                var mockCallback = function() {

                    // simulate getting reviewer
                    if (codeStr=='888') {
                        win({
                            // list of commands to process internally
                            action : [,
                                {
                                    command: 'updateUser',
                                    json: JSON.stringify(AppContext.getAccount())
                                },
                                {
                                    command: 'focusParty',
                                    json: "1"
                                }
                            ],
                            // html to show in popup to user
                            feedbackHtml : '<h3>OK</h3>You are now a reviewer for Helferverein Nord.'
                        });
                    } else

                    // simulate getting konfetti
                    {
                        win({
                            // list of commands to process internally
                            action: [
                                {
                                    command: 'focusParty',
                                    partyId: 2,
                                    user: null
                                }
                            ],
                            // html to show in popup to user
                            feedbackHtml: '<h3>OK</h3>999 Konfetti added to Party of Helferverein Nord.'
                        });
                    }
                };
                if (activeServerUrl===apiUrlJustUseMock)
                {
                    $timeout(function(){mockCallback();},3000);
                    console.warn("TODO: service-api  redeemCode() CREATE SERVER CALL");
                    return;
                }

                // ### SERVER MODE ###

                // CONFIG
                var config = getBasicHttpHeaderConfig();
                config.method = 'GET';
                config.url = activeServerUrl+'/account/redeem/'+codeStr;
                // WIN
                var successCallback = function(response) {
                    console.dir(response.data);
                    win(response.data);
                };
                // FAIL
                var errorCallback = function(response) {
                    console.warn("FAIL redeemCode:");
                    console.dir(response);
                    fallbackToMockOnBrowserOrFail(mockCallback, fail, response);
                };
                $http(config).then(successCallback, errorCallback);

            }

        };

    });
