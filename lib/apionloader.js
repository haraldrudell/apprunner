// apionloader.js
// load apis with onLoad option
// © Harald Rudell 2012

// allow us to load apis...
require = require('./getrequire').getRequire(require)

var getrequire = require('./getrequire')

exports.doOnLoads = doOnLoads

function doOnLoads() {
	getrequire.getOnLoads().forEach(function (apiName) {
		require(apiName).initApi()
	})
}