// apprunner.js
// manage code in api folder, handle errors
// © Harald Rudell 2012 MIT License

var appdata = require('./appdata')
// http://nodejs.org/api/path.html
var path = require('path')
// http://nodejs.org/api/fs.html
var fs = require('fs')
debugger
var topLevelExport = appsApprunner()
if (topLevelExport) module.exports = topLevelExport
else {
	var anomaly = require('./anomaly')
	var apilist = require('./apilist')
	var apperror = require('./apperror')
	var appinit = require('./appinit')
	var requirem = require('./getrequire')
	var rqs = require('./rqs')
	var serverwrapper = require('./serverwrapper')
	var shutdown = require('./appshutdown')
	// http://nodejs.org/api/path.html
	var path = require('path')

	module.exports = {
		initApp: appinit.initApp,
		getAppData: appdata.getAppData,
		addUriHandler: serverwrapper.addUriHandler,
		addErrorListener: apperror.addErrorListener,
		removeErrorListener: apperror.removeErrorListener,
		shutdown: shutdown.shutdown,
		anomaly: anomaly.anomaly,
		enableAnomalyMail: anomaly.enableAnomalyMail,
		apisReady: apilist.apisReady,
		getRqs: rqs.getRqs,
		getRequire: requirem.getRequire,
		testIntercept: requirem.testIntercept,
	}
}

/*
issue: apprunner may be required from a sub-module that has an apprunner available lower than top level.
This is a problem because running duplicate apprunner modules means they are not sharing state.
Therefore, figure out here if this source file comes from the app's top level apprunner module.
If it does not, return the top level exports object
*/
function appsApprunner() {
	var result
	var launchFolder = appdata.getLaunchFolder()
	var packageJson = path.join(launchFolder, 'package.json')
	var topLevelApprunner = path.join(launchFolder, 'node_modules', 'apprunner')
	var myApprunner = path.join(__dirname, '..')

	var package = {name: 'apprunner'}
	try {
		package = require(packageJson)
	} catch (e) {
		if (e.code !== 'MODULE_NOT_FOUND' ||
			!~e.message.indexOf(packageJson)) throw e
	}
	if (package.name !== 'apprunner')
		if (fs.existsSync(topLevelApprunner)) {
			if (myApprunner !== topLevelApprunner) result = require(topLevelApprunner)
		} else throw new Error('app does not have apprunner in dependencies')

	return result
}
