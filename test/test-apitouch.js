// test-apitouch.js
// © Harald Rudell 2012

var apitouch = require('../lib/apitouch')
// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

exports['Api Touch:'] = {
	'Apis Ready': function (done) {
		var readys = 0
		var apis = {
			'Test Api': {
				apiReady: 'apiReady',
				module: {apiReady: mockApiReady},
			},
		}
		var emitter = {id: 'ID'}
		apitouch.testReset()
		apitouch.setEmitter(emitter, apis)
		apitouch.apisReady(result)

		function result(err) {
			if (err) assert.equal(err, null)
			assert.equal(readys, 1)

			done()
		}
		function mockApiReady(cb) {
			readys++
			cb()
		}
	},
}