// getrequire.js
// api services: require, registration, emitter, request timer factory and initApi options filter
// © Harald Rudell 2012 MIT License

var initapiwrapper = require('./initapiwrapper')
var apirequire = require('./apirequire')
var apilist = require('./apilist')
var rqsm = require('./rqs')
var apperror = require('./apperror')
// http://nodejs.org/api/events.html
var events = require('events')
// http://nodejs.org/api/path.html
var path = require('path')

;[
getRequire, init, getApiData, testIntercept
].forEach(function (f) {exports[f.name] = f})

var state = {
	apiConfigs: {}, // key: api name, value: config object
	exportsMap: {}, // all modules loaded by apiRequire: key module name, value: exports object
	apiPath: [{folder: 'lib'}], // array of object: .file, .subPath
	testMap: null,
	deployFolder: '',
}

/*
Provide replacement require for load of api, emitter and request timer
theRequire: function: original require function
theExports: optional object with initApi property: used for intercepting the initApi export
opts: object
.api: optional string: unique api name eg. 'Server Helper'
.emScope if emitter, this emitter will be used. id property will be updated
.emScope if string: scope for emitter
.initApi: optional function: the internal initApi implementation
.rqScope: optional string or boolen, string slogan for request timer, true if using api name
.cb(err): optional function: rqs error callback
.timeoutMs: number ms: default rqs timeout if not 3 seconds
.ready undefined: instance readywith 3 s timeout
.ready: number: singleton ready timeout in ms
.ready false: api does not emit ready
.ready true: api emits both singleton and instance ready, timeout 3 s
.ready null/NaN : singleton ready with timeout 3 s
.saveApi: optional function
.endApi: optional function
.apiState: optional function

An emitter will be created if emScope or apiName is non-zero string
A request timer will be provided if rqScope is true or non-zero string
The api will be managed if there is a non-zero api name. emitter and initApi are required
*/
function getRequire(theRequire, theExports, opts) {
	var didWrap // did wrap initApi
	requireState = {}
	if (!opts) opts = {}

	// obtain replacement require
	if (typeof theRequire != 'function') throw Error(arguments.callee.name + ' invoked with require argument not function, type: ' + typeof theRequire)
	var result = apirequire.getApiRequire(state, theRequire)
	result.dirname = __dirname // absolute path can distinguish between multiple instances

	// find possible api name
	var apiName = typeof opts.api === 'string' && opts.api

	// get emitter
	if (opts.emScope instanceof events.EventEmitter && apiName) {
		result.emitter = opts.emScope
		result.emitter.id = apiName
	} else {
		var emitterId = typeof opts.emScope === 'string' && opts.emScope || apiName
		if (emitterId) {
			result.emitter = new events.EventEmitter
			result.emitter.id = emitterId
		}
	}
	apperror.addErrorListener(result.emitter)

	// wrap initApi
	if (opts.initApi) {
		if  (typeof opts.initApi != 'function') throw Error(arguments.callee.name + ' invoked with opts.initApi not function')
		if (!theExports) throw Error(arguments.callee.name + ' invoked with exports null')
		if  (!apiName) throw Error(arguments.callee.name + ' invoked with opts.initApi but no api name')
		theExports.initApi = initapiwrapper.getWrapper(opts.initApi, state, requireState)
		didWrap = true
		if (typeof opts.apiState == 'function') theExports.apiState = opts.apiState
		theExports = null
	}

	// if api, add it to apiList and monitor ready
	if (apiName) { // to get here, there must be an emitter
		if (!didWrap) throw new Error('InitApi missing for api: ' + apiName)
		var api = apilist.addApi(result.emitter, opts)
		if (typeof api === 'string') throw new Error(api)
		else requireState.apiObject = api
	}

	// get possible rqs
	var rqScope = opts.rqScope === true ? apiName : typeof opts.rqScope === 'string' && opts.rqScope
	if (rqScope) {
		var errorCallback = typeof opts.cb == 'function' ? opts.cb : function () {}
		var timeoutMs = opts.timeoutMs != null ? opts.timeoutMs : undefined
		// getRqs may throw
		result.rqs = rqsm.getRqs(errorCallback, rqScope, timeoutMs)
	}

	return result
}

function getApiData() {
	var result = {
		onloads: [], // api names with onLoad attribute
		apiMap: Object.keys(state.apiConfigs).length,
		apiPath: state.apiPath.length,
	}
	for (var apiName in state.apiConfigs)
		if (state.apiConfigs[apiName].onLoad) result.onloads.push(apiName)
	return result
}

/*
opts: object
appData: appData object to use
apiOpts: optional object, typically default.api

testOpts: otional object
*/
function init(opts) {
	if (!opts || !opts.appData) throw new Error(path.basename(__filename)+ ':' + arguments.callee.name + ': bad opts argument')

	var apiOpts = opts.apiOpts || {}
	state.apiConfigs = apiOpts.apiMap || {}
	if (Array.isArray(apiOpts.path)) state.apiPath = apiOpts.path

	state.deployFolder = opts.appData.launchFolder
}

function testIntercept(testOpts) {
	if (testOpts) {
		if (testOpts.testMap !== undefined) state.testMap = testOpts.testMap
		if (testOpts.exportsMap !== undefined) state.exportsMap = testOpts.exportsMap || {}
		if (testOpts.apperror !== undefined) apperror.testIntercept(testOpts.apperror)
		if (testOpts.useTestConfig != null) init(require('./testconfig').getTestConfig(testOpts.useTestConfig))
	}
}
