// test-getrequire.js
// © Harald Rudell 2012

var getrequire = require('../lib/getrequire')

var apilist = require('../lib/apilist')
var rqsm = require('../lib/rqs')
var apprunner = require('../lib/apprunner')
// http://nodejs.org/api/events.html
var events = require('events')
// https://github.com/haraldrudell/haraldutil
var haraldutil = require('haraldutil')
// http://nodejs.org/api/path.html
var path = require('path')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

aa = apilist.addApi
gr = rqsm.getRqs
gt = haraldutil.getType

exports['GetRequire:'] = {
	'Exports': function () {
		assert.exportsTest(getrequire, 3)
	},
	'Init': function () {
		getrequire.init()
	},
	'GetRequire': function () {
		var actual = getrequire.getRequire(function () {})
		assert.equal(typeof actual, 'function')
	},
	'GetRequire NotFunction': function () {
		assert.throws(function () {
			getrequire.getRequire()
		}, /not function/)
	},
	'GetRequire ApiList Error': function () {
		apilist.addApi = function () {return 'BAD'}
		assert.throws(function () {
			getrequire.getRequire(function () {}, null, {api: 'API'})
		}, /BAD/)
	},
	'GetRequire Provided Emitter': function () {
		var emitter = new events.EventEmitter
		var api = 'API'
		var timeoutMs = 5
		var aGetRqs = []
		var eGetRqs = [[0, api, timeoutMs]]
		var rqs = 5

		apilist.addApi = function () {return {}}
		rqsm.getRqs = function (cb, scope, to) {aGetRqs.push([cb, scope, to]); return rqs}
		var actual = getrequire.getRequire(function () {}, null, {api: api, emScope: emitter, timeoutMs: timeoutMs})

		assert.equal(actual.emitter, emitter)
		assert.equal(emitter.id, api)
		assert.equal(actual.rqs, rqs)
		assert.equal(typeof (eGetRqs[0][0] = aGetRqs[0] && aGetRqs[0][0]), 'function')
		assert.deepEqual(aGetRqs, eGetRqs)
	},
	'GetRequire Request Emitter': function () {
		var api = 'API'
		var rqScope = 'RQSCOPE'
		var emScope = 'EMSCOPE'
		var aGetRqs = []
		var eGetRqs = [[0, rqScope, undefined]]
		var rqs = 5

		apilist.addApi = function () {return {}}
		rqsm.getRqs = function (cb, scope, to) {aGetRqs.push([cb, scope, to]); return rqs}
		var actual = getrequire.getRequire(function () {}, null, {api: api, emScope: emScope, rqScope: rqScope})

		assert.ok(actual.emitter instanceof events.EventEmitter)
		assert.equal(actual.emitter.id, emScope)
		assert.equal(actual.rqs, rqs)
		assert.equal(typeof (eGetRqs[0][0] = aGetRqs[0] && aGetRqs[0][0]), 'function')
		assert.deepEqual(aGetRqs, eGetRqs)
	},
	'GetRequire InitApi Not Function': function () {
		var initApi = 5

		assert.throws(function () {
			apilist.addApi = function () {return {}}
			getrequire.getRequire(function () {}, null, {initApi: initApi})
		}, /opts.initApi not function/)

	},
	'GetRequire Exports Null': function () {
		var initApi = function () {}

		assert.throws(function () {
			apilist.addApi = function () {return {}}
			getrequire.getRequire(function () {}, null, {initApi: initApi})
		}, /exports null/)

	},
	'GetRequire InitApi Wrapper': function () {
		var initApi = function (opts) {aOpts.push(opts)}
		var exports = {}
		var opts = {a: 1}
		var aOpts = []

		apilist.addApi = function () {return {}}
		var actual = getrequire.getRequire(function () {}, exports, {initApi: initApi})

		assert.equal(typeof exports.initApi, 'function')
		exports.initApi(opts)

		assert.equal(aOpts.length, 1)
		var initAppOpts = aOpts[0]
		assert.ok(initAppOpts)
		assert.deepEqual(initAppOpts.config, opts)
		assert.equal(typeof initAppOpts.logger, 'function')
		assert.equal(initAppOpts.apprunner, apprunner)
		assert.equal(initAppOpts.appName, undefined)
		assert.equal(Object.keys(initAppOpts).length, 4)
	},
	'GetRequire Override': function () {
		var moduleName = 'MODULENAME'
		var file = 'FILE'
		var subPath = 'PATH'
		var expected = 5
		var aRequire = []
		var apiOpts = {apiMap: {}}
		apiOpts.apiMap[moduleName] = {file: file, subPath: subPath}
		var module = {}
		module[subPath] = expected
		var require = function (module) {assert.equal(module, file); return module}

		getrequire.init(apiOpts)
		var apiRequire = getrequire.getRequire(require)
		var actual = apiRequire(moduleName)

		assert.equal(actual, expected)
	},
	'GetRequire Override Not Found': function () {
		var moduleName = 'MODULENAME'
		var file = 'FILE'
		var apiOpts = {apiMap: {}}
		apiOpts.apiMap[moduleName] = {file: file}
		var e = new Error('not found')
		e.code = 'MODULE_NOT_FOUND'
		var require = function (module) {assert.equal(module, file); throw e}

		getrequire.init(apiOpts)
		var apiRequire = getrequire.getRequire(require)
		assert.throws(function () {
			apiRequire(moduleName)
		}, /not found/)
	},
	'GetRequire Override Subpath Not Found': function () {
		var moduleName = 'MODULENAME'
		var file = 'FILE'
		var apiOpts = {apiMap: {}}
		apiOpts.apiMap[moduleName] = {file: file, subPath: 'x'}
		var e = new Error('not found')
		e.code = 'MODULE_NOT_FOUND'
		var require = function (module) {assert.equal(module, file); throw e}

		getrequire.init(apiOpts)
		var apiRequire = getrequire.getRequire(require)
		assert.throws(function () {
			apiRequire(moduleName)
		}, /not found/)
	},
	'GetRequire Passthrough': function () {
		var moduleName = 'MODULENAME'
		var expected = 5
		var require = function (module) {assert.equal(module, moduleName); return expected}

		getrequire.init()
		var apiRequire = getrequire.getRequire(require)
		var actual = apiRequire(moduleName)

		assert.equal(actual, expected)
	},
	'GetRequire Path Folder': function () {
		var moduleName = 'MODULENAME'
		var expected = 5
		var folder = 'FOLDER'
		var apiOpts = {path: [{folder: './' + folder}]}
		var e = new Error('not found')
		e.code = 'MODULE_NOT_FOUND'
		var require = function (module) {
			if (module == moduleName) throw e
			var expected1 = folder + '/' + moduleName
			assert.equal(module.slice(-expected1.length), expected1, 'Asked for wrong module name: ' + module)
			return expected
		}

		getrequire.init(apiOpts)
		haraldutil.getType = function () {return 1}
		var apiRequire = getrequire.getRequire(require)
		var actual = apiRequire(moduleName)

		assert.equal(actual, expected)
	},
	'GetRequire Path Module': function () {
		var moduleName = 'MODULENAME'
		var expected = 5
		var otherModule = 'OTHERMODULE'
		var apiOpts = {path: [{file: otherModule, subPath: ''}]}
		var e = new Error('not found')
		e.code = 'MODULE_NOT_FOUND'
		var require = function (module) {
			if (module === moduleName) throw e
			assert.equal(module, otherModule, 'Asked for wrong module name: ' + module)
			return expected
		}

		getrequire.init(apiOpts)
		var apiRequire = getrequire.getRequire(require)
		var actual = apiRequire(moduleName)

		assert.equal(actual, expected)
	},
	'GetOnLoads': function () {
		var api = 'API'
		var expected = [api]
		var apiOpts = {apiMap: {}}
		apiOpts.apiMap[api] = {onLoad: true}

		getrequire.init(apiOpts)
		var actual = getrequire.getOnLoads()
		assert.deepEqual(actual, expected)
	},
	'after': function () {
		apilist.addApi = aa
		rqsm.getRqs = gr
		haraldutil.getType = gt
	},
}