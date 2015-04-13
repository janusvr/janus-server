
var fs = require('fs');

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
            key: fs.readFileSync('server-key.pem'),
            cert: fs.readFileSync('server-cert.pem'),
        }
    }

};
