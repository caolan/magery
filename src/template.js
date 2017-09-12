var BoundTemplate = require('./bound_template');
var patch = require('./patch');
var utils = require('./utils');


function Template(name, render) {
    this.render = render;
    this.name = name;
}

Template.prototype.bindPatcher = function (patcher, data, handlers) {
    var bound = new BoundTemplate(this, patcher, data, handlers);
    bound.update();
    return bound;
};

Template.prototype.bind = function (node, data, handlers) {
    if (typeof(node) === 'string') {
        node = document.getElementById(node);
    }
    return this.bindPatcher(
        new patch.Patcher(node),
        data,
        handlers
    );
};

Template.prototype.bindAll = function (handlers) {
    var self = this;
    var nodes = document.querySelectorAll('[data-bind="' + this.name + '"]');
    return Array.prototype.map.call(nodes, function (node) {
        var data = JSON.parse(node.getAttribute('data-context'));
        return self.bind(node, data, handlers);
    });
};

module.exports = Template;
