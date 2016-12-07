/* global log */

var args = require('optimist').argv;
global.config = require(args.config || './config.js');
var net = require('net');
var tls = require('tls');
var events = require('events');
var express = require('express');
var fs = require('fs');
var sets = require('simplesets');
var mysql = require('mysql');

// websocket requires
var websocket = require('websocket-driver');
var parser = require('http-string-parser');
var WebSocketStream = require('./src/WebSocketStream');

global.log = require('./src/Logging');

var Session = require('./src/Session');
var Room = require('./src/Room');
var Plugins = require('./src/Plugins');

function Server() {
    var d = new Date();
    this._sessions = new sets.Set();
    this._rooms = {};
    this._userList = Array();
    this._partyList = {};
    this._plugins = new Plugins(this);

}

Server.prototype.getRoom = function (roomId) {
    if (this._rooms[roomId] === undefined) {
        this._rooms[roomId] = new Room(roomId);
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
Server.prototype.start = function () {
    console.log('========================');
    console.log('Janus VR Presence Server');
    console.log('========================');
    log.info('Startup date/time: ' + Date());

    console.log('See server.log for activity information and config.js for configuration');
    console.log('Log level: ' + config.logLevel);
    console.log('Startup date/time: ' + Date());

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

    if (config.startWebServer) {
        this.startWebServer();
    }
};


// ## start web server ##
Server.prototype.startWebServer = function () {

    var self = this;

    this.ws = express();


    var router = express.Router();

    console.log('starting web server on port ' + config.webServerPort);
   
    if (global.config.hookPlugins.hasOwnProperty('enter_room') &&
        global.config.hookPlugins.enter_room.plugins.indexOf('janus-mysql-popular') > -1)
    { 
        this._conn = mysql.createPool({
            host     : config.MySQL_Hostname,
            user     : config.MySQL_Username,
            password : config.MySQL_Password,
            database : config.MySQL_Database
        });

        router.get('/getPopularRooms', function (req, res) {
            console.log('parmas', req.query);
            var limit = parseInt(req.query.limit, 10) || 20,
                offset = parseInt(req.query.offset, 10) || 0,
                orderBy = req.query.orderBy || "weight",
                desc = (req.query.desc && req.query.desc === "true") ? "DESC" : "";
            console.log('desc', desc);
            var sql = "SELECT roomName, url as roomUrl, count, weight, UNIX_TIMESTAMP(lastSeen) as lastEntered FROM `popular` ORDER BY ?? "+desc+" LIMIT ?,?";
            console.log(sql);
            this._conn.query(sql, [orderBy, offset, limit], function(err, results) {
                if (err) { 
                    console.log(err);
                    res.json({"success": false, "data": [{"error": "Error querying the DB"}]});
                    return;
                }
                
                res.json({"success": true, "data": results});
            })
        }.bind(this));
    }
    router.get('/log', function (req, res) {
        res.writeHead(200, {'Content-Type': 'text/plain', 'Content-Length': -1, 'Transfer-Encoding': 'chunked'});
        var logFile = fs.createReadStream('server.log');
        logFile.pipe(res);
    });

    router.get('/get_partylist', function (req, res) {
        //console.log("get_partylist: " + JSON.stringify(self._partyList));
        res.json(self._partyList);
    });

    router.get('/', function (req, res) {
        res.send(200, 'Nothing to see here ... yet');
    });


    this.ws.use(router);

    this.ws.listen(config.webServerPort, "::");
    log.info('Webserver started on port: ' + config.webServerPort);
    console.log('Start Date/Time: ' + Date());
};

// ## action on client connection ##
Server.prototype.onConnect = function (socket) {

    var self = this;
    var addr = socket.remoteAddress;
    var s;

    log.info('Client connected ' + addr);

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

(new Server()).start();
