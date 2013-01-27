// apirequire.js
// Load module using path and configs in json
// © Harald Rudell 2013 MIT License

var apierror = require('./apierror')
// http://nodejs.org/api/path.html
var path = require('path')

exports.getApiRequire = getApiRequire

function getApiRequire(state, theRequire) {
	return apiRequire

	function apiRequire(moduleName) {
		var result
		var apiConfig = state.apiConfigs[moduleName]
		var found
		var lastException
		var apiName

		if (state.testMap && state.testMap[moduleName]) found = result = state.testMap[moduleName]

		if (!found && apiConfig) { // check if this api entry has an override location: folder, file, subPath
			if (apiConfig.folder) tryFolder(apiConfig.folder)
			else if (apiConfig.file && !tryRequire(apiConfig.file)) { // override file entries MUST exist
				var e = new Error('Api config for ' + moduleName + ': file module failed to load: ' + apiConfig.file)
				apierror.emitError(e, lastException)
				throw lastException
			}
			if (found) doNamespace(apiConfig.subPath)
		}


		if (!found && !tryRequire(moduleName)) { // try node.js require
			var nodeJsRequireException = lastException
			if (!state.apiPath.some(tryPathEntry)) // try path
				throw nodeJsRequireException // this has the module name provided
		}

		state.exportsMap[moduleName] = result // successful load of module
		return  result

		function tryPathEntry(pathObject, index) {
			if (pathObject.folder) tryFolder(pathObject.folder)
			else if (pathObject.file &&!tryRequire(pathObject.file)) { // an api.path file entry MUST exist
				var e = new Error('Module in api.path failed to load: #' + index + ': '+ pathObject.file)
				apierror.emitError(e, lastException)
				throw e
			}
			if (found) {
				doNamespace(pathObject.subPath)
				if (found && pathObject.file && pathObject.subPath === undefined)
					if (result[moduleName]) result = result[moduleName]
					else found = false
			}
			return found
		}

		function tryFolder(folder) {
			return tryRequire(path.join(state.deployFolder, folder, moduleName))
		}

		function tryRequire(moduleName) {
			try { // node.js require
				result = theRequire(moduleName)
				found = true
			} catch (e) {
				if (e.code !== 'MODULE_NOT_FOUND') throw e // some other trouble than module not found
				if (e.moduleName) throw e // a recursive module not found
				e.moduleName = moduleName
				lastException = e
			}
			return found
		}

		function doNamespace(subPath) {
			if (typeof subPath === 'string') {
				var namespace = result
				String(subPath).split('.').forEach(function (prop) {
					if (namespace) namespace = namespace[prop]
				})
				if (!namespace) {
					found = false
					var lastException = new Error('In api ' + moduleName + ' Cannot find namespace ' + subPath)
					lastException.code = 'MODULE_NOT_FOUND'
				} else result = namespace
			}
		}
	}
}
