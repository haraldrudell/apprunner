// socket.js
// sockets for apprunner
// © Harald Rudell 2012

// https://github.com/LearnBoost/socket.io
var socketio = require('socket.io')
// https://github.com/shtylman/node-cookie
var cookiem = require('cookie')
// http://nodejs.org/api/events.html
var events = require('events')

exports.init = init
exports.registerNamespace = registerNamespace

// future...
var emitter
var eControl

var io
var sessionStore
var debugDisconnect /*= {
		'heartbeat timeout': 5, // defaults to 60 seconds
		'heartbeat interval': 1, // defaults to 25 seconds	
}*/

/*
key: namespace
value: object
.isAdded: boolean
.name:
.handler: function
.authHandler: function or string
*/
namespaces = {}

// add Web sockets to the Web server app
function init(app, defaults) {
	emitter = new events.EventEmitter()
	emitter.id = 'Web Socket Api'
	io = socketio.listen(app, debugDisconnect)
	io.set('log level', 0)
	sessionStore = defaults.sessionStore
	initNamespaces()
	console.log('Websockets enabled, nameSpaces:' + Object.keys(namespaces).length)
	return emitter
}

/*
name: string, eg 'mine' will respond to http://localhost/mine
handler: function(socket): invoked on connect
*/
function registerNamespace(name, handler, authHandler) {
	var result
	if (namespaces[name]) {
		reportError(Error('Duplicate Websocket namespace: ' + name))
	} else {
		var o = {
			name: name,
			handler: handler,
			authHandler: authHandler,
			result: {},
		}
		namespaces[name] = o
		result = o.result
		initNamespaces()
	}

	return result
}

function initNamespaces() {
	if (io) {
		for (var namespace in namespaces) {
			var o = namespaces[namespace]
			if (!o.isAdded) {
				var socketNamespace = io.of('/' + o.name)
				if (o.authHandler) {
					if (typeof o.authHandler == 'string') o.authHandler = defaultAuth(o.authHandler)
					socketNamespace.authorization(o.authHandler)
				}
				socketNamespace.on('connection', o.handler)
				o.result.socketNamespace = socketNamespace
				o.isAdded = true
			}
		}
	}
}

function reportError(err) {
	if (emitter && emitter.emit) emitter.emit('error', err)
	if (eControl !== false) throw err
}

function defaultAuth(sessionProperty) {
	return function socketAuth(handshakeData, callback) {

		// get the express session id from provided headers
		var result = false
		if (handshakeData.headers &&
			handshakeData.headers.cookie) {
			// parse the key=value string into an object
			var cookieObject = cookiem.parse(handshakeData.headers.cookie)
			var sessionID = cookieObject && cookieObject['connect.sid']
			if (sessionID && sessionStore) {

				sessionID = sessionID.substring(2, 26)

				// get session object from session store
				sessionStore.get(sessionID, function (err, session) {
				 	if (!err && session) {

				 		// verify the session
				 		result = !!session[sessionProperty]
				 	}
					callback(null, result)
				})
			} else {
				callback(null, result)
			}
		}
	}
}