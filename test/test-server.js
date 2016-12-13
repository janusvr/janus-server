var request = require('superagent'),
    assert = require('chai').assert,
    net = require('net'),
    Server = require('../server.js');


describe('server', function() {
    var app;
    before(function(done) {
        //process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0; // turn off ssl cert validation
        app = new Server();
        app.start(() => { 
            done();
        });
    });

    after(function(done) {
        //process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 1;
        app.close( () => {
            app = null;
            done();
        });
    });

    it('should return 200 when /getPopularRooms is requested', function(done) {
        request
        .get('http://localhost:8080/getPopularRooms')
        .end(function(err, res) {
            if (err) return done(err);
            assert.equal(res.status, 200);
            done(); 
        });
    });

    it('should accept tcp connections', function(done) {
        var client = net.createConnection({port: global.config.port}, function(socket) {
            client.end();
        });
        client.on('error', (err) => {
            throw new Error(err);
        });
        client.on('end', () => {
            done();
        });
    });

});

