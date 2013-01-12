// test-apprunner.js
// © Harald Rudell 2012

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

exports['AppRunner:'] = {
	'Require': function () { // verify error-free require
		var apprunner = require('../lib/apprunner')
	},
	'Exports': function () { // verify error-free require
		var apprunner = require('../lib/apprunner')
		assert.exportsTest(apprunner, 14, {rqs: 'object', emailer: 'object'})
	},
}