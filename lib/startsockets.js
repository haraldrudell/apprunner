// startsockets.js
// helper that makes starting websockets a one-liner
// © Harald Rudell 2012

var apimanager = require('./apimanager')

exports.startSockets = startSockets

function startSockets(server, defaults, cb) {
	apimanager.getApi({api: 'websockets'}, websocketsResult)

	function websocketsResult(err, websockets) {
		if (!err) websockets.initSockets(server, defaults)
		cb(err)
	}
}