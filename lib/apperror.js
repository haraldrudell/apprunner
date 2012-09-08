// apperror.js
// Centralized reporting of errors
// © Harald Rudell 2012

var anomaly = require('./anomaly')

exports.apiError = apiError

function apiError(err) {
/*
	console.log(arguments.callee.name, 'source:', this.id)
	Array.prototype.slice.call(arguments).forEach(function (arg, index) {
		console.log((index + 1) + ': ' + haraldutil.inspectDeep(arg))
	})
*/
	anomaly.anomaly(Array.prototype.slice.call(arguments))
}