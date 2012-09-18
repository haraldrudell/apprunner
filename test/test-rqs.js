// test-rqs.js
// © Harald Rudell 2012

var rqs = require('../lib/rqs')
var assert = require('mochawrapper')

var defTime = 100 // 100 ms
var moreThanDefTime = defTime + 10 // 110 ms
var longTime = 1e5 // 100 seconds

var els = rqs.emitter.listeners('error')

var errors = []
function errorListener(err) {
	errors.push(err)
}
var filemarker = 'file: ' + __filename.substring(__filename.lastIndexOf('/') + 1)
exports['Request Timer Factory:'] = {
	'Plain Invocation': function () {
		assert.equal(errors.length, 0, 'No errors before test')
		var factory = rqs.getRqs()
		assert.equal(typeof factory, 'object')
		assert.equal(Object.keys(factory).length, 5)
		Object.keys(factory).forEach(function (f) {
			assert.equal(typeof factory[f], 'function', 'factory.' + f + ' should be function')
		})
		assert.equal(errors.length, 1, 'Verify Error of missing callback')

		var e = errors[0]
		assert.ok(~e.toString().indexOf(filemarker))
		assert.ok(e.isTimer)
		assert.ok(!e.isTimeout)
		assert.ok(~e.scope.indexOf(filemarker))
		assert.ok(~e.factoryFrom.indexOf(filemarker))
		errors = []
	},
	'Default state': function () {
		var aECbs = []
		var factory = rqs.getRqs(errorCallback)

		// verify we got a request
		var before = Date.now()
		var rq = factory.addRq()
		var after = Date.now()
		assert.ok(rq)
		assert.ok(rq.id)

		// verify the state object
		var actual = factory.getState()
		assert.ok(actual)
		var rq = actual[rq.id]
		assert.equal(typeof rq, 'object')
		assert.equal(Object.keys(rq).length, 6)
		assert.ok(rq.timer)
		assert.equal(rq.timeout, 3000)
		assert.ok(rq.created >= before)
		assert.ok(rq.created <= after)
		assert.ok(~rq.from.substring(filemarker))
		assert.ok(~rq.param.substring(filemarker))

		factory.shutdown()
		assert.equal(aECbs.length, 0)
		assert.ok(!errors.length)

		function errorCallback(err) {
			aECbs.push(err)
		}
	},
	'TimeoutMs': function () {
		var aECbs = []
		var time = 150
		var factory = rqs.getRqs(errorCallback, undefined, time)

		var rq = factory.addRq()
		var state = factory.getState()
		var actual = state[rq.id].timeout
		assert.equal(actual, time)

		factory.shutdown()
		assert.equal(aECbs.length, 0)
		assert.ok(!errors.length)

		function errorCallback(err) {
			aECbs.push(err)
		}
	},
	'scopeName and .isTimeout()': function (done) {
		var aECbs = []
		var scope = 'SCOPE'
		var time = 100 // the minimum value rqs allow
		var moreTime = time + 10
		var factory = rqs.getRqs(errorCallback, scope, time)

		// scope only shows up in errors
		var rq = factory.addRq()
		assert.ok(!rq.isTimeout())

		setTimeout(next, moreTime)

		function next() {
			assert.ok(rq.isTimeout())
			assert.equal(aECbs.length, 1)
			assert.equal(errors.length, 1)
			var e = errors[0]
			errors = []
			var actual = e.scope
			assert.equal(actual, scope)

			factory.shutdown()
			assert.ok(!errors.length)

			done()
		}

		function errorCallback(err) {
			aECbs.push(err)
		}
	},
	'before': function () {
		rqs.emitter.removeAllListeners('error')
		rqs.emitter.addListener('error', errorListener)
	},
	'after': function () {
		rqs.emitter.removeAllListeners('error')
		els.forEach(function (listener) {
			rqs.emitter.addListener('error', listener)
		})
	},
}

exports['Request Timer Instance:'] = {
	'Default invocation and .toString()': function () {
		var aECbs = []
		var factory = rqs.getRqs(errorCallback)

		// verify we got a request
		var before = Date.now()
		var rq = factory.addRq()
		var after = Date.now()
		assert.equal(typeof rq, 'object')
		assert.equal(Object.keys(rq).length, 7)
		assert.equal(typeof rq.toString, 'function')
		assert.equal(typeof rq.clear, 'function')
		assert.equal(typeof rq.isTimeout, 'function')
		assert.equal(typeof rq.id, 'string')
		assert.ok(rq.created >= before)
		assert.ok(rq.created <= after)
		assert.ok(~rq.from.substring(filemarker))
		assert.ok(~rq.param.substring(filemarker))

		var s = rq.toString()
		assert.ok(~s.indexOf('Request '))
		assert.ok(~s.indexOf('created: ' + Date(rq.created)))
		assert.ok(~s.indexOf('from: ' + rq.from))
		assert.ok(~s.indexOf('parameter: '))
		assert.ok(!~s.indexOf('timeout: '))

		factory.shutdown()
		assert.equal(aECbs.length, 0)
		assert.ok(!errors.length)

		function errorCallback(err) {
			aECbs.push(err)
		}
	},
	'Parameter': function () {
		var aECbs = []
		var param = 'PARAM'
		var factory = rqs.getRqs(errorCallback)

		// verify we got a request
		var rq = factory.addRq(param)
		var actual = rq.param
		assert.equal(actual, param)

		factory.shutdown()
		assert.equal(aECbs.length, 0)
		assert.ok(!errors.length)

		function errorCallback(err) {
			aECbs.push(err)
		}
	},
	'Time': function () {
		var aECbs = []
		var time = 200
		var factory = rqs.getRqs(errorCallback, undefined, time)

		// verify we got a request
		var rq = factory.addRq()
		var state = factory.getState()
		var data = state[rq.id]
		var actual = data.timeout
		assert.equal(actual, time)

		factory.shutdown()
		assert.equal(aECbs.length, 0)
		assert.ok(!errors.length)

		function errorCallback(err) {
			aECbs.push(err)
		}
	},
	'.clear()': function () {
		var aECbs = []
		var factory = rqs.getRqs(errorCallback)

		assert.ok(factory.isDone())
		var rq = factory.addRq()
		assert.ok(!factory.isDone())
		rq.clear()
		assert.ok(factory.isDone())

		factory.shutdown()
		assert.equal(aECbs.length, 0)
		assert.ok(!errors.length)

		function errorCallback(err) {
			aECbs.push(err)
		}
	},
	'before': function () {
		rqs.emitter.removeAllListeners('error')
		rqs.emitter.addListener('error', errorListener)
	},
	'after': function () {
		rqs.emitter.removeAllListeners('error')
		els.forEach(function (listener) {
			rqs.emitter.addListener('error', listener)
		})
	},
}