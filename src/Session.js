var args = require('optimist').argv;
var byline = require('byline');
var config = require(args.config || '../config.js');

function Session(server, socket) {

    var self = this;

    this._socket = socket;

    this._userLocked = false;
    this._authed = false;

    this._server = server;
    this._rooms = [];
    this._usernames = [];

    this.id = null;
    this.currentRoom = null;


    byline(socket).on('data', this.parseMessage.bind(this));

    socket.on('close', function() {
        // let's remove the userId from the online list
        delete self._server._userList[self.id];

        if ( self.currentRoom ) {
            self.currentRoom.emit('user_disconnected', { userId:self.id });
        }

        self._rooms.forEach(function(room) {
            room.removeSession(self);
        });
    });
};




module.exports = Session;

Session.prototype.send = function(method, data) {
    var packet = JSON.stringify({method:method,data:data});
    this._socket.write(packet+'\r\n');
    //log.info('S->C: ' + packet);
};

Session.prototype.clientError = function(message) {
    log.error('Client error ('+this._socket.remoteAddress + ', ' + (this.id || 'Unnamed') + '): ' + message);
    this.send('error', {message:message});
};

Session.validMethods = [
    'logon', 
    'subscribe', 
    'unsubscribe', 
    'enter_room', 
    'move', 
    'chat', 
    'portal', 
    'users_online',
];

    Session.prototype.parseMessage = function(data) {

        //log.info('C->S: ' + data);

        var payload;
        var self = this;

        try {
            payload = JSON.parse(data);
        } catch(e) {
            log.info("data: " + data);
            log.info("payload: " + payload);
            this.clientError('Unable to parse last message');
            return;
        }
        if(Session.validMethods.indexOf(payload.method) === -1) {
            this.clientError('Invalid method: ' + payload.method);
            return;
        }

        if(payload.method !== 'logon' && !this._authed ) {
            this.clientError('You must call "logon" before sending any other commands.');
            return;
        }

        if(payload.data === undefined) payload.data = {};
        if(typeof(payload.data)!= "object") payload.data = { "data": payload.data };
        payload.data._userId = this.id;
        payload.data._userList = this._server._userList;
        payload.data._roomEmit = function(method, data) { self.currentRoom.emit(method, data) };
        Session.prototype[payload.method].call(this,payload.data);
    };




/*************************************************************************/
/*  Client methods                                                       */
/*************************************************************************/


// ## User Logon ##
Session.prototype.logon = function(data) {

    if(data.userId === undefined || data.userId === '') {
        this.clientError('Missing userId in data packet');
        return;
    }

    if(data.roomId === undefined) {
        this.clientError('Missing roomId in data packet');
        return;
    }

    if(!this._server.isNameFree(data.userId)) {
        this.clientError('User name is already in use');
        return;
    }

    this._server._plugins.call("logon", this, data);

    this.id = data.userId;
    this._authed = true;
    
    var self = this;
    this._server._userList[data.userId] = {
        roomId: data.roomId,
        send: function(method, data) { self.send(method, data); }
    }

        log.info('User: ' + this.id + ' signed on');
        this.currentRoom = this._server.getRoom(data.roomId);
        setTimeout(function(){ self.subscribe(data); }, 500);
};

// ## user enter room ##
Session.prototype.enter_room = function(data) {

    if(data.roomId  === undefined) {
        this.clientError('Missing roomId in data packet');
        return;
    }

    var oldRoomId = null;
    if(this.currentRoom) {
        oldRoomId = this.currentRoom.id;
        this.currentRoom.emit('user_leave', { 
            userId: this.id, 
            roomId: this.currentRoom.id,
            newRoomId: data.roomId
        });
    }

    this._server._userList[this.id].oldRoomId = oldRoomId;
    this._server._userList[this.id].roomId = data.roomId;

    this.currentRoom = this._server.getRoom(data.roomId);
    this.currentRoom.emit('user_enter', { 
        userId: this.id, 
        roomId: data.roomId,
        oldRoomId: oldRoomId
    });
};


// ## user move ##
Session.prototype.move = function(position) {

    var data = {
        roomId: this.currentRoom.id,
        userId: this.id,
        position: position
    };

    this.currentRoom.emit('user_moved', data);
};


// ## user chat ##
Session.prototype.chat = function(message) {

    var data = {
        roomId: this.currentRoom.id,
        userId: this.id,
        message: message
    };

    this.currentRoom.emit('user_chat', data);
};

Session.prototype.subscribe = function(data) {

    if(data.roomId  === undefined) {
        this.clientError('Missing roomId in data packet');
        return;
    }

    var room = this._server.getRoom(data.roomId);

    if(this._rooms.indexOf(room) === -1) {
        room.addSession(this);
        this._rooms.push(room);
    }

    this.send('okay');
};

Session.prototype.unsubscribe = function(data) {

    if(data.roomId  === undefined) {
        this.clientError('Missing roomId in data packet');
        return;
    }

    var room = this._server.getRoom(data.roomId);

    var i = this._rooms.indexOf(room);
    if(i !== -1) {
        room.removeSession(this);
        this._rooms.slice(i,1);
    }

    this.send('okay');
};


Session.prototype.portal = function(portal) {

    //TODO: Persist portals

    var data = {
        roomId: this.currentRoom.id,
        userId: this.id,
        url: portal.url,
        pos: portal.pos,
        fwd: portal.fwd
    };

    this.currentRoom.emit('user_portal', data);
    this.send('okay');
};

Session.prototype.users_online = function(data) {
    var maxResults = config.maxUserResults;
    var count = 0;
    var results = Array();

    if(data.maxResults !== undefined && data.maxResults < maxResults) maxResults = data.maxResults;

    if(data.roomId === undefined) {
        for(k in this._server._userList) {
            results.push(k);
            count++;
            if(count >= maxResults) break;
        }
    }
    else {
        for(k in this._server._userList) {
            if(this._server._userList[k].roomId == data.roomId) {
                results.push([k]);
                count++;
                if(count >= maxResults) break;
            }
        }
    }

    json = { "results": count, "roomId": data.roomId, "users": results };
    this.send('users_online', json);
}
