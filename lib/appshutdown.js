// appshutdown.js
// Shut down app from uncaught exception or signal
// © Harald Rudell 2012

var apperror = require('./apperror')
var anomaly = require('./anomaly')

exports.init = init

var slogan
var haraldOpsShutdown = defaultHaraldOpsShutdown

function init(defaults, slogan0) {
	haraldOpsShutdown = defaults.init && defaults.init.ops && defaults.init.ops.shutDown ||
		defaultHaraldOpsShutdown
	process.on('uncaughtException', processError)
	process.on('SIGINT', controlBreak)
}

function controlBreak() {
	console.log(slogan + ': caught SIGINT or ctrl-C')
	shutDown(0)
}

// global uncaught exception: shut down application
function processError(err) {
	console.log(slogan + ': detected uncaught exception')
	apperror.apiError.apply(this, [Error('Process Error')].concat(Array.prototype.slice.call(arguments)))
	shutDown(2)
}

function shutDown(exitCode) {
	console.log(slogan + ': is exiting the application with with code: ' + exitCode)
	anomaly.anomalyDown(closeOps)

	function closeOps() {
		haraldOpsShutdown(doExit)
	}

	function doExit() {
		process.exit(exitCode)
	}
}

function defaultHaraldOpsShutdown(cb) {
	 if (cb) cb()
}