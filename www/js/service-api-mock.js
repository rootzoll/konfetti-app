angular.module('starter.api', [])

    .factory('ApiService', function($log, $timeout) {

        var errorPossibility = 0.0;

        var context = {
            baseUrl : "",
            clientId : "",
            userId : "",
            secret : ""
        };

        /*
         * DATA PROTOTYPE OBJECTS (data skeletons with description)
         * objects as needed by client as result from requests
         * of course can be stored different or with additional fields in DB
         */

        // PARTY
        // config params of party and
        // the organisation responsible for party
        // putting already stuff in there for private parties
        var partyPrototype = {

            // official name to display in short
            name: '',

            // detail text - for e.g. address to show for editorial info
            detailText: '',

            // website http-address or email for further info
            // optional but should be seperate field so client can offer options
            contact: '',

            // 'public' = default
            // 'private' = can be found but is asking for invitation code
            // 'hidden' = cannot be found, just enter with invitaion code
            // --> codes should be stored in seperate table, so they can be individual if needed
            visibility: 'public',

            // determines if orga admins need to review public posting
            // 0 = no review,
            // 1 = full review of all public posts
            // 2 = just review request, follow up public info on request no review
            reviewLevel: 1,

            // minimal konfetti to spend on new request posting
            newRequestMinKonfetti: 1,

            // location - just if party should be found by location
            lon: 0.0,
            lat: 0.0,

            // dont store in DB - just gets calculated by server and delivered to client
            meters: 500,

            // user specific data on orga - not in DB gets added by server on the fly
            user: {
                // distance of user to party location
                meters: 0,
                // amount of konfetti user owns on party
                konfettiCount: 0,
                // total konfetti user collected on party
                konfettiTotal: 0,
                // position in most collected (over e.g. a month)
                // like a position in the high scores, e.g. top 3
                topPosition: 0
            }
        };

        // REQUEST
        // every party contains requests
        var requestPrototype = {

            // unique id
            id: 0,

            // author of request
            userId: 0,

            // different states used by app at the moment
            // 'review'
            // 'open'
            // 'rejected'
            // 'done'
            state: 'open',

            // user name of this user
            // a fixed copy of the name of user when request was created in DB
            // user can change his name on user profile - but this may be reviewed information so keep a copy to display
            userName: "",

            // id of party request belongs to
            partyId: 0,

            // server timestamp of creation
            time: 0,

            // actual amount on konfetti of request
            konfettiCount: 0,

            // this field is just handled on client side - no need to store in DB
            // this is always 0 but gets delivered by server
            konfettiAdd: 0,

            // title of request --> TODO: ref to multilang item?
            title: '',

            // image of user/selfi
            // maybe re reviewed information, so keep copy - dont take selfi from actual user profile
            // ? --> may be ref to media item
            imageUrl: '',

            // list of ids of media items
            // with additional public info on request
            // --> deliver all media item ids if user is author
            // --> deliver just public media items if user is not author
            info: [],

            // list of ids of chats as part of this request
            // --> deliver up to multiple chat ids, if user is author of chat
            // --> deliver array with just one id, if requesting user has active chat on this request
            chats:[]

        };

        // CHAT
        // basic chat information
        var chatPrototype = {
            // unique id
            id: 0,
            // the type of object the chat is attached to
            // for the beginning this will always be a request object
            // but later on this could be an offer or a support ticket
            contextType: 'request',
            // the reference id of the context object
            contextId: 0,
            // array of user ids of people part of the chat
            // also containing the owner of context item
            members: [],
            // list of chat items (see below)
            messages: []
        };

        // CHAT ITEM
        // contains metadata of a single chat message
        // the actual content of chat message is referenced in mediaitem field
        var chatItemPrototype = {
            id: 0, // uid of chatitem -> will be set by server
            userId: 0, // author -> needs to be verified by server
            time: 0, // timestamp -> will be set by server
            // 'mediaitem' can contain either just a reference id = NUMBER
            // or the complete media object (client can handle both)
            mediaItem: 0
        };

        // MEDIA ITEM
        // its kind of a abstract base class
        // sub classes can be --> text, multilang text, image, location
        var mediaItemPrototype = {
            // uid of media item
            id: 0,
            // 0 = not reviewed - just private if context as activated review
            // 1 = reviewed and can be public
            reviewed: 0,
            // the class name (just toplevel - no package) of media item type
            type: 'undefined'
        };

        /*
         * SAMPLE DATA
         * for click prototype when on server available
         */

        var party1 = cloneObject(partyPrototype);
        party1.name = 'Helferverein Nord e.V.';
        party1.detailText = 'Berliner Str. 99, 13189 Berlin, GERMANY';
        party1.contact = 'http://pankowhilft.blogsport.de';
        party1.newRequestMinKonfetti = 10;
        party1.user.meters = 500;
        party1.user.konfettiCount = 14;
        party1.user.konfettiTotal = 200;
        party1.user.topPosition = 4;

        var party2 = cloneObject(partyPrototype);
        party2.name = 'Helferverein Süd e.V.';
        party2.detailText = 'Antonplatz 3, 89282 München, GERMANY';
        party2.contact = 'muenchen@helfer.de';
        party2.newRequestMinKonfetti = 1;
        party2.user.meters = 500000;
        party2.user.konfettiCount = 140;
        party2.user.konfettiTotal = 10000;
        party2.user.topPosition = 4;

        var sampleNotifactions = [
            {id: 12, clientId: 1, partyId: 2, type:1, ref:0},
            {id: 87, clientId: 1, partyId: 2, type:2, ref:11},
            {id: 88, clientId: 1, partyId: 2, type:3, ref:12},
            {id: 96, clientId: 1, partyId: 2, type:4, ref:13}
        ];

        var exampleChatPreview1 = {
            id: 1,
            name: 'Jan',
            imageUrl: "http://img2.timeinc.net/people/i/2011/database/110214/christian-bale-300.jpg",
            lastLine: 'The task requested could ..',
            lastActivity: 423424243,
            lastStatus: 'new'
        };

        var exampleChatPreview2 = {
            id: 2,
            name: 'Jamal',
            imageUrl: "http://img2.timeinc.net/people/i/2011/database/110214/christian-bale-300.jpg",
            lastLine: 'Do you speak english?',
            lastActivity: 423424245,
            lastStatus: 'send'
        };

        var request11 = {
            id: 11,
            userId: 125,
            userName: "Johannes Kli",
            partyId: 2,
            time: 8238483432,
            konfettiCount: 8,
            konfettiAdd: 0, // this is always 0 but gets delivered by server
            title: 'Hecke am Spielplatz schneiden',
            imageUrl: 'http://img2.timeinc.net/people/i/2011/database/110214/christian-bale-300.jpg',
            state: 'open',
            info: [],
            chats:[]
        };

        var request12 = {
            id: 12,
            userId: 1,
            userName: "Christian Bäle",
            partyId: 2,
            time: 6238483432,
            konfettiCount: 34,
            konfettiAdd: 0, // this is always 0 but gets delivered by server
            title: 'Hecke am Spielplatz schneiden',
            imageUrl: 'http://img2.timeinc.net/people/i/2011/database/110214/christian-bale-300.jpg',
            state: 'rejected',
            info: [],
            chats:[exampleChatPreview1]
        };

        var request13 = {
            id: 13,
            userId: 124,
            userName: "Jochen Tuck",
            partyId: 2,
            time: 5238483432,
            konfettiCount: 1,
            konfettiAdd: 0, // this is always 0 but gets delivered by server
            title: 'Aufbau Grillfest bei Jannes auf dem Acker',
            imageUrl: 'http://www.mnf.uni-greifswald.de/fileadmin/Biochemie/AK_Heinicke/bilder/kontaktbilder/Fischer__Christian_II_WEB.jpg',
            state: 'open',
            chats:[exampleChatPreview2],
            info: []
        };

        var request14 = {
            id: 14,
            userId: 127,
            userName: "Jamal Klu",
            partyId: 2,
            time: 7238483432,
            konfettiCount: 6,
            konfettiAdd: 0, // this is always 0 but gets delivered by server
            title: 'Backofen reinigen',
            imageUrl: 'http://www.mnf.uni-greifswald.de/fileadmin/Biochemie/AK_Heinicke/bilder/kontaktbilder/Fischer__Christian_II_WEB.jpg',
            state: 'open',
            info: [],
            chats:[]
        };

        var chatItemIdCounter = 100;

        // a chat is metadata, participants and a time sorted list of chat items
        var chat1 = {
            id: 1,
            requestId: 12,
            hostId:124, // user id of user owning the request
            members: [123], // array of user ids of people part of the chat
            messages: [] // list of chatitems (see below)
        };

        var mediaItemText1 = cloneObject(mediaItemPrototype);
        mediaItemText1.id = 1;
        mediaItemText1 = "Text";
        mediaItemText1 = "Hi there. I would like to help.";

        var chatItem1 = cloneObject(chatItemPrototype);
        chatItem1.id = 1;
        chatItem1.userId = 1;

        var chat2 = cloneObject(chat1);
        chat2.messages = [
            {time:57135713257123, userId: 1, itemId:1234},
            {time:93797593475493, userId: 2, itemId:1235},
            {time:93797593474353, userId: 1, itemId:1233},
            {time:93797593474354, userId: 1, itemId:1236},
            {time:93797593474356, userId: 2, itemId:1237}];

        return {
            // --> gets set once called on start of app and those credentials can than be used on background API calls
            setCredentials: function(clientId, userId, secret) {
                context.clientId = clientId;
                context.userId = userId;
                context.secret = secret;
                return;
            },
            createAccount: function(win, fail) {
                $timeout(function(){
                    if (Math.random()>errorPossibility) {
                        // one user can have multiple accounts=clients bound to user profile
                        // no login up front - multiple clients can be bound to one user within settings option
                        win({
                            clientId: 1,
                            userId: 1, // the userid equals the clientid in the beginning - later on one client id can get master id for other clients
                            secret: 'da8ds68a6d8a6d8as6d8a6dsasad7a98d7s' // secret is tied to client
                        });
                    } else {
                        // fail gets an error code (number) that is displays in user feedback for support
                        fail(321);
                    }
                },1000);
                return;
            },
            // gets called once a user starts a chat
            createChat: function(requestId, win, fail) {
                $timeout(function(){
                    if (Math.random()>errorPossibility) {
                        win(chat1);
                    } else {
                        // fail gets an error code (number) that is displays in user feedback for support
                        fail(331);
                    }
                },1000);
                return;
            },
            // gets called once a user starts a chat
            loadChat: function(chatId, win, fail) {
                $timeout(function(){
                    if (Math.random()>errorPossibility) {
                        win(chat2);
                    } else {
                        // fail gets an error code (number) that is displays in user feedback for support
                        fail(331);
                    }
                },1000);
                return;
            },
            // return an empty chat item (no server request)
            getChatItemPrototype : function() {
                return cloneObject(chatItemPrototype);
            },
            // gets called once a user starts a chat
            sendChatItem: function(itemObj, win, fail) {
                $timeout(function(){
                    if (Math.random()>errorPossibility) {
                        // item gets returned again with id and maybe corrected data
                        itemObj.id = chatItemIdCounter++;
                        win(itemObj);
                    } else {
                        // fail gets an error code (number) that is displays in user feedback for support
                        fail(331);
                    }
                },1000);
                return;
            },
            loadPartylist: function(lat, lon, win, fail) {
                $timeout(function(){
                    if (Math.random()>errorPossibility) {
                        // one user can have multiple accounts=clients bound to user profile
                        // no login up front - multiple clients can be bound to one user within settings option
                        win([
                            {id: 1, lat: 2.34234, lon: 1.432423, meter: 566, new: 0}, // new = had no interaction yet
                            {id: 2, lat: 3.342, lon: 3.222, meter: 40000, new: 1}
                        ]);
                    } else {
                        // fail gets an error code (number) that is displays in user feedback for support
                        fail(234);
                    }
                },1000);
                return;
            },
            loadParty: function(partyId, win, fail) {
                $timeout(function(){
                    if (Math.random()>errorPossibility) {
                        // one user can have multiple accounts=clients bound to user profile
                        // no login up front - multiple clients can be bound to one user within settings option
                        if (partyId===1) {
                            win({
                                party: party1,
                                requests: [
                                    request11,
                                    request14
                                ],
                                notifications: []
                            });
                        } else
                        if (partyId===2) {
                            win({
                                party:party2,
                                requests: [
                                    request12,
                                    request13
                                ],
                                notifications: sampleNotifactions
                            });
                        } else {
                            fail(323);
                        }

                    } else {
                        // fail gets an error code (number) that is displays in user feedback for support
                        fail(232);
                    }
                },1000);
                return;
            },
            loadRequest: function(requestId, win, fail) {
                $timeout(function(){
                    if (Math.random()>errorPossibility) {
                        if (requestId==11) {
                            win(request11);
                        } else
                        if (requestId==12) {
                            win(request12);
                        } else
                        if (requestId==13) {
                            win(request13);
                        } else
                        if (requestId==14) {
                            win(request14);
                        } else {
                            $log.warn("Request("+requestId+") not found");
                            fail(353);
                        }
                    } else {
                        // fail gets an error code (number) that is displays in user feedback for support
                        fail(232);
                    }
                },1000);
                return;
            },
            loadMediaItem: function(itemId, win, fail){
                $timeout(function(){
                    if (Math.random()>errorPossibility) {
                        var item = cloneObject(mediaItemPrototype);
                        item.id = itemId;
                        item.reviewed = 1;
                        item.type = "text";
                        item.data = "[TODO LOADING "+itemId+"]";
                        win(item);
                    } else {
                        // fail gets an error code (number) that is displays in user feedback for support
                        fail(265);
                    }
                },1000);
                return;
            },
            upvoteRequest: function(requestId, confettiCount, win, fail) {
                $timeout(function(){
                    if (Math.random()>errorPossibility) {
                        win();
                    } else {
                        // fail gets an error code (number) that is displays in user feedback for support
                        fail(235);
                    }
                },2000);
                return;
            },
            markNotificationAsRead: function(notificationId, win, fail) {
                $timeout(function(){
                    if (Math.random()>errorPossibility) {
                        win();
                    } else {
                        // fail gets an error code (number) that is displays in user feedback for support
                        fail(239);
                    }
                },800);
                return;
            }

        };

    });
