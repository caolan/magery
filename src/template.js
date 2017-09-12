var BoundTemplate = require('./bound_template');
var patch = require('./patch');
var utils = require('./utils');


function Template(name, render) {
    this.render = render;
    this.name = name;
}

Template.prototype.bind = function (options) {
    options.patcher = options.patcher || new patch.Patcher(options.element);
    var bound = new BoundTemplate(this, options);
    bound.update();
    return bound;
};

Template.prototype.bindAll = function (options) {
    var self = this;
    var nodes = document.querySelectorAll('[data-bind="' + this.name + '"]');
    return Array.prototype.map.call(nodes, function (node) {
        var opt = utils.shallowClone(options);
        opt.data = opt.data || JSON.parse(node.getAttribute('data-context'));
        opt.element = node;
        return self.bind(opt);
    });
};

module.exports = Template;
