function Template(render) {
    this._render = render;
    this.handlers = {};
}

Template.prototype.bind = function (handlers) {
    this.handlers = handlers;
};

module.exports = Template;
