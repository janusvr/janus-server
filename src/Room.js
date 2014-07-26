var sets = require('simplesets');


function Room(id) {

    this.id = id;
    this._sessions = new sets.Set();

}

module.exports = Room;


Room.prototype.addSession = function(session) {
    this._sessions.add(session);
};

Room.prototype.removeSession = function(session) {
    this._sessions.remove(session);
};

Room.prototype.emit = function(event,data) {

    this._sessions.each(function(s) {

        //Dont echo events back to originiating session
        if(data.userId === s.id) {
            return;
        }

        s.send(event,data);
    });
};
