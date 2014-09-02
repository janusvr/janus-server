
var byline = require('byline');


function Session(server, socket) {

    var self = this;

    this._socket = socket;
    this._authed = false;
    this._server = server;
    this._rooms = [];

    this.id = null;
    this.currentRoom = null;


    byline(socket).on('data', this.parseMessage.bind(this));

    socket.on('close', function() {

        if(self.currentRoom) {
            self.currentRoom.emit('user_disconnected', {userId:self.id});
        }

        self._rooms.forEach(function(room){
            room.removeSession(self);
        });
    });
}

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

Session.validMethods = ['logon', 'subscribe', 'unsubscribe', 'enter_room', 'move', 'chat', 'portal'];

Session.prototype.parseMessage = function(data){

    //log.info('C->S: ' + data);

    var payload;

    try {
        payload = JSON.parse(data);
    } catch(e) {
        this.clientError('Unable to parse last message');
        return;
    }

    if(Session.validMethods.indexOf(payload.method) === -1) {
        this.clientError('Invalid method: ' + payload.method);
        return;
    }

    if(payload.method !== 'logon' && !this._authed) {
        this.clientError('Not signed on must call logon first');
        return;
    }

    Session.prototype[payload.method].call(this,payload.data);
};




/*************************************************************************/
/*  Client methods                                                       */
/*************************************************************************/

Session.prototype.logon = function(data) {
    if(data.userId === undefined) {
        this.clientError('Missing userId in data packet');
        return;
    }

    if(data.roomId === undefined) {
        this.clientError('Missing roomId in data packet');
        return;
    }

    //TODO: Auth

    if(!this._server.isNameFree(data.userId)) {
        this.clientError('User name is already in use');
        return;
    }

    this._authed = true;
    this.id = data.userId;

    log.info('User: ' + this.id + ' signed on');

    this.currentRoom = this._server.getRoom(data.roomId);
    this.subscribe(data);
};

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

    this.currentRoom = this._server.getRoom(data.roomId);
    this.currentRoom.emit('user_enter', { 
        userId: this.id, 
        roomId: data.roomId,
        oldRoomId: oldRoomId
    });
};

Session.prototype.move = function(position) {

    var data = {
        roomId: this.currentRoom.id,
        userId: this.id,
        position: position
    };

    this.currentRoom.emit('user_moved', data);
};

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
