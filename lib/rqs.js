// rqs.js
// provide timeout notification for callback functions
// © Harald Rudell 2012

/*
typical code:
...
var rqs = getRqs(errorCallback, 'scopeDescription', defaultTimer)

for (a in requests) {
	var rq = rqs.addRq({ name: 'database query', location: 45 })
	request(function (result) {
		rqs.clearRq(rq)
	})
}

rqs.clearRq(0)

function errorCallback() {
	if (!err) console.log('all completed')
	else console.log(err)
}
*/
var apperror = require('./apperror')
var emitter = new (require('events').EventEmitter)
emitter.id = 'Request Timer'
apperror.addErrorListener(emitter)

module.exports = {
	getRqs: getRqs,
}

// this key will not match any string
var invalidKey = ({})

// get a request timer factory
// errorCallback(err): function: the callers end function: invoked with err for each timeout
// scopeName: optional string: scope name for this factory eg. 'sync Db'
// defaultTimeoutMs: optional number: default timeout in ms, min 100,  default 3 s
function getRqs(errorCallback, scopeName, defaultTimeoutMs, logFunc) {
	if (!errorCallback instanceof Function) throw makeError('Fatal: Error callback not function')
	scopeName = scopeName ? String(scopeName) : 'anonymous'
	if (!defaultTimeoutMs || defaultTimeoutMs < 100) defaultTimeoutMs = 3000
	if (!logFunc) logFunc = console.log

	// the background request has value 0
	var requests = { 0: 1 } // key slogan, value: object .timer: setTimout timer .created: timevalue
	var nextIndex = 1 // default slogan serial number
	var rqCounter = 0 // number of issued requests for this factory

	return {
		addRq: addRq,
		clearRq: clearRq,
		func: scopeName,
		isDone: isDone,
		getCount: getCount,
	}

	/*
	Add a request that is monitored by a timer
	slogan: optional string: a string that uniquely identifying this request. if object: .rqId slogan property is added
	time: optional number: timeout in ms for this request, otherwise factory default, typically 3 s
	*/
	function addRq(slogan, time, addSerial) {
		var printable = printableSlogan(slogan = makeSlogan(slogan, addSerial))
		if (time == null || time < 100) time = defaultTimeoutMs
		rqCounter++

		// make sure not duplicate
		var key = getKey(slogan)
		if (requests[key]) errorCallback(makeError('Duplicate slogan:' + printable))

		// save request
		requests[key] = {
			timer: setTimeout(timeout, time),
			created: Date.now(),
		}

		return slogan

		function timeout() {

			// mark this slogan as timed out
			var request = requests[key]
			if (!request) errorCallback(makeError('Corrupt key on timeout:' + key))
			else request.timer = true

			// propagate timeout error
			var e = makeError('Timeout for:' + printable)
			e.isTimeout = true
			e.slogan = slogan
			errorCallback(e)
		}
	}

	/*
	mark a request as complete
	return value:
	- false: sucess: the rq was cleared before it timed out
	- number: this slogan timed out, number is ms elapsed since creation (errorCallback has already been invoked)
	*/
	function clearRq(slogan) {
		var result = false

		// find the request
		var key = getKey(slogan)
		var printable = printableSlogan(slogan)
		if (key == invalidKey) errorCallback(makeError('Corrupt slogan provided:' + printable))
		else {
			var request = requests[key]
			if (!request) errorCallback(Error('Unknown slogan:' + printable))
			else {

				// clear and delete timer
				if (slogan != 0) {
					if (request.timer === true) {
						// this slogan had already timed out
						result = Date.now() - request.created
						var s = 'After ' + result / 1e3 + ' s, the timed out request ' + printable + ' completed ' + getScope()
						emitter.emit('error', s)
					} else clearTimeout(request.timer)
				}
				delete requests[key]
			}
		}

		return result
	}

	// true if all requests completed
	function isDone() {
		return Object.keys(requests).length == 0
	}

	function getCount() {
		return rqCounter
	}

	function printableSlogan(slogan) {
		var result
		if (typeof slogan != 'object') result = String(slogan)
		else {
			var s = []
			for (var p in slogan) s.push(p + ':' + slogan[p])
			if (s.length == 0) s.push('empty-object')
			result = s.join(',')
		}
		return result
	}

	// convert value so that it can be interpreted as a slogan
	// always producers a valid slogan
	function makeSlogan(value, addSerial) {
		var result
		if (value != null && typeof value.valueOf() == 'object') {
			result = value
			result.rqId = String(nextIndex++)
		} else {
			if (value == null) result = String(nextIndex++)
			else {
				result = String(value)
				if (addSerial) result += nextIndex++
			}
		}
		return result		
	}

	// get the key value for slogan. invalidKey for corrupt slogan values
	function getKey(slogan) {
		var result

		if (slogan != null && typeof slogan.valueOf() == 'object') {
			// objects we create has a string rqid property
			result = typeof slogan.rqId == 'string' ? slogan.rqId : invalidKey
		} else { // otherwise only the number 0 and string values are ok
			result = slogan != 0 &&
				(slogan == null || typeof slogan != 'string') ?
				invalidKey :
				String(slogan)
		}

		return result
	}

	function makeError(s) {
		return new Error(String(s) + getScope())
	}

	function getScope() {
		return ' scope:' + String(scopeName)
	}

}