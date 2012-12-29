// getrequire.js
// provides api lifecycle
// © Harald Rudell 2012

// list of overrides - always intercept these
// list of module locations

var getemitter = require('./getemitter')

// https://github.com/haraldrudell/haraldutil
var haraldutil = require('haraldutil')

exports.getRequire = getRequire
exports.init = init

var apiConfig
var appName

function getRequire(theRequire, theExports, opts) {
	var theInitApi
require('haraldutil').p()
	// obtain replacement require
	if (typeof theRequire != 'function') throw Error(arguments.callee.name + ' invoked with require argument not function')
require('haraldutil').p(theRequire)
	var result = apiRequire

	// get emitter
	result.emitter = getemitter.getEmitter(opts)
	var apiName = result.emitter.id

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
require('haraldutil').p()
		// look for overrides
		// require the default
		// look in path if module not found
		return theRequire(moduleName)
	}

	function initApiWrapper(opts) {
require('haraldutil').p()

		// replace opts, override with apiConfig options
		var config = haraldutil.merge(haraldutil.shallowClone(apiConfig[apiName]), opts)
		var opts = {
			config: config, // configuration for this api
			//registerHandler: registerRoute, // register web routes
			logger: config.noLog ? function () {} : console.log,
			apprunner: require('./apprunner'), // this require needs to be delayed
			appName: appName,
		}

		theInitApi(opts)
	}
}

function init(apiOpts, appName0) {
	if (!apiOpts) apiOpts = {}
	apiConfig = apiOpts.apiMap || {}
	appName = appName0
}