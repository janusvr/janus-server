var fs = require('fs');
var splitca = require('split-ca');

module.exports = {
    /* Socket port to listen on */
    port: 5566,

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

    // Path to log output file
    logFilePath: "./server.log",
    
    /* SSL configurations */
    ssl: {
        port: 5567,
        options: {
            ca: splitca('cert/cabundle.pem'),
            key: fs.readFileSync('cert/server-key.pem'),
            cert: fs.readFileSync('cert/server-cert.pem'),
        }
    },
    
    /*
    ************************************************************************
    ***   The following options REQUIRE a redis database to function !   ***
    ************************************************************************
    */
    redis: {
        host: "127.0.0.1",
        port: 6379,
        //password: null
    },


    /*
    ************************************************************************
    ***   The following options REQUIRE a MySQL database to function !   ***
    ************************************************************************
    */

    // If you want to track how many users are online, set UserList: true.
    Userlist: false,

    /* Controls how many results a request for 'users_online' receives. */
    maxUserResults: 100,

    /* MySQL database connection info for janus-mysql-auth and janus-mysql-userlist */
    MySQL_Hostname: 'localhost',
    MySQL_Database: 'janusvr',
    MySQL_Username: 'janusvr',
    MySQL_Password: 'janusvr',

    /* Authentication mode:
        'none'     - Will not attempt to authenticate users, 
                     anyone can connect with any unused userId.
        'optional' - Anyone can connect, but if userId has been registered
                     a password must be provided.
        'required' - Only users with userids and passwords are allowed to connect.
    */
    authMode: "none",
    
    popularRooms: {
      halfLife: 7 * 24 * 60 * 60 * 1000, // set halflife to 7 days
      updateInterval: 3000,             // interval between weight updates on the popular rooms
      masterToken: "changethis"  
    },

    /*
    ************************************************************************
    ***   The previous options REQUIRE a MySQL database to function !    ***
    ************************************************************************
    */



    /* Plugins must be installed from npm, or manually created in node_module/ to be loaded. */
    /* hookPlugins are called while parsing messages */
    hookPlugins: {  
        logon: { 
            plugins: [ "janus-mysql-auth" ]
        },
        enter_room: {
            plugins: ["janus-mysql-popular"]
        }
      
    },

    /* methodPlugins add new commands to the server */
    methodPlugins: {
        ping: { plugin: "janus-method-ping" }
    },

    /* intervalPlugins are called in intervals specified in seconds. */
    intervalPlugins: [
        { plugin: "janus-mysql-userlist", interval: 5 }
    ],
};
