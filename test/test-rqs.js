// test-rqs.js
// © Harald Rudell 2012

var rqs = require('../lib/rqs')
var assert = require('mochawrapper')

var defTime = 100 // 100 ms
var moreThanDefTime = defTime + 10 // 110 ms
var longTime = 1e5 // 100 seconds

exports['Rqs:'] = {
	'Test': function (done) {
		var cbResults = []
		var logResults = []
		var state = {
			scope: 'rqFactory',
			isDone: false,
			count: 0,
			cbCount: 0,
			logCount: 0,
		}
		var rq2Slogan = { a: 'a' }

		// instanitate
		var rqFactory = rqs.getRqs(callback, state.scope, defTime, logFunc)
		verifyState()

		// add a request with default 100 ms timeout
		var rq1 = rqFactory.addRq()
		assert.equal(typeof rq1, 'string')
		assert.equal(rq1, '1')
		state.count ++
		verifyState()
		setTimeout(rq1AfterTimeout, moreThanDefTime)

		// add a request with long timeout
		var rq2 = rqFactory.addRq(rq2Slogan, longTime)
		assert.equal(typeof rq2, 'object')
		assert.ok(rq2 != null)
		assert.equal(rq2.rqId, '2')
		state.count++
		verifyState()

		// clear rq2
		var expected = false
		var actual = rqFactory.clearRq(rq2)
		assert.strictEqual(actual, false)
		verifyState()

		// clear illegal slogan
		var actual = rqFactory.clearRq(17)
		assert.strictEqual(actual, false)
		state.cbCount++
		var actualError = cbResults[cbResults.length - 1]
		assert.ok(actualError instanceof Error)
		assert.strictEqual(actualError.isTimeout, undefined)
		verifyState()

		// clear background
		var actual = rqFactory.clearRq(0)
		assert.strictEqual(actual, false)
		verifyState()

		// when we get here, rq1 should have timed out
		function rq1AfterTimeout() {

			// verify correct number of error callbacks
			state.cbCount++
			if (cbResults.length != state.cbCount) {
				console.log('callback problem:', cbResults)
			}

			// verify that we got a timeout error
			var actualError = cbResults[cbResults.length - 1]
			assert.ok(actualError instanceof Error)
			assert.strictEqual(actualError.isTimeout, true)

			verifyState()

			var actual = rqFactory.clearRq(rq1)
			assert.equal(typeof actual, 'number')
			state.isDone = true
			state.logCount++
			verifyState()

			done()
		}

		function verifyState() {
			assert.equal(rqFactory.func, state.scope)
			assert.equal(rqFactory.isDone(), state.isDone)
			assert.equal(rqFactory.getCount(), state.count)
			assert.equal(cbResults.length, state.cbCount)
			assert.equal(logResults.length, state.logCount)
		}

		function callback(err) {
			cbResults.push(err)
		}

		function logFunc() {
			logResults.push(arguments)
		}
	},
}