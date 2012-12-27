// readywatch.js

exports.readyWatch = readyWatch
exports.setRqs = setRqs

var rqs
function readyWatch(emitter, t) {
	if (!rqs) throw Error('ReadyWatch setRqs invocation')

	var timer = rqs.add(t)
	emitter.once('ready', clearTimer)

	function clearTimer() {
		timer.clear()
	}
}

function setRqs(rqs0) {
	rqs = rqs0
}