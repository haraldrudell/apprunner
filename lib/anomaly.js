// anomaly.js
// log and email peculiar app occurrences
// © Harald Rudell 2012

// https://github.com/haraldrudell/haraldutil
var haraldutil = require('haraldutil')
// http://nodejs.org/api/os.html
var os = require('os')

module.exports = {
	initAnomaly: init,
	anomaly: anomaly,
	anomalyDown: anomalyDown,
	enableAnomalyMail: enableAnomalyMail,
}

// defaults
var time24hours = 24 * 3600 * 1e3

// configuration
var sendMail = function () {}
var log = console.log
var opts = {}

// data
var lastSent
var queueTimer
var sendArray = []
var skipCounter = 0
var emailOn = true

function init(optsx, sendMailF, logF) {
	if (typeof optsx == 'object') for (var p in optsx) opts[p] = optsx[p]
	if (!opts.maxBuffer) opts.maxBuffer = 10
	if (!opts.period) opts.period = time24hours
	sendMail = sendMailF
	log = logF || function () {}
}

// control emailing on or off: flag: boolean
function enableAnomalyMail(flag) {
	emailOn = !!flag
	// notify if off state
	if (!emailOn) log(arguments.callee.name, emailOn)
}

// take note of an anomaly
function anomaly() {
	var func = arguments.callee.name
	var arr = Array.prototype.slice.call(arguments)

	// assemble string
	var s = getString(arr)

	// output to log and email stream
	log(func + ': ' + s)
	save(s)

	// send if not in suppress period
	if (!lastSent) send()
}

// assemble the string for one anomaly
function getString(arr) {
	var result = []

	// heading and location: 'Anomaly 2012-08-11T03:23:49.725Z'
	result.push('Anomaly ' + new Date().toISOString())
	result.push('host:' + os.hostname() + ' app:' + (opts.app || 'unknown'))

	// a stack trace for the invocation of anomaly
	var stack = Error().stack
	if (typeof stack == 'string') {
		stack = stack.split('\n')
		for (var ix = 4; ix < stack.length; ix++) result.push(stack[ix])
	}

	// output each provided argument
	arr.forEach(function (value, index) {
		result.push((index + 1) + ': ' + haraldutil.inspectDeep(value))
	})

	return result.join('\n')
}

// save a message to the email stream
function save(str) {
	if (sendArray.length < opts.maxBuffer) sendArray.push(str)
	else skipCounter++
}

// flush the send queue to an email
function send() {

	// assemble body
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
	queueTimer = setTimeout(checkSend, time24hours)
}

// end of suppress period
function checkSend() {
	if (sendArray.length) send()
	else lastSent = null
}

// shutdown anomaly, will allow app to exit
function anomalyDown(cb) {
	if (!lastSent) send()
	if (queueTimer) {
		clearTimeout(queueTimer)
		queueTimer = null
	}
	if (cb) cb()
}