var sets = require('simplesets');


function Room(id, server) {
    this.server = server; 
    this.id = id;
    this._sessions = new sets.Set();
    this.sub = server.redis.sub;
    this.pub = server.redis.pub;
    // subscribe from here, then have a global handler that hands off to room
    this.sub.psubscribe(id + ':*');
    
}

module.exports = Room;


Room.prototype.addSession = function(session) {
    this._sessions.add(session);
};

Room.prototype.removeSession = function(session) {
    this._sessions.remove(session);
};

Room.prototype.isEmpty = function() {
    return this._sessions.size() === 0;
}

Room.prototype.emitFromChannel = function(message) {
    this._sessions.each(function(s) {
        s.send(message);
    });
};

Room.prototype.emit = function(event, data, relay) {
    relay = relay || true;
    var packet = JSON.stringify({method:event, data: data}) + "\r\n";
    // relay is a boolean switch to control whether the data
    // should be relayed to the redis channel for this room
    if (relay)
         this.pub.publish(this.id + ':' + this.server.workerId, packet);

    this._sessions.each(function(s) {
        //Dont echo events back to originiating session
        if(data.userId === s.id) {
            return;
        }
        s.send(packet);
    });
};
