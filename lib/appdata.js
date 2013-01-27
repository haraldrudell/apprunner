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
initAppData, getAppData, getLaunchFolder
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

/*
Get a log function that prepends marker
logFn: optional function default appData.log, log function with util.format capability
marker: string: what is prepended to each log invocation

return value: function with properties
.log: the underlying log function
.marker: the marker string
*/
function getLog(logFn, marker) {
	var result = pLog
	result.log = logFn || appData.log
	result.marker = marker

	return result

	function pLog() {
		logFn(marker + ' ' +
			util.format.apply(this, Array.prototype.slice.call(arguments)))
	}
}

/*
Find the app's launch folder
1. require.main.filename
2. One level above if foldername is 'test'
3. Above the first occurence of '/node_modules' (does not work for symlinked modules)
4. current working directory
return value: string absolute path to folder where the initially launched script is located
*/
function getLaunchFolder() {
	var result

	var requireMainFilename = require && require.main && require.main.filename
	if (requireMainFilename) result = path.dirname(requireMainFilename)
	else if (__dirname) {
		var myFolderName = path.basename(__dirname)
		if (myFolderName === 'test') result = path.join(__dirname, '..')
		else {
			var firstNodeModules = __dirname.indexOf('/node_modules/')
			if (~firstNodeModules) result = __dirname.substring(0, firstNodeModules)
		}
	}
	if (!result) result = process.cwd()

	return result
}
