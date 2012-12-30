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

	// handle error
	if (err) {
		apilist.emitError(err)
		throw err
	}

	return emitter
}