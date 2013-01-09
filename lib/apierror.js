// apierror.js
// Submit Api Manager errors
// © Harald Rudell 2013

var apperror = require('./apperror')
// http://nodejs.org/api/events.html
var events = require('events')

exports.emitError = emitError
exports.init = init

var emitter

function init(noEmitter) {
	if (!noEmitter) {
		if (emitter) apperror.removeErrorListener(emitter)
		emitter = new events.EventEmitter
		emitter.id = 'Api Manager'
		apperror.addErrorListener(emitter)
	}
	return emitter
}

function emitError() {
	if (!emitter) init()
	emitter.emit.apply(emitter, ['error'].concat(Array.prototype.slice.call(arguments)))
}