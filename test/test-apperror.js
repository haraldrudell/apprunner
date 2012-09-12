// test-apperror.js
// © Harald Rudell 2012

var apperror = require('../lib/apperror')
var anomaly = require('../lib/anomaly')
// http://nodejs.org/api/events.html
var events = require('events')

var _an = anomaly.anomaly

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

exports['App Error Listeners:'] = {
	'Add Error Listener': function () {
		var e = new events.EventEmitter()
		apperror.addErrorListener(e)
		assert.equal(e.listeners('error').length, 1)
	},
	'Remove Error Listener': function () {
		var e = new events.EventEmitter()
		apperror.addErrorListener(e)
		apperror.removeErrorListener(e)
		assert.equal(e.listeners('error').length, 0)
	},
}

exports['App Error:'] = {
	'Api Error': function () {
		var value = 5
		var aAnomaly = []
		var eAnomaly = [[value]]

		anomaly.anomaly = mockAnomaly

		var e = new events.EventEmitter()
		apperror.addErrorListener(e)
		e.emit('error', value)
		assert.deepEqual(aAnomaly, eAnomaly, 'anomlay.anomaly invocations')

		function mockAnomaly(a) {
			aAnomaly.push(Array.prototype.slice.call(arguments))
		}
	},
	'after': function () {
		anomaly.anomaly = _an
	},
}