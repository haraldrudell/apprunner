// test-emailer.js
// © Harald Rudell 2012

var emailer = require('../lib/emailer')
// http://nodejs.org/api/events.html
var events = require('events')
// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

exports['Emailer:'] = {
	'Send and SetSendMail': function () {
		var subject = 'SUBJECT'
		var body = 'BODY'
		var sends = 0

		// api exports
		assert.equal(typeof emailer, 'object')
		assert.ok(emailer.emitter instanceof events.EventEmitter)
		assert.equal(typeof emailer.emitter.id, 'string')

		emailer.setSendMail(mockSend)
		emailer.send({subject: subject, body: body})
		assert.equal(sends, 1)

		function mockSend(subject0, body0) {
			assert.equal(subject0, subject)
			assert.equal(body0, body)
			sends++
		}
	},
}