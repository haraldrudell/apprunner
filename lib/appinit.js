// appinit.js
// Managing apis and handling errors
// © Harald Rudell 2012

var appshutdown = require('./appshutdown')
var apperror = require('./apperror')
var anomaly = require('./anomaly')
var apimanager = require('./apimanager')
var getrequire = require('./getrequire')

exports.initApp = initApp

var slogan = 'App Runner'
var msPerDay = 24*60*60*1e3
tzMs = (new Date).getTimezoneOffset() * 60*1e3


/*
defaults: options, typically loaded by haraldops
.init.appFolder: string: the folder of initial script
.init.logger: optional function(string): logging, default console.log
.init.ops.sendMail: optional function(subject, body): Sends mail, default none
.api: optional, indicates that Api Manager should be used
.api.apiMap: api configurations
app: Web server, has .on and .get methods
*/
function initApp(defaults, app) {
	if (!defaults) defaults = {}

	// configure error handling
	Error.stackTraceLimit = Infinity
	appshutdown.init(defaults)
	apperror.addErrorListener(app)
	apperror.addErrorListener(require('./rqs').emitter)
	if (!defaults.noInfoLog) console.log(slogan + ' is listening for errors')

	// get email function
	var sendMail
	if (defaults.init && defaults.init.ops) sendMail = defaults.init.ops.sendMail
	if (sendMail) require('./emailer').setSendMail(sendMail)

	// add anomaly reporting: unless defauls.anomaly explicitly false
	if (!(defaults.anomaly === false)) {

		// ability to not have email
		if (sendMail && // must have sendMail for disable to matter
			defaults.anomaly != null && // must have the parent object
			defaults.anomaly.noEmail != null) { // must have some setting for email
			if (typeof defaults.anomaly.noEmail == 'string') {
				var date = new Date(defaults.anomaly.noEmail).getTime()
				if (isNaN(date)) doMailFlag = true // unparseable date: leave it on
				else {
					var day = Math.floor((date - tzMs) / msPerDay) // day serial server timezone
					day++ // enable mail the day after
					doMailFlag = day * msPerDay + tzMs
				}
			} else doMailFlag = !defaults.anomaly.noEmail // boolean value
			if (doMailFlag !== true) anomaly.enableAnomalyMail(doMailFlag)
		}

		// ability to report errors
		var logger
		if (defaults.init) {
			logger = defaults.init.logger
			if (!defaults.anomaly) defaults.anomaly = {}
			if (!defaults.anomaly.app) defaults.anomaly.app = defaults.init.appName
		}
		if (!sendMail && !defaults.noInfoLog) console.log(slogan + ': Warning: sendmail not available')
		anomaly.initAnomaly(
			defaults.anomaly,
			sendMail,
			logger)
	}

	getrequire.init(defaults.api, defaults.init.appName)

	// add api loading capability
	if (defaults.api !== false) apimanager.initApi(defaults)
}