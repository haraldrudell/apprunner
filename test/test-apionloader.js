// test-apionloader.js
// © Harald Rudell 2013

var apionloader = require('../lib/apionloader')

var getrequire = require('../lib/getrequire')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

var ga = getrequire.getApiData
var gr = getrequire.getRequire

exports['ApiOnloader:'] = {
	'Exports': function () {
		assert.exportsTest(apionloader)
	},
	'DoOnLoads': function () {
		var api = 'API'
		var aReq = []
		var eReq = [api]
		var aInit = 0
		var mockModule = {initApi: function () {aInit++}}

		function mockApiRequire(api) {aReq.push(api); return mockModule}
		getrequire.getRequire = function() {return mockApiRequire}
		getrequire.getApiData = function () {return {onloads: [api]}}
		apionloader.doOnLoads(function () {})

		assert.ok(aInit)
		assert.deepEqual(aReq, eReq)
	},
	'after': function () {
		getrequire.getRequire = gr
		getrequire.getApiData = ga

	}
}