# App Runner

App Runner manages app lifecycle

## Benefits

* Flexible module loading provide choice of implementation with no code change
* Api lifecycle allows module spin-up/shutdown and settings from file data.
* Easier troubleshooting with emailed anomaly reports
* Orderly shutdown on exception and signal avoids data loss

## Features

1. Self-contained email forwarding and anomaly detection/reporting
2. require replacement
3. api module support with api names, error emiters, request timers, across-api function, settings mix-in and ready watchers
4. Separation between web server implementation and app code
5. Configurable handlers for SIGINT SIGURS2, uncaught exception

# Function Reference

## initApp(defaults)
Initialize apprunner
```js
require('apprunner').initApp(require('haraldops').init({
	appName: 'Node God',
	api: {
		apiMap: {
			nodegodweb: {
				onLoad: true,
				sessionSecret: 'veryGreat',
				PORT: 1111,
			}
		}
	}
}))
```
* defaults: options, typically loaded by haraldops

	* .init.noInfoLog: boolean: no logging by appInit
	* .anomaly: object for anomalysettings of false for disable

## getAppData(appInfo)
Retrieve key app data
```js
console.log(require('apprunner').getAppData())
```
```
{
	appName: 'Cloud Clearing',
	appId: 'cloudclearing',
	launchFolder: '/home/foxyboy/Desktop/c505/node/cloudclearing',
	sendMail: [Function: send],
	logger: [Function],
	registerHandler: [Function: registerHandler],
	views: { dbview: { db: [Object] } },
	defaultsFile: '/home/foxyboy/apps/cloudclearing.json'
}
```
* appInfo: optional object PORT:numer, URL: string
Forwarded on signal to [Node God](https://github.com/haraldrudell/nodegod)

## getRequire(require, exports, opts)

Provides a require with a flexible search for modules
```
require = require('apprunner').getRequire(require)
require('myaliasedmodule')
```

Registers an api with apprunner, providing emitter, rqs object and initApi wrapper
```
require = require('apprunner').getRequire(require, exports, {
	api: 'FB Friends', initApi: initApi, endApi: endApi,
	rqScope: true, timeoutMs: time10s, ready: false})
```
* options
	* .api: optional string: unique api name eg. 'Server Helper'
	* .emScope if emitter, this emitter will be used. id property will be updated
	* .emScope if string: scope for emitter
	* .initApi: optional function: the internal initApi implementation
	* .rqScope: optional string or boolen, string slogan for request timer, true if using api name
	* .cb(err): optional function: rqs error callback
	* .timeoutMs: number ms: default rqs timeout if not 3 seconds
	* .ready: positive number: timeout for ready in ms
	* .ready false: this api does not emit ready
	* .ready defaults: ready with timeout 3 s
	* .saveApi: optional function
	* .endApi: optional function
	* .apiState: optional function

1. An emitter will be created if emScope or apiName is non-zero string at require.emitter
2. A request timer will be provided if rqScope is true or non-zero string at require.rqs
3. The api will be managed if there is a non-zero api name. emitter and initApi are required. api name at require.emitter.id

## apisReady(cb)

Surveys all apis with singleton ready to see if they have concluded initializing.

## anomaly(...)

Report any argument as an anomaly, to the log and possibly via email
```js
require('apprunner').anomaly(err, {location: 'kitchen', user: 'fail'}, err2)
```

## enableAnomalyMail(flag)
control emailing of anomaly reports.
```js
require('apprunner').enableAnomalyMail('1/1/2013')
```
* flag either a date string or boolean flag, default: false

Anomaly reports are not sent until the day after the date provided.

## addErrorListener(emitter)

Adds an error listener to the EventEmitter.

Safe: can be invoked with any value, or repeatedly invoked.

## removeErrorListener(emitter)

Removes an error listener to the EventEmitter.

Safe: can be invoked with any value, or repeatedly invoked.

## shutdown(exitCode)

Shuts the application down. All apis that have exposed an saveApi or endApi gets these functions invoked prior to process.exit

App Runner handles process exceptions and SIGINT (ie. ctrl-Break.)
* Exit code 0 is SIGINT
* Exit code 2 is unhandled exception

## addUriHandler(fn)

Provides a function for a Web server instance that registers incoming uri and handlers
```js
var apprunner = require('apprunner')
var express = require('express')

var app = apprunner.addErrorListener(express())
apprunner.addUriHandler(app.get.bind(app))
```
* fn(uri, uriHandler): function, uri: string, uriHandler: function

## getRqs(errorCallback, scopeName, defaultTimeoutMs)

Get a timer factory
```js
var rqs = require('apprunner').getRqs(timeoutFn, 'UserStore Timers', 1000)

var timer = rqs.addRq('Getting Token')
userStore.getUser(fbId, saveOauthToken)

function saveOauthToken(err, user) {
	timer.clear()
	...
}

function timeoutFn(err) {
	console.log('an anomaly was reported for a timed out request')
	// maybe take alternative action
	if (err.isTimer) {
		if (err.param === 'Getting Token') ...
	}
}
```
* errorCallback(err): function: invoked with err for timeouts and inconsitencies
* scopeName: optional string or object: scope name for this factory eg. 'sync Db'
* defaultTimeoutMs: optional number: default timeout in ms, min 100,  default 3 s

1. rqs.addRq(parameter, time)
2. rqs.clearRq(parameter) : same as .clear
3. rqs.getState()
4. rqs.shutdown()

# Apis

An api must be loaded using these two things:

1. Being loaded using require from getRequire
2. Provide its initApi function and api name to getRequire

## What's the Difference Between an Api and a Module?

1. An singleton api or api instances returned by initApi can be required to emit ready
2. An api's initApi is provided options that is json-configured options overriden by invocation options
3. An api can have onLoad: true
4. An api has a sigleton emitter at require.emitter
5. An api has a module name like all modules but also an api name at require.emitter.id
6. An api can export the special endApi, saveApi and apiState functions
7. An api can get a timer factory at require.rqs

<h2>What code should be an Api?</h2>
<p>What source files should be designed as an api?</p>
<ol>
	<li>Modules that are shared across multiple apps or apis without being an npm package.</li>
	<li>modules with specific needs:<ol>
		<li>Instance matching</li>
		<li>Managed lifecycle due to timers, open ports to or tcp connections</li>
		<li>Singleton ready to delay app start</li>
		<li>Configuration information like urls or passwords</li>
		<li>Diagnostic error emitting</li>
		<li>Provide ops information</li>
		<li>Start using onLoad</li>
	</ol>
</ol>

## Loading an Api
Singleton
```js
require = require('apprunner').getRequire(require)
require('serverhelp').listen()
require('mongo').once('ready', mongoReady)
```
Instance
```js
require = require('apprunner').getRequire(require)
var fb = require('fb')
fb.initApi({user: userId}).once('ready', fbReady)
```

## Writing an Api
Singleton
```js
require = require('apprunner').getRequire(require, exports, {
	api: 'MongoD', initApi: initApi, endApi: endApi,
	rqScope: true, ready: false})
function someExport(...) ...
```
Instance
```
require = require('apprunner').getRequire(require, exports, {
	api: 'User Store', initApi: initApi,
	})
function initApi(opts) {
	...
	var readyState
	doSome(someCb)
	function someCb(err, data) {
		readyState = err || true
		var eArgs = ['ready']
		if (err) eArgs.push(err)
		e.emit.apply(e, eArgs)
	}
	var e = new events.EventEmitter
	e.isReady = isReady
	return e
	function isReady() {
		return readyState
}
}
```
## Api settings
Api settings are provided in the defaults object for appInit()
```js
{
		"api": {
		"path": [
			{
				"folder": "lib"
			},
			{
				"file": "applego"
			}
		],
		"apiMap": {
			"expressapi": {
				"onLoad": true,
				"sessionSecret": "secrets",
				"port": 3003
			},
}
```
* path: optional array of locations
* apiMap: optional object with api settings
	* each entry can have onLoad, folder/subPath/file along with other settings
1. A location can have folder/subPath: a string relative to the app's launch folder and a dot-separated name spacing in the loaded module
2. A location can have  file/subpath where file is a module name and subpath is a dot-separated name spacing in the loaded module

# Notes

(c) [Harald Rudell](http://www.haraldrudell.com) wrote this for node in September, 2012

No warranty expressed or implied. Use at your own risk.

Please suggest better ways, new features, and possible difficulties on [github](https://github.com/haraldrudell/apprunner)