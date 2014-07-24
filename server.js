var args = require('optimist').argv;
var config = require(args.config || './config.js');
var net = require('net');
var tls = require('tls');
var events = require('events');
var winston = require('winston');


var transports = [
    new (winston.transports.File)({ filename: 'server.log', level: args.debug ? 'debug':'info' })
];

if(args.console) {
    transports.push(new (winston.transports.Console)({ level: 'debug' }))
}

global.log = new (winston.Logger)({transports: transports});

process.on('uncaughtException', function(err) {
    // handle the error safely
    log.error('UNCAUGHT EXCEPTION:', err, err.stack);
    process.exit(1); //Dont contnue in undefined state
});



var Session = require('./Session');
var Room = require('./Room');


function Server() {

    this._sessions = [];
    this._rooms = {};
}

Server.prototype.getRoom = function(roomId) {
    if(this._rooms[roomId] === undefined)  {
        this._rooms[roomId] = new Room(roomId);
    }

    return this._rooms[roomId];
};

Server.prototype.isNameFree = function(name) {

    var free = true;
    this._sessions.forEach(function(s) {
        if(s.id === name) {
            free = false;
        }
    });
    return free;
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

    if(config.ssl) {

        this.ssl = tls.createServer(config.ssl.options, this.onConnect.bind(this))
        this.ssl.listen(config.ssl.port, function(err){

            if(err) {
                log.errror('Error listening on port');
                process.exit(1);
            }

            log.info('Server listening (SSL)');

        });
    }
};

Server.prototype.onConnect = function(socket) {

    var self = this;
    var addr = socket.remoteAddress;
    log.info('Client connected ' + addr);

    var s = new Session(this, socket);
    this._sessions.push(s);

    s._socket.on('end', function() {
        log.info('Client disconnected: ' + addr);
        self._sessions.slice(self._sessions.indexOf(s),1);
    });
};



(new Server()).start();
