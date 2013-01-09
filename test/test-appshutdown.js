// test-appshutdown.js
// © Harald Rudell 2012

var appshutdown = require('../lib/appshutdown')
var anomaly = require('../lib/anomaly')
var apitouchxx = require('../lib/apitouch-x')
var apilist = require('../lib/apilist')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')
// http://nodejs.org/api/fs.html
var fs = require('fs')
// http://nodejs.org/api/path.html
var path = require('path')

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
		assert.exportsTest(appshutdown, 2)
	},
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
	'ProcessSigInt: SIGINT or ctrl-Break': function () {
		var aDowns = 0
		var aExits = []
		var eExits = [0]
		var sigIntHandler = getHandler('SIGINT')

		process.exit = function (code) {aExits.push(code)}
		apitouchxx.endApi = function (cb) {cb()}
		apilist.invokeEndApi = function (cb) {cb()}
		anomaly.anomalyDown = function(cb) {aDowns++; cb()}
		console.log = function () {}
		sigIntHandler()
		console.log = _log

		assert.deepEqual(aExits, eExits, 'Incorrect exitCode')
		assert.equal(aDowns, 1)

		function getHandler(signal) {
			var handler
			process.on = function(e, f) {if (e == signal) handler = f}
			appshutdown.init({})
			process.on = _on
			return handler
		}
	},
	'ProcessException': function () {
		var aAnomaly = []
		var aAnomalyDown = 0
		var aProcessExit = []
		var eProcessExit = [2]
		var aEndApi = 0
		var processException = getHandler('uncaughtException')

		// emulate process exception: invoke processException with an Error argument
		anomaly.anomalyDown = function (cb) {aAnomalyDown++; cb()}
		anomaly.anomaly = function () {aAnomaly.push([arguments])}
		process.exit = function (code) {aProcessExit.push(code)}
		apitouchxx.endApi = function (cb) {aEndApi++; cb()}
		apilist.invokeEndApi = function (cb) {aEndApi++; cb()}
		console.log = function () {}
		processException(Error('x'))
		console.log = _log

		assert.deepEqual(aProcessExit, eProcessExit, 'Process exit code should be 2')
		assert.equal(aAnomaly.length, 1, 'One anomaly should be logged')
		assert.equal(aAnomalyDown, 1, 'Anomaly should be shut down exactly once')
		assert.equal(aEndApi, 2, 'Anomaly should be shut down exactly once')

		function getHandler(signal) {
			var handler
			process.on = function(e, f) {if (e == signal) handler = f}
			appshutdown.init({})
			process.on = _on
			return handler
		}
	},
	'SIGUSR2': function () {
		var defaults = {
			init: {tmpFolder: 'TMP'},
			PORT: 'port',
			URL: 'url',
		}
		var aWfs = []
		var sigIntHandler = getHandler('SIGUSR2', defaults)

		fs.writeFile = function (file, data, cb) {aWfs.push([file, data]); cb()}
		sigIntHandler()

		assert.equal(aWfs.length, 1)
		var eFile = path.join(defaults.init.tmpFolder, process.pid + '.json')
		assert.equal(aWfs[0][0], eFile)
		var eData = JSON.stringify({PORT: defaults.PORT, URL: defaults.URL})
		assert.equal(aWfs[0][1], eData)

		function getHandler(signal, defaults) {
			var handler
			process.on = function(e, f) {if (e == signal) handler = f}
			appshutdown.init(defaults)
			process.on = _on
			return handler
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