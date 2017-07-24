function enterRoom(data, next) {
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
    //this._server._plugins.call("enter_room", data);
    // TODO  
    this._server._userList[this.id].oldRoomId = oldRoomId;
    this._server._userList[this.id].roomId = data.roomId;
    if ((data.partyMode == true) || (data.partyMode == "true")) {
        if (this._server._partyList[this.id] === undefined) {
            this._server._partyList[this.id] = {};
       
        }
        if ((data.roomUrl !== undefined) && (data.roomUrl.match('^https?://'))){   
            this._server._partyList[this.id].roomId = data.roomId;    
            this._server._partyList[this.id].roomUrl = data.roomUrl;    
            this._server._partyList[this.id].roomName = (data.roomName === undefined) ? "" : data.roomName;   
            this._server._partyList[this.id].client_version = this.client_version;    
        }           
    } else {
         delete this._server._partyList[this.id];       
    }
    this._server.savePartyList();    
    this.currentRoom = this._server.getRoom(data.roomId);
    this.currentRoom.emit('user_enter', { 
        userId: this.id, 
        roomId: data.roomId,
        oldRoomId: oldRoomId
    });
    return next();
}

module.exports = [enterRoom];
