// test-apprunner.js
// © Harald Rudell 2012

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

exports['AppRunner:'] = {
	'Exports': function () { // verify error-free require
		var apprunner = require('../lib/apprunner')
		assert.equal(typeof apprunner,'object')
		assert.ok(Object.keys(apprunner).length > 0)
	},
}