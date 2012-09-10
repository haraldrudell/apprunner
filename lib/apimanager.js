// apimanager.js
// maps api names to JavaScript implementations
// © Harald Rudell 2012

// http://nodejs.org/api/fs.html
var fs = require('fs')
// http://nodejs.org/api/path.html
var path = require('path')
// http://nodejs.org/api/events.html
var events = require('events')
// https://github.com/haraldrudell/haraldutil
var haraldutil = require('haraldutil')

if (!fs.exists) fs.exists = path.exists

exports.initApi = initApi
exports.getApi = getApi

var apiFolder = './lib/api'
var apiMap = {}
var emitter
var app
var errorListener

/*
initialize api management
defaults: object: configuration information
app0: an express server
errorListener: a function receving events from apis
cb(err)

return value: event emitter for errors

defaults: {
	api: {
		folder: 'path',
		apimap: {
			type: {
				file: 'filename',
				...
*/
function initApi(defaults, app0, errorListener0, cb) {
	if (defaults == null) defaults = {}
	var onLoadList
	if (!defaults.init || !defaults.init.appFolder) throw Error('Must have defaults.init.appFolder')
	if (cb && typeof cb != 'function') throw Error(arguments.callee.name + ' fourth argument must be callback function')
	if (app0 == null || typeof app0.get != 'function') throw Error(arguments.callee.name + ' argument 2 must have app.get function')
	errorListener = errorListener0
	app = app0

	// find api folder
	var api = defaults != null && defaults.api || {}
	if (api.apiMap) {
		apiMap = api.apiMap
		var absolute = path.resolve(defaults.init.appFolder, api.folder || apiFolder)
		fs.exists(absolute, existsResult)
	} else end(Error('defaults api.apimap missing'))

	emitter = new events.EventEmitter()
	emitter.id = 'Api Manager'
	return emitter

	function existsResult(exists) {
		var err
		if (exists) {

			// list apis with 'onLoad: true'
			onLoadList = []
			apiFolder = absolute
			for (var apiName in apiMap)
				if (apiMap[apiName].onLoad)
					onLoadList.push(apiName)
			console.log('Api Manager onLoad apis:', onLoadList.length)
			loadNextApi()
		} else {
			err = Error('Api folder does not exist:\'' + absolute + '\'')
			end(err)
		}
	}

	// load onLoad apis
	function loadNextApi() {
		var api = onLoadList.shift()
		if (api) getApi({apitype: api}, apiLoaded)
		else end()
	}

	function apiLoaded(err) {
		if (!err) loadNextApi()
		else end(err)
	}

	function end(err) {
		var args = Array.prototype.slice.call(arguments)
		if (cb) cb.apply(this, args)
		else if (err) throw err
	}
}

/*
get an api implementation
opts: object
.apitype: string: name of api function to be loaded
cb(err, module)
*/
function getApi(opts, cb) {
	if (opts == null) opts = {}

	// get module path
	var absolute
	var config // configuration object for this api module
	// type is the name of the api configuration, eg. 'fb'
	var apiName = opts.api
	if (apiName) {
		config = haraldutil.merge(haraldutil.shallowClone(apiMap[apiName]), opts)
		absolute = config.file || './' + apiName
		if (absolute[0] == '.') absolute = path.resolve(apiFolder, absolute)

		// load implementation
		var module
		var err
		var loc
		try {
			module = require(absolute)
			var subPath = config.subPath || 'initApi'
			String(subPath).split('.').forEach(function (prop) {
				if (module != null) module = module[prop]
			})
		} catch (e) {
			loc = {location: Error('Loading api \'' + apiName + '\' from \'' + absolute + '\'')}
			err = e
		}
		if (!err) {
			if (typeof module == 'function') {
				var o = {
					config: config, // configuration for this api
					registerHandler: app.get.bind(app), // register web routes
					getApi: getApi, // getting another api
					logger: config.noLog ? function () {} : console.log,
				}
				module(o, end)
			} else end(Error('Module missing initApi export:' + apiName + '\' from \'' + absolute + '\''))
		} else end(err, loc)
	} else end(Error('Unknown api type:\'' + apiName + '\''))

	function end(err, module) {
		var args = Array.prototype.slice.call(arguments)
		prepareApi.apply(this, args)
		if (cb) cb.apply(this, args)
	}
}

function prepareApi(err, module) {
	var args = Array.prototype.slice.call(arguments)
	if (!err) {
		// add apirunner's error listener
		if (module && module.emitter) module.emitter.on('error', errorListener)
	} else emitter.emit.apply(emitter, ['error'].concat(args))
}