// greatrequire.js
// provides api lifecycle
// © Harald Rudell 2012

// http://nodejs.org/api/events.html
var events = require('events')

// list of overrides - always intercept these
// list of module locations

exports.greatRequire = greatRequire
exports.testReset = testReset

var loadedApis = {}

function greatRequire(theRequire, theEmitter, theExports) {

	// check the module for being an api
	if (typeof theRequire != 'function') throw Error('appruner.i invoked with first argument not function')
	if (!(theEmitter instanceof events.EventEmitter)) throw Error('apprunner.i invoked with second argument not EventEmitter')
	if (typeof theEmitter.id != 'string' || !theEmitter.id) throw Error('apprunner.i invoked with second argument emitter missing id non-zero string property')
	if  (!theExports || typeof theExports.initApi != 'function')  throw Error('apprunner.i invoked with third argument exports not having initApi function property')
	if (loadedApis[theEmitter.id]) throw Error('Duplicate api: ' + theEmitter.id)

	var instance = loadedApis[theEmitter.id] = {
		api: theEmitter.id,
		emitter: theEmitter,
		exports: theExports,
		initApi: theExports.initApi,
	}

	return requireIntercept

	// intercept initApi
	//return myRequire

	function requireIntercept(module) {

	}
}
function testReset() {
	var x = loadedApis
	loadedApis = {}
	return x
}