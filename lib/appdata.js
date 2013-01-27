// appdata.js
// Provide a data collection on the running app
// © Harald Rudell 2013 MIT License <harald@allgoodapps.com>

var emailer = require('./emailer')
var anomaly = require('./anomaly')
var appshutdown = require('./appshutdown')
var serverwrapper = require('./serverwrapper')
// http://nodejs.org/api/path.html
var path = require('path')
// http://nodejs.org/api/util.html
var util = require('util')

var appData = {
	appName: '?', // app name eg. 'Node.js #3'
	appId: '?', //machine-friendly app identifier, eg. 'nodejs3'
	launchFolder: '?', // fully qualified path to the initially launched script
	log: console.log, // default log function
	sendMail: emailer.send, // function(subject, body, cb) sending ops email
	// views
	// defaultsFile
	registerHandler: serverwrapper.registerHandler, // function for registering uris
	anomaly: anomaly.anomaly,
	getLog: getLog,
}

;[
initAppData, getAppData,
].forEach(function (f) {exports[f.name] = f})

function initAppData(jsonData) {
	appData.appName = jsonData.haraldopsAppName || '?'
	appData.appId = jsonData.haraldopsidentifier || 'x'
 	appData.launchFolder = getLaunchFolder()
	appData.log = jsonData.log
	appData.views = jsonData.haraldopsViews || {}
	if (jsonData.haraldopsDefaultsFile) appData.defaultsFile = jsonData.haraldopsDefaultsFile

	return appData
}

function getAppData(appInfo) {
	if (appInfo) appshutdown.init({appInfo: appInfo})
	var result = {}
	for (var p in appData) result[p] = appData[p]
	return result
}

function getLog(logFn, prepend) {
	var result = pLog
	result.log = logFn
	return result

	function pLog() {
		logFn(prepend + ' ' +
			util.format.apply(this, Array.prototype.slice.call(arguments)))
	}
}


// return value: string path where the initially launched script is located
function getLaunchFolder() {
	var folder = require && require.main && require.main.filename
	if (folder) folder = path.dirname(folder)
	else {
		var dir = __dirname && __dirname.length > 1 ? __dirname : process.cwd()
		var pos = dir.indexOf('/node_modules/')
		folder = ~pos ? dir.substring(0, pos) : dir
	}
	return folder
}
