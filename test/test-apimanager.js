// test-apimanager.js
// © Harald Rudell 2012

var apimanager = require('../lib/apimanager')
// http://nodejs.org/api/path.html
var path = require('path')
// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

var apitest = require('./apiFolder/apitest')

var _log = console.log

var defaults = {
	init: {
		appFolder: true,
	},
	api: {
		folder: path.join(__dirname, 'apiFolder'),
		apiMap: {
			apinull: {
				onLoad: true
			},
		},
	},
}
var app = {
	get: appGet,
}
function appGet() {
	throw Error()
}
function errorListener() {
	throw Error(Array.prototype.slice.call(arguments))
}

exports['API Manager:'] = {
	'Init Api': function () {
		var consoleLogs = 0
		var eConfig = {
			onLoad:true,
			api:'apinull'
		}


		console.log = mockConsoleLog
		require('./apiFolder/apinull').setInitApi(mockInitApi)

		apimanager.initApi(defaults, app)
		console.log = _log
		assert.equal(consoleLogs, 1, 'Console.log invocations')

		function mockConsoleLog(a) {
			consoleLogs++
		}
		function mockInitApi(opts) {
//console.error(arguments.callee.name, opts)
			assert.equal(typeof opts, 'object')
			assert.deepEqual(opts.config, eConfig)
			assert.equal(typeof opts.registerHandler, 'function')
			assert.equal(typeof opts.apprunner, 'object')
			assert.equal(typeof opts.apprunner.getApi, 'function')
			assert.equal(typeof opts.logger, 'function')
			assert.equal(Object.keys(opts).length, 5)
		}
	},
	'before': function () {
		apimanager.testReset()
	},
	'after': function () {
		console.log = _log
	}

}

exports['API Manager Get Api:'] = {
	'Invocation': function () {
		var value = 5
		var config = {api: 'apitest'}
		var consoleLogs = 0
		var eConfig = {
			api: 'apitest'
		}

		apitest.setApi(initApi)
		console.log = mockConsoleLog

		apimanager.getApi(config)
		console.log = _log
		assert.equal(consoleLogs, 0)

		// invoked when apimanager load apitest
		function initApi(opts) {
			return value
		}
		function mockConsoleLog(a) {
			consoleLogs++
		}
	},
	'before': function () {
		apimanager.testReset()
		console.log = function () {}
		apimanager.initApi(defaults, app)
		console.log = _log
	},
	'after': function () {
		console.log = _log
	}
}