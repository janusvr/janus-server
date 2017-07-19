function subscribe(data, next) {

    if(data.roomId  === undefined) 
        return this.clientError('Missing roomId in data packet');

    var room = this._server.getRoom(data.roomId);

    if(this._rooms.indexOf(room) === -1) {
        room.addSession(this);
        this._rooms.push(room);
    }

    this.clientOkay();
    return next();
};

module.exports = [subscribe];

