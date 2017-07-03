"use strict";

var context = require('./context');
var render = require('./render');
var patch = require('./patch');
var init = require('./init');


/***** Public API *****/

function BoundTemplate(node, template, data, handlers) {
    this.node = node;
    this.template = template;
    this.context = data;
    this.handlers = handlers;
}

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

exports.bind = function (node, template, data, handlers) {
    if (typeof node === 'string') {
        node = document.getElementById(node);
    }
    var bound = new BoundTemplate(node, template, data, handlers);
    var patcher = new patch.Patcher(node);
    var renderer = new render.Renderer(patcher, bound);
    bound.update = function () {
        renderer.render(this.template, this.context, null);
        this.update_queued = false;
    };
    bound.update();
    return bound;
};

exports.BoundTemplate = BoundTemplate;
exports.initTemplates = init.initTemplates;
