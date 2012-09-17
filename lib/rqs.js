// rqs2.js
// provide timeout notification for callback functions
// © Harald Rudell 2012

// https://github.com/haraldrudell/haraldutil
var haraldutil = require('haraldutil')

/*
typical code:
var rqs = apprunner.getApi({api: 'rqs'}).getRqs(cb, 'scraper')
var rq = rqs.addRq(url)
request(url, function (err) {
	rq.clear()
	...

the rq object
has a toString() producing a printable representation
.id is a unique string identifier
.param is a printable representation of param
.clear() clears the timer
.isTimeout() indicates if it has timed out already

the factory object rqs
.addRq(param, timer)
.clearRq(rq)
.isDone(): indictaes if all requests have completed
.getState(): gets a mirror of internal state
.shutDown(): cancels all pending timers

Errors
.isTimer set to true
if it is a timeout error, has an isTimeout property set to true
.scope identifying factory
.factoryFrom code that created the factory
-- if error pertaning to request
.from code that created timer
.param request param
.timeout request timeout in ms
.created timevalue for when request was created
*/
var emitter = new (require('events').EventEmitter)
var apiName = emitter.id = 'Request Timer'

exports.getRqs = getRqs,
exports.emitter = emitter

var time3seconds = 3000
var time100ms = 100

var minTimer = time100ms
var defTimer = time3seconds

// this key will not match any string
var invalidKey = ({})

/*
Request timer factory
errorCallback(err): function: invoked with err for timeouts and inconsitencies
scopeName: optional string or object: scope name for this factory eg. 'sync Db'
defaultTimeoutMs: optional number: default timeout in ms, min 100,  default 3 s
*/
function getRqs(errorCallback, scopeName, timeoutMs) {
	var factory = {from: haraldutil.getLocation({offset: 1, folder: false})}
	var requests = {}

	factory.scope = typeof scopeName == 'string' ? scopeName :
		(scopeName == null ? factory.from :
			haraldutil.inspect(scopeName))

	timeoutMs = isNaN(timeoutMs) || timeoutMs < minTimer ? defTimer : Number(timeoutMs)

	if (!(typeof errorCallback == 'function')) {
		var value = haraldutil.inspect(errorCallback)
		errorCallback = function () {}
		makeError('Error callback not function: ' + value)
	}

	return {
		addRq: addRq,
		clearRq: clear,
		isDone: isDone,
		getState: getState,
		shutdown: shutdown,
	}

	/*
	Add a request that is monitored by a timer
	parameter: optional string or object: affecting parameter for this request, eg. url for a Web request
	time: optional number: timeout in ms for this request, min 100ms, default is the factory default, typically 3 s

	return value: a printable and identifiable string
	*/
	function addRq(parameter, time) {
		// create an internal representation of the request
		var request = {
			created: Date.now(),
			from: haraldutil.getLocation({offset: 1, folder: false}),
			stack: new Error('Request Timer Stack'),
			timeout: isNaN(time) || time < 100 ? timeoutMs : Number(time),
			param: typeof parameter == 'string' ? parameter :
				(parameter == null ? factory.from :
					haraldutil.inspect(parameter)),
		}
		request.timer = setTimeout(timeout, request.timeout)

		// publicize the request
		var id = String(request.created + Math.random())
		requests[id] = request

		// return an object referring to the request
		var result = {
			id: id,
			created: request.created,
			param: request.param,
			from: request.from,
			toString: function () {
				return requestString(this)
			},
			clear: function () {
				clear(this)
			},
			isTimeout: function () {
				return isTimeout(this.id)
			}
		}

		return result

		function timeout() {

			// mark this request as timed out
			request.timer = true
			makeError('Timeout for: ' + requestString(request), request, {isTimeout: true})
		}

		function isTimeout() {
			return request.timer === true
		}
	}

	/*
	mark a request as complete
	instance: a value from addRq

	return value:
	- false: sucess: the rq was cleared before it timed out
	- number: this slogan timed out, number is ms elapsed since creation (errorCallback has already been invoked)
	*/
	function clear(instance) {
		var result = false

		// find the request
		var request
		if (instance && instance.id) {
			if (request = requests[instance.id]) {
				if (request.timer !== true) { // ok: within the timeout period
					clearTimeout(request.timer)
					request.timer = null
					delete requests[instance.id]
				} else { // it had already timed out
					result = Date.now() - request.created
					makeError('After ' + (result / 1e3) + ' s,' +
						' the timed out request completed: ' + requestString(request))
				}
			} else makeError('Instance not found: ' + haraldutil.inspectDeep(instance))
		} else {
			makeError('Corrupt instance provided: ' + haraldutil.inspectDeep(instance))
		}

		return result
	}

	function requestString(request) {
		if (!request) request = {}

		var result = 'Request ' +
		'created: ' + Date(request.created) +
		'from: ' + request.from +
		'parameter: \'' + request.param + '\''
		if (request.timeout) result += ' timeout: ' + (request.timeout / 1e3) + ' s'

		return result
	}

	// true if all requests completed
	function isDone() {
		return Object.keys(requests).length == 0
	}

	function makeError(s, rq, extraProps) {
		var result = new Error(String(s) +
			' factory: ' + factory.scope +
			' from: ' + factory.from)
		result.isTimer = true
		result.scope = factory.scope
		result.factoryFrom = factory.from
		if (rq) {
			result.from = rq.from
			result.param = rq.param
			result.timeout = rq.timeout
			result.created = rq.created
		}
		if (extraProps) {
			for (var p in extraProps) result[p] = extraProps[p]
		}

		var stack = rq && rq.stack
		emitter.emit('error', result, stack)
		errorCallback(result)

		return result
	}

	// clear all timers
	function shutdown() {
		var timer

		for (var id in requests)
			if (timer = requests[id].timer) {
				clearTimeout(timer)
				requests[id].timer = null
			}
	}

	function getState() {
		var result = {}
		for (var id in requests) result[id] = haraldutil.shallowClone(requests[id])
		return result
	}
}