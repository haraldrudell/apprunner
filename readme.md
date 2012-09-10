# App Runner

App Runner allows to to generate and maintain many apps using shared code. Require is great, App Runner is greater!

App Runner does three things:
* Provides loadable apis
* Manages application errors
* Emails anomaly reports

Why App Runner? App Runner is App Lego.

If you make many Web apps and you have several of them for example accessing Facebook or using the same type of database, App Runner enables you to architect that in a repeatable pattern. App Runner allows you to use json to configure where code comes from and its settings.

## Benefits

1. Load of a module now has callback and can signal load error.
2. Each module (api) can have its location and configuration defined in json.
3. Large volumes of errors can be emitted and properly communicated.
4. Reported errors does not kill the app or affect its execution.
5. Each api can register uri routes, but does not depend on a particular Web server.
6. Unhandled exceptions are communicated similar to errors.
7. SIGINT signal gracefully shuts down the application.

# Reference

App Runner handles process exceptions and SIGINT.
* Exit code 0 is SIGINT
* Exit code 2 is unhandled exception

## initApp(defaults, app, cb)

* defaults: options, typically loaded by haraldops

  * .init.appFolder: string: the folder of initial script
  * .init.logger: optional function(string): logging, default console.log
  * .init.ops.sendMail: optional function(subject, body): Sends mail, default none
  * .api: optional, indicates that Api Manager should be used
  * .api.apiMap: api configurations

* app: Web server, has .on and .get methods
* cb(err): optional function

## getApi(opts, cb)

get an api implementation
* opts: object
* .api: string: name of api function to be loaded
* cb(err, module)

APIs are either configured directly in opts, or in defaults provided at App Runner init

If module has module.emitter, APp Runner will listen and manage error events

## anomaly(...)

Report any argument as an anomaly, to the log and if so configured a periodcal email.

## enableAnomalyMail(flag)

control emailing on or off: flag: boolean, default: false

## getCbCounter()
Ensures that all callbacks has completed

```js
var haraldutil = require('haraldutil')
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

# Examples

TODO

# Notes

(c) [Harald Rudell](http://www.haraldrudell.com) wrote this for node in September, 2012

No warranty expressed or implied. Use at your own risk.

Please suggest better ways, new features, and possible difficulties on [github](https://github.com/haraldrudell/apprunner)