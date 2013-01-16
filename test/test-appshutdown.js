// test-appshutdown.js
// © Harald Rudell 2012 MIT License

var appshutdown = require('../lib/appshutdown')
var anomaly = require('../lib/anomaly')
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
var iea = apilist.invokeEndApi

exports['App Shutdown:'] = {
	'Exports': function () {
		assert.exportsTest(appshutdown, 2)
	},
	'Init': function () {
		var opts = {
			signals: {
				uncaughtException: false,
				SIGINT: false,
				SIGUSR2: false,
			},
		}

		appshutdown.init(opts)
	},
	'ProcessSigInt: SIGINT or ctrl-Break': function () {
		var opts = {
			signals: {
				uncaughtException: false,
				SIGUSR2: false,
			},
			logger: function () {},
		}

		var aOn = {}
		process.on = function(e, f) {aOn[e] = f}

		appshutdown.init(opts)

		assert.equal(Object.keys(aOn).length, 1, Object.keys(aOn))
		assert.equal(typeof aOn.SIGINT, 'function')

		var aDowns = 0
		anomaly.anomalyDown = function(cb) {aDowns++; cb()}

		var aExits = []
		var eExits = [0]
		process.exit = function (code) {aExits.push(code)}

		apilist.invokeEndApi = function (cb) {cb()}
		aOn.SIGINT()

		assert.deepEqual(aExits, eExits, 'Incorrect exitCode')
		assert.equal(aDowns, 1)
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
		apilist.invokeEndApi = function (cb) {aEndApi++; cb()}
		console.log = function () {}
		processException(Error('x'))
		console.log = _log

		assert.deepEqual(aProcessExit, eProcessExit, 'Process exit code should be 2')
		assert.equal(aAnomaly.length, 1, 'One anomaly should be logged')
		assert.equal(aAnomalyDown, 1, 'Anomaly should be shut down exactly once')
		assert.equal(aEndApi, 1, 'Anomaly should be shut down exactly once')

		function getHandler(signal) {
			var handler
			process.on = function(e, f) {if (e == signal) handler = f}
			appshutdown.init({})
			process.on = _on
			return handler
		}
	},
	'SIGUSR2': function () {
		var opts = {
			tmpFolder: 'TMP',
			appInfo: {
				PORT: 'port',
				URL: 'url',
			},
		}
		var aWfs = []
		var sigIntHandler = getHandler('SIGUSR2', opts)

		fs.writeFile = function (file, data, cb) {aWfs.push([file, data]); cb()}

		sigIntHandler()

		assert.equal(aWfs.length, 1)
		var eFile = path.join(opts.tmpFolder, process.pid + '.json')
		assert.equal(aWfs[0][0], eFile)
		var eData = JSON.stringify(opts.appInfo)
		assert.equal(aWfs[0][1], eData)

		function getHandler(signal, defaults) {
			var handler
			process.on = function(e, f) {if (e == signal) handler = f}
			appshutdown.init(opts)
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
		apilist.invokeEndApi = iea
	}
}