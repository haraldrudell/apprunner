// createkey.js
// create a unique identifier based on a list of strings
// © Harald Rudell 2012

exports.createKey = createKey

function createKey() {
	var result = ''
	var badIndex

	// true if false was never returned
	if (!Array.prototype.slice.call(arguments).every(function (value, index) {
		var ok = value && typeof value.valueOf() == 'string'
		if (ok) result += '(' + value + ')'
		else badIndex = index
		return ok
	})) throw Error('Required option undefined: ' + badIndex)

	return result
}