var args = require('optimist').argv;
var config = require(args.config || '../config.js');
var Session = require('./Session');

class Plugins
{
    constructor(server)
    {
        this._plugins = [];
        this._intervals = [];
        this._methodPlugins = [];
        this._server = server;

        this.intervalLoad();
        this.methodLoad();
    }

    intervalLoad()
    {
        var plugins = config.intervalPlugins;

        for(var p in plugins) {
            var file = plugins[p].plugin;
            var plugin = require(file);
            var interval = new plugin(this._server);
    
            this._intervals[p] = setInterval(function() { interval.call(this._server); }, (plugins[p].interval * 1000)); 
        }
    }

    methodLoad()
    {
        var plugins = config.methodPlugins;

        for(var method in plugins) {
            var file = plugins[method].plugin;
            var plugin = require(file); 
            Session.validMethods.push(method);
            Session.prototype[method] = plugin.call;
        }
    }

    call()
    {
        var hook = config.hookPlugins[name];

        for(var k in hook.plugins) {
            var p = hook.plugins[k];
            
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

    load(name, file)
    {
        this._plugins[name][file] = require(file);
    }
}

module.exports = Plugins;
