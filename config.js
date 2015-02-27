
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
	MySQL_Hostname: 'localhost',
	MySQL_Database: 'janusvr',
	MySQL_Username: 'janusvr',
	MySQL_Password: 'janusvr',

};
