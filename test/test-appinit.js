// test-appinit.js
// © Harald Rudell 2012

var appinit = require('../lib/appinit')
// http://nodejs.org/api/path.html
var path = require('path')
// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

exports['App Runner Init:'] = {
	'Invocation': function (done) {
		var app = {
			on: appOn,
		}

		appinit.initApp({}, app, callback)

		function callback() {
			done()
		}
		function appOn(event, handler) {
			assert.equal(event, 'error')
			assert.equal(typeof handler, 'function')
		}
	},
}