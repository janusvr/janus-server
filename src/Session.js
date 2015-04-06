var args = require('optimist').argv;
var byline = require('byline');
var config = require(args.config || '../config.js');
var mysql = require('mysql');


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


    byline(socket).on('data', this.parseMessage.bind(this));

    socket.on('close', function() {
		var dbcon = mysql.createConnection({
			database : config.MySQL_Database,
			host     : config.MySQL_Hostname,
			user     : config.MySQL_Username,
			password : config.MySQL_Password,
		});
		dbcon.connect(function(err) {
			// connected! (unless `err` is set)
		});
		var post = {userid: self.id};
		dbcon.query('DELETE FROM online_users WHERE ?', post, function(err, result) {
		});
		dbcon.end();

        if ( self.currentRoom ) {
            self.currentRoom.emit('user_disconnected', { userId:self.id });

        }

        self._rooms.forEach(function(room) {
            room.removeSession(self);
        });
    });
};




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

Session.validMethods = [
						'logon', 
						'subscribe', 
						'unsubscribe', 
						'enter_room', 
						'move', 
						'chat', 
						'portal', 
						'usersonline', 
						'getusersonline', 
						'usersinroom', 
						'getusersinroom',
						'passwordrequest'
					];

Session.prototype.parseMessage = function(data) {

    //log.info('C->S: ' + data);

    var payload;

    try {
        payload = JSON.parse(data);
    } catch(e) {
    	log.info("data: " + data);
    	log.info("payload: " + payload);
        this.clientError('Unable to parse last message');
        return;
    }
    if(Session.validMethods.indexOf(payload.method) === -1) {
        this.clientError('Invalid method: ' + payload.method);
        return;
    }

    if(payload.method !== 'logon' && !this._authed ) {
        this.clientError('Missing or wrong password');
        return;
    }

	Session.prototype[payload.method].call(this,payload.data);
};




/*************************************************************************/
/*  Client methods                                                       */
/*************************************************************************/


// ## User Logon ##
Session.prototype.logon = function(data) {

	var userInfo = this._server.getUserInfo(data.userId);
	var dbcon = mysql.createConnection({
		database : config.MySQL_Database,
		host     : config.MySQL_Hostname,
		user     : config.MySQL_Username,
		password : config.MySQL_Password,
	});



    if(data.userId === undefined) {
        this.clientError('Missing userId in data packet');
        return;
    }

	if(data.roomId === undefined) {
        this.clientError('Missing roomId in data packet');
        return;
    }

    if(!this._server.isNameFree(data.userId)) {
        this.clientError('User name is already in use');
        return;
    }

	if ( data.userId !== undefined) {


		if ( userInfo == 0 ) {

			this._authed = true;
			this.id = data.userId;
		}

		else {
			var storedUserPass = userInfo[1];
			var transmittedUserPass = data.password;

			if ( transmittedUserPass !== "" ) {
				if ( transmittedUserPass === storedUserPass ) {
					this._authed = true;
					this.id = data.userId;
					log.info(data.userId + " authenticated.");
				}
				else {
					log.info("Failed password authentication by username: " + userInfo[0]);
					this.send('passwordrequest');
				}
			}
		}
	}




	if ( this._authed == true ) {
		
		log.info('User: ' + this.id + ' signed on ' + this._authed);
	    this.currentRoom = this._server.getRoom(data.roomId);
		this.subscribe(data);

		dbcon.connect(function(err) {
			// connected! (unless `err` is set)
		});
		var post = {userid: data.userId};
		dbcon.query('INSERT INTO online_users SET ?', post, function(err, result) {
		});
		dbcon.end();
	}
};


// ## user enter room ##
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


// ## user move ##
Session.prototype.move = function(position) {

    var data = {
        roomId: this.currentRoom.id,
        userId: this.id,
        position: position
    };

    this.currentRoom.emit('user_moved', data);
};


// ## user chat ##
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

Session.prototype.getusersonline = function(data) {
	var userCount = this._server.usersonline();
	this.send('usersonline', userCount);
};

Session.prototype.getusersinroom = function(data) {
	var usersInRoom = this._server.usersinroom();
	this.send('usersinroom', usersInRoom);
};


