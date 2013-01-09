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

var _log = console.log
var ta = apitouch.touchApis

exports['ApiList:'] = {
	'Exports': function () {
		assert.exportsTest(apilist, 5)
	},
	'AddApi': function () {
		apilist.testReset()
		var api = 'API'
		var emitter = new events.EventEmitter
		emitter.id = api
		var expected1 = 'Duplicate api: ' + emitter.id

		var actual = apilist.addApi(emitter)
		assert.ok(actual)
		assert.equal(actual.api, api)
		assert.equal(actual.emitter, emitter)
		assert.equal(emitter.listeners('ready').length, 1)
		emitter.removeAllListeners('ready')

		var actual = apilist.addApi(emitter)
		assert.equal(actual, expected1)
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
	'AddApi NoReady': function () {
		apilist.testReset()
		var api = 'API'
		var emitter = new events.EventEmitter
		emitter.id = api
		emitter.noReady = true

		var actual = apilist.addApi(emitter)
		assert.equal(emitter.listeners('ready').length, 0)
		assert.ok(actual.isReady)
	},
	'AddApi Not Function': function () {
		var api = 'API'
		var emitter = new events.EventEmitter
		emitter.id = api
		emitter.noReady = true
		var expected1 = ' must be function'

		;['saveApi', 'endApi', 'apiState'].forEach(function (fn) {
			apilist.testReset()
			var opts = {}
			opts[fn] = 1

			var actual = apilist.addApi(emitter, opts)

			assert.ok(typeof actual, 'string')
			assert.equal(actual.slice(-expected1.length), expected1)
		})
	},
	'OnReady': function () {

		// reset and install our own error listener
		apilist.testReset()
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
		var actual = apilist.addApi(emitter)
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
	'AddApi After EndApi': function () {
		apilist.testReset()
		apitouch.touchApis = function (e, cb) {cb()}
		apilist.invokeEndApi(afterEndApi)

		function afterEndApi(err) {
			var actual = apilist.addApi()
			assert.equal(actual, 'addApi invoked after endApi')
		}
	},
	'GetState': function () {
		var api = 'API'
		var emitter = new events.EventEmitter
		emitter.id = api
		emitter.noReady = true
		var expected = {}
		expected[api] = {api: api, emitter: emitter, isReady: true}

		apilist.testReset()
		apilist.addApi(emitter)
		var actual = apilist.getState()
		assert.deepEqual(actual, expected)
	},
	'after': function () {
		apierror.init()
		console.log = _log
		apitouch.touchApis = ta
	}
}