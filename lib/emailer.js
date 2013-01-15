// emailer.js
// provide a stop gap capability
// © Harald Rudell 2012

var anomaly = require('./anomaly')

var emitter = new (require('events').EventEmitter)
var apiName = emitter.id = 'Emailer'

exports.send = send
exports.setSendMail = setSendMail
exports.emitter = emitter

var sendMail

function send(opts, cb) {
	if (!opts) opts = {}
	if (typeof sendMail === 'function') {
		sendMail(opts.subject || 'Subject', opts.body || 'Body')
	} else anomaly.anomaly(new Error('Sendmail not available'), {subject: opts.subject, body: opts.body})
	if (cb) cb()
}

function setSendMail(f) {
	sendMail = f
}