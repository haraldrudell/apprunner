// apprunner.js
// manage code in api folder, handle errors
// © Harald Rudell 2012

var anomaly = require('./anomaly')
var apilist = require('./apilist')
var apperror = require('./apperror')
var appinit = require('./appinit')
var shutdown = require('./appshutdown')
var emailer = require('./emailer')
var requirem = require('./getrequire')
var rqs = require('./rqs')
// https://github.com/haraldrudell/haraldutil
var haraldutil = require('haraldutil')

module.exports = haraldutil.merge(
	{
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
	}
)