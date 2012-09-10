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
	throw Error()
}

exports['API Manager:'] = {
	'Init Api': function (done) {
		var consoleLogs = 0
		var aInitApi = []

		console.log = mockConsoleLog
		require('./apiFolder/apinull').setInitApi(mockInitApi)

		var actual = apimanager.initApi(defaults, app, errorListener, callback)

		function callback(err) {
			console.log = _log
			assert.ok(!err)
			assert.equal(typeof actual, 'object')
			assert.equal(typeof actual.emit, 'function')

			done()
		}
		function mockConsoleLog(a) {
			consoleLogs++
		}
		function mockInitApi(opts, cb) {
//console.error(arguments.callee.name, opts)
			assert.equal(typeof opts, 'object')
			assert.equal(typeof opts.config, 'object')
			assert.equal(typeof opts.registerHandler, 'function')
			assert.equal(typeof opts.getApi, 'function')
			assert.equal(typeof opts.logger, 'function')
			assert.equal(Object.keys(opts).length, 4)
			assert.equal(typeof cb, 'function')
			aInitApi.push(opts.config)
			cb()
		}
	},
	'after': function () {
		console.log = _log
	}

}
/*
exports['API Manager Get Api:'] = {
	'before': function (done) {
		console.log = function () {}
		apimanager.initApi(defaults, app, errorListener, callback)
		function callback(err) {
			console.log = _log
			if (err) throw err
			done()
		}
	},
	'Invocation': function (done) {
		apitest.setApi(initApi)
		var value = 5
		var config = {api: 'apitest'}
		apimanager.getApi(config, getApiResult)

		function getApiResult(err, module) {
			if (err) assert.equal(err, null)
			assert.equal(module, value)

			done()
		}

		// invoked when apimanager load apitest
		function initApi(opts, cb) {
			assert.equal(typeof opts, 'object', 'opts type')
			assert.equal(typeof opts.logger, 'function', 'opts.logger')
			assert.deepEqual(opts.config, config, 'opts.config')
			assert.equal(typeof opts.registerHandler, 'function', 'opts.registerHandler')
			assert.equal(typeof opts.getApi, 'function', 'opts.getApi')
			assert.equal(Object.keys(opts).length, 4, 'opts length')
			cb(null, value)
		}
	},
}*/