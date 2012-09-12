// appshutdown.js
// Shut down app from uncaught exception or signal
// © Harald Rudell 2012

var anomaly = require('./anomaly')
var apimanager = require('./apimanager')
// http://nodejs.org/api/fs.html
var fs = require('fs')
// http://nodejs.org/api/path.html
var path = require('path')

exports.init = init
exports.shutdown = shutdown

var emitter = new (require('events').EventEmitter)
emitter.id = 'Process Watch'

var defaults = {}
var appName = 'Unknown'

function init(defaults0) {
	if (defaults0) defaults = defaults0
	if (defaults.init && defaults.init.appName) appName = defaults.init.appName

	ensureListener('uncaughtException', processException)
	ensureListener('SIGINT', processSigInt)
	ensureListener('SIGUSR2', processSigUsr2)
}

function ensureListener(signal, handler) {
	if (!~process.listeners(signal).indexOf(handler))
		process.on(signal, handler)
}

function processSigInt() {
	shutDown(0, 'caught SIGINT or ctrl-C')
}

function shutdown(exitCode) {
	shutDown(exitCode || 0, 'had shutdown invoked')
}

function processException(err) {
	console.log(appName + ': detected uncaught exception')
	anomaly.anomaly.apply(emitter, [err, new Error('Process Exception')].concat(Array.prototype.slice.call(arguments).slice(1)))
	shutDown(2)
}

function shutDown(exitCode, reason) {
	console.log(appName + (reason ? ': ' + reason : '') + ': exiting with code: ' + exitCode)
	apimanager.endApi(endApiResult)

	function endApiResult(err) { // err has already been reported, and app is shutting down
		anomaly.anomalyDown(closeOps)
	}

	function closeOps() {
		if (defaults.init &&
			defaults.init.ops &&
			typeof defaults.init.ops.shutDown == 'function')
			defaults.init.ops.shutDown(doExit)
		else doExit()
	}

	function doExit() {
		console.log(emitter.id, 'process.exit')
		process.exit(exitCode)
	}
}

function processSigUsr2() {

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
			anomaly.anomaly(e, obj)
		}
	}

	// write
	if (file && data) fs.writeFile(file, data, writeResult)

	function writeResult(err) {
		if (err) anomaly.anomaly(e, file)
	}
}