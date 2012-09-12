// apimanager.js
// maps api names to JavaScript implementations
// © Harald Rudell 2012

var apperror = require('./apperror')
// http://nodejs.org/api/fs.html
var fs = require('fs')
// http://nodejs.org/api/path.html
var path = require('path')
// http://nodejs.org/api/events.html
var events = require('events')
// https://github.com/haraldrudell/haraldutil
var haraldutil = require('haraldutil')

if (!fs.existsSync) fs.existsSync = path.existsSync

exports.initApi = initApi
exports.getApi = getApi
exports.apisReady = apisReady
exports.endApi = endApi
exports.testReset = testReset

var defaultFolder = 'lib'

var emitter = new events.EventEmitter()
emitter.id = 'Api Manager'
apperror.addErrorListener(emitter)

var apiFolder = defaultFolder
var apiMap = {}
var appGet = defaultGetHandler
var isEndApi
var isApisReady
/*
initialize api management
defaults: object: configuration information
app: optional object: an express server
errorListener: a function receving events from apis

return value: event emitter for errors

defaults: {
	api: {
		folder: 'path',
		apimap: {
			type: {
				file: 'filename',
				...
*/
function initApi(defaults, app) {
	if (!defaults.init || !defaults.init.appFolder) throw Error('Must have defaults.init.appFolder')
	if (app && typeof app.get == 'function') appGet = app.get.bind(app)

	// find api folder
	var api = defaults.api || {}
	if (api.apiMap) apiMap = api.apiMap
	var absolute = path.resolve(defaults.init.appFolder, api.folder || defaultFolder)
	if (fs.existsSync(absolute)) {
		apiFolder = absolute

		// find onLoad apis
		var onLoadList = []
		for (var apiName in apiMap)
			if (apiMap[apiName].onLoad)
				onLoadList.push(apiName)
		console.log(emitter.id + ' onLoad apis:', onLoadList.length)

		// load onLoad apis
		onLoadList.forEach(function (api) {
			getApi({api: api})
		})
	}
}

/*
get an api implementation
opts: object
.api: string: name of api function to be loaded
cb(err, module)
*/
var loadedApis = {}
function getApi(opts, cb) {
	if (isEndApi) reportError(new Error('getApi invoked after endApi'))
	if (!opts) opts = {}
	var apiDescriptor = {}
	var config
	var err
	var loc

	// opts.api is the name of the api configuration, eg. 'fb'
	if (apiDescriptor.apiName = opts.api) {

		// get api key
		var key
		config = haraldutil.merge(haraldutil.shallowClone(apiMap[apiDescriptor.apiName]), opts)
		apiDescriptor.absolute = String(config.file || './' + apiDescriptor.apiName)
		if (apiDescriptor.absolute[0] == '.') apiDescriptor.absolute = path.resolve(apiFolder, apiDescriptor.absolute)
		// get subpath in module
		apiDescriptor.subPath = String(config.subPath || '')
		// get export names
		apiDescriptor.initApi = String(config.initApi || 'initApi')
		apiDescriptor.endApi = String(config.endApi || 'endApi')
		apiDescriptor.apiReady = String(config.apiReady || 'apiReady')
		apiDescriptor.emitter = String(config.emitter || 'emitter')
		key = makeKey(apiDescriptor)

		if (!loadedApis[key]) {
			loadApi()
			if (!err) loadedApis[key] = apiDescriptor
		} else apiDescriptor = loadedApis[key].result

	} else err = new Error('opts.api not provided')

	if (err) reportError(err, loc)

	return apiDescriptor.result

	function loadApi() {

		// load implementing module
		var module
		try {
			module = require(apiDescriptor.absolute)
		} catch (e) {
			loc = {location: Error('Loading api \'' + apiDescriptor.apiName + '\' from \'' + apiDescriptor.absolute + '\'')}
			err = e
		}
		if (!err) {

			// resolve subpath
			var namespace = module
			if (apiDescriptor.subPath) {
				String(apiDescriptor.subPath).split('.').forEach(function (prop) {
					if (namespace != null) namespace = namespace[prop]
				})
			}
			if (namespace) {
				apiDescriptor.result = namespace

				// if initApp is function, invoke
				var initApp = getExport(apiDescriptor, 'initApi')
				if (typeof initApp == 'function') {
					var o = {
						config: config, // configuration for this api
						registerHandler: appGet, // register web routes
						getApi: getApi, // getting another api
						logger: config.noLog ? function () {} : console.log,
					}
					try {
						var value =  initApp(o)
						if (value) apiDescriptor.result = value
					} catch (e) {
						loc = {location: Error('Invoking initApi \'' + apiDescriptor.apiName + '\' from \'' + apiDescriptor.absolute + '\'')}
						err = e
					}
				}				
				if (!err) apperror.addErrorListener(getExport(apiDescriptor, 'emitter'))
			} else err = new Error('Module namespace missing, api: \'' + apiDescriptor.apiName + '\' module \'' + apiDescriptor.absolute + (apiDescriptor.subPath ? '\' namespace: \'' + apiDescriptor.subPath + '\'' : '\''))
		}
	}
}

function getExport(apiDescriptor, name) {
	var result
	if (apiDescriptor.result) {
		var resultKey = apiDescriptor[name]
		if (resultKey) {
			var exportedValue = apiDescriptor.result[resultKey]
			if (exportedValue) result = exportedValue
		}
	}
	return result
}

function makeKey(apiDescriptor) {
	return '(' + apiDescriptor.absolute + ')(' + apiDescriptor.subPath + ')(' + apiDescriptor.initApi + ')'
}

function defaultGetHandler() {
	emitter.emit('error', 'Api invoked registerHandler but no express server was provided')
}

function reportError(err) {
	emitter.emit.apply(this, ['error'].concat(Array.prototype.slice.call(arguments)))
	throw err
}

function endApi(cb) {
	if (isEndApi !== true) {
		if (!isEndApi) {
			isEndApi = [cb]
			touchAllApis('endApi', end)
		} else isEndApi.push(cb)
	} else cb()

	function end(err) {
		var cbs = isEndApi
		isEndApi = true
		cbs.forEach(function (cb) {
			cb(err)
		})
	}
}

function apisReady(cb) {
	if (isApisReady !== true && !isEndApi) {
		if (!isApisReady) {
			isApisReady = [cb]
			touchAllApis('apiReady', end)
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

function touchAllApis(xport, cb) {
	var isError
	var cbc = haraldutil.getCbCounter({callback: readyResult})

	for (var key in loadedApis) {
		var apiDescriptor = loadedApis[key]
		var fn = getExport(apiDescriptor, xport)
		if (typeof fn == 'function') checkApi(apiDescriptor, fn, cbc.add(readyResult))
	}
	readyResult()

	function checkApi(apiDescriptor, fn, cb) {
	// TODO timer
		fn(checkResult)

		function checkResult(err) {
			cb(err)
		}
	}

	function readyResult(err) {
		if (!err) {
			if (!isError && cbc.isDone(arguments.callee)) cb()
		} else {
			emitter.emit.apply(this, ['error'].concat(Array.prototype.slice.call(arguments)))
			if (!isError) {
				isError = true
				cb(err)
			}
		}
	}
}

function testReset() {
	apiFolder = defaultFolder
	apiMap = {}
	appGet = defaultGetHandler
	isEndApi = undefined
	isApisReady = undefined
	loadedApis = {}
}