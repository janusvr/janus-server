
var fs = require('fs');
var splitca = require('split-ca');

module.exports = {
    /* Socket port to listen on */
    port: 5566,

    /* Web UI */
    webServer: 8080,

    /*Log Levels - default is "info"
     *  
     *  This setting controls all logging into
     *  the server.log file - other than the
     *  restart message which will ALWAYS show.
     *
     * "info" -> log info and error events
     * "error" -> log error events only
     * "silent" -> do not log at all
     *
     * debug, warn, fatal, error, http could be 
     * implemented as well, but not done yet*/
    logLevel: "info",
    
    /* SSL configurations */
    ssl: {
        port: 5567,
        options: {
            ca: splitca('cert/cabundle.pem'),
            key: fs.readFileSync('cert/server-key.pem'),
            cert: fs.readFileSync('cert/server-cert.pem'),
        }
    },

    /* MySQL database connection info for user authentication */
    MySQL_Hostname: 'localhost',
    MySQL_Database: 'janusvr',
    MySQL_Username: 'janusvr',
    MySQL_Password: 'janusvr',

    /* Update user authentication information interval in minutes */
    UserInfo_updateInterval: 5,

    /*
    server mode 1: Free for all, anybody can log on with any userId
    server mode 2: Registered userId's will trigger a password request
    server mode 3: Only registered userId's are allowed to connect
    */
    server_mode: 2,

    /* wether or not to log connection stats */
    access_stats: 1,

    /* wether or not to show who's online or now */
    online_users: 1,

};
