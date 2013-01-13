// apperror.js
// Centralized error reporting for apis and non-apis
// © Harald Rudell 2012

var anomaly = require('./anomaly')
// http://nodejs.org/api/events.html
var events = require('events')

exports.addErrorListener = addErrorListener
exports.removeErrorListener = removeErrorListener

// report error from unknown api
function apiError(err) {
	anomaly.anomaly.apply(this, Array.prototype.slice.call(arguments))
}

/*
Add listener for an api's errors
eventEmitter: events.EventEmitter
eventEmitter.id api name

Can be invokd multiple times for any value
*/
function addErrorListener(eventEmitter) {
	if (eventEmitter instanceof events.EventEmitter &&
		!~eventEmitter.listeners('error').indexOf(apiError))
		eventEmitter.on('error', apiError)
	return eventEmitter
}

/*
Remove listener from addErrorListener
eventEmitter: events.EventEmitter

Can be invoked multiple times for any value
*/
function removeErrorListener(eventEmitter) {
	if (eventEmitter instanceof events.EventEmitter)
		eventEmitter.removeListener('error', apiError)
	return eventEmitter
}