function portal(portal, next) {

    //TODO: Persist portals

    var data = {
        roomId: this.currentRoom.id,
        userId: this.id,
        url: portal.url,
        pos: portal.pos,
        fwd: portal.fwd
    };

    this.currentRoom.emit('user_portal', data);
    this.clientOkay();
    return next();
};

module.exports = [portal];
