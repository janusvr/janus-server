var net = require('net');
var tls = require('tls');
var events = require('events');
var fs = require('fs');
var sets = require('simplesets');
var mysql = require('mysql');
var cluster = require('cluster');
// websocket requires
var websocket = require('websocket-driver');
var parser = require('http-string-parser');
var WebSocketStream = require('./WebSocketStream');

//global.log = require('./Logging');
global.log = {
    _log: console.log,
    info: console.log,
    debug: console.log,
    warn: console.log,
    error: console.error,
    http: console.log 
};

var Session = require('./Session');
var Room = require('./Room');
var Plugins = require('./Plugins');
var redis = require('redis');

function Server() {
    var d = new Date();
    this._sessions = new sets.Set();
    this._rooms = {};
    this._userList = Array();
    this._partyList = {};
    this._plugins = new Plugins(this);

    this.redisClient = redis.createClient(config.redis);
    this.savePartyList();

    if (cluster.isWorker)
        this.workerId = cluster.worker.id.toString();
    else this.workerId = process.pid.toString();
    this.redis = {
        pub: redis.createClient(config.redis),
        sub: redis.createClient(config.redis)
    }
    this.redis.sub.on("pmessage", (pattern, channel, message) => {
        var split = channel.split(':');
        if (split[1] !== this.workerId && this._rooms[split[0]] !== undefined) {
            this._rooms[split[0]].emitFromChannel(message);
        }
    });
}

Server.prototype.getRoom = function (roomId) {
    if (this._rooms[roomId] === undefined) {
        this._rooms[roomId] = new Room(roomId, this);
    }

    return this._rooms[roomId];
};

// ## Check if username is in use ##
Server.prototype.isNameFree = function (name) {

    var free = true;
    this._sessions.each(function (s) {
        if (s.id === name) {
            free = false;
        }
    });
    return free;
};

// ## Start Socket Server ##
Server.prototype.start = function (callback) {

    this.server = net.createServer(this.onConnect.bind(this));
    this.server.listen(config.port, "::", function (err) {

        if (err) {
            log.error('Socket Server error listening on port: ' + config.port);
            process.exit(1);
        }

        log.info('Socket Server listening on port: ' + config.port);
        console.log('Socket Server listening on port: ' + config.port);

    });

    if (config.ssl) {

        this.ssl = tls.createServer(config.ssl.options, this.onConnect.bind(this));
        this.ssl.listen(config.ssl.port, "::", function (err) {

            if (err) {
                log.error('SSL Server error listening on port: ' + config.ssl.port);
                process.exit(1);
            }

            console.log('SSL Server listening on port: ' + config.ssl.port);
            log.info('SSL Server listening on port: ' + config.ssl.port);

        });
    }

    if (callback && typeof(callback) == "function") 
        callback();
};



Server.prototype.close = function(cb) {
    this.redisClient.quit();
    this.server.close( (err) => {
        return cb(err);
    });
}

Server.prototype.savePartyList = function() {
    this.redisClient.set('partylist', JSON.stringify(this._partyList));
}

// ## action on client connection ##
Server.prototype.onConnect = function (socket) {
    var self = this;
    var addr = socket.remoteAddress;
    var s;

    log.info('Client connected ' + addr + ' pid: ' + process.pid);

    // setup for websocket
    var driver = websocket.server({'protocols': 'binary'});
    socket.on('error', function (err) {
        log.error(addr);
        log.error('Socket error: ', err);
    });
    socket.on('close', function () {
        log.info('Client disconnected: ' + addr);
        if (s)
            self._sessions.remove(s);
    });

    socket.once('data', function (data) {
        // try to parse the packet as http
        var request = parser.parseRequest(data.toString());

        if (Object.keys(request.headers).length === 0)
        {
            // there are no http headers, this is a raw tcp connection
            s = new Session(self, socket);
            self._sessions.add(s);

            // emit the first message so the session gets it
            socket.emit('data', data);
        }
    });

    driver.on('connect', function () {
        if (websocket.isWebSocket(driver)) {
            log.info('Websocket connection:', addr);
            driver.start();

            s = new Session(self, new WebSocketStream(driver, socket));
            self._sessions.add(s)

            driver.on('error', function (err) {
                log.error(addr);
                log.error('Websocket error: ', err);
            });
        }
    });
    socket.pipe(driver.io).pipe(socket);
};

module.exports = Server;
