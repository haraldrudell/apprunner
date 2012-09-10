// apinull.js
// test api manager onLoad
// © Harald Rudell 2012

exports.initApi = initApi
exports.setInitApi = setInitApi

var anInitApi

function initApi() {
	if (!anInitApi) throw new Error('apinull: setInitApi was not invoked')
	else anInitApi.apply(this, Array.prototype.slice.call(arguments))
}

function setInitApi(f) {
	anInitApi = f
}