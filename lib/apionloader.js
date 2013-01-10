// apionloader.js
// load apis with onLoad option
// © Harald Rudell 2012

var getrequire = require('./getrequire')

exports.doOnLoads = doOnLoads

function doOnLoads(log) {
	// allow us to load apis...
	require = getrequire.getRequire(require)

	var apiData = getrequire.getApiData()
	var logArgs = ['ApiMap:', apiData.apiMap, 'Paths:', apiData.apiPath]
	if (apiData.onloads.length) logArgs.push('Loading onload apis:', apiData.onloads.join(', '))
	else logArgs.push('onloads:', 0)
	log.apply(this, logArgs)

	apiData.onloads.forEach(function (apiName) {
		require(apiName).initApi()
	})
}