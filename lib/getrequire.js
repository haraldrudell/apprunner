// getrequire.js
// provides api lifecycle
// © Harald Rudell 2012

// list of overrides - always intercept these
// list of module locations

var apilist = require('./apilist')
var rqsm = require('./rqs')

// http://nodejs.org/api/events.html
var events = require('events')
// https://github.com/haraldrudell/haraldutil
var haraldutil = require('haraldutil')

exports.getRequire = getRequire
exports.init = init

var apiConfigs = {}
var appName

/*
get a replacement require function that faciliates load of api
theRequire: function: original require function
theExports: optional object with initApi property: used for intercepting the initApi export
opts: object
.api: non-zero string: unique api name
.emScope if emitter, this emitter will be used. id property will be updated
.emScope otherwise: optional string: scope for emitter. Either .api or .emScope must be present to get an emitter. false prevents an emitter
.initApi: optional function: the internal initApi implementation
.rqScope: optional string or boolen, slogan for request timer, true if using api name
.cb(err): optional function: rqs error callback
.timeoutMs: number ms: default rqs timeout if not 3 seconds
*/
function getRequire(theRequire, theExports, opts) {
	var theInitApi
	if (!opts) opts = {}

	// obtain replacement require
	if (typeof theRequire != 'function') throw Error(arguments.callee.name + ' invoked with require argument not function')
	var result = apiRequire

	// find possible api name
	var apiName = typeof opts.api == 'string' && opts.api

	// get emitter
	if (typeof opts.emScope == events.EventEmitter && apiName) {
		result.emitter = opts.emScope
		result.emitter.id = apiName
	} else {
		var emitterId = typeof opts.emScope == 'string' && opts.emScope || apiName
		if (emitterId) {
			result.emitter = new events.EventEmitter
			result.emitter.id = emitterId
		}
	}

	// if api, add it to apiList and monitor ready
	if (apiName) {
		var api = apilist.addApi(result.emitter, opts)
		if (typeof api == 'string') throw new Error(api)
	}

	// get possible rqs
	var rqScope = opts.rqScope || apiName
	if (rqScope) {
		var scopeName = opts.rqScope !== true ? opts.rqScope : apiName
		var errorCallback = typeof opts.cb == 'function' ? opts.cb : defaultError
		var timeoutMs = opts.timeoutMs != null ? opts.timeoutMs : undefined
		// getRqs may throw
		result.rqs = rqsm.getRqs(errorCallback, scopeName, timeoutMs)
	}

	// wrap initApi
	if (opts.initApi) {
		if  (typeof opts.initApi != 'function') throw Error(arguments.callee.name + ' invoked with opts.initApi not function')
		if (!(theExports instanceof Object)) throw Error(arguments.callee.name + ' invoked with exports not object')
		theInitApi = opts.initApi
		theExports.initApi = initApiWrapper
		theExports = null
	}

	return result

	function apiRequire(moduleName) {
		var result
		var apiConfig = apiConfigs[moduleName]
		var found

		// overrides
		if (apiConfig && apiConfig.file && tryRequire(apiConfig.file))
			doNamespace()

		// try node.js require
		if (!found && !tryRequire(moduleName)) {

			// try path
			// TODO
		}

		return  result

		function tryRequire(moduleName) {
			try { // node.js require
				result = theRequire(moduleName)
				found = true
			} catch (e) {
				if (e.code != 'MODULE_NOT_FOUND') throw e
			}
			return found
		}

		function doNamespace() {
			if (typeof apiConfig.subPath == 'string') {
				var namespace = result
				String(apiConfig.subPath).split('.').forEach(function (prop) {
					if (namespace) namespace = namespace[prop]
				})
				if (!namespace) {
					var e = new Error('In api ' + modulename + ' Cannot find namespace ' + apiConfig.subPath)
					e.code = 'MODULE_NOT_FOUND'
					throw e
				}
				result = namespace
			}
		}
	}


	function initApiWrapper(opts) {

		// replace opts, override with apiConfigs options
		var config = haraldutil.merge(haraldutil.shallowClone(apiConfigs[apiName]), opts)
		var opts = {
			config: config, // configuration for this api
			//registerHandler: registerRoute, // register web routes
			logger: config.noLog ? function () {} : console.log,
			apprunner: require('./apprunner'), // this require needs to be delayed
			appName: appName,
		}

		return theInitApi(opts)
	}
}

function init(apiOpts, appName0) {
	if (!apiOpts) apiOpts = {}
	apiConfigs = apiOpts.apiMap || {}
	appName = appName0
}

function defaultError() {}