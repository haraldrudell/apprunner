// test-greatrequire.js
// © Harald Rudell 2012

var greatrequire = require('../lib/greatrequire')
// http://nodejs.org/api/events.html
var events = require('events')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

exports['GreatRequire:'] = {
	'Exports': function () {
		assert.equal(typeof greatrequire.greatRequire, 'function')
		assert.equal(Object.keys(greatrequire).length, 2)
	},
	'GreatRequire': function () {
		var api = 'API'
		var theRequire = myRequire
		var theEmitter = new events.EventEmitter
		theEmitter.id = api
		var theExports = {initApi: mockInitApi}

		greatrequire.testReset()
		var actual = greatrequire.greatRequire(theRequire, theEmitter, theExports)
		assert.equal(typeof actual, 'function')
		var loadedApis = greatrequire.testReset()
		assert.ok(loadedApis[api])

		function mockInitApi() {}
		function myRequire() {}
	},
	'Errors': function () {
		greatrequire.testReset()

		// first argument
		assert.throws(function () {
			greatrequire.greatRequire()
		}, /not function/)

		// second argument
		var f = function () {}
		assert.throws(function () {
			greatrequire.greatRequire(f)
		}, /not EventEmitter/)

		var e1 = new events.EventEmitter
		assert.throws(function () {
			greatrequire.greatRequire(f, e1)
		}, /string property/)

		// third argument
		var e2 = new events.EventEmitter
		e2.id = 'ApiName'
		assert.throws(function () {
			greatrequire.greatRequire(f, e2)
		}, /argument exports/)

		// third argument
		assert.throws(function () {
			greatrequire.greatRequire(f, e2, {})
		}, /argument exports/)

		// duplicate api
		var theExports = {initApi: f}
		assert.throws(function () {
			greatrequire.greatRequire(f, e2, theExports)
			greatrequire.greatRequire(f, e2, theExports)
		}, /Duplicate/)
	},
}