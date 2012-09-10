// appinit.js
// Start the app
// © Harald Rudell 2012

var appshutdown = require('./appshutdown')
var apperror = require('./apperror')
var anomaly = require('./anomaly')
var apimanager = require('./apimanager')

exports.initApp = initApp

var slogan = 'App Runner'

/*
defaults: options, typically loaded by haraldops
.init.appFolder: string: the folder of initial script
.init.logger: optional function(string): logging, default console.log
.init.ops.sendMail: optional function(subject, body): Sends mail, default none
.api: optional, indicates that Api Manager should be used
.api.apiMap: api configurations
app: Web server, has .on and .get methods
cb(err): optional function
*/
function initApp(defaults, app, cb) {
	if (defaults == null) defaults = {}
	if (cb && typeof cb != 'function') throw Error(arguments.callee.name + ' third argument must be callback function')
	if (app == null || typeof app.on != 'function') throw Error(arguments.callee.name + ' second argument must be express app')

	// add basic error listeners
	Error.stackTraceLimit = Infinity
	appshutdown.init(defaults, slogan)
	app.on('error', apperror.apiError)
	console.log(slogan + ' is listening for errors')

	// add anomaly reporting
	if (defaults.anomaly) {

		// ability to not have email
		if (defaults.anomaly.noEmail) anomaly.enableAnomalyMail(false)

		// ability to report errors
		var logger
		var sendMail
		if (defaults.init) {
			logger = defaults.init.logger
			if (defaults.init.ops) sendMail = defaults.init.ops.sendMail
			if (!defaults.anomaly.app) defaults.anomaly.app = defaults.init.appName
		}
		if (!sendMail) console.log(slogan + ': Warning: sendmail not available')
		anomaly.initAnomaly(
			defaults.anomaly,
			sendMail,
			logger)
	}

	// add api loading capability
	if (defaults.api) apimanager.initApi(defaults, app, apperror.apiError, apiResult)
	else apiResult()

	function apiResult(err) {
		// if we have no callback throw init errors here
		if (err && !cb) throw err
		if (cb) cb(err)		
	}
}