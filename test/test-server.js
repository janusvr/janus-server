var request = require('superagent'),
    assert = require('chai').assert,
    net = require('net'),
    WebSocketClient = require('websocket').client,
    Server = require('../server.js'),
    JanusClient = require('./JanusClient');


describe('server', () => {
    var app;
    before( (done) => {
        //process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0; // turn off ssl cert validation
        app = new Server();
        app.start(done);
    });

    after( (done) => {
        //process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 1;
        app.close( () => {
            app = null;
            done();
        });
    });

    it('should return 200 when /getPopularRooms is requested', (done) => {
        request
        .get('http://localhost:8080/getPopularRooms')
        .end(function(err, res) {
            if (err) return done(err);
            assert.equal(res.status, 200);
            done(); 
        });
    });

    it('should accept tcp connections', (done) => {
        var client = net.createConnection({port: global.config.port}, function(socket) {
            client.end();
        });
        client.on('error', (err) => {
            throw new Error(err);
        });
        client.on('end', done);
    });

    it('should accept websocket connections', (done) => {
        var client = new WebSocketClient();
        client.connect("ws://localhost:"+global.config.port);
        client.on('connectFailed', (err) => {
            throw new Error(err);
        });  
        client.on('connect', (conn) => {
            conn.close();
            done();
        });
    });

    describe("tcp connections", runClientTests.bind(this, "tcp")); 
    describe("websocket connections", runClientTests.bind(this, "websocket"));
});

function runClientTests (transport, done) {
    var client, 
        clientOptions = {
            transport: transport,
            host: 'localhost', 
            port: global.config.port, 
            room: 'http://testroom', 
            userId: 'tcptester'
        };
    before( (done) => { 
        client = new JanusClient(clientOptions);
        done();
    });

    after( (done) => {
        if (!client.destroyed) {
            client.on('end', done); 
            client.disconnect();
        }
        else {
            done();
        }
    });
    it('should return ok on logon method', (done) => { checkLogon(client, done) });
}

function checkLogon (client, done) {
    client.on('connected', () => {
        client.once('data', (data) => {
            assert.equal(data.method, "okay");
            client.disconnect();
            done();
        });
        client.sendLogon();
    });
    client.connect();
}

