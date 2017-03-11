/* global log */
var cluster = require('cluster');

if (cluster.isMaster) {
    var numCPUs  = require('os').cpus().length;
    console.log(`Starting ${numCPUs} workers`);
    console.log('========================');
    console.log('Janus VR Presence Server (clustered)');
    console.log('========================');
    console.log('See server.log for activity information and config.js for configuration');
    console.log('Startup date/time: ' + Date());
    for (var i = 0; i < numCPUs; i++)
        cluster.fork()
}

else {
    var args = require('optimist').argv;
    global.config = require(args.config || './config.js');

    var Server = require("./src/Server.js");

    (new Server()).start();
}
