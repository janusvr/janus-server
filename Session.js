
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


    this.listener = this.send.bind(this);

    socket.on('end', function() {
        self.subscriptions.each(function(room){
            room.removeListener('event',self.listener);
        });
    });
}

module.exports = Session;

Session.prototype.send = function(method, data) {
    var packet = JSON.stringify({method:method,data:data});
    this._socket.write(packet);
    log.debug('S->C: ' + packet);
};

Session.prototype.clientError = function(message) {
    log.error('Client error: ' + message);
    this.send('error', {message:message});
};

Session.validMethods = ['logon', 'subscribe', 'unsubscribe', 'enter_room', 'move', 'chat'];

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
    //TODO: Prevent duplicate sessions

    this.send('okay');

    this._authed = true;
    this.id = data.userId;

    log.info('User: ' + this.id + ' signed on');

    this.currentRoom = this._server.getRoom(data.roomId);
    this.currentRoom.on('event', this.listener);
    this.subscriptions.push(this.currentRoom);
};

Session.prototype.enter_room = function(data) {

    if(data.roomId  === undefined) {
        this.clientError('Missing roomId in data packet');
        return;
    }

    this.currentRoom = this._server.getRoom(data.roomId);
    this.currentRoom.emit('event', 'user_entered', { userId: this.id, roomId: data.roomId })
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
