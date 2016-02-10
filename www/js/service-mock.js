angular.module('starter.mock', [])

    /*
     * ALREADY OBSOLETE - JUST KEEP CHAT & NOTIFICATION OBJECTS UNTIL
     * THE REAL ONES ARE FULLY IMPLEMENTED
     */

    .factory('MockData', function() {

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
        // the actual conttent of chat message is referenced in mediaitem field
        var chatItemPrototype = {
            id: 0, // uid of chatitem -> will be set by server
            userId: 0, // author -> needs to be verified by server
            time: 0, // timestamp -> will be set by server
            // 'mediaitem' can contain either just a reference id = NUMBER
            // or the complete media object (client can handle both)
            mediaItem: 0
        };

        var welcomeNotifaction = [
            {id: 98, userId: 1, partyId: 1, type:0, ref:111}
        ];

        var sampleNotifactions = [
            {id: 12, userId: 1, partyId: 2, type:1, ref:0},
            {id: 87, userId: 1, partyId: 2, type:2, ref:11},
            {id: 88, userId: 1, partyId: 2, type:3, ref:12},
            {id: 96, userId: 1, partyId: 2, type:4, ref:13}
        ];

        // a chat is metadata, participants and a time sorted list of chat items
        var chat1 = {
            id: 1,
            requestId: 12,
            hostId:124, // user id of user owning the request
            members: [123], // array of user ids of people part of the chat
            messages: [] // list of chatitems (see below)
        };

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


        var lastPostedRequest = null;

        return {
            getMockData: function(mockVarNameAsString) {
                return eval(mockVarNameAsString);
            },
            putlastPostedRequest: function(request) {
                lastPostedRequest = request;
                return true;
            },
            getLastPostedRequest: function() {
                return lastPostedRequest;
            }
        };

    });
