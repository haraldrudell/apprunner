// apprunner.js
// manage code in api folder, handle errors
// © Harald Rudell 2012

// https://github.com/haraldrudell/haraldutil
var haraldutil = require('haraldutil')
var anomaly = require('./anomaly')

module.exports = haraldutil.merge(
	require('./appinit'),
	require('./startsockets'),
	{
		anomaly: anomaly.anomaly,
		enableAnomalyMail: anomaly.enableAnomalyMail,
		getCbCounter: haraldutil.getCbCounter,
		getApi: require('./apimanager').getApi,
	}
)