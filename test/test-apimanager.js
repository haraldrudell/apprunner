// test-apimanager.js
// © Harald Rudell 2012

var apimanager = require('../lib/apimanager')
// http://nodejs.org/api/path.html
var path = require('path')
// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

var apitest = require('./apiFolder/apitest')

var defaults = {
	init: {
		appFolder: true,
	},
	api: {
		folder: path.join(__dirname, 'apiFolder'),
		apiMap: {
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

exports['Init Api:'] = {
	'Invocation': function (done) {
		var actual = apimanager.initApi(defaults, app, errorListener, callback)

		function callback(err) {
			assert.ok(!err)
			assert.equal(typeof actual, 'object')
			assert.equal(typeof actual.emit, 'function')

			done()
		}
	},
}

exports['Get Api:'] = {
	'before': function (done) {
		apimanager.initApi(defaults, app, errorListener, callback)
		function callback(err) {
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
}