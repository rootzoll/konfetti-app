angular.module('starter.api', [])

    .factory('ApiService', function($log, $timeout) {

        var errorPossibility = 0.0;

        var context = {
            baseUrl : "",
            clientId : "",
            secret : ""
        };

        var notifactionsStore = [
            {id: 12, clientId: 1, partyId: 1, type:1, ref:123}, // ref can de based on type different id
            {id: 87, clientId: 1, partyId: 1, type:2, ref:655}, // like request, chat, info item
            {id: 88, clientId: 1, partyId: 2, type:3, ref:633}
        ];

        return {
            setCredentials: function(clientId, secret) {
                context.clientId = clientId;
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
                            secret: 'da8ds68a6d8a6d8as6d8a6dsasad7a98d7s'
                        });
                    } else {
                        // fail gets an error code (number) that is displays in user feedback for support
                        fail(321);
                    }
                },2000);
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
                },2000);
                return;
            },
            loadParty: function(partyId, win, fail) {
                $timeout(function(){
                    if (Math.random()>errorPossibility) {
                        // one user can have multiple accounts=clients bound to user profile
                        // no login up front - multiple clients can be bound to one user within settings option
                        if (partyId===1) {
                            win({
                                orga:{
                                    name: 'Helferverein Nord e.V.',
                                    town: 'Berlin-Pankow',
                                    address: 'Berliner Str. 99, 13189 Berlin, GERMANY',
                                    lon: 0.0,
                                    lat: 0.0,
                                    meters: 500,                    // calculate on server based on client location
                                    person: 'Max Mustermann',
                                    website: 'http://pankowhilft.blogsport.de',
                                    konfettiCount: 1000
                                },
                                requestsOpen: [
                                    {   id: 12,
                                        userId: 123,
                                        partyId: 2,
                                        time: 8238483432,
                                        konfettiCount: 8,
                                        konfettiAdd: 0, // this is always 0 but gets delivered by server
                                        title: 'Hecke am Spielplatz schneiden',
                                        imageUrl: 'http://img2.timeinc.net/people/i/2011/database/110214/christian-bale-300.jpg',
                                        state: 'open'
                                    },
                                    {   id: 14,
                                        userId: 123,
                                        partyId: 2,
                                        time: 7238483432,
                                        konfettiCount: 6,
                                        konfettiAdd: 0, // this is always 0 but gets delivered by server
                                        title: 'Backofen reinigen',
                                        imageUrl: 'http://www.mnf.uni-greifswald.de/fileadmin/Biochemie/AK_Heinicke/bilder/kontaktbilder/Fischer__Christian_II_WEB.jpg',
                                        state: 'open'
                                    }
                                ],
                                requestsPosted: [],
                                requestsInteraction: [],
                                requestsReview: [],
                                notifications: []
                            });
                        } else
                        if (partyId===2) {
                            win({
                                orga:{
                                    name: 'Helferverein Süd e.V.',
                                    town: 'München',
                                    address: 'Antonplatz 3, 89282 München, GERMANY',
                                    lon: 0.0,
                                    lat: 0.0,
                                    meters: 500000,                 // calculate on server based on client location
                                    person: 'Maxie Musterfrau',
                                    website: 'http://muenchen.blogsport.de',
                                    konfettiCount: 10
                                },
                                requestsOpen: [],
                                requestsPosted: [
                                    {   id: 12,
                                        userId: 123,
                                        partyId: 2,
                                        time: 6238483432,
                                        konfettiCount: 34,
                                        konfettiAdd: 0, // this is always 0 but gets delivered by server
                                        title: 'Hecke am Spielplatz schneiden',
                                        imageUrl: 'http://img2.timeinc.net/people/i/2011/database/110214/christian-bale-300.jpg',
                                        state: 'review'
                                    }
                                ],
                                requestsInteraction: [
                                    {   id: 13,
                                        userId: 124,
                                        partyId: 2,
                                        time: 5238483432,
                                        konfettiCount: 1,
                                        konfettiAdd: 0, // this is always 0 but gets delivered by server
                                        title: 'Aufbau Grillfest bei Jannes auf dem Acker',
                                        imageUrl: 'http://www.mnf.uni-greifswald.de/fileadmin/Biochemie/AK_Heinicke/bilder/kontaktbilder/Fischer__Christian_II_WEB.jpg',
                                        state: 'open'
                                    }
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
                },2000);
                return;
            }
        };

    });
