// test-apperror.js
// © Harald Rudell 2012

var apperror = require('../lib/apperror')
var anomaly = require('../lib/anomaly')

var _an = anomaly.anomaly

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

exports['App Error:'] = {
	'Api Error': function () {
		var value = 5
		var aAnomaly = []
		var eAnomaly = [[value]]

		anomaly.anomaly = mockAnomaly

		apperror.apiError(value)
		assert.deepEqual(aAnomaly, eAnomaly, 'anomlay.anomaly invocations')

		function mockAnomaly(a) {
			aAnomaly.push(Array.prototype.slice.call(arguments))
		}
	},
	'after': function () {
		anomaly.anomaly = _an
	},
}
