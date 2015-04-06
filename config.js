
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

	/* Server modes:
		0: No authentication
		1: Registered usernames must authenticate
		2: All users must authenticate
	*/
	ServerMode: 1,
};
