// test-getrequire.js
// © Harald Rudell 2012 MIT License

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

var aa = apilist.addApi
var gr = rqsm.getRqs
var gt = haraldutil.getType

exports['GetRequire:'] = {
	'Exports': function () {
		assert.exportsTest(getrequire, 4)
	},
	'Init': function () {
		getrequire.init({appData: {}})
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
	'GetRequire Provided Emitter': function () {
		var emitter = new events.EventEmitter
		var api = 'API'
		var theExports = {}

		apilist.addApi = function () {return {}}
		var actual = getrequire.getRequire(function () {}, theExports, {api: api, initApi: function () {}, emScope: emitter, ready: false})

		assert.equal(actual.emitter, emitter)
		assert.equal(emitter.id, api)
		assert.ok(theExports.initApi)
	},
	'GetRequire Requested Emitter': function () {
		var emScope = 'EMSCOPE'

		var actual = getrequire.getRequire(function () {}, null, {emScope: emScope})

		assert.ok(actual.emitter instanceof events.EventEmitter)
		assert.equal(actual.emitter.id, emScope)
	},
	'GetRequire InitApi Wrapper': function () {
		var api = 'API'
		var initApi = function () {}
		var theExports = {}

		getrequire.getRequire(function () {}, theExports, {api: api, initApi: initApi})

		assert.equal(typeof theExports.initApi, 'function')
		assert.notEqual(theExports.initApi, initApi)
	},
	'GetRequire InitApi Not Function': function () {
		var initApi = 5

		assert.throws(function () {
			getrequire.getRequire(function () {}, null, {initApi: initApi})
		}, /opts.initApi not function/)
	},
	'GetRequire InitApi Exports Null': function () {
		var initApi = function () {}

		assert.throws(function () {
			getrequire.getRequire(function () {}, null, {initApi: initApi})
		}, /exports null/)
	},
	'GetRequire AddApi': function () {
		var api = 'API'
		var opts = {api: api, initApi: function () {}}
		var theExports = {}
		var aAddApi = []
		var eAddApi = [['emitter', opts]]

		apilist.addApi = function (r, o) {aAddApi.push([r, o]); return {}}
		var actual = getrequire.getRequire(function () {}, theExports, opts)

		assert.ok((eAddApi[0][0] = aAddApi[0] && aAddApi[0][0]) instanceof events.EventEmitter)
		assert.deepEqual(aAddApi, eAddApi)
	},
	'GetRequire AddApi No InitApi': function () {
		var api = 'API'
		var opts = {api: api}

		assert.throws(function () {
			var actual = getrequire.getRequire(function () {}, null, opts)
		}, /InitApi missing/)
	},
	'GetRequire ApiList Error': function () {
		var api = 'API'
		var opts = {api: api, initApi: function () {}}
		var theExports = {}

		apilist.addApi = function () {return 'BAD'}
		assert.throws(function () {
			getrequire.getRequire(function () {}, theExports, opts)
		}, /BAD/)
	},
	'GetRequire Rqs': function () {
		var rqScope = 'RQSCOPE'
		var rqs = 5
		var aGetRqs = []
		var eGetRqs = [[0, rqScope, undefined]]

		rqsm.getRqs = function (cb, scope, to) {aGetRqs.push([cb, scope, to]); return rqs}
		var actual = getrequire.getRequire(function () {}, null, {rqScope: rqScope})

		assert.equal(actual.rqs, rqs)
		assert.equal(typeof (eGetRqs[0][0] = aGetRqs[0] && aGetRqs[0][0]), 'function')
		assert.deepEqual(aGetRqs, eGetRqs)
	},
	'GetRequire Rqs ApiName': function () {
		var api = 'API'
		var opts = {api: api, initApi: function () {}, timeoutMs: 5, rqScope: true}
		var aGetRqs = []
		var eGetRqs = [['cb', api, opts.timeoutMs]]
		var rqs = 5
		var theExports = {}
		var aAddApi = 0

		apilist.addApi = function () {aAddApi++; return {}}
		rqsm.getRqs = function (cb, scope, to) {aGetRqs.push([cb, scope, to]); return rqs}
		var actual = getrequire.getRequire(function () {}, theExports, opts)

		assert.ok(aAddApi)
		assert.equal(actual.rqs, rqs)
		assert.equal(typeof (eGetRqs[0][0] = aGetRqs[0] && aGetRqs[0][0]), 'function')
		assert.deepEqual(aGetRqs, eGetRqs)
	},
	'GetApiData': function () {
		var api = 'API'
		var apiOpts = {apiMap: {}}
		apiOpts.apiMap[api] = {onLoad: true}
		var expected = {
			apiMap: 1,
			onloads: [api],
			apiPath: 1,
		}

		getrequire.init({apiOpts: apiOpts, appData: {}})
		var actual = getrequire.getApiData()
		assert.deepEqual(actual, expected)
	},
	'after': function () {
		apilist.addApi = aa
		rqsm.getRqs = gr
	},
}

exports['InitApiWrapper:'] = {
	'InitApi Opts Mixin': function () {
		var moduleName = 'MODULE'
		var api = 'APINAME'
		var jsonOpts = {json: 1}
		var invocationOps = {invocation: 1}
		var mixedOpts = {}
		for (var p in jsonOpts) mixedOpts[p] = jsonOpts[p]
		for (var p in invocationOps) mixedOpts[p] = invocationOps[p]

		var aInitApiOpts = []
		var eInitApiOpts = [mixedOpts]
		var initApi = function (o) {aInitApiOpts.push(o)}

		// add the api to get an initApi Wrapper function
		apilist.addApi = function () {return {}}
		var actual = getrequire.getRequire(function () {}, exports, {api: api, initApi: initApi})

		assert.equal(typeof exports.initApi, 'function')
		var initApiWrapper = exports.initApi

		// setup exportsMap translating from module name to exports object
		var exportsMap = {}
		exportsMap[moduleName] = exports
		// setup apiConfigs translating from module name to json opts
		var apiConfigs = {}
		apiConfigs[moduleName] = jsonOpts
		getrequire.init({apiOpts: {apiMap: apiConfigs}, appData: {}})
		getrequire.testIntercept({exportsMap: exportsMap})

		initApiWrapper(invocationOps)

		assert.deepEqual(aInitApiOpts, eInitApiOpts)
	},
	'after': function () {
		apilist.addApi = aa
	}
}

exports['ApiRequire:'] = {
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

		getrequire.init({apiOpts: apiOpts, appData: {}})
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

		getrequire.testIntercept({apiOpts: apiOpts})
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

		getrequire.testIntercept({apiOpts: apiOpts})
		var apiRequire = getrequire.getRequire(require)
		assert.throws(function () {
			apiRequire(moduleName)
		}, /not found/)
	},
	'GetRequire Passthrough': function () {
		var moduleName = 'MODULENAME'
		var expected = 5
		var require = function (module) {assert.equal(module, moduleName); return expected}

		getrequire.init({appData: {}})
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

		getrequire.init({apiOpts: apiOpts, appData: {}})
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

		getrequire.init({apiOpts: apiOpts, appData: {}})
		var apiRequire = getrequire.getRequire(require)
		var actual = apiRequire(moduleName)

		assert.equal(actual, expected)
	},

	'after': function () {
		haraldutil.getType = gt
		getrequire.testIntercept({apiOpts: false, exportsMap: false})
	}
}