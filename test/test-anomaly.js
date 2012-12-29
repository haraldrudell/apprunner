// test-anomaly.js
// © Harald Rudell 2012

var testedModule = require('../lib/anomaly')
// http://nodejs.org/api/os.html
var os = require('os')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

var exportsCount = 4
var testedModuleType = 'object'
var exportsTypes = {}

var anomalySubject = 'Anomaly Report'
var anomalyBodyStart = 'Anomaly '

exports['Anomaly:'] = {
	'Exports': function () {

		// if export count changes, we need to write more tests
		assert.equal(typeof testedModule, testedModuleType, 'Module type incorrect')
		assert.equal(Object.keys(testedModule).length, exportsCount, 'Export count changed')

		// all exports function
		for (var exportName in testedModule) {
			var actual = typeof testedModule[exportName]
			var expected = exportsTypes[exportName] || 'function'
			assert.equal(actual, expected, 'Incorrect type of export ' + exportName)
		}
	},
	'InitAnomaly AnomalyDown': function (done) {
		testedModule.initAnomaly()
		testedModule.anomalyDown(downResult)

		function downResult() {
			done()
		}
	},
	'EnableAnomalyMail': function (done) {
		var logs = 0
		var mails = 0

		testedModule.initAnomaly({}, mockMail, mockLog)
		testedModule.anomalyDown(downResult)

		function downResult() {
			assert.equal(testedModule.enableAnomalyMail(true), true)
			assert.equal(logs, 0)
			assert.equal(testedModule.enableAnomalyMail(false), false)
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

		testedModule.initAnomaly({maxBuffer: 1}, mockSendMail, mockLog)
		testedModule.enableAnomalyMail(true)

		// first anomaly: immediately sent
		testedModule.anomaly(anomaly1)
		assert.equal(aSendMail.length, 1)
		assert.equal(aSendMail[0][0], eSubject + ' ' + os.hostname())
		assert.deepEqual(typeof aSendMail[0][1], 'string')
		assert.ok(~aSendMail[0][1].indexOf(anomaly1))
		assert.equal(logs, 1, 'Console.log invocations: each anomaly should be logged')

		// second anomaly: queued
		// third anomaly: skipped
		logs = 0
		aSendMail = []
		testedModule.anomaly(anomaly2)
		testedModule.anomaly(anomaly3)
		assert.equal(aSendMail.length, 0)
		assert.equal(logs, 2, 'Console.log invocations: each anomaly should be logged')

		// shutDown: should send
		testedModule.anomalyDown(downResult)

		function downResult() {
			assert.equal(aSendMail.length, 1)
			assert.equal(aSendMail[0][0], eSubject + ' ' + os.hostname())
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