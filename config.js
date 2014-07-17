
var fs = require('fs');

module.exports = {

    /* Socket port to listen on */
    port: '5566',


    ssl: {
        port: 5567,
        options: {
            key: fs.readFileSync('server-key.pem'),
            cert: fs.readFileSync('server-cert.pem'),
        }
    }


}
