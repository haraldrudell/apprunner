// test-apitouch.js
// © Harald Rudell 2013

var apitouch = require('../lib/apitouch')

var apierror = require('../lib/apierror')
var rqsm = require('../lib/rqs')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

var ee = apierror.emitError
var gr = rqsm.getRqs

exports['ApiTouch:'] = {
	'Exports': function () {
		assert.exportsTest(apitouch, 1)
	},
	'TouchApis': function () {
		var aEnd = 0
		apitouch.touchApis(undefined, end)

		assert.ok(aEnd)

		function end(err) {
			if (err) assert.equal(err, null)
			aEnd++
		}
	},
	'TouchApis Error': function () {
		var api = 'API'
		var endApi = 'endApi'
		var opts = {
			apiMap: {},
			fName: endApi,
		}
		var e = new Error('x')
		opts.apiMap[api] = {}
		opts.apiMap[api][endApi] = function mockEndApi(cb) {cb(e)}

		var aEnd = 0
		var aEe = 0

		apierror.emitError = function mockEmitError() {aEe++}
		apitouch.touchApis(opts, end)

		assert.ok(aEnd)
		assert.ok(aEe)

		function end(err) {
			assert.equal(err, e)
			aEnd++
		}
	},
	'TouchApis Timeout': function (done) {
		var api = 'API'
		var endApi = 'endApi'
		var opts = {
			apiMap: {},
			fName: endApi,
		}
		opts.apiMap[api] = {}
		var aEndApi = 0
		opts.apiMap[api][endApi] = function mockEndApi() {aEndApi++}

		// invokes endApi that does not call back to end, instead timeout
		function mockAddRq() {setTimeout(timeout, 10)}
		rqsm.getRqs = function mockGetRqs() {return {addRq: mockAddRq}}
		function mockEnd() {assert.ok(false)}
		apitouch.touchApis(opts, mockEnd)

		function timeout() {
			assert.ok(aEndApi)

			done()
		}
	},
	'after': function () {
		apierror.emitError = ee
		rqsm.getRqs = gr
	}
}