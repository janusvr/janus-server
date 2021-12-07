var sets = require('simplesets');

class Room
{
    constructor(id, server) {
        this.server = server; 
        this.id = id;
        this._sessions = new sets.Set();
        if (global.config.multiprocess.enabled) {
            this.sub = server.redis.sub;
            this.pub = server.redis.pub;
            // subscribe from here, then have a global handler that hands off to room
            this.sub.psubscribe(id + ':*');
        }
    }

    addSession(session)
    {
        this._sessions.add(session);
    }

    removeSession(session)
    {
        this._sessions.remove(session);
    }

    isEmpty()
    {
        return this._sessions.size() === 0;
    }

    emitFromChannel(message)
    {
        this._sessions.each(function(s) {
            s.send(message);
        });
    }

    emit(event, data, relay)
    {
        relay = relay || true;
        if (!global.config.multiprocess.enabled) relay = false;
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
    }
}

module.exports = Room;
