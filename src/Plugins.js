var args = require('optimist').argv;
var config = require(args.config || '../config.js');

function Plugins(server) {
    this._plugins = [];
    this._intervals = [];
    this._server = server;

    this.intervalLoad();
}

Plugins.prototype.intervalLoad = function() {
    var plugins = config.intervalPlugins;

    for(var p in plugins) {
        var filename = '../plugins/' + plugins[p].plugin + '.js';
        var plugin = require(filename);
        var interval = new plugin(this._server);

        this._intervals[p] = setInterval(function() { interval.call(this._server); }, (plugins[p].interval * 1000)); 
    }
}

Plugins.prototype.call = function(name, socket, command) {
  var method = config.methodPlugins[name];

  for(var k in method.plugins) {
    var p = method.plugins[k];

    if(p === undefined) {
        err = "Unable to load plugin " + p;
        log.info(err);
        console.log(err);
        return;
    } 

    if(this._plugins[name] === undefined) {
        this._plugins[name] = Array();
    }
 
    if(this._plugins[name][p] === undefined) {
        this.load(name, p);
    }

    this._plugins[name][p].call(name, socket, command);
  }
}

Plugins.prototype.load = function(name, file) {
    var filename = '../plugins/' + file + '.js';
    this._plugins[name][file] = require(filename);
}

module.exports = Plugins;
