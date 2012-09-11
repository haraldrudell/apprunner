// apitest.js

exports.initApi = initApi
exports.setApi = setApi

var api

function initApi() {
	return api.apply(this, Array.prototype.slice.call(arguments))
}

function setApi(f) {
	api = f
}