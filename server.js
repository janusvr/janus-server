var args = require('optimist').argv;
var config = require(args.config || './config.js');
var net = require('net');
var tls = require('tls');
var events = require('events');
var express = require('express');
var fs = require('fs');
var sets = require('simplesets');

var mysql = require('mysql');

var totalConnected = 0;
var userList = [];

global.log = require('./src/Logging');

var Session = require('./src/Session');
var Room = require('./src/Room');


function Server() {

    this._sessions = new sets.Set();
    this._rooms = {};
	this.updateUserList();
	var UIUInt = ( config.UserInfo_updateInterval * 60 ) * 1000;
	var timerId = setInterval(this.updateUserList, UIUInt); // Update username and pass list every 5 min
}

Server.prototype.getRoom = function(roomId) {
    if(this._rooms[roomId] === undefined)  {
        this._rooms[roomId] = new Room(roomId);
    }

    return this._rooms[roomId];
};

// ## Check if username is in use ##
Server.prototype.isNameFree = function(name) {

    var free = true;
    this._sessions.each(function(s) {
        if(s.id === name) {
            free = false;
        }
    });
    return free;
};

// ## Start Socket Server ##
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


// ## start web server ##
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

// ## action on client connection ##
Server.prototype.onConnect = function(socket) {

    var self = this;
    var addr = socket.remoteAddress;
    totalConnected++;
    log.info('Client connected ' + addr);

    var s = new Session(this, socket);
    this._sessions.add(s);

    socket.on('close', function() {
    	totalConnected--;
        log.info('Client disconnected: ' + addr);
        self._sessions.remove(s);
    });

    socket.on('error', function(err){
        log.error('Socket error: ', err);
    });
};

// ## return global client count connected to server ##
Server.prototype.usersonline = function() {
	return totalConnected;
};

// ## return client count in current room ## TODO not working yet
Server.prototype.usersinroom = function(room) {
	return 0;
};

Server.prototype.updateUserList = function() {
	log.info("Updating userlist");
	var dbcon = mysql.createConnection({
		database : config.MySQL_Database,
		host     : config.MySQL_Hostname,
		user     : config.MySQL_Username,
		password : config.MySQL_Password,
	});

	while(userList.length > 0) {
		userList.pop();
	}

	dbcon.connect(function(err) {
		// connected! (unless `err` is set)
	});

	dbcon.query('SELECT * FROM usernames ORDER BY user DESC', function(err, rows, fields) {
		for (var i in rows) {
			userList.push([rows[i].user, rows[i].password, rows[i].lastlogin, rows[i].isloggedin]);
		}
	});
	dbcon.end();

};

Server.prototype.getUserInfo = function(username) {
	var returnVar = 0;
	for (var i = 0; i <= userList.length-1; i++) {
		//log.info(username + " - " + userList[i][0]);
		if ( userList[i][0].toLowerCase() === username.toLowerCase() ) {
			returnVar = userList[i];
		}
	}
	return returnVar;
};

(new Server()).start();
