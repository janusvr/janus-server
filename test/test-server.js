var request = require('superagent'),
    chai = require('chai'),
    assert = chai.assert,
    expect = chai.expect,
    net = require('net'),
    WebSocketClient = require('websocket').client,
    Server = require('../server.js'),
    JanusClient = require('./JanusClient');


describe('server', () => {
    var app;
    before( (done) => {
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
    describe('presence server', (done) => {
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
    })
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
            userId: 'tester'
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
    it('logon should return {method: "okay"}', (done) =>  { checkLogon(client, done) });
    it('subscribe should return {method: "okay"}', (done) => { checkSubscribe(client, done) });
    it('enter_room should work', (done) => { checkEnterRoom(client, done)});
    it('unsubscribe should return {method: "okay"}', (done) => { checkUnsubscribe(client, done) });

}

function checkLogon (client, done) {
    client.on('connected', () => {
        client.once('data', (data) => {
            assert.equal(data.method, "okay");
            done();
        });
        client.sendLogon();
    });
    client.connect();
}


function checkSubscribe (client, done) {
    client.once('data', (data) => {
        assert.equal(data.method, "okay");
        done();
    });
    client.sendSubscribe(client._roomUrl);
}

function checkEnterRoom (client, done, party) {
    client.enter_room(client._roomUrl, true, () => {
        if (party == true)
            checkPartyList(done);
        else
            return done();
    });
}

function checkUnsubscribe (client, done) {
    client.once('data', (data) => {
        assert.equal(data.method, "okay");
        done();
    });
    client.unsubscribe();
}
