// apperror.js
// Centralized reporting of errors
// © Harald Rudell 2012

var anomaly = require('./anomaly')
// http://nodejs.org/api/events.html
var events = require('events')

exports.addErrorListener = addErrorListener
exports.removeErrorListener = removeErrorListener

function apiError(err) {
/*
	console.log(arguments.callee.name, 'source:', this.id)
	Array.prototype.slice.call(arguments).forEach(function (arg, index) {
		console.log((index + 1) + ': ' + haraldutil.inspectDeep(arg))
	})
*/
	anomaly.anomaly.apply(this, Array.prototype.slice.call(arguments))
}

function addErrorListener(eventEmitter) {
	if (eventEmitter instanceof events.EventEmitter &&
		!~eventEmitter.listeners('error').indexOf(apiError))
		eventEmitter.on('error', apiError)
}

function removeErrorListener(eventEmitter) {
	if (eventEmitter instanceof events.EventEmitter)
		eventEmitter.removeListener('error', apiError)
}