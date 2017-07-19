
function unsubscribe(data, next) {

    if(data.roomId  === undefined) 
        return this.clientError('Missing roomId in data packet');

    var room = this._server.getRoom(data.roomId);
    var i = this._rooms.indexOf(room);
    if(i !== -1) {
        room.removeSession(this);
        this._rooms.splice(i,1);
    }
    if (room.isEmpty()) 
        delete this._server._rooms[data.roomId]; 
    
    this.clientOkay();
    return next();
};

module.exports = [unsubscribe];

