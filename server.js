var args = require('optimist').argv;
var config = require(args.config || './config.js');
var net = require('net');
var events = require('events');

global.log = require('winston');


var Session = require('./Session');


function Server() {

    this._sessions = [];
    this._rooms = {};
}

Server.prototype.getRoom = function(roomId) {
    if(this._rooms[roomId] === undefined)  {
        this._rooms[roomId] = new events.EventEmitter(); //TODO: room class
        this._rooms[roomId].id = roomId;
    }

    return this._rooms[roomId];

};

Server.prototype.start = function() {

    log.info('Starting socket server...');

    this.server = net.createServer(this.onConnect.bind(this));
    this.server.listen(config.port, function(err){

        if(err) {
            log.errror('Error listening on port');
            process.exit(1);
        }

        log.info('Server listening');

    });
};

Server.prototype.onConnect = function(socket) {

    var self = this;
    log.info('Client connected');

    var s = new Session(this, socket);
    this._sessions.push(s);

    s._socket.on('end', function() {
        log.info('Client disconnected');
        self._sessions.slice(self._sessions.indexOf(s),1);
    });
};



(new Server()).start();
