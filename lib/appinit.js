// appinit.js
// Start the app
// © Harald Rudell 2012

var appshutdown = require('./appshutdown')
var apperror = require('./apperror')
var anomaly = require('./anomaly')
var apimanager = require('./apimanager')
var socket = require('./socket')

exports.initApp = initApp
exports.startWebsocket = startWebsocket

var slogan = 'App Runner'
var doWebSockets

function initApp(defaults, app, cb) {
	if (defaults == null) defaults = {}
	if (cb && typeof cb != 'function') throw Error(arguments.callee.name + ' third argument must be callback function')
	if (app == null || typeof app.on != 'function') throw Error(arguments.callee.name + ' second argument must be express app')

	// install error listeners
	Error.stackTraceLimit = Infinity
	appshutdown.init(defaults, slogan)
	app.on('error', apperror.apiError)
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

	doWebsockets = defaults.websockets

	// initalize api
	if (defaults.api) apimanager.initApi(defaults, app, apperror.apiError, cb)
	else cb()
}

// error management for websockets
function startWebsocket(server) {
	var result = false
	server.on('error', apperror.apiError)
	if (doWebsockets) {
		var emitter = socket.initSockets(server)
		if (emitter != null && typeof emitter.on == 'function') emitter.on('error', apiError)
	}
	return result
}