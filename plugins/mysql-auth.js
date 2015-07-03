var mysql  = require('mysql');
var args   = require('optimist').argv;
var config = require(args.config || '../config.js');

var create_users_query = "CREATE TABLE IF NOT EXISTS `users` (";
    create_users_query+= "`id` int(11) NOT NULL AUTO_INCREMENT, PRIMARY KEY(`id`),";
    create_users_query+= "  `userId` varchar(255) NOT NULL, UNIQUE(`userId`),";
    create_users_query+= "  `password` varchar(255) DEFAULT NULL,";
    create_users_query+= "  `ip` varchar(40) NOT NULL,";
    create_users_query+= "  `blocked` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',";
    create_users_query+= "  `note` blob NOT NULL,";
    create_users_query+= "  `client_version` varchar(32) NOT NULL,";
    create_users_query+= "  `roomId` varchar(64) NOT NULL,";
    create_users_query+= "  `created_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',";
    create_users_query+= "  `updated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00'";
    create_users_query+= ")";

var create_access_query = "CREATE TABLE IF NOT EXISTS `access_statistics` (";
    create_access_query+= "  `logon_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,";
    create_access_query+= "  `ip` char(40) DEFAULT NULL";
    create_access_query+= ");";

function Plugin() {
    console.log("Loading mysql-auth");
    log.info("Loading mysql-auth");
    this._conn = mysql.createConnection({
    host     : config.MySQL_Hostname,
    user     : config.MySQL_Username,
    password : config.MySQL_Password,
    database : config.MySQL_Database
    });

    this._conn.connect(function(err) {
        if (err) {
            throw new Error('Can not connect to mysql server '+config.MySQL_Hostname);
            return;
        }
    console.log("Connected to mysql server "+config.MySQL_Hostname);
    log.info("Connected to mysql server "+config.MySQL_Hostname);
    });

    this._conn.query(create_users_query, function(err, results) {
        if(err != null) throw new Error(err);
        if(results.warningCount == 0) log.info("Created `users` table.");
    });

    this._conn.query(create_access_query, function(err, results) {
        if(err != null) throw new Error(err);
        if(results.warningCount == 0) log.info("Created `access_statistics` table.");
    });   
}

Plugin.prototype.call = function(name, session, command) {
    switch(config.authMode) {
        case 'optional':
            if(command.password === undefined) {
                this.search(command, session);
            }
            else this.authenticate(command, session);
            break;
        case 'required':
            if(command.password === undefined) {
                session.clientError('Password is required, none given.');
                session._socket.destroy();
                return;
            }

            this.authenticate(command, session);
            break;
        case 'none':
            break;
    }

    /* User successfully authenticated */
    var access_query = "INSERT INTO `access_statistics` (`logon_time`, `ip`) VALUES (NOW(), ?);";
    var inserts = [session._socket.remoteAddress];
    var sql = mysql.format(access_query, inserts);

    this._conn.query(sql, function(err, results) {
        if(err != null) console.log(err);
    });

    var update_query = "INSERT INTO `users` (`userId`, `ip`, `created_at`, `client_version`, `roomId`, `password`) VALUES (?, ?, NOW(), ?, ?, ?)";
        update_query+= " ON DUPLICATE KEY UPDATE `ip` = ?, `client_version` = ?, `roomId` = ?, `updated_at` = NOW();";
    var inserts = [ command.userId, session._socket.remoteAddress, command.version, command.roomId, '', 
                    session._socket.remoteAddress, command.version, command.roomId ];
    var sql = mysql.format(update_query, inserts);

    this._conn.query(sql, function(err, results) {
        if(err != null) throw new Error(err);
    });
}

Plugin.prototype.search = function(command, session) {
    var search_query = "SELECT `userId` FROM `users` WHERE `userId` = ? AND `password` != '';";
    var inserts = [command.userId];
    var sql = mysql.format(search_query, inserts);

    this._conn.query(sql, function(err, results) {
        if(err != null) throw new Error(err);
        if(results.length) {
            session.clientError('You must specify password');
            session._socket.destroy();
            return;
        }
    });

    var search_query = "SELECT `userId`, `blocked` FROM `users` WHERE `userId` = ? AND `blocked` != '0000-00-00 00:00:00';";
    var inserts = [command.userId];
    var sql = mysql.format(search_query, inserts);

    this._conn.query(sql, function(err, results) {
        if(err != null) throw new Error(err);
        if(results.length) {
            for(k in results) {
                session.clientError('You were blocked on ' + results[k].blocked);
                session._socket.destroy();
                return;
            }
        }
    });
}

Plugin.prototype.authenticate = function(command, session) {
    var auth_query = "SELECT * FROM `users` WHERE `userId` = ? AND `password` = PASSWORD(?);";
    var inserts = [command.userId, command.password];
    var sql = mysql.format(auth_query, inserts);

    this._conn.query(sql, function(err, results) {
                        if(err != null) throw new Error(err);
                        if(results.length == 0) {
                            session.clientError('Incorrect username or password');
                            session._socket.destroy();
                            return;
                        }
                    });

    var search_query = "SELECT `userId`, `blocked` FROM `users` WHERE `userId` = ? AND `blocked` != '0000-00-00 00:00:00';";
    var inserts = [command.userId];
    var sql = mysql.format(search_query, inserts);

    this._conn.query(sql, function(err, results) {
        if(err != null) throw new Error(err);
        if(results.length) {  
            for(k in results) {
                session.clientError('You were blocked on ' + results[k].blocked);
                session._socket.destroy();
                return;
            }
        }
    });
}

module.exports = new Plugin();
