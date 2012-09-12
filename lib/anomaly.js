// anomaly.js
// log and email peculiar app occurrences
// © Harald Rudell 2012

// https://github.com/haraldrudell/haraldutil
var haraldutil = require('haraldutil')
// http://nodejs.org/api/os.html
var os = require('os')
// http://nodejs.org/api/events.html
var events = require('events')

exports.initAnomaly = init
exports.anomaly = anomaly
exports.anomalyDown = anomalyDown
exports.enableAnomalyMail = enableAnomalyMail

// defaults
var time24hours = 24 * 3600 * 1e3
var defOpts = {
	period: time24hours,
	maxBuffer: 100,
}
// configuration
var sendMail = function () {}
var log = console.log
var opts = {}

// data
var lastSent
var silentPeriod
var sendArray = []
var skipCounter = 0
var emailOn = true

/*
initialize
optsx: optional object
.app: optional string: application name, default 'unknown'
.period: optional number: shortest time between emails, unit ms, default: 24 h
.maxBuffer: optional number: max queued anomalies, default: 100
sendMailF(body, subject): optional function: sends email, default: no email
logF: function(string): optional function: log to use, default console.log
*/
function init(optsx, sendMailF, logF) {
	opts = haraldutil.merge(defOpts, optsx)
	if (sendMailF) sendMail = sendMailF
	if (logF) log = logF
}

// control emailing on or off: flag: boolean, default: false
function enableAnomalyMail(flag) {
	emailOn = !!flag
	// notify if off state
	if (!emailOn) log(
		arguments.callee.name,
		emailOn,
		haraldutil.getLocation({offset: 1, folder: false, object:false}))
	return emailOn
}

// process anomaly, any number of arguments
function anomaly() {
	var id
	if (this instanceof events.EventEmitter && this.id) id = this.id
	// output to log and email stream
	var body = getBody(id, Array.prototype.slice.call(arguments))
	log(arguments.callee.name + ': ' + body)
	send(body)
}

// assemble the text body of one anomaly
function getBody(id, arr) {
	var result = []

	// heading and location: 'Anomaly 2012-08-11T03:23:49.725Z'
	result.push('Anomaly ' + new Date().toISOString())
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
	if (emailOn) sendMail('Anomaly Report', body)

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

// shutdown anomaly, will allow app to exit
function anomalyDown(cb) {
	if (sendArray.length) sendNow()
	cancelSilent()
	if (cb) cb()
}