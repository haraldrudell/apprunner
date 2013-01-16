// apilist.js
// api services: list of apis, api ready monitoring, saveApi and endApi invocation
// © Harald Rudell 2012 MIT License

var apierror = require('./apierror')
var apitouch = require('./apitouch')
var rqsm = require('./rqs')
// http://nodejs.org/api/events.html
var events = require('events')
// https://github.com/haraldrudell/haraldutil
var haraldutil = require('haraldutil')

;[
addApi, invokeEndApi, isEndApiFn, getState, apisReady, testReset
].forEach(function (f) {exports[f.name] = f})

var time3s = 3e3

/*
key: module name eg. 'mongod'
value: object
.emitter: api error emitter
.saveApi .endApi optional function: lifecycle functions
*/
var apiMap = {}
var apiReadyWait = []
var isEndApi
// rqsm emits timeouts as Request Timer
var rqs = rqsm.getRqs(function () {}, 'Api Ready', time3s)

/*
Add an api to the loaded apis
emitter: EventEmitter
emitter.id: string api name
emitter.noReady: boolean default false: this api does not emit ready
opts: object
.saveApi: optional function
.endApi: optional function
.apiState: optional function
.ready undefined: instance ready, 3 s
.ready: number: singleton ready timeout in ms
.ready false: api does not emit ready
.ready null/NaN : singleton ready with timeout 3 s

return value: api object on success, printable string on troubles
 */
function addApi(emitter, opts) {
	if (!opts) opts = {}
	var result

	if (isEndApi) result = arguments.callee.name + ' invoked after endApi'
	else if (!(emitter instanceof events.EventEmitter)) result = 'Bad emitter'
	else if (typeof emitter.id != 'string' || !emitter.id) result = 'Emitter id property (api name) not string or blank'
	else {
		if (apiMap[emitter.id]) result = 'Duplicate api: ' + emitter.id
		else {
			result = apiMap[emitter.id] = {api: emitter.id, emitter: emitter}
			if (opts.ready !== false && opts.ready !== undefined) {
				emitter.once('ready', onReady)
				var timeout
				if (+opts.ready > 0) timeout = +opts.ready
				var timer = rqs.addRq(result.api, timeout)
			} else {
				result.isReady = true
				if (opts.ready === undefined) result.instanceReady = true
			}
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

	function onReady(err) {
		timer.clear()
		var args = Array.prototype.slice.call(arguments)
		var api = getApi(this, args)
		var err

		if (api) {
			if (!api.isReady) {
				api.isReady = err || true
				if (!(err instanceof Error)) { // we have an new api becoming ready
					if (apiReadyWait.length) checkApisReady()
				} else err = new Error('onReady with error for api: ' + api.api)
			} else  err = new Error('Multiple onReady for api: ' + api.api)
		}
		if (err) apierror.emitError(err, {args: args, emitter: this})
	}
}

function apisReady(cb) {
	if (!apiReadyWait.length && checkApisReady()) cb()
	else apiReadyWait.push(cb)
}

function checkApisReady() {
	var isReady = true
	for (var api in apiMap) {
		if (!apiMap[api].isReady) {
			isReady = false
			break
		}
	}
	if (isReady && apiReadyWait.length) {
		var cbs = apiReadyWait
		apiReadyWait = []
		cbs.forEach(function (cb) {
			cb()
		})
	}
	return isReady
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

function testReset(rqs0) {
	var result = rqs
	for (var apiName in apiMap) {
		var api = apiMap[apiName]
		if (!api.isready) api.emitter.removeAllListeners('ready')
		if (rqs.shutdown) rqs.shutdown()
	}
	apiMap = {}
	isEndApi = undefined
	if (rqs0) rqs = rqs0
	return rqs
}