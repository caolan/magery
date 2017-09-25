// var transforms = require('./transforms');
// var render = require('./render');
// var patch = require('./patch');


function Template(render) {
    this._render = render;
    this.handlers = {};
}

Template.prototype.bind = function (handlers) {
    this.handlers = handlers;
};

// Template.prototype.patch = function (element, data) {
//     var patcher = new patch.Patcher(element, transforms);
//     render(patcher, this.node, data, '');
// };

module.exports = Template;
