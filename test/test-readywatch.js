// test-readywatch.js
// test-greatrequire.js
// © Harald Rudell 2012

var readywatch = require('../lib/readywatch')
// http://nodejs.org/api/events.html
var events = require('events')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

exports['ReadyWatch:'] = {
	'Exports': function () {
		assert.equal(typeof readywatch.readyWatch, 'function')
		assert.equal(typeof readywatch.setRqs, 'function')
		assert.equal(Object.keys(readywatch).length, 2)
	},
	'ReadyWatch': function () {
	},
}