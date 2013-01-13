// getrequire.js
// api services: require, registration, emitter, request timer factory and initApi options filter
// © Harald Rudell 2012
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
getRequire, init, getApiData,
].forEach(function (f) {exports[f.name] = f})

var apiConfigs = {} // key: api name, value: config object
var apiPath = [{folder: './lib'}] // array of object: .file, .subPath
var appName
var testMap
var deployFolder
var exportsMap = {} // key api identifier, value exports object
var rqs
/*
Provide replacement require for load of api, emitter and request timer
theRequire: function: original require function
theExports: optional object with initApi property: used for intercepting the initApi export
opts: object
.api: optional string: unique api name
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
	var moduleOpts
	var moduleExports
	var moduleApi
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
		moduleExports = theExports
		theExports.initApi = initApiWrapper
		if (typeof opts.apiState == 'function') theExports.apiState = opts.apiState
		theExports = null
	}

	// if api, add it to apiList and monitor ready
	if (apiName) { // to get here, there must be an emitter
		if (!moduleInternalInitApi) throw new Error('InitApi missing for api: ' + apiName)
		var api = apilist.addApi(result.emitter, opts)
		if (typeof api === 'string') throw new Error(api)
		else moduleApi = api
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

		// overrides: throws if .file load fails or .subPath namespace does not exist
		if (!found && apiConfig && apiConfig.file) {
			if (tryRequire(apiConfig.file)) doNamespace()
			if (!found) throw lastException
		}

		// try node.js require
		if (!found && !tryRequire(moduleName)) {

			// try path
			var nodeJsRequireException = lastException
			if (!apiPath.some(function (pathObject, index) {
				if (pathObject.folder) {
					var theModule = './' + path.relative(__dirname, path.resolve(deployFolder, path.join(pathObject.folder, moduleName)))
					if (tryRequire(theModule) && pathObject.subPath) doNamespace()
				} else if (tryRequire(pathObject.file)) {
					if (pathObject.subPath != null) {
						if (pathObject.subPath) doNamespace()
					} else if (found && result[moduleName]) result = result[moduleName]
					else found = false
				} else { // bad api.path configuration
					var e = new Error('Module in api.path failed to load: #' + index + ': '+ pathObject.file)
					apierror.emitError(e, nodeJsRequireException)
					throw e
				}
				return found
			})) throw nodeJsRequireException // this has the module name provided
		}

		if (apiConfig) exportsMap[moduleName] = result // successful load of api with a config
		return  result

		function tryRequire(moduleName) {
			try { // node.js require
				result = theRequire(moduleName)
				found = true
			} catch (e) {
				if (e.code != 'MODULE_NOT_FOUND') throw e
				lastException = e
			}
			return found
		}

		function doNamespace() {
			if (typeof apiConfig.subPath === 'string') {
				var namespace = result
				String(apiConfig.subPath).split('.').forEach(function (prop) {
					if (namespace) namespace = namespace[prop]
				})
				if (!namespace) {
					found = false
					var lastException = new Error('In api ' + moduleName + ' Cannot find namespace ' + apiConfig.subPath)
					lastException.code = 'MODULE_NOT_FOUND'
				} else result = namespace
			}
		}
	}

	function initApiWrapper(opts) { // merge in options from json file
		var timer
		if (moduleOpts == null) {
			moduleOpts = false
			for (var apiName in exportsMap) {
				var anExports = exportsMap[apiName]
				if (anExports && anExports.initApi == initApiWrapper) {
					moduleOpts = apiConfigs[apiName]
					break
				}
			}
		}
		if (moduleOpts) opts = haraldutil.merge(haraldutil.shallowClone(moduleOpts), opts)
		else if (!opts) opts = {}
		var instance = moduleInternalInitApi(opts)
		if (moduleApi.instanceReady) {
			if (!rqs) rqs = rqsm.getRqs(function () {}, 'Api Instance Timer')
			timer = rqs.addRq(moduleApi.api)
			instance.once('ready', onReady)
		}
		return instance

		function onReady() {
			timer.clear()
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

function init(opts, testMap0, exportsMap0) {
	if (!opts || !opts.appData) throw new Error(path.basename(__filename)+ ':' + arguments.callee.name + ': bad opts argument')

	var apiOpts = opts.apiOpts || {}
	apiConfigs = apiOpts.apiMap || {}
	if (Array.isArray(apiOpts.path)) apiPath = apiOpts.path

	appName = opts.appData.appName
	deployFolder = opts.appData.launchFolder

	if (testMap0 != null) testMap = testMap0
	if (exportsMap0 != null) exportsMap = exportsMap0
}

function defaultTimerErrorCallback() {}