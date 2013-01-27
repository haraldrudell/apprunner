// appinit.js
// Manage app and api lifecycles and errors
// © Harald Rudell 2012 MIT License <harald@allgoodapps.com>

var appdata = require('./appdata')
var appshutdown = require('./appshutdown')
var apperror = require('./apperror')
var anomaly = require('./anomaly')
var getrequire = require('./getrequire')
var apionloader = require('./apionloader')
var emailer = require('./emailer')
var serverwrapper = require('./serverwrapper')
// https://github.com/haraldrudell/haraldutil
var haraldutil = require('haraldutil')
// http://nodejs.org/api/path.html
var path = require('path')
// http://nodejs.org/api/events.html
var events = require('events')

;[
initApp, testEmitter
].forEach(function (f) {exports[f.name] = f})

var emitter = new events.EventEmitter
emitter.id = 'App Runner'

var time1min = 60e3
var msPerDay = 24 * 60 *  time1min
tzMs = (new Date).getTimezoneOffset() * time1min

/*
defaults: options, typically loaded by haraldops
.init.appFolder: string: the folder of initial script
.init.logger: optional function(string): logging, default console.log
.init.ops.sendMail: optional function(subject, body): Sends mail, default none
.api: optional, indicates that Api Manager should be used
.api.apiMap: api configurations
app: optional Web server, has .on and .get methods, and is an emitter
*/
function initApp(defaults) {
	if (!defaults) defaults = {}

	// determine log
	var jsonData = getHaraldOpsData(defaults)
	var log = jsonData.log

	// listen for errors
	appshutdown.init({
		log: console.log,
		opsShutdown: jsonData.haraldopsShutdown,
		signals: defaults.api && defaults.api.signals,
		appName: jsonData.appName,
		infoLog: !jsonData.noInfoLog ,
		tmpFolder: jsonData.tmpFolder,
	})
	apperror.addErrorListener(emitter)
	Error.stackTraceLimit = Infinity
	log(emitter.id, 'is listening for errors')

	var appData = appdata.initAppData(jsonData)

	if (jsonData.haraldopsSendMail) emailer.setSendMail(jsonData.haraldopsSendMail)
	else log(emitter.id, 'Warning: sendmail not available')

	if (defaults.anomaly !== false) { // configure anomaly
		/*
		Control anomaly report emailing
		defaults.anomaly.noEmail:
		- string date: emailing disabled until after this date
		- true: emailing disabled
		- default: emailing enabled
		*/
		var doMailFlag = true
		var setting = defaults.anomaly && defaults.anomaly.noEmail
		if (setting != null) { // setting for email is present
			if (typeof setting === 'string') {
				var date = new Date(setting).getTime()
				if (!isNaN(date)) { // unparseable date: email is on
					var day = Math.floor((date - tzMs) / msPerDay) // day serial server timezone
					day++ // enable mail the day after
					doMailFlag = day * msPerDay + tzMs // timeval when email should be enabled again
				}
			} else doMailFlag = !setting // boolean value
		}
		if (doMailFlag !== true) anomaly.enableAnomalyMail(doMailFlag) // something else than enabled

		var anomalySetting = haraldutil.shallowClone(defaults.anomaly)
		if (!anomalySetting.app) anomalySetting.app = appData.appName
		anomaly.initAnomaly(anomalySetting, appData.log)
	}

	serverwrapper.setEmitter(emitter)

	// let haraldops register its routes
	if (jsonData.haraldopsResponderFn && jsonData.haraldopsResponderUrl) {
		var app = {get: serverwrapper.registerHandler}
		jsonData.haraldopsResponderFn(app, jsonData.haraldopsResponderUrl)
	}

	// init api management
	getrequire.init({apiOpts: defaults.api, appData: appData})
	apionloader.doOnLoads(log)
}

function testEmitter(e) {
	var result = emitter
	if (e) emitter = e
	return result
}

/*
encapsulate haraldops dependency
return value: object
.haraldopsShutdown: function or undefined
.haraldopsSendMail: function or undefined
*/
function getHaraldOpsData(defaults) {
 	var init = defaults.init || {}
 	var ops = init.ops || {}
 	var haraldops = defaults.haraldops || {}

	var jsonData = {}
	if (typeof ops.shutDown === 'function') jsonData.haraldopsShutdown = ops.shutDown
	if (typeof ops.sendMail === 'function') jsonData.haraldopsSendMail = ops.sendMail
	if (typeof init.appName === 'string' && init.appName) jsonData.haraldopsAppName = init.appName
	if (typeof init.identifier === 'string' && init.identifier) jsonData.haraldopsidentifier = init.identifier
	if (defaults.views) jsonData.haraldopsViews = defaults.views
	if (init.defaultsFile) jsonData.haraldopsDefaultsFile = init.defaultsFile
	if (typeof init.tmpFolder === 'string' && init.tmpFolder) jsonData.tmpFolder = init.tmpFolder
	if (typeof haraldops.responder === 'string' && haraldops.responder) jsonData.haraldopsResponderUrl = haraldops.responder
	if (typeof ops.responder === 'function') jsonData.haraldopsResponderFn = ops.responder

	jsonData.log = defaults.noInfoLog ? function () {} :
		defaults.apprunner && typeof defaults.apprunner.log === 'function' ? defaults.apprunner.log :
		console.log

	return jsonData
}
