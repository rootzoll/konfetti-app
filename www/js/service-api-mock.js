angular.module('starter.api', [])

    .factory('ApiService', function($log, $timeout) {

        var errorPossibility = 0.0;

        var context = {
            baseUrl : "",
            clientId : "",
            userId : "",
            secret : ""
        };

        var orga1 = {
            name: 'Helferverein Nord e.V.',
            town: 'Berlin-Pankow',
            address: 'Berliner Str. 99, 13189 Berlin, GERMANY',
            lon: 0.0,
            lat: 0.0,
            meters: 500,                    // calculate on server based on client location
            person: 'Max Mustermann',
            website: 'http://pankowhilft.blogsport.de',
            newRequestMinKonfetti: 10,
            newRequestReview: 1, // true = before getting public, review process
            konfettiCount: 14,
            konfettiTotal: 4532452, // what user collected total
            topClass: 5 // TOP3, TOP5, TOP10, TOP20, TOP100
        };

        var orga2 = {
            name: 'Helferverein Süd e.V.',
            town: 'München',
            address: 'Antonplatz 3, 89282 München, GERMANY',
            lon: 0.0,
            lat: 0.0,
            meters: 500000,                 // calculate on server based on client location
            person: 'Maxie Musterfrau',
            website: 'http://muenchen.blogsport.de',
            konfettiNewRequestMin: 10,
            newRequestReview: 1,
            konfettiCount: 15,
            konfettiTotal: 10,
            topClass: 20 // TOP3, TOP5, TOP10, TOP20, TOP100
        };

        var notifactionsStore = [
            {id: 12, clientId: 1, partyId: 1, type:1, ref:123}, // ref can de based on type different id
            {id: 87, clientId: 1, partyId: 1, type:2, ref:655}, // like request, chat, info item
            {id: 88, clientId: 1, partyId: 2, type:3, ref:633}
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
            userId: 123,
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
            userId: 123,
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
            userId: 123,
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

        return {
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
                                orga: orga1,
                                requestsOpen: [
                                    request11,
                                    request14
                                ],
                                requestsPosted: [],
                                requestsInteraction: [],
                                requestsReview: [],
                                notifications: []
                            });
                        } else
                        if (partyId===2) {
                            win({
                                orga:orga2,
                                requestsOpen: [],
                                requestsPosted: [
                                    request12
                                ],
                                requestsInteraction: [
                                    request13
                                ],
                                requestsReview: [],
                                notifications: notifactionsStore
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
            }
        };

    });
