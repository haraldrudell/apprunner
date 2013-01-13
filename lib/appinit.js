// appinit.js
// Manage app and api lifecycles and errors
// © Harald Rudell 2012

var appshutdown = require('./appshutdown')
var apperror = require('./apperror')
var anomaly = require('./anomaly')
var getrequire = require('./getrequire')
var apionloader = require('./apionloader')
var emailer = require('./emailer')
// http://nodejs.org/api/path.html
var path = require('path')
// http://nodejs.org/api/events.html
var events = require('events')

;[
initApp, getAppData, addUriHandler, testEmitter,
].forEach(function (f) {exports[f.name] = f})

var emitter = new events.EventEmitter
emitter.id = 'App Runner'
var time1min = 60e3
var msPerDay = 24 * 60 *  time1min
tzMs = (new Date).getTimezoneOffset() * time1min

var appData = {
	appName: '?', // app name eg. 'Node.js #3'
	appId: '?', //machine-friendly app identifier, eg. 'nodejs3'
	launchFolder: '?', // fully qualified path to the initially launched script
	sendMail: defaultSendMail, // function(subject, body, cb) sending ops email
	logger: console.log, // default log function
	registerHandler: registerHandler, // function for registering uris
}
registerHandlers = []
registerFns = []

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
	initAppData(defaults)

	// configure error handling
	Error.stackTraceLimit = Infinity
	initAppShutdown(defaults)
	apperror.addErrorListener(require('./rqs').emitter)
	apperror.addErrorListener(emitter)
	if (!defaults.noInfoLog) console.log(emitter.id, 'is listening for errors')
	if (!(defaults.anomaly === false)) initAnomaly(defaults)

	// init api management
	getrequire.init({apiOpts: defaults.api, appData: appData})
	apionloader.doOnLoads(appData.logger)
}

function initAppData(defaults) {
 	appData.launchFolder = getLaunchFolder()
	if (defaults.init) {
		appData.appName = defaults.init.appName || '?'
		appData.appId = defaults.init.identifier || 'x'
		if (defaults.init.ops &&
			typeof defaults.init.ops.sendMail == 'function')
			emailer.setSendMail(appData.sendMail = defaults.init.ops.sendMail)
		if (defaults.init.logger) appData.logger = defaults.init.logger
	}
}

function initAppShutdown(defaults) {
	var opts = {
		logger: appData.logger,
		opsShutdown: defaults.init && defaults.init.ops && defaults.init.ops.shutDown,
		signals: defaults.api && defaults.api.signals,
		appName: appData.appName,
		appInfo: {
			PORT: defaults.PORT,
			URL: defaults.URL,
		},
		tmpFolder: defaults.init && defaults.init.tmpFolder,
	}
	appshutdown.init(opts)
}

function initAnomaly(defaults) {
	// ability to not have email
	if (appData.sendMail !== defaultSendMail && // must have sendMail for disable to matter
		defaults.anomaly != null && // must have the parent object
		defaults.anomaly.noEmail != null) { // must have some setting for email
		var doMailFlag
		if (typeof defaults.anomaly.noEmail == 'string') {
			var date = new Date(defaults.anomaly.noEmail).getTime()
			if (isNaN(date)) doMailFlag = true // unparseable date: leave it on
			else {
				var day = Math.floor((date - tzMs) / msPerDay) // day serial server timezone
				day++ // enable mail the day after
				doMailFlag = day * msPerDay + tzMs
			}
		} else doMailFlag = !defaults.anomaly.noEmail // boolean value
		if (doMailFlag !== true) anomaly.enableAnomalyMail(doMailFlag)
	}

	// ability to report errors
	var logger
	if (defaults.init) {
		if (!defaults.anomaly) defaults.anomaly = {}
		if (!defaults.anomaly.app) defaults.anomaly.app = appData.appName
	}
	if (appData.sendMail === defaultSendMail && !defaults.noInfoLog) console.log(emitter.id, 'Warning: sendmail not available')
	anomaly.initAnomaly(
		defaults.anomaly,
		appData.sendMail,
		appData.logger)
}

function getAppData() {
	var result = {}
	for (var p in appData) result[p] = appData[p]
	return result
}

function registerHandler(uri, fn) {
	if (typeof uri !== 'string' || !uri) emitter.emit('error', new Error('Bad registerHandler uri: ' + uri))
	else if (typeof fn !== 'function') emitter.emit('error', new Error('RegisterHandler argument 2 not function'))
	else if (registerFns.length) {
		registerFns.forEach(function (f) {
			f(uri, fn)
		})
	} else registerHandlers.push({uri: uri, fn: fn})
}

function addUriHandler(fn) {
	if (typeof fn === 'function') {
		registerFns.push(fn)
		var rh = registerHandlers
		registerHandlers = []
		rh.forEach(function (o) {
			fn(o.uri, o.fn)
		})
	}
}

// return value: string path where the initially launched script is located
function getLaunchFolder() {
	var folder = require && require.main && require.main.filename
	if (folder) folder = path.dirname(folder)
	else {
		var dir = __dirname && __dirname.length > 1 ? __dirname : process.cwd()
		var pos = dir.indexOf('/node_modules/')
		folder = ~pos ? dir.substring(0, pos) : dir
	}
	return folder
}

function defaultSendMail(subject, body, cb) {
	appData.logger('Sending of mail not available',
		'subject:', subject,
		'body', body)
	if (cb) cb()
}

function testEmitter(e) {
	var result = emitter
	if (e) emitter = e
	return result
}