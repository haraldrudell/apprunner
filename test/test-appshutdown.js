// test-appshutdown.js
// © Harald Rudell 2012

var appshutdown = require('../lib/appshutdown')
var anomaly = require('../lib/anomaly')
var apperror = require('../lib/apperror')
// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

var _log = console.log
var _exit = process.exit
var _on = process.on
var _ad = anomaly.anomalyDown
var _ae = apperror.apiError

exports['App Shutdown:'] = {
	'Init': function () {
		var aOns = []
		var eOns = ['uncaughtException', 'SIGINT']

		process.on = mockOn

		appshutdown.init({})
		assert.equal(aOns.length, eOns.length, 'Number of process.on invocations')
		eOns.forEach(function (event) {
			if (!~aOns.indexOf(event)) assert.ok(false, 'Expected on invocation for event:' + event)
		})

		function mockOn(event, handler) {
			assert.equal(typeof handler, 'function')
			aOns.push(event)
		}
	},
	'SIGINT or ctrl-Break': function () {
		var logs = 0
		var downs = 0
		var aExits = []
		var eExits = [0]

		process.exit = mockExit
		console.log = mockLog
		anomaly.anomalyDown = mockAnomalyDown

		appshutdown.controlBreak()
		console.log = _log
		assert.deepEqual(aExits, eExits, 'Incorrect exitCode')
		assert.equal(logs, 2)
		assert.equal(downs, 1)

		function mockExit(exitCode) {
			aExits.push(exitCode)
		}
		function mockLog() {
			logs++
		}
		function mockAnomalyDown(cb) {
			downs++
			cb()
		}
	},
	'processError': function () {
		var logs = 0
		var errors = 0
		var downs = 0
		var aExits = []
		var eExits = [2]

		apperror.apiError = mockError
		anomaly.anomalyDown = mockAnomalyDown
		console.log = mockLog
		process.exit = mockExit

		appshutdown.processError(Error('x'))
		console.log = _log
		assert.deepEqual(aExits, eExits)
		assert.equal(errors, 1)
		assert.equal(logs, 2)
		assert.equal(downs, 1)

		function mockExit(exitCode) {
			aExits.push(exitCode)
		}
		function mockError() {
			errors++
		}
		function mockLog() {
			logs++
		}
		function mockAnomalyDown(cb) {
			downs++
			cb()
		}
	},
	'after': function () {
		console.log = _log
		process.exit = _exit
		process.on = _on
		anomaly.anomalyDown = _ad
		apperror.apiError = _ae
	}
}