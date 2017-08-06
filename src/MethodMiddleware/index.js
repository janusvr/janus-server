var middlewarePath = process.cwd() + '/src/MethodMiddleware/';
var pluginPath = process.cwd() + '/plugins/';

var fs = require('fs');
var middleware = require('../Middleware.js');

var imported = {};
var plugins = {};

function getModules(directory) {
    let files = fs.readdirSync(directory);
    let jsfiles = files.filter(x => { 
        let split = x.split('.'); 
        return (split[split.length - 1] === 'js' && split[0] !== 'index');
    });
    return jsfiles.map(x => x.split('.')[0]); 
}

var middlewareModules = getModules(middlewarePath);
middlewareModules.forEach(method => {
    imported[method] = require(middlewarePath+method);
});

// plugin format: { method: 'logon', functions: [] }

var pluginModules = getModules(pluginPath);
pluginModules.forEach(x => {
    let plugin = plugins[x] = require(pluginPath+x),
        method = plugin.method;
    if (imported.hasOwnProperty(method)) 
        imported[method] = plugin.functions.concat(imported[method]);
});

function getMiddleware(context) {
    var keys = Object.keys(imported);
    var methods = {};
    keys.forEach((key) => {
        methods[key] = (data) => { 
            var tasks = imported[key].map(x => x.bind(context));
            return middleware(data, tasks, () => {});
        };
    });
    return methods;
}
module.exports = getMiddleware;
