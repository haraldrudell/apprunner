// anomaly.js
// log and email peculiar app occurrences
// © Harald Rudell 2012 MIT License

var emailer = require('./emailer')
// https://github.com/haraldrudell/haraldutil
var haraldutil = require('haraldutil')
// http://nodejs.org/api/os.html
var os = require('os')
// http://nodejs.org/api/events.html
var events = require('events')

;[
initAnomaly, anomaly, shutdown, enableAnomalyMail, testReset,
].forEach(function (f) {exports[f.name] = f})

var time24hours = 24 * 3600 * 1e3
var defOpts = {
	period: time24hours,
	maxBuffer: 100,
}
var id = 'AnomalyMailer'

// configuration
var log = console.log
var opts = {}

// state
var lastSent
var silentPeriod
var enqueuedEmails = []
var skipCounter = 0
var emailOn = true
var isShutdown

/*
initialize anomaly reporting

optsx: optional object
.app: optional string: application name, default 'unknown'
.noSubjectApp: boolean default false: email subject line does not contain app name
.noSubjectHost: boolean default false: email subject line does not contain hostname
.period: optional number, unit ms, default 24h: shortest time between emails
.maxBuffer: optional number, default 100: max queued anomalies
logF: optional function default console.log: log to use
*/
function initAnomaly(opts0, logF) {
	opts = haraldutil.merge(defOpts, opts0)
	if (logF) log = logF
}

/*
Control emailing of anomaly reports
flag: boolean default false: true to send email. If enableAnomalyMail is not invoked emailing is on
flag: number: timeval for when emailing gets enabled
*/
function enableAnomalyMail(flag) {
	emailOn = flag
	if (!isEmailOn()) { // notify if off state
		var printableState = typeof flag === 'number' ?
			'disabled until: ' + (new Date(flag)).toISOString().substring(0, 10) :
			'disabled'
		var callersLocation = haraldutil.getLocation({offset: 1, folder: false, object: false, fileLine: true, dropExt: true})
		log(id, printableState, callersLocation)
	}
	return emailOn
}

/*
Process anomaly
any number of arguments
this: optionally an api's event emitter
*/
function anomaly() {
	var id = this instanceof events.EventEmitter && this.id ? String(this.id) : '' // first argument must be string, otherwise console.log does inspect
	var body = getBody(id, Array.prototype.slice.call(arguments))
	log(id, body)
	if (!isShutdown && isEmailOn() && emailer.hasSendMail()) enqueueEmail(body)
}

function shutdown(cb) { // shutdown anomaly allowing for app to exit
	if (enqueuedEmails.length) sendQueue()
	cancelSilentPeriodTimer()
	isShutdown = true
	if (cb) cb()
}

function isEmailOn() {
	return typeof emailOn === 'number' ? Date.now() >= emailOn : !!emailOn
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
		' api: ' + (id || 'unknown')) +
		' pid: ' + process.pid

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

function enqueueEmail(body) {
	if (enqueuedEmails.length < opts.maxBuffer) enqueuedEmails.push(body)
	else skipCounter++

	if (!silentPeriod) sendQueue()
}

// flush the send queue to an email
function sendQueue() {

	var subject = ['Anomaly Report']
	if (!opts.noSubjectApp && opts.app) subject.push(opts.app)
	if (!opts.noSubjectHost) subject.push(os.hostname())
	subject = subject.join(' ')

	var body
	if (skipCounter > 0) { // notify of skipped emails
		enqueuedEmails.push('Skipped:' + skipCounter)
		skipCounter = 0
	}
	body = enqueuedEmails.join('\n\n')
	enqueuedEmails = []

	emailer.send({subject: subject, body: body}) // TODO error handling when haraldops and emailer updated
	lastSent = Date.now()
	startSilentPeriod()
}

function startSilentPeriod() {
	cancelSilentPeriodTimer()
	silentPeriod = setTimeout(endSilentPeriod, time24hours)
}

function endSilentPeriod() {
	silentPeriod = null
	if (enqueuedEmails.length) sendQueue()
}

function cancelSilentPeriodTimer() {
	if (silentPeriod) {
		var s = silentPeriod
		silentPeriod = null
		clearTimeout(s)
	}
}

function testReset() {
	isShutdown = false
	enqueuedEmails = []
	skipCounter = 0
}
