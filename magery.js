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
    return this.applyHandler(this, name, args);
};


BoundTemplate.prototype.applyHandler = function (name, args) {
    // console.log(['trigger', name].concat(Array.prototype.slice.call(arguments, 1)));
    // var start = performance.now();
    this.handlers[name].apply(this, args);
    this.update();
    // var end = performance.now();
    // console.log((end - start) + 'ms');
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
    };
    bound.update();
    return bound;
};

exports.BoundTemplate = BoundTemplate;
exports.initTemplates = init.initTemplates;
