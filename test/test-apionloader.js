// test-apionloader.js
// © Harald Rudell 2013 MIT License

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
		getrequire.testIntercept({testMap: testMap})

		getrequire.getApiData = function mockGetApiData() {return {onloads: [api]}}
		apionloader.doOnLoads(function mockLog() {})

		assert.ok(aInit)
	},
	'after': function () {
		getrequire.testIntercept({testMap: false})
		getrequire.getApiData = ga

	}
}