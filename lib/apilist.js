// apilist.js
// api services: list of apis, api ready monitoring, saveApi and endApi invocation
// © Harald Rudell 2012

var apierror = require('./apierror')
var apitouch = require('./apitouch')
// http://nodejs.org/api/events.html
var events = require('events')
// https://github.com/haraldrudell/haraldutil
var haraldutil = require('haraldutil')

;[
addApi, invokeEndApi, isEndApiFn, getState, testReset
].forEach(function (f) {exports[f.name] = f})

/*
key: module name eg. 'mongod'
value: object
.emitter: api error emitter
.saveApi .endApi optional function: lifecycle functions
*/
var apiMap = {}
var isEndApi

/*
save an api, return value: printable string on troubles
 */
function addApi(emitter, opts) {
	var result

	if (isEndApi) result = arguments.callee.name + ' invoked after endApi'
	else if (!(emitter instanceof events.EventEmitter)) result = 'Bad emitter'
	else if (typeof emitter.id != 'string' || !emitter.id) result = 'Emitter id property (api name) not string or blank'
	else {
		if (apiMap[emitter.id]) result = 'Duplicate api: ' + emitter.id
		else {
			result = apiMap[emitter.id] = {api: emitter.id, emitter: emitter}
			if (!emitter.noReady) {
				emitter.once('ready', onReady)
			} else result.isReady = true
			if (opts && findFn('saveApi') && findFn('endApi') && findFn('apiState')) ;
		}
	}

	return result

	function findFn(fName) {
		if (opts[fName])
			if (typeof opts[fName] == 'function')
				result[fName] = opts[fName]
			else result = fName + ' must be function'
		return typeof result != 'string'
	}
}

function onReady(err) {
	var args = Array.prototype.slice.call(arguments)
	var api = getApi(this, args)
	var err

	if (api) {
		if (!api.isReady) {
			api.isReady = err || true
			if (err instanceof Error) err = new Error('onReady with error for api: ' + api.api)
		} else  err = new Error('Multiple onReady for api: ' + api.api)
	}
	if (err) apierror.emitError(err, {args: args, emitter: this})
}

function getApi(emitter, args) {
	var err
	var api
	if (emitter instanceof events.EventEmitter) {
		var id = emitter.id
		if (id && typeof id === 'string') {
			api = apiMap[id]
			if (!api) err = new Error('onReady for unknown api')
		} else err = new Error('onReady for unknown api')
	} else err = new Error('onReady for non-emitter')
	if (err) apierror.emitError(err, {emitter: emitter, args: args})

	return api
}

function invokeEndApi(cb) {
	if (isEndApi != null) {
		var err = new Error('endapi invoked repeatedly')
		apierror.emitError(err)
		cb(err)
	} else {
		isEndApi = false
		apitouch.touchApis('saveApi', saveApiDone)
	}

	function saveApiDone(err) {
		isEndApi = true
		if (!err) apitouch.touchApis('endApi', cb)
		else cb(err)
	}
}

function isEndApiFn() {
	return isEndApi
}

function getState() {
	var result = {}
	for (var apiName in apiMap)
		result[apiName] = haraldutil.shallowClone(apiMap[apiName])
	return result
}

function testReset() {
	for (var apiName in apiMap) {
		var api = apiMap[apiName]
		if (!api.isready) api.emitter.removeListener('ready', onReady)
	}
	apiMap = {}
	isEndApi = undefined
}