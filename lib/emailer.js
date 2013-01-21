// emailer.js
// provide a stop gap capability
// © Harald Rudell 2012 MIT License

var anomaly = require('./anomaly')

;[
send, setSendMail, hasSendMail
].forEach(function (f) {exports[f.name] = f})

var sendMail

function send(opts, cb) {
	if (!opts) opts = {}

	if (sendMail) sendMail(opts.subject || 'Subject', opts.body || 'Body')
	else anomaly.anomaly(new Error('Sendmail not available'), {subject: opts.subject, body: opts.body})
// TODO update haraldops to provide callback and signal anomaly here on error
	if (cb) cb()
}

function setSendMail(f) {
	if (typeof f === 'function') sendMail = f
}

function hasSendMail(f) {
	return !!sendMail
}