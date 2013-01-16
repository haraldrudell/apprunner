// test-apprunner.js
// © Harald Rudell 2012 MIT License

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

exports['AppRunner:'] = {
	'Require': function () { // verify error-free require
		var apprunner = require('../lib/apprunner')
	},
	'Exports': function () { // verify error-free require
		var apprunner = require('../lib/apprunner')
		assert.exportsTest(apprunner, 12)
	},
}