// test-appinit.js
// © Harald Rudell 2012

var appinit = require('../lib/appinit')

var appshutdown = require('../lib/appshutdown')
var apperror = require('../lib/apperror')
var anomaly = require('../lib/anomaly')
var getrequire = require('../lib/getrequire')
var apionloader = require('../lib/apionloader')
var emailer = require('../lib/emailer')
// http://nodejs.org/api/events.html
var events = require('events')
// http://nodejs.org/api/path.html
var path = require('path')

// https://github.com/haraldrudell/mochawrapper
var assert = require('mochawrapper')

var _log = console.log
var _asi = appshutdown.init
var ae = apperror.addErrorListener
var _ai = anomaly.initAnomaly
var gi = getrequire.init
var dd = apionloader.doOnLoads
var sm = emailer.setSendMail
var ea = anomaly.enableAnomalyMail
var ee = appinit.testEmitter

exports['AppInit:'] = {
	'Exports': function () {
		assert.exportsTest(appinit, 4)
	},
	'InitApp': function () {
		var defaults = {
			noInfoLog: true,
			anomaly: false,
			api: false,
		}
		var appShutdownInits = 0
		appshutdown.init = function mockAppShutdownInit() {appShutdownInits++}

		var aAddErrorListener = 0
		apperror.addErrorListener = function mockAddErrorListener(o) {aAddErrorListener++}

		var aInit = 0
		getrequire.init = function mockInit() {aInit++}

		var aDoOnLoads = 0
		apionloader.doOnLoads = function mockDoOnLoads() {aDoOnLoads++}

		appinit.initApp(defaults)

		assert.equal(appShutdownInits, 1)
		assert.equal(aAddErrorListener, 2)
		assert.equal(aInit, 1)
		assert.equal(aDoOnLoads, 1)
	},
	'InitApp InitAnomaly App': function () {
		var defaults = {
			anomaly: {
				noEmail: '1/1/2013',
				app: 'expressObject',
			},
			init: {
				logger: 3,
				ops: {
					sendMail: mockSendMail,
				},
				appName: 'APPNAME',
				identifier: 'APPIDENTIFIER'
			},
		}

		var aAddErrorListener = []
		var eAddErrorListener = ['emitter', appinit.testEmitter()]
		apperror.addErrorListener = function mockAddErrorListener(o) {aAddErrorListener.push(o)}

		appshutdown.init = function mockAppShutdownInit() {}
		getrequire.init = function mockInit() {}
		apionloader.doOnLoads = function mockDoOnLoads() {}

		function mockSendMail(s, b) {}
		emailer.setSendMail = function mockSetSendMail(x) {assert.equal(x, mockSendMail)}

		var aEnableAnomalyMail = []
		var tzMs = (new Date).getTimezoneOffset() * 60*1e3
		var msPerDay = 24*60*60*1e3
		var dayTimeval = (Math.floor((new Date(defaults.anomaly.noEmail).getTime() - tzMs) / msPerDay) + 1) * msPerDay + tzMs
		var eEnableAnomalyMail = [dayTimeval]
		anomaly.enableAnomalyMail = function mockEnableAnomalyMail(x) {aEnableAnomalyMail.push(x)}

		var aInitAnomaly = []
		var eInitAnomaly = [[defaults.anomaly, emailer.send, defaults.init.logger]]
		anomaly.initAnomaly = function mockInitAnomaly(d, s, l) {aInitAnomaly.push([d, s, l])}

		console.log = function () {} // I want to test the console.log statements, too
		appinit.initApp(defaults)
		console.log = _log

		assert.ok((eAddErrorListener[0] = aAddErrorListener[0]) instanceof events.EventEmitter)
		assert.deepEqual(aAddErrorListener, eAddErrorListener)
		assert.deepEqual(aEnableAnomalyMail, eEnableAnomalyMail)
		assert.deepEqual(aInitAnomaly, eInitAnomaly)
	},
	'GetAppData': function () {
		var defaults = {
			noInfoLog: true,
			anomaly: false,
			api: false,
			init: {
				logger: 3,
				ops: {
					sendMail: mockSendMail,
				},
				appName: 'APPNAME',
				identifier: 'APPIDENTIFIER',
			},
		}

		function mockSendMail(s, b) {}

		appshutdown.init = function mockAppShutdownInit() {}
		apperror.addErrorListener = function mockAddErrorListener() {}
		getrequire.init = function mockInit() {}
		apionloader.doOnLoads = function mockDoOnLoads() {}
		emailer.setSendMail = function mockSetSendMail() {}

		appinit.initApp(defaults)

		var expected = {
			sendMail: defaults.init.ops.sendMail,
			logger: defaults.init.logger,
			appName: defaults.init.appName,
			launchFolder: getLaunchFolder(),
			appId: defaults.init.identifier,
			registerHandler: 'f',
			views: undefined,
		}
		var actual = appinit.getAppData()

		assert.equal(typeof (expected.sendMail = actual && actual.sendMail), 'function')
		assert.equal(typeof (expected.registerHandler = actual && actual.registerHandler), 'function')
		assert.deepEqual(actual, expected)

		function getLaunchFolder() {
			var folder = require && require.main && require.main.filename
			if (folder) folder = path.dirname(folder)
			else {
				var dir = __dirname && __dirname.length > 1 ? __dirname : process.cwd()
				var pos = dir.indexOf('/node_modules/')
				folder = ~pos ? dir.substring(0, pos) : dir
			}
			return folder
		}
	},
	'AddUriHandler': function () {
		var uris = [
			{uri: '/0', handler: function () {}},
			{uri: '/1', handler: function () {}},
		]
		var aEmits = []
		appinit.testEmitter({emit: function (e, a) {aEmits.push(a)}})

		// register before a uri handler exists
		var appData = appinit.getAppData()
		appData.registerHandler(uris[0].uri, uris[0].handler)

		assert.deepEqual(aEmits, [])

		// bad uri
		appData.registerHandler(1, function () {})
		assert.equal(aEmits.length, 1)

		// bad handler
		appData.registerHandler('/9', 1)
		assert.equal(aEmits.length, 2)

		// register uri handler
		aEmits = []
		var aAddRoute = []
		var eAddRoute = [[uris[0].uri, uris[0].handler]]
		function addRoute(u, f) {aAddRoute.push([u, f])}
		appinit.addUriHandler(addRoute)

		assert.deepEqual(aAddRoute, eAddRoute)

		// register subsequent uri
		appData.registerHandler(uris[1].uri, uris[1].handler)
		eAddRoute.push([uris[1].uri, uris[1].handler])

		assert.deepEqual(aAddRoute, eAddRoute)
		assert.equal(aEmits.length, 0)
	},
	'after': function () {
		console.log = _log
		appshutdown.init = _asi
		apperror.addErrorListener = ae
		anomaly.initAnomaly = _ai
		getrequire.init = gi
		apionloader.doOnLoads = dd
		emailer.setSendMail = sm
		anomaly.enableAnomalyMail = ea
		appinit.testEmitter(ee)
	}
}