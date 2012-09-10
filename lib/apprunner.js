// apprunner.js
// manage code in api folder, handle errors
// © Harald Rudell 2012

// https://github.com/haraldrudell/haraldutil
var haraldutil = require('haraldutil')

module.exports = haraldutil.merge(
	require('./appinit'),
	require('./anomaly'),
	{
		getCbCounter: haraldutil.getCbCounter,
		getApi: require('./apimanager').getApi,
	}
)