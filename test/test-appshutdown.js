// test-appshutdown.js
// © Harald Rudell 2012

var appshutdown = require('../lib/appshutdown')
var anomaly = require('../lib/anomaly')
// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

var _log = console.log
var _exit = process.exit
var _on = process.on
var _ad = anomaly.anomalyDown
var an = anomaly.anomaly

exports['App Shutdown:'] = {
	'Init': function () {
		var aOns = {}
		var eOns = ['uncaughtException', 'SIGINT', 'SIGUSR2']

		process.on = mockOn

		appshutdown.init({})
		assert.equal(Object.keys(aOns).length, eOns.length, 'Number of process.on invocations')
		eOns.forEach(function (event) {
			if (!aOns[event]) assert.ok(false, 'Missing process listener for event:' + event)
		})

		function mockOn(event, handler) {
			assert.equal(typeof event, 'string')
			assert.equal(typeof handler, 'function')
			aOns[event] = handler
		}
	},
	'SIGINT or ctrl-Break': function () {
		var logs = 0
		var downs = 0
		var aExits = []
		var eExits = [0]

		var sigIntHandler = getHandler('SIGINT')

		process.exit = mockExit
		console.log = mockLog
		anomaly.anomalyDown = mockAnomalyDown

		sigIntHandler()
		console.log = _log
		assert.deepEqual(aExits, eExits, 'Incorrect exitCode')
		assert.equal(logs, 1, 'Console.log invocation count')
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

		function getHandler(signal) {
			var handler
			process.on = mockOn
			appshutdown.init({})
			return handler
			function mockOn(event, handler0) {
				if (event == signal) handler = handler0
			}
		}
	},
	'processError': function () {
		var logs = 0
		var errors = 0
		var downs = 0
		var aExits = []
		var eExits = [2]

		var processExceptionHandler = getHandler('uncaughtException')

		anomaly.anomalyDown = mockAnomalyDown
		anomaly.anomaly = mockError
		console.log = mockLog
		process.exit = mockExit

		processExceptionHandler(Error('x'))
		console.log = _log
		assert.deepEqual(aExits, eExits)
		assert.equal(errors, 1)
		assert.equal(logs, 2, 'Console.log invocations')
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
		function getHandler(signal) {
			var handler
			process.on = mockOn
			appshutdown.init({})
			return handler
			function mockOn(event, handler0) {
				if (event == signal) handler = handler0
			}
		}
	},
	'after': function () {
		console.log = _log
		process.exit = _exit
		process.on = _on
		anomaly.anomalyDown = _ad
		anomaly.anomaly = an
	}
}