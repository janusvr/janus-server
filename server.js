var args = require('optimist').argv;
var config = require(args.config || './config.js');
var net = require('net');
var tls = require('tls');
var events = require('events');
var express = require('express');
var fs = require('fs');
var sets = require('simplesets');

global.log = require('./src/Logging');

var Session = require('./src/Session');
var Room = require('./src/Room');


function Server() {

    this._sessions = new sets.Set();
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
    this._sessions.each(function(s) {
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
            log.error('Error listening on port');
            process.exit(1);
        }

        log.info('Server listening');

    });

    if(config.ssl) {

        this.ssl = tls.createServer(config.ssl.options, this.onConnect.bind(this));
        this.ssl.listen(config.ssl.port, function(err){

            if(err) {
                log.error('Error listening on port');
                process.exit(1);
            }

            log.info('Server listening (SSL)');

        });
    }

    this.startWebServer();
};

Server.prototype.startWebServer = function() {

    var self = this;

    this.ws = express();


    var router = express.Router();

    router.get('/log', function(req,res){
        res.writeHead(200, {'Content-Type':'text/plain', 'Content-Length':-1, 'Transfer-Encoding': 'chunked'});
        var logFile = fs.createReadStream('server.log');
        logFile.pipe(res);
    });

    router.get('/', function(req,res){
        res.send(200, 'Nothing to see here ... yet');
    });


    this.ws.use(router);

    this.ws.listen(config.webServer);
    log.info('Webserver started on port: ' + config.webServer);

};

Server.prototype.onConnect = function(socket) {

    var self = this;
    var addr = socket.remoteAddress;
    log.info('Client connected ' + addr);

    var s = new Session(this, socket);
    this._sessions.add(s);

    socket.on('close', function() {
        log.info('Client disconnected: ' + addr);
        self._sessions.remove(s);
    });

    socket.on('error', function(err){
        log.error('Socket error: ', err);
    });
};



(new Server()).start();
