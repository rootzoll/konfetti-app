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

        var context = {
            clientId : 0,
            userId : 0,
            secret : ""
        };

        var fallbackToMockOnBrowser = function(mockCallback) {
            if (AppContext.getRunningOS()==='browser') {
                console.warn("FAILED REQUEST to '"+activeServerUrl+"' - Fallback to FakeData");
                activeServerUrl = apiUrlJustUseMock;
                mockCallback();
            }
        };

        var getBasicHttpHeaderConfig = function() {
            var basicConfig = {
                timeout: 6000,
                headers: {
                    'clientId': context.clientId+'',
                    'userId': context.userId+'',
                    'secret': context.secret+''
                }
            };
            return basicConfig;
        };

        return {
            // --> gets set once called on start of app and those credentials can than be used on background API calls
            setCredentials: function(clientId, userId, secret) {
                context.clientId = clientId;
                context.userId = userId;
                context.secret = secret;
            },
            createAccount: function(win, fail) {

                // ### MOCK MODE ###

                var mockCallback = function() {
                    context.userId = 1;
                    context.clientId = 1;
                    win({
                        clientId: 125,
                        userId: 125, // the userid equals the clientid in the beginning - later on one client id can get master id for other clients
                        secret: 'da8ds68a6d8a6d8as6d8a6dsasad7a98d7s' // secret is tied to client
                    })
                };
                if (activeServerUrl===apiUrlJustUseMock) {
                    $timeout(function(){mockCallback();},1000);
                    return;
                }

                // ### SERVER MODE ###

                // CONFIG
                var config = getBasicHttpHeaderConfig();
                config.method = 'GET';
                config.url = activeServerUrl+'/account';
                // WIN
                var successCallback = function(response) {
                    console.dir(response);
                    alert("WIN: new Account created (see log)");
                };
                // FAIL
                var errorCallback = function(response) {
                    console.dir(response);
                    console.warn("FAIL new Account NOT created");
                    fallbackToMockOnBrowser(mockCallback);
                };
                $http(config).then(successCallback, errorCallback);

            },
            // gets called once a user starts a chat
            createChat: function(requestId, win, fail) {

                // ### MOCK MODE ###

                var mockCallback = function() {
                    win(MockData.getMockData('chat1'));
                };
                //if (activeServerUrl===apiUrlJustUseMock)
                {
                    $timeout(function(){mockCallback();},1000);
                    return;
                }

                // ### SERVER MODE ###

                // TODO

            },
            // gets called once a user starts a chat
            loadChat: function(chatId, win, fail) {

                // ### MOCK MODE ###

                var mockCallback = function() {
                    win(MockData.getMockData('chat2'));
                };
                //if (activeServerUrl===apiUrlJustUseMock)
                {
                    $timeout(function(){mockCallback();},1000);
                    return;
                }

                // ### SERVER MODE ###

                // TODO

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
                //if (activeServerUrl===apiUrlJustUseMock)
                {
                    $timeout(function() {mockCallback();},1000);
                    return;
                }

                // ### SERVER MODE ###

                // TODO

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
                    itemObj.type = "konfetti.data.mediaitem.MultiLang";

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
                //if (activeServerUrl===apiUrlJustUseMock)
                {
                    $timeout(function(){mockCallback();},1000);
                    return;
                }

                // ### SERVER MODE ###

                // TODO

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
                //if (activeServerUrl===apiUrlJustUseMock)
                {
                    $timeout(function(){mockCallback();},1000);
                    return;
                }

                // ### SERVER MODE ###

                // TODO

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
                        win({
                            party: MockData.getMockData('party1'),
                            requests: requests,
                            notifications: MockData.getMockData('welcomeNotifaction')
                        });
                    } else
                    if (partyId===2) {
                        var requests = [
                            MockData.getMockData('request12'),
                            MockData.getMockData('request13')
                        ];
                        requests = addLastPostedRequest(2, requests);
                        win({
                            party:MockData.getMockData('party2'),
                            requests: requests,
                            notifications: MockData.getMockData('sampleNotifactions')
                        });
                    } else {
                        fail(323);
                    }
                };
                //if (activeServerUrl===apiUrlJustUseMock)
                {
                    $timeout(function(){mockCallback();},1000);
                    return;
                }

                // ### SERVER MODE ###

                // TODO

            },
            loadRequest: function(requestId, win, fail) {

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
                //if (activeServerUrl===apiUrlJustUseMock)
                {
                    $timeout(function(){mockCallback();},1000);
                    return;
                }

                // ### SERVER MODE ###

                // TODO

            },
            loadMediaItem: function(itemId, win, fail){

                // ### MOCK MODE ###

                var mockCallback = function() {

                        // default
                        var item = cloneObject(MockData.getMockData('mediaItemPrototype'));
                        item.id = itemId;
                        item.reviewed = 1;
                        item.type = "text";
                        item.data = "[TODO LOADING "+itemId+"]";

                        // itemId 111
                        if (itemId==111) {
                            item = MockData.getMockData('mediaItemText111');
                        }

                        // deliver back
                        win(item);
                };
                //if (activeServerUrl===apiUrlJustUseMock)
                {
                    $timeout(function(){mockCallback();},1000);
                    return;
                }

                // ### SERVER MODE ###

                // TODO

            },
            upvoteRequest: function(requestId, confettiCount, win, fail) {

                // ### MOCK MODE ###

                var mockCallback = function() {
                    if (Math.random()>errorPossibility) {
                        win();
                    } else {
                        // fail gets an error code (number) that is displays in user feedback for support
                        fail(235);
                    }
                };
                //if (activeServerUrl===apiUrlJustUseMock)
                {
                    $timeout(function(){mockCallback();},1000);
                    return;
                }

                // ### SERVER MODE ###

                // TODO

            },
            // post a
            postRequest: function(requestObj, win, fail) {

                // ### MOCK MODE ###

                var mockCallback = function() {
                    requestObj.state = "review";
                    requestObj.id = 999;
                    requestObj.userId = context.userId;
                    requestObj.time = Date.now();
                    MockData.putlastPostedRequest(requestObj);
                    win(requestObj);
                };
                //if (activeServerUrl===apiUrlJustUseMock)
                {
                    $timeout(function(){mockCallback();},1000);
                    return;
                }

                // ### SERVER MODE ###

                // TODO
            },
            // delete a request or a part of a request
            // mediaitemId = if 0 or null its the complete request
            // if a mediaitemId is given then just a part of the request gets deleted
            deleteRequest: function(requestId, mediaitemId, win, fail) {

                // ### MOCK MODE ###

                var mockCallback = function() {
                    win();
                };
                //if (activeServerUrl===apiUrlJustUseMock)
                {
                    $timeout(function(){mockCallback();},1000);
                    return;
                }

                // ### SERVER MODE ###

                // TODO
            },
            rewardRequest: function(requestId, arrayOfRewardGetterUserIds, win, fail) {

                // ### MOCK MODE ###

                var mockCallback = function() {
                    win();
                };
                //if (activeServerUrl===apiUrlJustUseMock)
                {
                    $timeout(function(){mockCallback();},1000);
                    return;
                }

                // ### SERVER MODE ###

                // TODO
            },
            // a chat belonging to a request should no longer be shown
            // to author - dongt delete chat, can get visible again if
            // chat partner send new message if foreverMute = false
            muteChatOnRequest: function(requestId, chatId, foreverMute, win, fail) {

                // ### MOCK MODE ###

                var mockCallback = function() {
                    win();
                };
                //if (activeServerUrl===apiUrlJustUseMock)
                {
                    $timeout(function(){mockCallback();},1000);
                    return;
                }

                // ### SERVER MODE ###

                // TODO
            },
            setStateOfRequestToProcessing: function(requestId, win, fail) {

                // ### MOCK MODE ###

                var mockCallback = function() {
                    win();
                };
                //if (activeServerUrl===apiUrlJustUseMock)
                {
                    $timeout(function(){mockCallback();},1000);
                    return;
                }

                // ### SERVER MODE ###

                // TODO
            },
            setStateOfRequestToReOpen: function(requestId, win, fail) {

                // ### MOCK MODE ###

                var mockCallback = function() {
                    win();
                };
                //if (activeServerUrl===apiUrlJustUseMock)
                {
                    $timeout(function(){mockCallback();},1000);
                    return;
                }

                // ### SERVER MODE ###

                // TODO
            },
            // set the review result on a request
            // mediaItemId - if rejection is targeted at a sub element of the request (0 or null = the request itself)
            // messageStr - just optional in case reviewer likes to chat back the reason
            reviewResultOnRequest : function(requestId, allowRequestBool, mediaItemId, messageStr, win, fail) {

                // ### MOCK MODE ###

                var mockCallback = function() {
                    win();
                };
                //if (activeServerUrl===apiUrlJustUseMock)
                {
                    $timeout(function(){mockCallback();},1000);
                    return;
                }

                // ### SERVER MODE ###

                // TODO


            },
            markNotificationAsRead: function(notificationId, win, fail) {

                // ### MOCK MODE ###

                var mockCallback = function() {
                    win();
                };
                //if (activeServerUrl===apiUrlJustUseMock)
                {
                    $timeout(function(){mockCallback();},1000);
                    return;
                }

                // ### SERVER MODE ###

                // TODO

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
                                    command: 'reviewer',
                                    partyId: 1
                                },
                                {
                                    command: 'focusParty',
                                    partyId: 1
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
                                    partyId: 2
                                }
                            ],
                            // html to show in popup to user
                            feedbackHtml: '<h3>OK</h3>999 Konfetti added to Party of Helferverein Nord.'
                        });
                    }
                };
                //if (activeServerUrl===apiUrlJustUseMock)
                {
                    $timeout(function(){mockCallback();},3000);
                    return;
                }

                // ### SERVER MODE ###

                // TODO

            }

        };

    });
