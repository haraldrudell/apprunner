// test-startsockets.js
// © Harald Rudell 2012

var apimanager = require('../lib/apimanager')
var startsockets = require('../lib/startsockets')
// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

_ga = apimanager.getApi

exports['Start Sockets:'] = {
	'Invocation': function (done) {
		var module = {
			initSockets: mockInitSockets,
		}
		var defaults1 = 5
		var server1 = 3
		var mockInitSocket = 0
		var mockGetApis = 0

		apimanager.getApi = mockGetApi

		startsockets.startSockets(server1, defaults1, socketResult)

		function socketResult(err) {
			if (err) assert.equal(err, false)
			assert.equal(mockInitSocket,1)
			assert.equal(mockGetApis,1)

			done()
		}

		function mockInitSockets(server, defaults) {
			mockInitSocket++
			assert.equal(server, server1)
			assert.equal(defaults, defaults1)
		}
		function mockGetApi(opts, cb) {
			mockGetApis++
			assert.deepEqual(opts, {api: 'websockets'})
			cb(null, module)
		}
	},
	'after': function () {
		 apimanager.getApi = _ga
	},
}