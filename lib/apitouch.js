// apitouch.js
// singleton functions touching all loaded apis
// © Harald Rudell 2012

var rqsm = require('./rqs')
// https://github.com/haraldrudell/haraldutil
var haraldutil = require('haraldutil')
// http://nodejs.org/api/path.html
var path = require('path')

exports.apisReady = apisReady
exports.endApi = endApi
exports.endApiInvoked = endApiInvoked
exports.getExport = getExport
exports.setEmitter = setEmitter
exports.testReset = testReset

var apiShutdownTimeout = 1000
var apiReadyTimeout = 3000

/*
facilitate multiple invocations
true: is ready
undefined: not yet invoked
Array: is execuing
*/
var isApisReady

// true: is invopked, no more getApi
var isEndApi

var emitter
var loadedApis

function endApi(cb) {
	var slogan
	if (isEndApi !== true) {
		if (!isEndApi) {
			isEndApi = [cb]
			slogan = getId() + ' ' + arguments.callee.name
			console.time(slogan)
			touchAllApis('endApi', apiShutdownTimeout, end)
		} else isEndApi.push(cb)
	} else { // we are already shut down
		cb()
		finalCall()
	}

	function end(err) {
		console.timeEnd(slogan)
		var cbs = isEndApi
		isEndApi = true
		cbs.forEach(function (cb) {
			cb(err)
		})
		finalCall() // after all callbacks invoked
	}

	function finalCall() {}
}

function apisReady(cb) {
	if (isApisReady !== true && !isEndApi) {
		if (!isApisReady) {
			isApisReady = [cb]
			touchAllApis('apiReady', apiReadyTimeout, end)
		} else isApisReady.push(cb)
	} else cb()

	function end(err) {
		var cbs = isApisReady
		isApisReady = true
		cbs.forEach(function (cb) {
			cb(err)
		})		
	}
}

function getId() {
	return emitter && emitter.id ||
		path.basename(__filename, path.extname(__filename)) + ':' + process.pid
}

function touchAllApis(xport, timeout, cb) {
	var rqs = rqsm.getRqs(error, getId() + ' ' + xport, timeout)
	var isError
	var cbc = haraldutil.getCbCounter({callback: readyResult})

	for (var key in loadedApis) {
		var apiDescriptor = loadedApis[key]
		var fn = getExport(apiDescriptor, xport)
		if (typeof fn == 'function') checkApi(apiDescriptor, fn, cbc.add(readyResult))
	}
	readyResult()

	function checkApi(apiDescriptor, fn, cb) {
		var timer = rqs.addRq(apiDescriptor.apiName)
		fn(checkResult)

		function checkResult(err) {
			rqs.clearRq(timer)
			cb(err)
		}
	}

	function readyResult(err) {
		if (!err) {
			if (!isError && cbc.isDone(arguments.callee)) {
				rqs.shutdown()
				cb()
			}
		} else {
			emitter.emit.apply(this, ['error'].concat(Array.prototype.slice.call(arguments)))
			if (!isError) {
				isError = true
				rqs.shutdown()
				cb(err)
			}
		}
	}

	function error(err) {
		emitter.emit('error', err)
	}
}

function endApiInvoked() {
	return !!isEndApi
}

/*
get a named export
apiDescriptor: object
name: string eg. 'initApi'
*/
function getExport(apiDescriptor, name) {
	var result
	if (apiDescriptor.module) {
		var resultKey = apiDescriptor[name]
		if (resultKey) {
			var exportedValue = apiDescriptor.module[resultKey]
			if (exportedValue) result = exportedValue
		}
	}
	return result
}

function setEmitter(emitter0, apis) {
	emitter = emitter0
	loadedApis = apis	
}
function testReset() {
	isEndApi = undefined
	isApisReady = undefined
}