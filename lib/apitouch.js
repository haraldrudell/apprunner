// apitouch.js
// Touch a function of all loaded apis
// © Harald Rudell 2013 MIT License

var rqsm = require('./rqs')
var apierror = require('./apierror')

exports.touchApis = touchApis

var time1s = 1e3
var defaultTimeout = time1s
/*
Invoke a function on all registered apis
opts: object
.apiMap: object, the map of apis
.timeout: optional number, default 1000, the timeout to use for each call
.fName: string, the function name to invoke
cb(err) function

errors are emitted by apierror
*/
function touchApis(opts, cb) {
	if (!opts) opts = {}
	var isError
	// we need our own rqs, because we shut it down
	var id = (apierror.init(true) || apierror.init()).id
	var rqsTouch = rqsm.getRqs(apierror.emitError, id + ' ' + opts.fName, opts.timeout != null ? opts.timeout : defaultTimeout)
	var cbCounter = 1

	// iterate over all known apis
	for (var apiName in opts.apiMap) {
		var fn = opts.apiMap[apiName][opts.fName]
		if (typeof fn == 'function') {
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
		if (!--cbCounter) rqsTouch.shutdown()
		if (!err) {
			if (!cbCounter && !isError) cb()
		} else {
			apierror.emitError.apply(this, Array.prototype.slice.call(arguments))
			if (!isError) {
				isError = true
				cb(err)
			}
		}
	}
}
