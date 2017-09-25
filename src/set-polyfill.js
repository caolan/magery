// use built in Set() if available
if (typeof Set === 'undefined') {

function SetPolyfill() {
    this.values = [];
}

SetPolyfill.prototype.add = function (x) {
    this.values.push(x);
};

SetPolyfill.prototype.has = function (x) {
    return this.values.indexOf(x) !== -1;
};

SetPolyfill.prototype.clear = function () {
    this.values = [];
};

    module.exports = SetPolyfill;
}
else {
	module.exports = Set;
}
