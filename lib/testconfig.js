// testconfig.js
// Load config json from the test folder so that apis can be loaded during testing
// © Harald Rudell 2013 MIT License

/*
__firname in the test itself is the best folder source to use.
In fact, it is the very location where testapisetup.json is located.

result:
require('apprunner').testIntercept({useTestConfig: __dirname})

conclusion: no project file has been loaded.
Only the test itself and whatever require comes from that.

conclusion:
if modules should be possible to symlink, no __dirname from other than true project files can be used.

conclusion: require.main.filename can not be used
When tests are run, require.main.filename points to the _mocha executable
eg. launch Folder /node_modules/mochawrapper/node_modules/mocha2/bin/_mocha
*/

// http://nodejs.org/api/path.html
var path = require('path')

exports.getTestConfig = getTestConfig

// return value: api config json
function getTestConfig(dirname) {

	var testApiSetup

	// try to load the file with test configuration from the project's test folder
	var absPathTestApiSetup = path.join(dirname, 'testapisetup.json')
	try {
		testApiSetup = require(absPathTestApiSetup)
	} catch (e) {
		if (e.code !== 'MODULE_NOT_FOUND') throw e
	}

	var getRequireInitOpts = {}
	for (var p in testApiSetup) if (p !== 'api') getRequireInitOpts[p] = testApiSetup[p]
	getRequireInitOpts.apiOpts = testApiSetup.api // rename api to apiOpts
	if (!getRequireInitOpts.appData) getRequireInitOpts.appData = {} // avoid init-check

	return getRequireInitOpts
}
