// initapiwrapper.js
// Insert json configuration options into initApi invocation options
// © Harald Rudell 2013 MIT License

var rqsm = require('./rqs')
// https://github.com/haraldrudell/haraldutil
var haraldutil = require('haraldutil')

var rqs // initApi request timers for all modules with instance ready

exports.getWrapper = getWrapper

function getWrapper(initApi, state, requireState) {
	var moduleJsonOpts // cached json config for this module
	var apiConfigName

	return initApiWrapper

	/*
	initApi invoked on an api
	invocationOpts: optional object: options provided in the current initApi invocation

	1. initApiWrapper is the function exported as initApi in the module's export object
	2. exportsMap contains all known export objects
	3. We can therefore get the module name by looking in exportsMap for initApiWrapper
	4. The module name is used to find json options

	- the code invoking the api must use apiRequire
	- the api must provide initApi to getRequire
	*/
	function initApiWrapper(invocationOpts) { // merge in options from json file
		var instanceReadyTimer // possible timer for this initApi invocation

		if (!moduleJsonOpts) { // json data for this module not yet identified
			/*
			A module can be loaded under different names
			eg. './module' and '././module'
			find a name that loaded this module and has a json configuration

			*/
			var initApiWrapperWasFound
			for (var aModuleName in state.exportsMap) {
				var anExports = state.exportsMap[aModuleName]
				if (anExports && anExports.initApi === initApiWrapper) {
					initApiWrapperWasFound = true
					if (state.apiConfigs[aModuleName]) {
						moduleJsonOpts = state.apiConfigs[aModuleName]
						apiConfigName = aModuleName
						break
					}
				}
			}
			if (!initApiWrapperWasFound) throw new Error('Api not loaded with apprunner: ' + apiObject.api)
			if (!moduleJsonOpts) moduleJsonOpts = {}
		}

		var opts = haraldutil.merge(haraldutil.shallowClone(moduleJsonOpts), invocationOpts)

		var instance = initApi(opts)

		if (requireState.apiObject.instanceReady) {
			if (!rqs) rqs = rqsm.getRqs(function () {}, 'Instance Ready Timer')
			instanceReadyTimer = rqs.addRq(requireState.apiObject.api)
			instance.once('ready', onReady)
		}
		return instance

		function onReady() {
			instanceReadyTimer.clear()
		}
	}
}
