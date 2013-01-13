// test-apilist.js
// © Harald Rudell 2012

var apilist = require('../lib/apilist')

var apierror = require('../lib/apierror')
var apperror = require('../lib/apperror')
var apitouch = require('../lib/apitouch')
// http://nodejs.org/api/events.html
var events = require('events')
// http://nodejs.org/api/path.html
var path = require('path')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

var ta = apitouch.touchApis
var _rqs = apilist.testReset()

exports['AddApi:'] = {
	'Exports': function () {
		assert.exportsTest(apilist, 6)
	},
	'AddApi': function () {
		var api = 'API'
		var emitter = new events.EventEmitter
		emitter.id = api

		apilist.testReset({addRq: function () {}})
		var actual = apilist.addApi(emitter)

		assert.ok(actual)
		assert.equal(actual.api, api)
		assert.equal(actual.emitter, emitter)
	},
	'AddApi After EndApi': function () {
		apilist.testReset()
		apitouch.touchApis = function (e, cb) {cb()}
		apilist.invokeEndApi(afterEndApi)

		function afterEndApi(err) {
			var actual = apilist.addApi()
			assert.equal(actual, 'addApi invoked after endApi')
		}
	},
	'AddApi Emitter': function () {
		apilist.testReset()
		var actual = apilist.addApi()
		assert.equal(actual, 'Bad emitter')
	},
	'AddApi Emitter ID': function () {
		apilist.testReset()
		var emitter = new events.EventEmitter

		var actual = apilist.addApi(emitter)
		assert.equal(actual, 'Emitter id property (api name) not string or blank')
	},
	'AddApi Duplicate': function () {
		var api = 'API'
		var emitter = new events.EventEmitter
		emitter.id = api
		var expected1 = 'Duplicate api: ' + emitter.id

		apilist.testReset({addRq: function () {}})
		var actual = apilist.addApi(emitter)
		assert.ok(actual)
		assert.equal(actual.api, api)
		assert.equal(actual.emitter, emitter)

		var actual = apilist.addApi(emitter)
		assert.equal(actual, expected1)
	},
	'AddApi Ready False': function () {
		apilist.testReset()
		var api = 'API'
		var emitter = new events.EventEmitter
		emitter.id = api

		var actual = apilist.addApi(emitter, {ready: false})
		assert.equal(emitter.listeners('ready').length, 0)
		assert.ok(actual.isReady)
	},
	'AddApi Ready true': function () {
		var api = 'API'
		var emitter = new events.EventEmitter
		emitter.id = api

		var aAddRq = []
		var eAddRq = [[api, undefined]]
		apilist.testReset({addRq: function (api, t) {aAddRq.push([api, t])}})

		var actual = apilist.addApi(emitter, {ready: null})

		assert.deepEqual(aAddRq, eAddRq)
	},
	'AddApi Ready Timeout': function () {
		var api = 'API'
		var emitter = new events.EventEmitter
		emitter.id = api
		var aAddRq = []
		var eAddRq = [[api, 1]]

		apilist.testReset({addRq: function (api, t) {aAddRq.push([api, t])}})
		var actual = apilist.addApi(emitter, {ready: 1})

		assert.deepEqual(aAddRq, eAddRq)
	},
	'ApisReady TODO': function () {
		// TODO implement test
	},
	'after': function () {
		apitouch.touchApis = ta
		apilist.testReset(_rqs)
	}
}

exports['FindFn:'] = {
	'AddApi Not Function': function () {
		var api = 'API'
		var emitter = new events.EventEmitter
		emitter.id = api
		emitter.noReady = true
		var expected1 = ' must be function'

		;['saveApi', 'endApi', 'apiState'].forEach(function (fn) {
			var opts = {}
			opts[fn] = 1

			apilist.testReset({addRq: function () {}})
			var actual = apilist.addApi(emitter, opts)

			assert.ok(typeof actual, 'string')
			assert.equal(actual.slice(-expected1.length), expected1)
		})
	},
	'after': function () {
		apilist.testReset(_rqs)
	}
}

