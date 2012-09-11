// test-appinit.js
// © Harald Rudell 2012

var appinit = require('../lib/appinit')
var appshutdown = require('../lib/appshutdown')
var anomaly = require('../lib/anomaly')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

var _log = console.log
var _asi = appshutdown.init
var _ai = anomaly.initAnomaly

exports['App Runner:'] = {
	'Init App': function (done) {
		var self = this
		var consoleLogs = 0
		var appShutdownInits = 0
		var app = {
			on: mockAppOn,
			get: function () {},
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
				appFolder: true
			},
			api: true,
		}
		var aInitAnomaly = []
		var eInitAnomaly = [[anomalyOpts, sendMail, logger]]
		var aAppOn = []
		var eAppOn = ['error']

		console.log = mockConsoleLog
		appshutdown.init = mockAppShutdownInit
		anomaly.initAnomaly = mockInitAnomaly

		appinit.initApp(defaults, app, callback)

		function callback(err) {
			console.log = _log
			if (err) assert.equal(err, null)
			assert.deepEqual(aAppOn, eAppOn, 'app.on invocations')
			assert.deepEqual(aInitAnomaly, eInitAnomaly, 'Anomaly invocations')
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
	},
	'after': function () {
		console.log = _log
		appshutdown.init = _asi
		anomaly.initAnomaly = _ai
	}
}