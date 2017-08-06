function validateLogon(data, next) {
    if(typeof data.userId !== "string" || data.userId === '') 
        return this.clientError('Missing userId in data packet');        

    if (!data.userId.match('^[a-zA-Z0-9_]+$')) 
        return this.clientError('illegal character in user name, only use alphanumeric and underscore');;

    if(data.roomId === undefined) 
        return this.clientError('Missing roomId in data packet');;
    return next();
}

function checkNameFree(data, next) {
    this._server.isNameFree(data.userId, (err, free) => {
        if (!free) return this.clientError('User name is already in use');;
        return next();
    }); 
}

function setLogonData(data, next) {
    this.id = data.userId;
    this._authed = true;
    this.client_version = 
            (data.version === undefined)?"undefined":data.version;
    
    this._server._userList[data.userId] = {
        roomId: data.roomId,
    }
    return next();
}

function setRoomData(data, next) {
    this.currentRoom = this._server.getRoom(data.roomId);
    log.info('User: ' + this.id + ' logged on');
    return next();
}

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
}
module.exports = [validateLogon, checkNameFree, setLogonData, setRoomData, subscribe];
