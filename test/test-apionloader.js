// test-apionloader.js
// © Harald Rudell 2013

var apionloader = require('../lib/apionloader')

var apilist = require('../lib/apilist')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

go = apilist.getOnLoads

exports['ApiOnloader:'] = {
	'Exports': function () {
		assert.exportsTest(apionloader)
	},
	'DoOnLoads': function () {
		apilist.getOnLoads = function () {return []}
		apionloader.doOnLoads()
	},
	'after': function () {
		apilist.getOnLoads = go
	}
}