// apimanager.js
// maps api names to JavaScript implementations
// © Harald Rudell 2012

var apitouch = require('./apitouch')
var apperror = require('./apperror')
var rqsm = require('./rqs')
// http://nodejs.org/api/fs.html
var fs = require('fs')
// http://nodejs.org/api/path.html
var path = require('path')
// https://github.com/haraldrudell/haraldutil
var haraldutil = require('haraldutil')
// http://nodejs.org/api/events.html
var events = require('events')

if (!fs.existsSync) fs.existsSync = path.existsSync

exports.initApi = initApi
exports.getApi = getApi
exports.testReset = testReset
exports.addRoutes = addRoutes
exports.loadOnLoad = loadOnLoad

var defaultFolder = 'lib'
var appObject
var routeList = []
var onLoadList = []

var emitter = new (events.EventEmitter)
emitter.id = 'Api Manager'
apperror.addErrorListener(emitter)

var apiFolder = defaultFolder
var apiMap = {}
var appGet = defaultGetHandler
var appName

var loadedApis = {}
var rqs = rqsm.getRqs(reportError, emitter.id + ' initApi')
/*
initialize api management
defaults: object: configuration information
app: optional object: an express server
errorListener: a function receving events from apis

return value: event emitter for errors

defaults: {
	api: {
		folder: 'path',
		apiMap: {
			type: {
				file: 'filename',
				...
*/
function initApi(defaults, logger) {
	if (!defaults.init || !defaults.init.appFolder) throw Error('Must have defaults.init.appFolder')
	appName = defaults.init && defaults.init.appName || 'unknown'

	apitouch.setEmitter(emitter, loadedApis)

	// find api folder
	var api = defaults.api || {}
	if (api.apiMap) apiMap = api.apiMap
	var absolute = path.resolve(defaults.init.appFolder, api.folder || defaultFolder)
	if (fs.existsSync(absolute)) {
		apiFolder = absolute

		// find onLoad apis
		for (var apiName in apiMap)
			if (apiMap[apiName].onLoad)
				onLoadList.push(apiName)

		if (!logger) logger = console.log
		if (!defaults.noInfoLog) logger(emitter.id,
			'onLoad apis:', onLoadList.length,
			'apiMap entries:', Object.keys(apiMap).length,
			'apiFolder:', apiFolder)
	}
}

/*
get an api implementation
opts: object
.api: string: name of api function to be loaded
*/
function getApi(opts) {
	if (apitouch.endApiInvoked()) reportError(new Error('getApi invoked after endApi'))
	if (!opts) opts = {}
	var apiDescriptor = {}
	var config
	var err
	var loc

	// opts.api is the name of the api configuration, eg. 'fb'
	if (apiDescriptor.apiName = opts.api) {

		// ifConfigured only loads if apiMap has the api
		if (!opts.ifConfigured || apiMap[apiDescriptor.apiName]) {

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
			} else {
				apiDescriptor = loadedApis[key]
				invokeInitApi()
			}
		}

	} else err = new Error('opts.api not provided')

	if (err) reportError(err, loc)

	return apiDescriptor.result || apiDescriptor.module

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
			if (namespace) { // we found the api object
				apiDescriptor.module = namespace
				checkModule(namespace)
				invokeInitApi()
				if (!err) apperror.addErrorListener(namespace.emitter)
			} else err = new Error('Module namespace missing, api: \'' + apiDescriptor.apiName + '\' module \'' + apiDescriptor.absolute + (apiDescriptor.subPath ? '\' namespace: \'' + apiDescriptor.subPath + '\'' : '\''))
		}
	}

	function checkModule() {
		var emitter = apitouch.getExport(apiDescriptor, 'emitter')
		if (!(emitter instanceof events.EventEmitter) ||
			!(emitter.id)) err = new Error('Api does not have named emitter: ' + apiDescriptor.apiName + ' export: \'' + apiDescriptor.emitter + '\'')

		Array('initApi', 'endApi', 'apiReady').forEach(function (xport) {
			var fn = apitouch.getExport(apiDescriptor, xport)
			if (fn && typeof fn != 'function') reportError(new Error('Api \'' +  + apiDescriptor.apiName + '\' export not function:' + xport))
		})
	}

	function invokeInitApi() {
		// if initApp is function, invoke
		var fn = apitouch.getExport(apiDescriptor, 'initApi')
		if (typeof fn == 'function') {
			var opts = {
				config: config, // configuration for this api
				registerHandler: registerRoute, // register web routes
				logger: config.noLog ? function () {} : console.log,
				apprunner: require('./apprunner'), // this require needs to be delayed
				appName: appName,
			}
			var rq = rqs.addRq(apiDescriptor.apiName + ' initApi')
			try {
				var value = fn(opts)
				if (value) apiDescriptor.result = value
			} catch (e) {
				loc = {location: Error('Invoking initApi \'' + apiDescriptor.apiName + '\' from \'' + apiDescriptor.absolute + '\'')}
				err = e
			}
			rq.clear()
		}
	}
}

function makeKey(apiDescriptor) {
	return '(' + apiDescriptor.absolute + ')(' + apiDescriptor.subPath + ')(' + apiDescriptor.initApi + ')'
}

function defaultGetHandler() {
	emitter.emit('error', 'Api invoked registerHandler but no express server was provided')
}

function reportError(err) {
	emitter.emit.apply(this, ['error'].concat(Array.prototype.slice.call(arguments)))
	// here we throw errors occuring during getApi
	throw err
}

function testReset() {
	apiFolder = defaultFolder
	apiMap = {}
	appGet = defaultGetHandler
	for (var p in loadedApis) delete loadedApis[p]
	apitouch.testReset()
}

function registerRoute(route, handler) {
	if (appObject) appObject.get(route, handler)
	else routeList.push({route: route, handler: handler})
}

function addRoutes(appObject0) {
	if (appObject = appObject0)
		while (routeObject = routeList.shift())
			registerRoute(routeObject.route, routeObject.handler)
}

function loadOnLoad() {
	var apis = onLoadList
	onLoadList = []

	// load onLoad apis
	apis.forEach(function (api) {
		getApi({api: api})
	})
}