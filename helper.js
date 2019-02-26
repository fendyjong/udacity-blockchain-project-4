function isNumeric(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
}

function currentTimestamp() {
	return new Date().getTime().toString().slice(0, -3);
}

module.exports = {
	isNumeric,
	currentTimestamp,
};
