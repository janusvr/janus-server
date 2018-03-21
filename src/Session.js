var args = require('optimist').argv;
var byline = require('byline');
var config = require(args.config || '../config.js');
var CRLF = "\r\n";
const okayMessage = JSON.stringify({"method": "okay"}) + CRLF;
var getMiddleware = require('./MethodMiddleware');

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

    this.methods = getMiddleware(this);
    byline(socket).on('data', this.parseMessage.bind(this));

};

Session.prototype.close = function() {
    delete this._server._userList[this.id];
    delete this._server._partyList[this.id];
    if (this.currentRoom)
        this.currentRoom.emit('user_disconnected', { userId: this.id });
    this._rooms.forEach(room => room.removeSession(this))
}

Session.prototype.makeMessage = function(method, data) {
    return JSON.stringify({method: method, data: data}) + CRLF;
}

Session.prototype.makeError = function(data) {
    return JSON.stringify({method: "error", data: {message: data}}) + CRLF;
};

module.exports = Session;

Session.prototype.send = function(message) {
    if (!this._socket.destroyed)
        this._socket.write(message);
};

Session.prototype.clientError = function(message) {
    log.error('Client error ('+this._socket.remoteAddress + ', ' + (this.id || 'Unnamed') + '): ' + message);
    this.send(this.makeError(message));
};

Session.prototype.clientOkay = function() {
    this.send(okayMessage);
    log.info("S->C:", okayMessage);
}

Session.validMethods = [
    'logon',
    'subscribe',
    'unsubscribe',
    'enter_room',
    'move',
    'chat',
    'portal',
    'users_online',
    'get_partylist',
];

Session.prototype.parseMessage = function(data) {

    //log.info('C->S: ' + data);

    var payload;

    try {
        payload = JSON.parse(data);
    }
    catch(e) {
        log.info("data: " + data);
        log.info("payload: " + payload);
        return this.clientError('Unable to parse last message');
    }

    if(Session.validMethods.indexOf(payload.method) === -1)
        return this.clientError('Invalid method: ' + payload.method);

    if(payload.method !== 'logon' && !this._authed )
        return this.clientError('You must call "logon" before sending any other commands.');

    if(payload.data === undefined) payload.data = {};
    if(typeof(payload.data)!= "object") payload.data = { "data": payload.data };
    payload.data._userId = this.id;
    payload.data._userList = this._server._userList;
    payload.data._roomEmit = (method, data) => { this.currentRoom.emit(method, data) };
    this.methods[payload.method](payload.data);
};

Session.prototype.get_partylist = function(data) {
    this.send(this.makeMessage('get_partylist', this._server._partyList));
}