exports['OnReady:'] = {
	'OnReady': function () {

		// reset and install our own error listener
		apilist.testReset({addRq: function () {return {clear: function () {}}}})
		var apiErrorEmitter = apierror.init()
		apperror.removeErrorListener(apiErrorEmitter)
		var aAno = 0
		var errFunc = function () {aAno++}
		apiErrorEmitter.on('error', errFunc)

		// get onReady
		var onReady
		var api = 'API'
		var emitter = new events.EventEmitter
		emitter.id = api
		var actual = apilist.addApi(emitter, {ready: null})
		assert.ok(typeof actual !== 'string')
		onReady = emitter.listeners('ready')[0]
		assert.equal(typeof onReady, 'function')

		// onReady from non-emitter
		onReady()
		assert.ok(aAno)

		// onReady from emitter without id
		aAno = 0
		var anEmitter = new events.EventEmitter
		anEmitter.once('ready', onReady)
		anEmitter.emit('ready')

		assert.ok(aAno)

		// onReady from unknown api
		aAno = 0
		var anEmitter = new events.EventEmitter
		anEmitter.id = 'XYZ'
		anEmitter.once('ready', onReady)
		anEmitter.emit('ready')

		assert.ok(aAno)

		// onReady with error
		assert.equal(emitter.isReady, undefined)
		aAno = 0
		var e = new Error('x')
		emitter.once('ready', onReady)
		emitter.emit('ready', e)

		assert.ok(aAno)
		assert.equal(actual.isReady, e)

		// duplicate onReady
		aAno = 0
		emitter.once('ready', onReady)
		emitter.emit('ready')

		assert.ok(aAno)

		// good onReady
		aAno = 0
		delete actual.isReady
		emitter.once('ready', onReady)
		emitter.emit('ready')

		assert.equal(aAno, 0)
		assert.ok(actual.isReady)

		apierror.init()
	},
	'after': function () {
		apierror.init()
		apilist.testReset(_rqs)
	}
}

exports['EndApi:'] = {
	'EndApi IsEndApiFn': function () {
		var aTouch = []
		var eTouch = ['saveApi', 'endApi']

		apilist.testReset()
		assert.equal(apilist.isEndApiFn(), undefined)
		apitouch.touchApis = function (fName, cb) {aTouch.push(fName); cb()}
		apilist.invokeEndApi(afterEndApi)

		function afterEndApi(err) {
			if (err) assert.equal(err, null)
			assert.deepEqual(aTouch, eTouch)
			assert.equal(apilist.isEndApiFn(), true)
		}
	},
	'EndApi Repeated': function () {
		apilist.testReset()
		apitouch.touchApis = function (e, cb) {cb()}
		var apiErrorEmitter = apierror.init()
		apperror.removeErrorListener(apiErrorEmitter)
		var aAno = 0
		apiErrorEmitter.on('error', function () {aAno++})
		apilist.invokeEndApi(afterEndApi)

		function afterEndApi(err) {
			if (err) assert.equal(err, null)
			apilist.invokeEndApi(doubleEndApi)
		}

		function doubleEndApi(err) {
			assert.ok(err)
			assert.ok(aAno)
		}
	},
	'EndApi SaveApi Error': function () {
		apilist.testReset()
		apitouch.touchApis = function (e, cb) {if (e === 'saveApi') cb(new Error('x')); else cb()}
		var apiErrorEmitter = apierror.init()
		apperror.removeErrorListener(apiErrorEmitter)
		var aAno = 0
		apiErrorEmitter.on('error', function () {aAno++})
		apilist.invokeEndApi(afterEndApi)

		function afterEndApi(err) {
			assert.ok(err)
		}
	},
	'EndApi EndApi Error': function () {
		apilist.testReset()
		apitouch.touchApis = function (e, cb) {if (e === 'endApi') cb(new Error('x')); else cb()}
		var apiErrorEmitter = apierror.init()
		apperror.removeErrorListener(apiErrorEmitter)
		var aAno = 0
		apiErrorEmitter.on('error', function () {aAno++})
		apilist.invokeEndApi(afterEndApi)

		function afterEndApi(err) {
			assert.ok(err)
		}
	},
	'after': function () {
		apitouch.touchApis = ta
		apilist.testReset(_rqs)
	}
}

exports['GetState:'] = {
	'GetState': function () {
		var api = 'API'
		var emitter = new events.EventEmitter
		emitter.id = api
		var expected = {}
		expected[api] = {api: api, emitter: emitter, isReady: true}

		apilist.testReset({addRq: function () {}})
		apilist.addApi(emitter, {ready: false})
		var actual = apilist.getState()
		assert.deepEqual(actual, expected)
	},
	'after': function () {
		apilist.testReset(_rqs)
	}
}