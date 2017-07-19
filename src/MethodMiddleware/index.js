var norm = require('path').join(__dirname);
var fs = require('fs');
var middleware = require('../Middleware.js');

var imported = {};

var files = fs.readdirSync(norm);
let jsfiles = files.filter(x => { 
    let split = x.split('.'); 
    return (split[split.length - 1] === 'js' && split[0] !== 'index')
});

var modules = jsfiles.map(x => x.split('.')[0]);

modules.forEach(method => {
    imported[method] = require("./"+method);
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
