// apprunner.js
// manage code in api folder, handle errors
// © Harald Rudell 2012

var apimanager = require('./apimanager')
var applego = require('applego')
// https://github.com/haraldrudell/haraldutil
var haraldutil = require('haraldutil')

exports.initApp = initApp
exports.startWebsocket = startWebsocket
exports.getCbCounter = haraldutil.getCbCounter

var doWebSockets

function initApp(defaults, app, cb) {
	if (defaults == null) defaults = {}
	if (cb && typeof cb != 'function') throw Error(arguments.callee.name + ' third argument must be callback function')
	doWebsockets = defaults.websockets
	app.on('error', apiError)
	applego.init(app, defaults)
	if (defaults.api) apimanager.initApi(defaults, app, apiError, cb)
	else cb()
}

function apiError(err) {
/*
	console.log(arguments.callee.name, 'source:', this.id)
	Array.prototype.slice.call(arguments).forEach(function (arg, index) {
		console.log((index + 1) + ': ' + haraldutil.inspectDeep(arg))
	})
*/
	applego.anomaly(Array.prototype.slice.call(arguments))
}

function startWebsocket(server) {
	server.on('error', apiError)
	return doWebsockets ?
		applego.initSockets(server) :
		false
}