function Set() {
    this.values = [];
}

Set.prototype.add = function (x) {
    this.values.push(x);
};

Set.prototype.has = function (x) {
    return this.values.indexOf(x) !== -1;
};

// use built in Set() if available
module.exports = window.Set || Set;
