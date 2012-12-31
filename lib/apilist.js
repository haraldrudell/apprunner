// apilist.js
// api services: list of apis, api ready monitoring, saveApi and endApi invocation
// © Harald Rudell 2012

var rqsm = require('./rqs')
var apperror = require('./apperror')

// http://nodejs.org/api/events.html
var events = require('events')

exports.addApi = addApi
exports.getOnLoads = getOnLoads
exports.emitError = emitError
exports.invokeEndApi = invokeEndApi
exports.isEndApi = isEndApiFn
exports.getState = getState
exports.testReset = testReset

var emitter = new events.EventEmitter
emitter.id = 'Api Manager'
apperror.addErrorListener(emitter)

/*
key: module name eg. 'mongod'
value: object
.emitter: api error emitter
.saveApi .endApi optional function: lifecycle functions
*/
var apiMap = {}
var isEndApi

var apiShutdownTimeout = 1000

/*
save an api, return value: printable string on troubles
 */
function addApi(emitter, opts) {
	var result

	if (isEndApi) result = arguments.callee.name + ' invoked after endApi'
	else if (!emitter || typeof emitter.on != 'function' || typeof emitter.once != 'function') result = 'Bad emitter'
	else if (typeof emitter.id != 'string' || !emitter.id) result = 'Emitter id property (api name) not string or blank'
	else {
		if (apiMap[emitter.id]) result = 'Duplicate api: ' + emitter.id
		else {
			result = apiMap[emitter.id] = {api: emitter.id, emitter: emitter}
			if (!emitter.noReady) {
				emitter.once('ready', onReady)
			} else api.isReady = true
			if (findFn('saveApi') && findFn('endApi')) ;
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
	var api = apiMap[id]

	// handle 'ready' with error
	if (err) {
		var args = Array.prototype.slice.call(arguments)
		args.splice(1, 0, {event: 'api ready event with error'})
		anomaly.anomaly.apply(this, args)
		throw err
	}

	// set api.isReady
	if (!this || !this.id) err = new Error('ready for nameless api')
	else {
		var api = apiMap[this.id]
		if (!api) err = new Error('ready for unknown api: ' + this.id)
		else if (api.isReady) err = new Error('multiple ready for api: ' + this.id)
		else api.isReady = true
	}

	// handle error
	if (err) {
		emitError(err)
		throw err
	}
}

function getOnLoads() {
	var result = []
	for (var apiName in apiMap)
		if (apiMap[apiName].onLoad) result.push(apiName)
	return result
}

function invokeEndApi(cb) {
	if (isEndApi != null) {
		var err = new Error('endapi invoked repeatedly')
		emitError(err)
		cb(err)
	} else isEndApi = false

	touchAllApis('saveApi', saveApiDone)

	function saveApiDone(err) {
		isEndApi = true
		if (!err) touchAllApis('endApi', cb)
		else cb(err)
	}
}

function touchAllApis(fName, cb) {
	var isError
	// we need our own rqs, because we shut it down
	var rqsTouch = rqsm.getRqs(emitError, emitter.id + ' ' + fName, apiShutdownTimeout)
	var cbCounter = 1

	// iterate over all known apis
	for (var apiName in apiMap) {
		var api = apiMap[apiName]
		var fn = api[fName]
		if (fn) {
			cbCounter++
			invokeApi(fn, apiName, end)
		}
	}
	end()

	function invokeApi(fn, apiName) {
		var timer = rqsTouch.addRq(apiName)
		fn(checkResult)

		function checkResult(err) {
			timer.clear()
			end(err)
		}
	}

	function end(err) {
		if (!err) {
			if (!isError && !--cbCounter) {
				rqsTouch.shutdown()
				cb()
			}
		} else {
			emitError.apply(this, Array.prototype.slice.call(arguments))
			if (!isError) {
				rqsTouch.shutdown()
				cb(err)
			}
		}
	}
}

function isEndApiFn() {
	return isEndApi
}

function emitError() {
	emitter.emit.apply(emitter, ['error'].concat(Array.prototype.slice.call(arguments)))
}
function getState() {
	var result = {}
	for (apiName in apiMap)
		result[apiName] = haraldutil.shallwoClone(apiMap[apiName])
	return result
}

function testReset() {
	for (apiName in apiMap) {
		api = apiMap
		if (!api.isready) api.emitter.removeListener('ready', onReady)
	}
	apiMap = {}
}