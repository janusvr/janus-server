
var byline = require('byline');


function Session(server, socket) {

    var self = this;

    this._socket = socket;
    this._authed = false;
    this._server = server;

    this.id = null;
    this.currentRoom = null;

    this.subscriptions = [];

    byline(socket).on('data', this.parseMessage.bind(this));

    this.listener = function(method,data) {

        //Dont echo our own events
        if(data.userId === self.id) {
            return;
        }
        self.send(method,data);
    }

    socket.on('end', function() {

        if(self.currentRoom) {
            self.currentRoom.emit('event', 'user_disconnected', {userId:self.id});
        }

        self.subscriptions.forEach(function(room){
            room.removeListener('event',self.listener);
        });
    });
}

module.exports = Session;

Session.prototype.send = function(method, data) {
    var packet = JSON.stringify({method:method,data:data});
    this._socket.write(packet+'\r\n');
    log.debug('S->C: ' + packet);
};

Session.prototype.clientError = function(message) {
    log.error('Client error: ' + message);
    this.send('error', {message:message});
};

Session.validMethods = ['logon', 'subscribe', 'unsubscribe', 'enter_room', 'move', 'chat', 'portal'];

Session.prototype.parseMessage = function(data){

    log.debug('C->S: ' + data);

    var payload;

    try {
        payload = JSON.parse(data);
    } catch(e) {
        this.clientError('Unable to parse last message');
        return;
    }

    if(Session.validMethods.indexOf(payload.method) === -1) {
        this.clientError('Invalid method: ' + payload.method)
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

    if(this.currentRoom) {
        this.currentRoom.emit('event', 'user_leave', { userId: this.id, roomId: this.currentRoom.id })
    }


    this.currentRoom = this._server.getRoom(data.roomId);
    this.currentRoom.emit('event', 'user_enter', { userId: this.id, roomId: data.roomId })
};

Session.prototype.move = function(position) {

    var data = {
        roomId: this.currentRoom.id,
        userId: this.id,
        position: position
    };

    this.currentRoom.emit('event', 'user_moved', data);
};

Session.prototype.chat = function(message) {

    var data = {
        roomId: this.currentRoom.id,
        userId: this.id,
        message: message
    };

    this.currentRoom.emit('event', 'user_chat', data);
};

Session.prototype.subscribe = function(data) {

    if(data.roomId  === undefined) {
        this.clientError('Missing roomId in data packet');
        return;
    }

    var room = this._server.getRoom(data.roomId);

    if(this.subscriptions.indexOf(room) === -1) {
        room.on('event', this.listener);
        this.subscriptions.push(room);
    }

    this.send('okay');
};

Session.prototype.unsubscribe = function(data) {

    if(data.roomId  === undefined) {
        this.clientError('Missing roomId in data packet');
        return;
    }

    var room = this._server.getRoom(data.roomId);

    var i = this.subscriptions.indexOf(room);
    if(i !== -1) {
        room.removeListener('event', this.listener);
        room.slice(i,1);
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

    this.currentRoom.emit('event', 'new_portal', data);
    this.send('okay');
};
