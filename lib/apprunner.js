// apprunner.js
// manage code in api folder, handle errors
// © Harald Rudell 2012

// https://github.com/haraldrudell/haraldutil
var haraldutil = require('haraldutil')
var anomaly = require('./anomaly')
var apperror = require('./apperror')
var apimanagerxx = require('./apimanager-x')
var emailer = require('./emailer')
var apitouchxx = require('./apitouch-x')
var rqs = require('./rqs')

module.exports = haraldutil.merge(
	require('./appinit'), // initApp, getAppName
	{
		addErrorListener: apperror.addErrorListener,
		removeErrorListener: apperror.removeErrorListener,
		shutdown: require('./appshutdown').shutdown,
		anomaly: anomaly.anomaly,
		enableAnomalyMail: anomaly.enableAnomalyMail,
		getApi: apimanagerxx.getApi,
		apisReady: apitouchxx.apisReady,
		rqs: {getRqs: rqs.getRqs, emitter:rqs.emitter},
		emailer: {send: emailer.send, emitter: emailer.emitter},
		addRoutes: apimanagerxx.addRoutes,
		getRequire: require('./getrequire').getRequire,
	}
)