// test-emailer.js
// © Harald Rudell 2012 MIT License

var emailer = require('../lib/emailer')

// http://nodejs.org/api/events.html
var events = require('events')
// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

exports['Emailer:'] = {
	'Exports': function () {
		assert.exportsTest(emailer, 3)
	},
	'Send SetSendMail HasSendMail': function () {
		var subject = 'SUBJECT'
		var body = 'BODY'
		var sends = 0

		emailer.setSendMail(mockSend)
		assert.ok(emailer.hasSendMail)
		emailer.send({subject: subject, body: body})
		assert.equal(sends, 1)

		function mockSend(subject0, body0) {
			assert.equal(subject0, subject)
			assert.equal(body0, body)
			sends++
		}
	},
}