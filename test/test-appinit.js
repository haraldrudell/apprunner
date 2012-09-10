// test-appinit.js
// © Harald Rudell 2012

var appinit = require('../lib/appinit')
var appshutdown = require('../lib/appshutdown')
var anomaly = require('../lib/anomaly')
var apimanager = require('../lib/apimanager')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

var _log = console.log
var _asi = appshutdown.init
var _ai = anomaly.initAnomaly
var _api = apimanager.initApi

exports['App Runner:'] = {
	'Init App': function (done) {
		var self = this
		var consoleLogs = 0
		var appShutdownInits = 0
		var app = {
			on: mockAppOn,
		}
		var logger = 3
		var sendMail = 5
		var anomalyOpts = 7
		var defaults = {
			anomaly: anomalyOpts,
			init: {
				logger: logger,
				ops: {
					sendMail: sendMail,
				},
			},
			api: true,
		}
		var aInitAnomaly = []
		var eInitAnomaly = [[anomalyOpts, sendMail, logger]]
		var aAppOn = []
		var eAppOn = ['error']
		var aApiManagerInitApi = []
		var eApiManagerInitApi = [[defaults, app]]

		console.log = mockConsoleLog
		appshutdown.init = mockAppShutdownInit
		anomaly.initAnomaly = mockInitAnomaly
		apimanager.initApi = mockApiManagerInitApi

		appinit.initApp(defaults, app, callback)

		function callback(err) {
			console.log = _log
			if (err) assert.equal(err, null)
			assert.deepEqual(aAppOn, eAppOn, 'app.on invocations')
			assert.deepEqual(aInitAnomaly, eInitAnomaly, 'Anomaly invocations')
			assert.deepEqual(aApiManagerInitApi, eApiManagerInitApi, 'Api Manager invocations')
			assert.equal(consoleLogs, 1, 'Console invocations')
			assert.equal(appShutdownInits, 1, 'App Shutdown Init invocations')
			
			done()
		}
		function mockAppOn(event, handler) {
			assert.equal(typeof handler, 'function')
			aAppOn.push(event)
		}
		function mockConsoleLog(a) {
//console.error(arguments.callee.name, a)
			consoleLogs++
		}
		function mockAppShutdownInit() {
			appShutdownInits++
		}
		function mockInitAnomaly(opts, mail, logger) {
			aInitAnomaly.push([opts, mail, logger])
		}
		function mockApiManagerInitApi(opts, app, errorListener, cb) {
			assert.equal(typeof errorListener, 'function')
			aApiManagerInitApi.push([opts, app])
			cb()
		}
	},
	'after': function () {
		console.log = _log
		appshutdown.init = _asi
		anomaly.initAnomaly = _ai
		apimanager.initApi = _api
	}
}