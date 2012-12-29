// getemitter.js
// create event emitter for api
// © Harald Rudell 2012

var apilist = require('./apilist')
var rqsm = require('./rqs')

// http://nodejs.org/api/events.html
var events = require('events')

exports. getEmitter = getEmitter

/*
Get an api emitter and register the api
opts: object
.api: non-zero string, eg. 'MongoD'
.readyTimeout: optional number ms: timeout for ready if not 3 s, 0 for no ready event
.rqScope: optional string or boolen, slogan, true if use apiName
.cb(err): optional function: rqs error callback
.timeoutMs: number ms: default timeout if not 3 seconds

throws on troubles

rqsData: booloean or object: true: provide rqs object with 3-second timeout and no error callback
*/
function getEmitter(opts) {
	var err

	// get emitter and register api
	if (!opts) err = new Error(arguments.callee.name + ' invoked without opts')
	else {
		if (typeof opts.api != 'string' || !opts.api) err = new Error(arguments.callee.name + ' invoked with api name blank or non-string')
		else {
			var emitter = new events.EventEmitter
			emitter.id = opts.api
			var api = apilist.addApi(emitter)
			if (typeof api == 'string') err = new Error(api)
		}
	}

	// get rqs
	if (!err && opts.rqScope) {
		var scopeName = opts.rqScope !== true ? opts.rqScope : emitter.id
		var errorCallback = typeof opts.cb == 'function' ? opts.cb : defaultError
		var timeoutMs = opts.timeoutMs != null ? opts.timeoutMs : undefined
		// getRqs may throw
		emitter.rqs = rqsm.getRqs(errorCallback, scopeName, timeoutMs)
	}

	// handle error
	if (err) {
		apilist.emitError(err)
		throw err
	}

	return emitter
}

function defaultError() {}