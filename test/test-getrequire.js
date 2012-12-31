// test-getrequire.js
// © Harald Rudell 2012

var testedModule = require('../lib/getrequire')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

var exportsCount = 2
var testedModuleType = 'object'
var exportsTypes = {}

exports['GetRequire:'] = {'DISABLED': function () {var exports={}
exports['GetRequire:'] = {
	'Exports': function () {

		// if export count changes, we need to write more tests
		assert.equal(typeof testedModule, testedModuleType, 'Module type incorrect')
		assert.equal(Object.keys(testedModule).length, exportsCount, 'Export count changed')

		// all exports function
		for (var exportName in testedModule) {
			var actual = typeof testedModule[exportName]
			var expected = exportsTypes[exportName] || 'function'
			assert.equal(actual, expected, 'Incorrect type of export ' + exportName)
		}
	},
	'Init': function () {
		testedModule.init()
	},
	'GetRequire ApiRequire': function (done) {
		var apiName = 'API'

		//getemitter.getEmitter = mockEmitter
		var actual = testedModule.getRequire(mockRequire, undefined, {api: apiName})
		//getemitter.getEmitter = ge
		assert.equal(typeof actual, 'function')
		assert.equal(actual.emitter.id, apiName)
		actual()

		function mockRequire() {
			done()
		}
		function mockEmitter(opts) {
			assert.ok(opts)
			assert.ok(opts.api)
			assert.equal(typeof opts.api, 'string')
			return {id: opts.api}
		}
	},
	'GetRequire InitApiWrapper': function (done) {
		var emitterArg = {initApi: mockInitApi}
		var emitter = {id: 'API'}
		var exports0 = {}

		// have getemitter set exports0.initApi to initApiWrapper
		//getemitter.getEmitter = mockEmitter
		var actual = testedModule.getRequire(function () {}, exports0, emitterArg)
		//getemitter.getEmitter = ge

		assert.equal(typeof exports0.initApi, 'function')
		assert.ok(exports0.initApi != mockInitApi)
		exports0.initApi()

		function mockInitApi() {
			done()
		}
		function mockEmitter(opts) {
			assert.equal(opts, emitterArg)
			return emitter
		}
	},
	'Errors': function () {
		//TODOtestedModule.testReset()

		// first argument
		assert.throws(function () {
			testedModule.getRequire()
		}, /not function/)
		var f = function () {}
		assert.throws(function () {
			testedModule.getRequire(5)
		}, /not function/)
	},
	'after': function () {
	},
}}}