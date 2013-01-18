// anomaly.js
// log and email peculiar app occurrences
// © Harald Rudell 2012 MIT License

// https://github.com/haraldrudell/haraldutil
var haraldutil = require('haraldutil')
// http://nodejs.org/api/os.html
var os = require('os')
// http://nodejs.org/api/events.html
var events = require('events')

exports.initAnomaly = initAnomaly
exports.anomaly = anomaly
exports.anomalyDown = anomalyDown
exports.enableAnomalyMail = enableAnomalyMail

// defaults
var time24hours = 24 * 3600 * 1e3
var defOpts = {
	period: time24hours,
	maxBuffer: 100,
}
var id = 'AnomalyMailer'

// configuration
var sendMail = emailDisabledSendFunction
var log = console.log
var opts = {}

// state
var lastSent
var silentPeriod
var sendArray = []
var skipCounter = 0
var emailOn = true

/*
initialize logging and sending of anomaly reports

optsx: optional object
.app: optional string: application name, default 'unknown'
.noSubjectApp: boolean: true: email subject line does not contain app name
.noSubjectHost: boolean: true: email subject line does not contain hostname
.period: optional number: shortest time between emails, unit ms, default: 24 h
.maxBuffer: optional number: max queued anomalies, default: 100
sendMailF({body, subject}, cb): optional function: sends email, default: no email
logF: function(string): optional function: log to use, default console.log
*/
function initAnomaly(opts0, sendMailF, logF) {
	opts = haraldutil.merge(defOpts, opts0)
	if (sendMailF) sendMail = sendMailF
	if (logF) log = logF
}

// control emailing on or off: flag: boolean, default: false
function enableAnomalyMail(flag) {
	emailOn = flag
	// notify if off state
	if (!isEmailOn()) {
		var display = flag === false ? 'disabled' : 'disabled until: ' + (new Date(flag)).toISOString().substring(0, 10)
		log(id, display,
			haraldutil.getLocation({offset: 1, folder: false, object:false, fileLine: true, dropExt: true}))
	}
	return emailOn
}

function isEmailOn() {
	var result = emailOn
	if (typeof emailOn == 'number') {
		if (Date.now() >= emailOn) {
			result = emailOn = true
		} else result = false
	}
	return result
}

// process anomaly, any number of arguments
function anomaly() {
	var id = '' // first argument must be string, otherwise console.log does inspect
	if (this instanceof events.EventEmitter && this.id) id = String(this.id)
	// output to log and email stream
	var body = getBody(id, Array.prototype.slice.call(arguments))
	log(id, body)
	send(body)
}

// assemble the text body of one anomaly
function getBody(id, arr) {
	var result = []

	// heading and location: 'Anomaly 2012-08-11T03:23:49.725Z'
	var now = new Date
	result.push('Anomaly ' + now.toISOString() + ' ' + haraldutil.getISOPacific(now))
	if (id) result.push()
	result.push('host:' + os.hostname() +
		' app:' + (opts.app || 'unknown') +
		' api: ' + (id || 'unknown'))

	// output each provided argument
	arr.forEach(function (value, index) {
		result.push((index + 1) + ': ' + haraldutil.inspectDeep(value))
	})

	// a stack trace for the invocation of anomaly
	var o = haraldutil.parseTrace(new Error)
	if (o && Array.isArray(o.frames)) {
		result.push('Anomaly invoked from:')
		for (var ix = 2; ix < o.frames.length; ix++) {
			var frame = o.frames[ix]
			var s = [' ']
			if (frame.func) s.push(frame.func)
			if (frame.as) s.push('as:', frame.as)
			if (frame.file) s.push(frame.file + ':' + frame.line + ':' + frame.column)
			if (frame.folder) s.push(frame.folder)
			if (frame.source) s.push('source:', frame.source)
			result.push(s.join(' '))
		}
	}

	return result.join('\n')
}

// send to the email stream
function send(body) {

	// save to stream
	if (sendArray.length < opts.maxBuffer) sendArray.push(body)
	else skipCounter++

	if (!silentPeriod) sendNow()
}

// flush the send queue to an email
function sendNow() {

	// assemble body from sendArray
	if (skipCounter > 0) {
		sendArray.push('Skipped:' + skipCounter)
		skipCounter = 0
	}
	var body = sendArray.join('\n\n')
	sendArray = []

	// send email
	if (isEmailOn()) {
		var subject = ['Anomaly Report']
		if (!opts.noSubjectApp && opts.app) subject.push(opts.app)
		if (!opts.noSubjectHost) subject.push(os.hostname())
		if (sendMail) sendMail({subject: subject.join(' '), body: body})
		else console.log(id, 'mail shutdown:', body)
	}

	// set up suppress period
	lastSent = Date.now()
	if (!silentPeriod) {
		silentPeriod = setTimeout(checkSend, time24hours)
	}
}

// end of suppress period
function checkSend() {
	silentPeriod = null
	if (sendArray.length) sendNow()
}

// cancel suppress period
function cancelSilent() {
	if (silentPeriod) {
		clearTimeout(silentPeriod)
		silentPeriod = null
	}
}

function emailDisabledSendFunction() {}

// shutdown anomaly, will allow app to exit
function anomalyDown(cb) {
	if (sendArray.length) sendNow()
	cancelSilent()
	sendMail = null
	if (cb) cb()
}