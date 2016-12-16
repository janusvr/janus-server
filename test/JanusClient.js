var util = require("util"),
    crypto = require("crypto"),
    EventEmitter = require("events").EventEmitter,
    net = require('net'),
    WebSocketClient = require('websocket').client;

/**
 * @constructor
 * @param {string} opts.transport - Either "tcp" or "websocket"
 * @param {string} opts.host - Hostname to connect to
 * @param {number} opts.port - Port 
 * @param {string} opts.userId - Name of the user
 * @param {string} opts.room - URL of the room to start in
**/
function JanusClient(opts) {
    this._transport = opts.transport || "tcp",
    this._host = opts.host,
    this._port = opts.port,
    this._userId = opts.userId,
    this._roomId = crypto.createHash("md5").update(opts.room).digest("hex");
    this.destroyed = false;
    this._conn;
    if (this._transport === "tcp") {
        this._conn = new TcpClient(this._host, this._port, this._userId, this._roomId);
    }
    else if (this._transport === "websocket") {
        this._conn = new WsClient(this._host, this._port, this._userId, this._roomId); 
    }
    
    this._conn.on("connected", () => { this.emit("connected"); });
    this._conn.on("data", (data) => { this.emit("data", data); });
    this._conn.on("end", () => { this.emit("end"); });
}

util.inherits(JanusClient, EventEmitter);

JanusClient.prototype.connect = function() {
    this._conn.connect();
}

JanusClient.prototype.disconnect = function() {
    this._conn.disconnect();
    this._conn = null;
    this.destroyed = true;
}

JanusClient.prototype.send = function(msgData) {
    this._conn.send(msgData);
}

JanusClient.prototype.sendLogon = function() {
    if (!this._conn) throw new Error('no connection available');
    var msgData = {
        'method': 'logon',
        'data': {
            'userId': this._userId,
            'version': 55.3,
            'roomId': this._roomId
        }
    };
    this.send(msgData);
}

module.exports = JanusClient;

function TcpClient (host, port, userId, room) {
    this._socket;
    this._userId = userId;
    this._roomId = crypto.createHash("md5")
        .update(room)
        .digest("hex");
    this._port = port;
    this._host = host;
}
util.inherits(TcpClient, EventEmitter)

TcpClient.prototype.connect = function() {
    this._socket = net.createConnection({
            port: this._port, 
            host: this._host }, 
            () => { this.emit('connected'); });
    this._socket.on('data', (data) => {
        this.emit('data', JSON.parse(data));
    });
    this._socket.on('end', (data) => {
        this.emit('end');
    });
}

TcpClient.prototype.disconnect = function() {
    this._socket.end();
}

TcpClient.prototype.send = function(msgData) {
    this._socket.write(JSON.stringify(msgData) + '\r\n');
}

function WsClient (host, port, userId, room) {
    this._ws = new WebSocketClient();
    this._socket;
    this._userId = userId;
    this._roomId = crypto.createHash("md5")
        .update(room)
        .digest("hex");
    this._port = port;
    this._host = host;
}
util.inherits(WsClient, EventEmitter)

WsClient.prototype.connect = function() {
    this._ws.on('connectFailed', (err) => {
        throw new Error(err);
    });
    this._ws.on('connect', (conn) => {
        this._socket = conn;
        this.emit('connected');
        this._socket.on('message', (data) => {
            this.emit('data', JSON.parse(data.utf8Data));
        });
        this._socket.on('close', (data) => {
            this.emit('end');
        }); 
    });
    this._ws.connect("ws://"+this._host+":"+this._port);
}

WsClient.prototype.disconnect = function() {
    this._socket.close();
}

WsClient.prototype.send = function(msgData) {
    this._socket.send(JSON.stringify(msgData) + '\r\n');
}


