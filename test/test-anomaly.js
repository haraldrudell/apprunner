// test-anomaly.js
// © Harald Rudell 2012

var anomaly = require('../lib/anomaly')
// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

var anomalySubject = 'Anomaly Report'
var anomalyBodyStart = 'Anomaly '

exports['Anomaly:'] = {
	'Init and Down': function (done) {
		anomaly.initAnomaly()
		anomaly.anomalyDown(downResult)

		function downResult() {
			done()
		}
	},
	'Enable Anomaly Mail': function (done) {
		var logs = 0
		var mails = 0

		anomaly.initAnomaly({}, mockMail, mockLog)
		anomaly.anomalyDown(downResult)

		function downResult() {
			assert.equal(anomaly.enableAnomalyMail(true), true)
			assert.equal(logs, 0)
			assert.equal(anomaly.enableAnomalyMail(false), false)
			assert.equal(logs, 1)
			assert.equal(mails, 0)

			done()
		}

		function mockLog() {
			logs++
		}
		function mockMail() {
			mails++
		}
	},
	'Anomaly': function (done) {
		var logs = 0
		var aSendMail = []
		var eSubject = 'Anomaly Report'
		var anomaly1 = 'haha1'
		var anomaly2 = 'haha2'
		var anomaly3 = 'haha3'

		anomaly.initAnomaly({maxBuffer: 1}, mockSendMail, mockLog)
		anomaly.enableAnomalyMail(true)

		// first anomaly: immediately sent
		anomaly.anomaly(anomaly1)
		assert.equal(aSendMail.length, 1)
		assert.equal(aSendMail[0][0], eSubject)
		assert.deepEqual(typeof aSendMail[0][1], 'string')
		assert.ok(~aSendMail[0][1].indexOf(anomaly1))
		assert.equal(logs, 1, 'Console.log invocations: each anomaly should be logged')

		// second anomaly: queued
		// third anomaly: skipped
		logs = 0
		aSendMail = []
		anomaly.anomaly(anomaly2)
		anomaly.anomaly(anomaly3)
		assert.equal(aSendMail.length, 0)
		assert.equal(logs, 2, 'Console.log invocations: each anomaly should be logged')

		// shutDown: should send
		anomaly.anomalyDown(downResult)

		function downResult() {
			assert.equal(aSendMail.length, 1)
			assert.equal(aSendMail[0][0], eSubject)
			assert.deepEqual(typeof aSendMail[0][1], 'string')
			assert.ok(~aSendMail[0][1].indexOf(anomaly2))
			assert.ok(!~aSendMail[0][1].indexOf(anomaly3))
			assert.ok(~aSendMail[0][1].indexOf('Skipped:1'))
			assert.equal(logs, 2)

			done()
		}

		function log() {
			console.log('anomaly log:', arguments)
		}
		function mockSendMail(subject, body) {
			aSendMail.push([subject, body])
		}
		function mockLog(a) {
//console.error(arguments.callee.name, a)
			logs++
		}
	},
}