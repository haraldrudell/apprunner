// apitest.js

exports.initApi = initApi
exports.setApi = setApi

var api

function initApi() {
	api.apply(this, Array.prototype.slice.call(arguments))
}

function setApi(f) {
	api = f
}