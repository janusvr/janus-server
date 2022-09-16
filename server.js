/* global log */
var cluster = require('cluster');
var redis = require('redis');
const config = require('./config.js');

if (cluster.isMaster && config.multiprocess.enabled) {
    var numCPUs = config.multiproccess.processes;
    console.log(`Starting ${numCPUs} workers`);
    console.log('========================');
    console.log('Janus VR Presence Server (clustered)');
    console.log('========================');
    console.log('See config.js for configuration');
    console.log('Startup date/time: ' + Date());
    var redisClient = redis.createClient(config.redis);
    redisClient.del('userlist:multi');
    redisClient.del('partylist:multi');
    for (var i = 0; i < numCPUs; i++) {
        var child = cluster.fork();
        child.on('exit', () => {
            redisClient.hdel('userlist', child.process.pid);
            redisClient.hdel('partylist', child.process.pid);            
        });
    }

    Object.keys(cluster.workers).forEach(function(id) {
        console.log('SPAWNED', cluster.workers[id].process.pid);
    });
}

else {
    var Server = require("./src/Server.js");
    (new Server(config)).start();
}
