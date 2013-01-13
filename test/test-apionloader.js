// test-apionloader.js
// © Harald Rudell 2013

var apionloader = require('../lib/apionloader')

var getrequire = require('../lib/getrequire')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

var ga = getrequire.getApiData

exports['ApiOnloader:'] = {
	'Exports': function () {
		assert.exportsTest(apionloader)
	},
	'DoOnLoads': function () {
		var api = 'API'

		var aInit = 0
		var testMap = {}
		testMap[api] = {initApi: function mockInitApi() {aInit++}}
		getrequire.init({appData: {}}, testMap)

		getrequire.getApiData = function mockGetApiData() {return {onloads: [api]}}
debugger
		apionloader.doOnLoads(function mockLog() {})

		assert.ok(aInit)
	},
	'after': function () {
		getrequire.init({appData: {}}, false)
		getrequire.getApiData = ga

	}
}