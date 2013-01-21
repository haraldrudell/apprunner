// test-anomaly.js
// © Harald Rudell 2012 MIT License

var anomaly = require('../lib/anomaly')
var emailer = require('../lib/emailer')

// http://nodejs.org/api/os.html
var os = require('os')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

he = emailer.hasSendMail
es = emailer.send

exports['Anomaly:'] = {
	'Exports': function () {
		assert.exportsTest(anomaly, 5)
	},
	'InitAnomaly Shutdown': function () {
		anomaly.testReset()
		anomaly.initAnomaly()
		anomaly.shutdown()
	},
	'EnableAnomalyMail': function () {
		var logs = 0
		var mails = 0

		anomaly.testReset()
		anomaly.initAnomaly({}, function () {})

		assert.equal(anomaly.enableAnomalyMail(true), true)
		assert.equal(anomaly.enableAnomalyMail(false), false)
		assert.equal(anomaly.enableAnomalyMail(0), false)
		assert.ok(anomaly.enableAnomalyMail(new Date(2099, 0, 1).getTime()))

		anomaly.shutdown()
	},
	'Anomaly': function () {
		var eSubject = 'Anomaly Report' + ' ' + os.hostname()
		var anomaly1 = 'haha1'
		var anomaly2 = 'haha2'
		var anomaly3 = 'haha3'

		emailer.hasSendMail = function mockHasSendMail() {return true}

		var aSend = []
		emailer.send = function mockSend(o) {aSend.push(o)}

		var aLogs = 0
		anomaly.testReset()
		anomaly.initAnomaly({maxBuffer: 1}, function () {aLogs++})
		anomaly.enableAnomalyMail(true)

		anomaly.anomaly(anomaly1) // first anomaly: immediately sent

		assert.ok(aLogs)
		assert.equal(aSend.length, 1)
		assert.equal(typeof aSend[0], 'object')
		assert.equal(Object.keys(aSend[0]).length, 2)
		assert.equal(aSend[0].subject, eSubject)
		var body = aSend[0].body
		assert.equal(typeof body, 'string')
		assert.ok(~body.indexOf(anomaly1))

		aLogs = 0
		aSend = []

		anomaly.anomaly(anomaly2) // second anomaly: queued
		anomaly.anomaly(anomaly3) // third anomaly: skipped

		assert.equal(aSend.length, 0)
		assert.equal(aLogs, 2, 'Console.log invocations: each anomaly should be logged')

		anomaly.shutdown() // shutDown: should send

		assert.equal(aSend.length, 1)
		assert.equal(typeof aSend[0], 'object')
		assert.equal(Object.keys(aSend[0]).length, 2)
		assert.equal(aSend[0].subject, eSubject)
		var body = aSend[0].body
		assert.equal(typeof body, 'string')
		assert.ok(~body.indexOf(anomaly2))
		assert.ok(!~body.indexOf(anomaly3))
		assert.ok(~body.indexOf('Skipped:1'))
		assert.equal(aLogs, 2)
	},
	'after': function () {
		emailer.hasSendMail = he
		emailer.send = es
	}
}