# App Runner

App Runner allows to to generate and maintain many apps using shared code. Require is great, App Runner is greater!

App Runner does three things:
* Provides module control from json
* Manages application errors and reporting
* Handle lifecycle of the app and its modules

Why App Runner? App Runner is App Lego.

If you make many Web apps for example accessing Facebook or the same database, App Runner enables you to architect in a repeatable pattern. App Runner allows you to use json to configure where code comes from and its settings.

## Benefits

1. Apis can be moved between project files and external modules with no code change.
2. One or many apis per file or module.
2. Configuration information provided to apis from code and json.
3. Apis can emit large volumes of errors that is properly communicated.
4. Reported errors does not kill the app or affect its execution.
5. Each api can register uri routes, but does not depend on a particular Web server implementation.
6. Unhandled process exceptions are communicated similarly to errors.
7. SIGINT signal gracefully shuts down the application.
8. Apis can communciate delayed readiness, and provide shutdown hooks

# Reference

App Runner handles process exceptions and SIGINT.
* Exit code 0 is SIGINT
* Exit code 2 is unhandled exception

## initApp(defaults, app)

* defaults: options, typically loaded by haraldops

  * .init.appFolder: string: the folder of initial script
  * .init.logger: optional function(string): logging, default console.log
  * .init.ops.sendMail: optional function(subject, body): Sends mail, default none
  * .api: optional, indicates that Api Manager should be used
  * .api.apiMap: optional: api configurations

* app: Web server, could be an event emitter and have a .get method

## getApi(opts)

Example of using a proprietary serverhelp api, that manages Express lifecycle as an api.

```js
require('apprunner')
	.getApi({api: 'serverhelp'})
	.listen({
		server: app,
		port: defaults.PORT,
		interface: defaults.appInterface},
	cbc.add(appIsUp))
```

gets an api implementation
* opts: object
* .api: string: name of api function to be loaded

APIs are either configured directly in the opts object, or in defaults provided at App Runner's init.

## apisReady(cb)

Surveys all loaded apis to see if they have concluded initializing. Each api can expose an apiReady(cb) function used fo this purpose.

## anomaly(...)

Report any argument as an anomaly, to the log and if so configured a periodcal email.

## enableAnomalyMail(flag)

control emailing on or off: flag: boolean, default: false

## addErrorListener(emitter)

Adds an error listener to the EventEmitter. Safe: can be invoked with any value, or repeatedly invoked.

## removeErrorListener(emitter)

Removes an error listener to the EventEmitter. Safe: can be invoked with any value, or repeatedly invoked.

## shutdown(exitCode)

Shuts the application down. All apis that have exposed an endApi function gets this invoked prior to process.exit

## getCbCounter()
Ensures that all callbacks has completed

```js
var apprunner = require('apprunner')
var cbc = haraldutil.getCbCounter()
setTimeout(cbc.add(callback), 100)
setTimeout(cbc.add(callback), 100)

function callback() {
  if (cbc.isDone(arguments.callee))
    console.log('All callbacks completed.')
  else console.log('Not done yet...')
}
```
```
Not done yet...
All callbacks completed.
```
var cbc = getCbCounter(opts)
* opts: optional object
* opts.emitter: optional event emitter or boolean. default: errors are thrown

  * false: errors are ignored
  * emitter: errors are emitted

* opts.callback: function or array of function: add is done for each function

cbc: object
* .add(f): adds a callback for function f, return value: f
* .isDone(f): notes one callback completed. returns true if all callbacks complete, otherwise false
* .getStatus(): gets an object representing the current state

# Configuring and Writing an Api Module

Configurations for an api is provided either in defaults or in the opts

## Retrieving an api

As a minimum, the opts object needs to contain the api property: `getApi({api: 'userstore'})`

## How the api is loaded

An Api's location is determined by two properties:

1. .file: the same value you would provide to require
2. .subPath: dot-separated property access inside the module loaded by require

If file is missing some special steps are taken:

1. If file is missing, the default filename is the api name.
2. defaults.api.folder can provide a default folder used if file begings with '.' or is missing
3. If no folder is provided, the lib folder in appFolder is used.

## The api module

The api module itself can have four optional special exports:
* initApi(opts): code executed on the first load of the api processing the options. May return a value that is used in place of the regular module value
* apiReady(cb(err)) calls back when the api is ready to provide service
* endApi(cb(err)) instructs the api to shut down, ie. close connections and clear timers
* emitter if this is an EventEmitter, errors emitted are processed as anomalies

## Execution of initApi

if your api exports initApi, ths function is invoked on each require. This is because options may change, and you need to take this in account.

initApi is provided an options object:

* .config: object: the merge of options providing to getApi and options in apiMap. getApi options overrride
* .registerHandler(string route, handler(req, res, next)): registers a route with whatever Web server is used. 
* .logger: function(string): the logging to be used
* .apprunner: object: the apprunner module for convenience

if initApi returns a value, this is used as the result of getApi().

# Examples

TODO

# Notes

(c) [Harald Rudell](http://www.haraldrudell.com) wrote this for node in September, 2012

No warranty expressed or implied. Use at your own risk.

Please suggest better ways, new features, and possible difficulties on [github](https://github.com/haraldrudell/apprunner)