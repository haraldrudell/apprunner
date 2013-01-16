// test-anomaly.js
// © Harald Rudell 2012 MIT License

var anomaly = require('../lib/anomaly')

// http://nodejs.org/api/os.html
var os = require('os')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

var anomalySubject = 'Anomaly Report'
var anomalyBodyStart = 'Anomaly '

exports['Anomaly:'] = {
	'Exports': function () {
		assert.exportsTest(anomaly, 4)
	},
	'InitAnomaly AnomalyDown': function (done) {
		anomaly.initAnomaly()
		anomaly.anomalyDown(downResult)

		function downResult() {
			done()
		}
	},
	'EnableAnomalyMail': function (done) {
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
		var eSubject = 'Anomaly Report'
		var anomaly1 = 'haha1'
		var anomaly2 = 'haha2'
		var anomaly3 = 'haha3'

		var aSendMail = []
		function mockSendMail(o) {aSendMail.push(o)}

		anomaly.initAnomaly({maxBuffer: 1}, mockSendMail, mockLog)
		anomaly.enableAnomalyMail(true)

		// first anomaly: immediately sent
		anomaly.anomaly(anomaly1)
		assert.equal(aSendMail.length, 1)
		assert.equal(aSendMail[0].subject, eSubject + ' ' + os.hostname())
		assert.deepEqual(typeof aSendMail[0].body, 'string')
		assert.ok(~aSendMail[0].body.indexOf(anomaly1))
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
			assert.equal(aSendMail[0].subject, eSubject + ' ' + os.hostname())
			assert.deepEqual(typeof aSendMail[0].body, 'string')
			assert.ok(~aSendMail[0].body.indexOf(anomaly2))
			assert.ok(!~aSendMail[0].body.indexOf(anomaly3))
			assert.ok(~aSendMail[0].body.indexOf('Skipped:1'))
			assert.equal(logs, 2)

			done()
		}

		function log() {
			console.log('anomaly log:', arguments)
		}
		function mockLog(a) {
			logs++
		}
	},
}