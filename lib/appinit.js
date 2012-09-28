// appinit.js
// Managing apis and handling errors
// © Harald Rudell 2012

var appshutdown = require('./appshutdown')
var apperror = require('./apperror')
var anomaly = require('./anomaly')
var apimanager = require('./apimanager')

exports.initApp = initApp

var slogan = 'App Runner'

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

	// add anomaly reporting
	if (!(defaults.anomaly === false)) {

		// ability to not have email
		if (defaults.anomaly && defaults.anomaly.noEmail) anomaly.enableAnomalyMail(false)

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

	// add api loading capability
	if (!(defaults.api === false)) apimanager.initApi(defaults, app)
}