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

if (!fs.existsSync) fs.existsSync = path.existsSync

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
function initApi(defaults, app0, errorListener0) {
	if (!defaults.init || !defaults.init.appFolder) throw Error('Must have defaults.init.appFolder')
	if (typeof app0.get != 'function') throw Error(arguments.callee.name + ' argument 2 must have app.get function')
	if (typeof errorListener0 != 'function') throw Error(arguments.callee.name + ' argument 3 must be function')
	errorListener = errorListener0
	app = app0

	// set up out error emitter
	emitter = new events.EventEmitter()
	emitter.id = 'Api Manager'

	// find api folder
	var api = defaults.api || {}
	if (api.apiMap) apiMap = api.apiMap
	var absolute = path.resolve(defaults.init.appFolder, api.folder || apiFolder)
	if (fs.existsSync(absolute)) {
		apiFolder = absolute

		// find onLoad apis
		var onLoadList = []
		for (var apiName in apiMap)
			if (apiMap[apiName].onLoad)
				onLoadList.push(apiName)
		console.log('Api Manager onLoad apis:', onLoadList.length)

		// load onLoad apis
		onLoadList.forEach(function (api) {
			getApi({api: api})
		})
	}

	return emitter
}

/*
get an api implementation
opts: object
.api: string: name of api function to be loaded
cb(err, module)
*/
function getApi(opts, cb) {
	var err
	var result
	var loc
	if (opts == null) opts = {}

	// opts.api is the name of the api configuration, eg. 'fb'
	var apiName = opts.api
	if (apiName) {

		// get require argument
		var absolute
		var config = haraldutil.merge(haraldutil.shallowClone(apiMap[apiName]), opts)
		absolute = config.file || './' + apiName
		if (absolute[0] == '.') absolute = path.resolve(apiFolder, absolute)

		// load implementing module
		var module
		try {
			module = require(absolute)
		} catch (e) {
			loc = {location: Error('Loading api \'' + apiName + '\' from \'' + absolute + '\'')}
			err = e
		}
		if (!err) {

			// find initApi function
			var fn = module
			var subPath = config.subPath || 'initApi'
			String(subPath).split('.').forEach(function (prop) {
				if (fn != null) fn = fn[prop]
			})
			if (typeof fn == 'function') {

				// invoke initApi
				var o = {
					config: config, // configuration for this api
					registerHandler: app.get.bind(app), // register web routes
					getApi: getApi, // getting another api
					logger: config.noLog ? function () {} : console.log,
				}
				result = fn(o)
				if (result && result.emitter instanceof events.EventEmitter) {
					if (!~result.emitter.listeners('error').indexOf(errorListener))
						result.emitter.on('error', errorListener)
				}
			} else err = Error('Module missing initApi export: \'' + apiName + '\' from \'' + absolute + '\'')
		}
	} else err = Error('Unknown api type:\'' + apiName + '\'')

	if (err) {
		emitter.emit('error', err, loc)
		throw err
	}

	return result
}