var patch = require('./patch');


function BoundTemplate(template, patcher, data, handlers) {
    this.handlers = handlers;
    this.data = data;
    this.patcher = patcher;
    this.template = template;
    this.text_buffer = '';
    this.update_queued = false;
}

BoundTemplate.prototype.update = function () {
    this.patcher.reset();
    this.template.render(this, this.data, null);
    this.update_queued = false;
};

BoundTemplate.prototype.trigger = function (name /* args... */) {
    var args = Array.prototype.slice.call(arguments, 1);
    return this.applyHandler(name, args);
};

BoundTemplate.prototype.applyHandler = function (name, args) {
    var queued = this.update_queued;
    this.update_queued = true;
    this.handlers[name].apply(this, args);
    if (!queued) {
        this.update();
    }
};

module.exports = BoundTemplate;
