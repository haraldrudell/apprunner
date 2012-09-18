// apprunner.js
// manage code in api folder, handle errors
// © Harald Rudell 2012

// https://github.com/haraldrudell/haraldutil
var haraldutil = require('haraldutil')
var anomaly = require('./anomaly')
var apperror = require('./apperror')
var apimanager = require('./apimanager')
var emailer = require('./emailer')
var apitouch = require('./apitouch')
var rqs = require('./rqs')

module.exports = haraldutil.merge(
	require('./appinit'),
	require('./createkey'),	
	{
		addErrorListener: apperror.addErrorListener,
		removeErrorListener: apperror.removeErrorListener,
		shutdown: require('./appshutdown').shutdown,
		anomaly: anomaly.anomaly,
		enableAnomalyMail: anomaly.enableAnomalyMail,
		getCbCounter: haraldutil.getCbCounter,
		getApi: apimanager.getApi,
		apisReady: apitouch.apisReady,
		rqs: {getRqs: rqs.getRqs, emitter:rqs.emitter},
		emailer: {send: emailer.send, emitter: emailer.emitter},
	}
)