// ## user chat ##
function chat(message, next) {

    var data = {
        roomId: this.currentRoom.id,
        userId: this.id,
        message: message
    };

    this.currentRoom.emit('user_chat', data);
    return next();
};

module.exports = [chat];

