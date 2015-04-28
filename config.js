
var fs = require('fs');

module.exports = {
    /* Socket port to listen on */
    port: 5566,

    /* Web UI */
    webServer: 8080,

    ssl: {
        port: 5567,
        options: {
            key: fs.readFileSync('server-key.pem'),
            cert: fs.readFileSync('server-cert.pem'),
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
