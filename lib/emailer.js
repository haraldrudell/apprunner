// emailer.js
// Provide managed operations emails
// © Harald Rudell 2012 MIT License <harald@allgoodapps.com>

var anomaly = require('./anomaly')

;[
send, setSendMail, hasSendMail
].forEach(function (f) {exports[f.name] = f})

var sendMail

function send(opts, cb) {
	if (!opts) opts = {}

	if (sendMail) sendMail(String(opts.subject || 'Subject'), String(opts.body || 'Body'))
	else if (opts.anomaly !== false) anomaly.anomaly(new Error('Sendmail not available'), {subject: opts.subject, body: opts.body})
// TODO update haraldops to provide callback and signal anomaly here on error
	if (cb) cb()
}

function setSendMail(f) {
	sendMail = f
}

function hasSendMail(f) {
	return !!sendMail
}
