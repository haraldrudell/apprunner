// apprunner.js
// manage code in api folder, handle errors
// © Harald Rudell 2012

// https://github.com/haraldrudell/haraldutil
var haraldutil = require('haraldutil')
var anomaly = require('./anomaly')
var apperror = require('./apperror')
var apimanager = require('./apimanager')

module.exports = haraldutil.merge(
	require('./appinit'),
	{
		addErrorListener: apperror.addErrorListener,
		removeErrorListener: apperror.removeErrorListener,
		shutdown: require('./appshutdown').shutdown,
		anomaly: anomaly.anomaly,
		enableAnomalyMail: anomaly.enableAnomalyMail,
		getCbCounter: haraldutil.getCbCounter,
		getApi: apimanager.getApi,
		apisReady: apimanager.apisReady,
	}
)