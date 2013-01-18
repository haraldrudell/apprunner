// getrequire.js
// api services: require, registration, emitter, request timer factory and initApi options filter
// © Harald Rudell 2012 MIT License

var apilist = require('./apilist')
var rqsm = require('./rqs')
var apperror = require('./apperror')
var apierror = require('./apierror')

// http://nodejs.org/api/events.html
var events = require('events')
// https://github.com/haraldrudell/haraldutil
var haraldutil = require('haraldutil')
// http://nodejs.org/api/path.html
var path = require('path')

;[
getRequire, init, getApiData, testIntercept
].forEach(function (f) {exports[f.name] = f})

var apiConfigs = {} // key: api name, value: config object
var apiPath = [{folder: 'lib'}] // array of object: .file, .subPath
var appName
var testMap
var deployFolder
var exportsMap = {} // all modules loaded by apiRequire: key module name, value: exports object
var rqs
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
.ready: positive number: timeout for ready in ms
.ready false: this api does not emit ready
.ready defaults: ready with timeout 3 s
.saveApi: optional function
.endApi: optional function
.apiState: optional function

An emitter will be created if emScope or apiName is non-zero string
A request timer will be provided if rqScope is true or non-zero string
The api will be managed if there is a non-zero api name. emitter and initApi are required
*/
function getRequire(theRequire, theExports, opts) {
	var moduleInternalInitApi
	var apiObject
	var moduleName
	var moduleJsonOpts
	if (!opts) opts = {}

	// obtain replacement require
	if (typeof theRequire != 'function') throw Error(arguments.callee.name + ' invoked with require argument not function, type: ' + typeof theRequire)
	var result = apiRequire

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
		moduleInternalInitApi = opts.initApi
		theExports.initApi = initApiWrapper
		if (typeof opts.apiState == 'function') theExports.apiState = opts.apiState
		theExports = null
	}

	// if api, add it to apiList and monitor ready
	if (apiName) { // to get here, there must be an emitter
		if (!moduleInternalInitApi) throw new Error('InitApi missing for api: ' + apiName)
		var api = apilist.addApi(result.emitter, opts)
		if (typeof api === 'string') throw new Error(api)
		else apiObject = api
	}

	// get possible rqs
	var rqScope = opts.rqScope === true ? apiName : typeof opts.rqScope === 'string' && opts.rqScope
	if (rqScope) {
		var errorCallback = typeof opts.cb == 'function' ? opts.cb : defaultTimerErrorCallback
		var timeoutMs = opts.timeoutMs != null ? opts.timeoutMs : undefined
		// getRqs may throw
		result.rqs = rqsm.getRqs(errorCallback, rqScope, timeoutMs)
	}

	return result

	function apiRequire(moduleName) {
		var result
		var apiConfig = apiConfigs[moduleName]
		var found
		var lastException
		var apiName

		if (testMap && testMap[moduleName]) found = result = testMap[moduleName]

		if (!found && apiConfig) { // check if this api entry has an override location: folder, file, subPath
			if (apiConfig.folder) tryFolder(apiConfig.folder)
			else if (apiConfig.file && !tryRequire(apiConfig.file)) { // override file entries MUST exist
				var e = new Error('Api config for ' + moduleName + ': file module failed to load: ' + apiConfig.file)
				apierror.emitError(e, lastException)
				throw lastException
			}
			if (found) doNamespace(apiConfig.subPath)
		}

		// try node.js require
		if (!found && !tryRequire(moduleName)) {

			// try path
			var nodeJsRequireException = lastException
			if (!apiPath.some(function (pathObject, index) {
				if (pathObject.folder) tryFolder(pathObject.folder)
				else if (pathObject.file &&!tryRequire(pathObject.file)) { // an api.path file entry MUST exist
					var e = new Error('Module in api.path failed to load: #' + index + ': '+ pathObject.file)
					apierror.emitError(e, lastException)
					throw e
				}
				if (found) {
					doNamespace(pathObject.subPath)
					if (found && pathObject.file && pathObject.subPath === undefined)
						if (result[moduleName]) result = result[moduleName]
						else found = false
				}
				return found
			})) throw nodeJsRequireException // this has the module name provided
		}

		exportsMap[moduleName] = result // successful load of module
		return  result

		function tryFolder(folder) {
			return tryRequire(path.join(deployFolder, folder, moduleName))
		}

		function tryRequire(moduleName) {
			try { // node.js require
				result = theRequire(moduleName)
				found = true
			} catch (e) {
				if (e.code !== 'MODULE_NOT_FOUND') throw e // some other trouble than module not found
				if (e.moduleName) throw e // a recursive module not found
				e.moduleName = moduleName
				lastException = e
			}
			return found
		}

		function doNamespace(subPath) {
			if (typeof subPath === 'string') {
				var namespace = result
				String(subPath).split('.').forEach(function (prop) {
					if (namespace) namespace = namespace[prop]
				})
				if (!namespace) {
					found = false
					var lastException = new Error('In api ' + moduleName + ' Cannot find namespace ' + subPath)
					lastException.code = 'MODULE_NOT_FOUND'
				} else result = namespace
			}
		}
	}

	/*
	initApi invoked on an api
	invocationOpts: optional object: options provided in the current initApi invocation

	1. initApiWrapper is the function exported as initApi in the module's export object
	2. exportsMap contains all known export objects
	3. We can therefore get the module name by looking in exportsMap for initApiWrapper
	4. The module name is used to find json options

	- the code invoking the api must use apiRequire
	- the api must provide initApi to getRequire
	*/
	function initApiWrapper(invocationOpts) { // merge in options from json file
		var instanceReadyTimer

		if (!moduleJsonOpts) { // json data for this module not yet identified
			/*
			A module can be loaded under different names
			eg. './module' and '././module'
			find a name that loaded this module and has a json configuration

			*/
			var initApiWrapperWasFound
			moduleJsonOpts
			var moduleName
			for (var aModuleName in exportsMap) {
				var anExports = exportsMap[aModuleName]
				if (anExports && anExports.initApi === initApiWrapper) {
					initApiWrapperWasFound = true
					if (apiConfigs[aModuleName]) {
						moduleJsonOpts = apiConfigs[aModuleName]
						moduleName = aModuleName
						break
					}
				}
			}
			if (!initApiWrapperWasFound) throw new Error('Api not loaded with apprunner: ' + apiObject.api)
			if (!moduleJsonOpts) moduleJsonOpts = {}
		}

		var opts = haraldutil.merge(haraldutil.shallowClone(moduleJsonOpts), invocationOpts)
		var instance = moduleInternalInitApi(opts)
		if (apiObject.instanceReady) {
			if (!rqs) rqs = rqsm.getRqs(function () {}, 'Api Instance Timer')
			instanceReadyTimer = rqs.addRq(apiObject.api)
			instance.once('ready', onReady)
		}
		return instance

		function onReady() {
			instanceReadyTimer.clear()
		}
	}
}

function getApiData() {
	var result = {
		onloads: [], // api names with onLoad attribute
		apiMap: Object.keys(apiConfigs).length,
		apiPath: apiPath.length,
	}
	for (var apiName in apiConfigs)
		if (apiConfigs[apiName].onLoad) result.onloads.push(apiName)
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
	apiConfigs = apiOpts.apiMap || {}
	if (Array.isArray(apiOpts.path)) apiPath = apiOpts.path

	appName = opts.appData.appName
	deployFolder = opts.appData.launchFolder
}

function testIntercept(testOpts) {
	if (testOpts) {
		if (testOpts.testMap !== undefined) testMap = testOpts.testMap
		if (testOpts.exportsMap !== undefined) exportsMap = testOpts.exportsMap || {}
		if (testOpts.apperror !== undefined) apperror.testIntercept(testOpts.apperror)
	}
}

function defaultTimerErrorCallback() {}