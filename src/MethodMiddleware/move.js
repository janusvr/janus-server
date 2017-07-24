// ## user move ##
function move(position, next) {

    var data = {
        roomId: this.currentRoom.id,
        userId: this.id,
        position: position
    };

    this.currentRoom.emit('user_moved', data);
    return next();
};

module.exports = [move];
