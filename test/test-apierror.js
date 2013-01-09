// test-apierror.js
// © Harald Rudell 2013

var apierror = require('../lib/apierror')

// http://nodejs.org/api/events.html
var events = require('events')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

exports['ApiError:'] = {
	'Exports': function () {
		assert.exportsTest(apierror, 2)
	},
	'Init': function () {
		var actual = apierror.init()
		assert.ok(actual instanceof events.EventEmitter)
		assert.equal(actual.id, 'Api Manager')
	},
	'emitError': function () {
		var aErrs = []
		var eErrs = [[7]]
		var emitter = apierror.init()
		emitter.removeAllListeners('error')
		emitter.once('error', function () {aErrs.push(Array.prototype.slice.call(arguments))})
		apierror.emitError(7)

		assert.deepEqual(aErrs, eErrs)
		apierror.init()
	},
}


