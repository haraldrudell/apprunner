// appshutdown.js
// Shut down app from uncaught exception or signal
// © Harald Rudell 2012

var apperror = require('./apperror')
var anomaly = require('./anomaly')
// http://nodejs.org/api/fs.html
var fs = require('fs')
// http://nodejs.org/api/path.html
var path = require('path')

exports.init = init

// for testing
exports.controlBreak = controlBreak
exports.processError = processError

var defaults
var slogan
var haraldOpsShutdown = defaultHaraldOpsShutdown

function init(defaults0, slogan0) {
	defaults = defaults0 || {}
	haraldOpsShutdown = defaults.init && defaults.init.ops && defaults.init.ops.shutDown ||
		defaultHaraldOpsShutdown
	slogan = slogan0
	process.on('uncaughtException', processError)
	process.on('SIGINT', controlBreak)
	process.on('SIGUSR2', writeInfo)	
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

function writeInfo() {

	// get filename
	var file
	if (defaults.init && defaults.init.tmpFolder) file = path.join(defaults.init.tmpFolder, process.pid + '.json')

	// get data
	var data
	if (defaults.PORT || defaults.URL) {
		obj = {}
		if (defaults.PORT) obj.PORT = defaults.PORT
		if (defaults.URL) obj.URL = defaults.URL
		try {
			data = JSON.stringify(obj)
		} catch(e) {
			apperror.apiError(e, obj)
		}
	}

	// write
	if (file && data) fs.writeFile(file, data, writeResult)

	function writeResult(err) {
		if (err) apperror.apiError(e, file)
	}
}