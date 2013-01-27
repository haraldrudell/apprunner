// appshutdown.js
// Shutdown app from invocation, uncaught exception or signal
// © Harald Rudell 2012 MIT License

var anomaly = require('./anomaly')
var apilist = require('./apilist')
// http://nodejs.org/api/fs.html
var fs = require('fs')
// http://nodejs.org/api/path.html
var path = require('path')
// http://nodejs.org/api/events.html
var events = require('events')
// http://nodejs.org/api/util.html
var util = require('util')

;[
init, shutdown
].forEach(function (f) {exports[f.name] = f})

var emitter = new events.EventEmitter
emitter.id = 'Process Watch'

var knownSignals = {
	'uncaughtException': processException,
	'SIGINT': processSigInt,
	'SIGUSR2': processSigUsr2,
}

var appName = 'Unknown:' +process.pid
var log = console.log
var opsShutdown
var appInfo
var tmpFolder
var infoLog

/*
Configure shutdown
opts: optional object
.log optional function log, default console.log
infoLog: boolean default true: log more than minimum
.opsShutdown(cb): optional function invoked right before process.exit
.appName: optional string prepended to log, default 'unknown:pid'
.signals: optional array of string
- default signals: uncaught sigint sigusr2 configured unless false
- other signals: configured if true
.appInfo: optional object that is written to the filesystem by default sigusr2 handler
.tmpFolder: optional string: set folder for .appInfo writes, defaults writes don't happen

only act on the options that are present
*/
function init(opts) {
	if (!opts) opts = {}
	if (opts.infoLog != null) infoLog = opts.infoLog
	if (typeof opts.opsShutdown === 'function') opsShutdown = opts.opsShutdown
	if (typeof opts.log === 'function') log = opts.log
	if (opts.appName) appName = opts.appName + ':' + process.pid
	var signals = opts.signals || {}
	for (var signal in knownSignals) { // add knownSignals default listeners
		if (signals[signal] !== false) ensureListener(signal, knownSignals[signal])
	}
	for (var signal in signals) { // add additional ignoring listeners
		if (!knownSignals[signal] || signals[signal] === true) ensureListener(signal, ignoringHandler(signal))
	}
	if (opts.appInfo) appInfo = opts.appInfo
	if (opts.tmpFolder) tmpFolder = opts.tmpFolder
}

function log() { // prepend appName
	log.apply(this, [appName].concat(util.format.apply(this, Array.prototype.slice.call(arguments))))
}

function ensureListener(signal, handler) {
	if (!~process.listeners(signal).indexOf(handler))
		process.on(signal, handler)
}

function ignoringHandler(signal) {
	return ignoreSignal

	function ignoreSignal() {
		log('Ignoring signal:', signal)
	}
}

function processSigInt() {
	shutDown(0, 'caught SIGINT or ctrl-C')
}

function shutdown(exitCode) {
	shutDown(exitCode || 0, 'had shutdown invoked')
}

function processException(err) {
	log('Detected uncaught exception')
	// anomaly provides a trace 'anomaly invoked from' which contains this stack trace
	anomaly.anomaly.apply(emitter, Array.prototype.slice.call(arguments))
	shutDown(2)
}

function shutDown(exitCode, reason) {
	var t = Date.now()
	if (infoLog || exitCode !== 0) {
		var logArgs = []
		if (reason) logArgs.push(reason)
		logArgs.push('exiting with code:', exitCode)
		log.apply(this, logArgs)
	}
	apilist.invokeEndApi(endApiResult)

	function endApiResult(err) { // err has already been reported, and app is shutting down
		if (infoLog) log('endApi complete:', (Date.now() - t) / 1e3)
		anomaly.shutdown(closeOps)
	}

	function closeOps() {
		if (infoLog) log('Anomaly shutdown complete:', (Date.now() - t) / 1e3)
		if (opsShutdown) opsShutdown(doExit)
		else doExit()
	}

	function doExit() {
		if (infoLog) log('Ops shutdown complete:', (Date.now() - t) / 1e3, 'process exit')
		process.exit(exitCode)
	}
}

function processSigUsr2() {
	var file
	if (infoLog) log('Received SIGUSR2')
	if (tmpFolder) {

		// get data and write
		var obj = appInfo
		var keys = typeof obj === 'object' ? Object.keys(obj).length : 0
		if (keys) {
			var jsonString
			try {
				jsonString = JSON.stringify(obj)
			} catch(e) {
				anomaly.anomaly(e, obj)
			}
			if (jsonString) {
				file = path.join(tmpFolder, process.pid + '.json')
				fs.writeFile(file, jsonString, writeResult)
			}
		}
	}

	function writeResult(err) {
		if (!err) {
			if (infoLog) log('Wrote', keys, 'data points at:', (new Date).toISOString())
		} else anomaly.anomaly(err, file)
	}
}