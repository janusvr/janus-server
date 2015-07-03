/*
 * This plugin will update the `roomId` and `updated_at` of online users.
 *
 */
var mysql  = require('mysql');
var args   = require('optimist').argv;
var config = require(args.config || '../config.js');

function Plugin(server) {
    console.log("Loading mysql-userlist");
    log.info("Loading mysql-userlist");
    this._conn = mysql.createConnection({
    host     : config.MySQL_Hostname,
    user     : config.MySQL_Username,
    password : config.MySQL_Password,
    database : config.MySQL_Database
    });

    this._server = server;

    this._conn.connect(function(err) {
        if (err) {
            throw new Error('Can not connect to mysql server '+config.MySQL_Hostname);
            return;
        }
    console.log("Connected to mysql server "+config.MySQL_Hostname);
    log.info("Connected to mysql server "+config.MySQL_Hostname);
    });
}

Plugin.prototype.call = function() {
    var users = this._server._userList;
    
    for(u in users) {
        query = "UPDATE `users` SET `updated_at` = NOW(), `roomId` = ? WHERE `userId` = ?;";
        inserts = [users[u].roomId, u];
        sql = mysql.format(query, inserts);

        this._conn.query(sql, function(err, results) {
            if(err != null) throw new Error(err);
        });
    }
}

module.exports = Plugin;
