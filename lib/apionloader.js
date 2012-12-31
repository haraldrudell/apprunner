// apionloader.js
// load apis with onLoad option
// © Harald Rudell 2012

// allow us to load apis...
require = require('./getrequire').getRequire(require)

var apilist = require('./apilist')

exports.doOnLoads = doOnLoads

function doOnLoads() {
	apilist.getOnLoads().forEach(function (apiName) {
		require(apiName).initApi()
	})
}