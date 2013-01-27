// serverwrapper.js
// Allow registration of handlers prior to server start
// © Harald Rudell 2013 MIT License <harald@allgoodapps.com>

var emitter
var registerHandlers = []
var registerFns = []

;[
addUriHandler, registerHandler, setEmitter
].forEach(function (f) {exports[f.name] = f})

function registerHandler(uri, fn) {
	if (typeof uri !== 'string' || !uri && emitter) emitter.emit('error', new Error('Bad registerHandler uri: ' + uri))
	else if (typeof fn !== 'function' && emitter) emitter.emit('error', new Error('RegisterHandler argument 2 not function'))
	else if (registerFns.length) {
		registerFns.forEach(function (f) {
			f(uri, fn)
		})
	} else registerHandlers.push({uri: uri, fn: fn})
}

function addUriHandler(fn) {
	if (typeof fn === 'function') {
		registerFns.push(fn)
		var rh = registerHandlers
		registerHandlers = []
		rh.forEach(function (o) {
			fn(o.uri, o.fn)
		})
	}
}

function setEmitter(em) {
	emitter = em
}
