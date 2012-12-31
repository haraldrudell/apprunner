// test-appshutdown.js
// © Harald Rudell 2012

var testedModule = require('../lib/appshutdown')
var anomaly = require('../lib/anomaly')
var apitouchxx = require('../lib/apitouch-x')
var apilist = require('../lib/apilist')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')
// http://nodejs.org/api/fs.html
var fs = require('fs')
// http://nodejs.org/api/path.html
var path = require('path')

var exportsCount = 2
var testedModuleType = 'object'
var exportsTypes = {}

var _log = console.log
var _exit = process.exit
var _on = process.on
var _ad = anomaly.anomalyDown
var an = anomaly.anomaly
var wf = fs.writeFile
var ea = apitouchxx.endApi
var iea = apilist.invokeEndApi

exports['App Shutdown:'] = {
	'Exports': function () {

		// if export count changes, we need to write more tests
		assert.equal(typeof testedModule, testedModuleType, 'Module type incorrect')
		assert.equal(Object.keys(testedModule).length, exportsCount, 'Export count changed')

		// all exports function
		for (var exportName in testedModule) {
			var actual = typeof testedModule[exportName]
			var expected = exportsTypes[exportName] || 'function'
			assert.equal(actual, expected, 'Incorrect type of export ' + exportName)
		}
	},
	'Init': function () {
		var aOns = {}
		var eOns = ['uncaughtException', 'SIGINT', 'SIGUSR2']

		process.on = mockOn

		testedModule.init({})
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
	'ProcessSigInt: SIGINT or ctrl-Break': function () {
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
		//assert.equal(logs, 5, 'Console.log invocation count')
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
			testedModule.init({})
			return handler
			function mockOn(event, handler0) {
				if (event == signal) handler = handler0
			}
		}
	},
	'ProcessException': function () {
		var aAnomaly = []
		var aAnomalyDown = 0
		var aProcessExit = []
		var eProcessExit = [2]
		var aEndApi = 0

		// get processException function: it's the handler for uncaughtException
		var processException = getHandler('uncaughtException')

		// emulate process exception: invoke processException with an Error argument
		anomaly.anomalyDown = mockAnomalyDown
		anomaly.anomaly = mockAnomaly
		process.exit = mockProcessExit
		apitouchxx.endApi = mockEndApi
		apilist.invokeEndApi = mockEndApi
		console.log = function () {}
		processException(Error('x'))
		console.log = _log

		assert.deepEqual(aProcessExit, eProcessExit, 'Process exit code should be 2')
		//**require('haraldutil').pp(aAnomaly)
		assert.equal(aAnomaly.length, 1, 'One anomaly should be logged')
		assert.equal(aAnomalyDown, 1, 'Anomaly should be shut down exactly once')
		assert.equal(aEndApi, 2, 'Anomaly should be shut down exactly once')

		function mockProcessExit(exitCode) {
			aProcessExit.push(exitCode)
		}
		function mockAnomaly() {
			aAnomaly.push([arguments])
		}
		function mockAnomalyDown(cb) {
			aAnomalyDown++
			cb()
		}
		function mockEndApi(cb) {
			aEndApi++
			cb()
		}
		function getHandler(signal) {
			var handler
			process.on = mockOn
			testedModule.init({})
			return handler
			function mockOn(event, handler0) {
				if (event == signal) handler = handler0
			}
		}
	},
	'SIGUSR2': function () {
		var defaults = {
			init: {tmpFolder: 'TMP'},
			PORT: 'port',
			URL: 'url',
		}
		var aWfs = []

		var sigIntHandler = getHandler('SIGUSR2')

		fs.writeFile = mockWriteFile
		sigIntHandler()
		assert.equal(aWfs.length, 1)
		var eFile = path.join(defaults.init.tmpFolder, process.pid + '.json')
		assert.equal(aWfs[0][0], eFile)
		var eData = JSON.stringify({PORT: defaults.PORT, URL: defaults.URL})
		assert.equal(aWfs[0][1], eData)

		function mockWriteFile(file, data, cb) {
			aWfs.push([file, data])
			cb()
		}
		function getHandler(signal) {
			var handler
			process.on = mockOn
			testedModule.init(defaults)
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
		fs.writeFile = wf
		apitouchxx.endApi = ea
		apilist.invokeEndApi = iea
	}
}