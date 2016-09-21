var Stream = require('stream'),
    util = require('util');

function WebSocketStream(driver, socket) {
  Stream.call(this);
  this._driver = driver;
  this._socket = socket;
  this.readable = this.writable = true;

  this.localAddress = socket.localAddress;
  this.localPort = socket.localPort;

  this.remoteFamily = socket.remoteFamily;
  this.remoteAddress = socket.remoteAddress;
  this.remotePort = socket.remotePort;
  
  this._driver.on('message', function(message) { 
    this.emit('data', message.data);
  }.bind(this));


  this._driver.on('close', function() {
    this.emit('close');
  }.bind(this));
}

util.inherits(WebSocketStream, Stream);

module.exports = WebSocketStream;

WebSocketStream.prototype.write = function(message) {
  this._driver.text(message);
}
