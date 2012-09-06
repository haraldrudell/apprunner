// apprunner.js
// manage code in api folder, handle errors
// © Harald Rudell 2012

var apimanager = require('./apimanager')
var anomaly = require('./anomaly')
var applego = require('applego')
// https://github.com/haraldrudell/haraldutil
var haraldutil = require('haraldutil')

exports.initApp = initApp
exports.startWebsocket = startWebsocket
exports.getCbCounter = haraldutil.getCbCounter
exports.errorListener = apiError

var slogan = 'App Runner'
var doWebSockets
var haraldOpsShutdown

function initApp(defaults, app, cb) {
	if (defaults == null) defaults = {}
	if (cb && typeof cb != 'function') throw Error(arguments.callee.name + ' third argument must be callback function')

	// install error listeners
	haraldOpsShutdown = defaults.init && defaults.init.ops && defaults.init.ops.shutDown ||
		defaultHaraldOpsShutdown
	process.on('uncaughtException', processError)
	process.on('SIGINT', controlBreak)
	app.on('error', apiError)
	console.log(slogan + ' is listening for errors')

	// init anomaly
	if (defaults.anomaly) {
		if (defaults.anomaly.noEmail) anomaly.enableAnomalyMail(false)
		var logger
		var sendMail
		if (defaults.init) {
			logger = defaults.init.logger
			if (defaults.init.ops) {
				sendMail = defaults.init.ops.sendMail
			}
			if (!defaults.anomaly.app) defaults.anomaly.app = defaults.init.appName
		}

		if (!sendMail) console.log(slogan + ': Warning: sendmail not available')

		anomaly.initAnomaly(
			defaults.anomaly,
			sendMail,
			logger)
	}

	// initialize applego
	doWebsockets = defaults.websockets
	applego.init(app, defaults)

	// initalize api
	if (defaults.api) apimanager.initApi(defaults, app, apiError, cb)
	else cb()
}

function controlBreak() {
	console.log(slogan + ': caught SIGINT or ctrl-C')
	shutDown(0)
}

// global uncaught exception: shut down application
function processError(err) {
	console.log(slogan + ': detected uncaught exception')
	apiError.apply(this, [Error('Process Error')].concat(Array.prototype.slice.call(arguments)))
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

// Centralized reporting of errors
function apiError(err) {
/*
	console.log(arguments.callee.name, 'source:', this.id)
	Array.prototype.slice.call(arguments).forEach(function (arg, index) {
		console.log((index + 1) + ': ' + haraldutil.inspectDeep(arg))
	})
*/
	applego.anomaly(Array.prototype.slice.call(arguments))
}

function startWebsocket(server) {
	server.on('error', apiError)
	return doWebsockets ?
		applego.initSockets(server) :
		false
}