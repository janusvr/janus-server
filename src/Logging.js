
var npmlog = require('npmlog');
var args = require('optimist').argv;
var onFinished = require('finished');
var fs = require('fs');

var rootDirectory = __dirname.substr(0,__dirname.lastIndexOf('/')+1);

function callingFile(index, err) {

	var old = Error.prepareStackTrace;

	Error.prepareStackTrace = function (_, stack) {
		return stack;
	};

	if(err === undefined) {
		err = {};
		Error.captureStackTrace(err);
	}
	callFrame = err.stack[index];

	Error.prepareStackTrace = old;
	return callFrame.getFileName().replace(rootDirectory,'') + ':' + callFrame.getLineNumber();
}


if(args.debug) {
	npmlog.enableColor();
} else {
	npmlog.stream = fs.createWriteStream('server.log');
}

function log(level) {
	var msg = Array.prototype.slice.call(arguments,1);

	npmlog.log.apply(npmlog, [level,callingFile(2)].concat(msg));
}

process.on('uncaughtException', function(ex){
	npmlog.log('error', callingFile(0,ex), "Uncaught exception %s", ex.message);
	process.exit(1);
});


function httpLog(req,res,next) {
	var start = process.hrtime();

	onFinished(res, function(){
		var time = process.hrtime(start);
		time = (time[0] * 1e3) + (time[1]/1e6);
		npmlog.log('http', req.path, '%d time: %d ms', res.statusCode, time);
	});
	next();
}

module.exports = {
	_log: npmlog,
	info: log.bind(null,'info'),
	debug: log.bind(null,'verbose'),
	warn: log.bind(null,'warn'),
	fatal: log.bind(null,'fatal'),
	error: log.bind(null,'error'),
	http: httpLog
};
