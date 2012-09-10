// test-anomaly.js
// © Harald Rudell 2012

var anomaly = require('../lib/anomaly')
var assert = require('mochawrapper')

var anomalySubject = 'Anomaly Report'
var anomalyBodyStart = 'Anomaly '

exports['Anomaly:'] = {
	'Text': function () {
		var mockMail = getMockSendMail(anomalySubject)
		var mockLog = getMockLog()
		var anomalyArg = 'haha'

		// init
		anomaly.initAnomaly({}, mockMail.sendMail, mockLog.log)

		// verify one anomaly
		mockMail.allowInvocation()
		mockLog.allowInvocation()
		anomaly.anomaly(anomalyArg)
		mockMail.verifyInvocations()
		var body = mockMail.getBody()
		assert.equal(body.substring(0, anomalyBodyStart.length), anomalyBodyStart)
		var found = body.indexOf('1: \'' + anomalyArg + '\'') != -1
		assert.ok(found)
		mockLog.verifyInvocations()

		// verify second is queued
		mockLog.allowInvocation()
		anomaly.anomaly('haha2')
		mockMail.verifyInvocations()
		mockLog.verifyInvocations()

		// shutDown
		anomaly.anomalyDown()

		function log() {
			console.log('anomaly log:', arguments)
		}
	},
}

function getMockLog() {
	var logPending = 0
	var logActual = 0

	return {
		log: log,
		allowInvocation: allowInvocation,
		verifyInvocations: verifyInvocations,
	}

	function allowInvocation() {
		logPending++
	}
	function verifyInvocations() {
		if (logPending != logActual) throw Error('Missing log invocation')
	}

	function log() {
		if (++logActual != logPending) {
			var string = ''
			Array.prototype.slice.call(arguments, 0).forEach(function (value) {
				string += value
			})
			throw Error('Unforeseen log invocation:\'' + string + '\'')
		}
	}
}

function getMockSendMail(subject) {
	var sendMailPending = 0
	var sendMailActual = 0
	var body

	return {
		sendMail: mockSendMail,
		allowInvocation: allowInvocation,
		getBody: getBody,
		verifyInvocations: verifyInvocations,
	}

	function allowInvocation() {
		sendMailPending++
	}
	function getBody() {
		return body
	}
	function verifyInvocations() {
		if (sendMailPending != sendMailActual) throw Error('Missing sendMail invocation')
	}
	function mockSendMail(s, b) {
		if (++sendMailActual != sendMailPending) throw Error('Unforeseen sendmail invocation')
		if (typeof s != 'string' || typeof b != 'string') throw Error('Bad sendmail parameters')
		if (s != subject) throw Error('Incorrect sendMail subject:' +
			s +
			' instead of ' +
			subject)
		body = b
	}
}