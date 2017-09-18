var transforms = require('./transforms');
var patch = require('./patch');


function Template(name, render) {
    this.render = render;
    this.name = name;
    this.handlers = {};
}

Template.prototype.bind = function (handlers) {
    this.handlers = handlers;
};

Template.prototype.patch = function (element, next_data, prev_data) {
    var state = {
        patcher: new patch.Patcher(element, transforms),
        template: this,
        text_buffer: ''
    };
    this.render(state, next_data, prev_data);
};

module.exports = Template;
