


function Room(id) {

    this.id = id;
    this._sessions = [];

}

module.exports = Room;


Room.prototype.addSession = function(session) {

    var i = this._sessions.indexOf(session);
    if(i===-1) this._sessions.push(session);
};

Room.prototype.removeSession = function(session) {

    var i = this._sessions.indexOf(session);
    if(i!==-1) this._sessions.slice(i,1);
};

Room.prototype.emit = function(event,data) {

    this._sessions.forEach(function(s) {

        //Dont echo events back to originiating session
        if(data.userId === session.id) {
            return;
        }

        s.send(event,data);
    });
};
