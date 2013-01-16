// apprunner.js
// manage code in api folder, handle errors
// © Harald Rudell 2012 MIT License

var anomaly = require('./anomaly')
var apilist = require('./apilist')
var apperror = require('./apperror')
var appinit = require('./appinit')
var requirem = require('./getrequire')
var rqs = require('./rqs')
var shutdown = require('./appshutdown')

module.exports = {
	initApp: appinit.initApp,
	getAppData: appinit.getAppData,
	addUriHandler: appinit.addUriHandler,
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