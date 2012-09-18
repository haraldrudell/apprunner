// apitest.js

var emitter = new (require('events').EventEmitter)
emitter.id = 'Api Test'

exports.emitter = emitter
exports.initApi = initApi
exports.setApi = setApi

var api

function initApi() {
	return api.apply(this, Array.prototype.slice.call(arguments))
}

function setApi(f) {
	api = f
}