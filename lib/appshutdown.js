// appshutdown.js
// Shut down app from uncaught exception or signal
// © Harald Rudell 2012

var anomaly = require('./anomaly')
var apitouchxx = require('./apitouch-x')
var apilist = require('./apilist')

// http://nodejs.org/api/fs.html
var fs = require('fs')
// http://nodejs.org/api/path.html
var path = require('path')

;[
init, shutdown
].forEach(function (f) {exports[f.name] = f})

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
	if (!defaults.apprunner || !defaults.apprunner.uncaughtException ||
		defaults.apprunner.uncaughtException != 'ignore')
		shutDown(2)
}

function shutDown(exitCode, reason) {
	var t = Date.now()
	console.log(appName + (reason ? ': ' + reason : '') + ': exiting with code: ' + exitCode)
	var cbCounter = 2
	apitouchxx.endApi(endApiResult)
	apilist.invokeEndApi(endApiResult)

	function endApiResult(err) { // err has already been reported, and app is shutting down
		if (!--cbCounter) {
			console.log(emitter.id, 'endApi complete:', (Date.now() - t) / 1e3)
			anomaly.anomalyDown(closeOps)
		}
	}

	function closeOps() {
		console.log(emitter.id, 'Anomaly shutdown complete:', (Date.now() - t) / 1e3)
		if (defaults.init &&
			defaults.init.ops &&
			typeof defaults.init.ops.shutDown == 'function')
			defaults.init.ops.shutDown(doExit)
		else doExit()
	}

	function doExit() {
		console.log(emitter.id, 'Ops shutdown complete:', (Date.now() - t) / 1e3, 'process exit')
		process.exit(exitCode)
	}
}

function processSigUsr2() {
	console.log('Process:', process.pid, 'received SIGUSR2')
	if (defaults.init && defaults.init.tmpFolder) {

		// get data and write
		var obj = {}
		if (defaults.PORT) obj.PORT = defaults.PORT
		if (defaults.URL) obj.URL = defaults.URL
		var keys = Object.keys(obj).length
		if (keys) {
			var jsonString
			try {
				jsonString = JSON.stringify(obj)
			} catch(e) {
				anomaly.anomaly(e, obj)
			}
			if (jsonString) fs.writeFile(path.join(defaults.init.tmpFolder, process.pid + '.json'), jsonString, writeResult)
		}
	}

	function writeResult(err) {
		if (!err) console.log('Process:', process.pid, 'wrote', keys, 'data points at:', (new Date).toISOString())
		else anomaly.anomaly(err, file)
	}
}