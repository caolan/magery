var patch = require('./patch');
var active_paths = require('./active_paths');
var compile = require('./compile');


/***** Public API *****/

function BoundTemplate(node, template, data, handlers) {
    this.node = node;
    this.template = template;
    this.data = data;
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

exports.bind = function (node, template_id, data, handlers) {
    if (typeof node === 'string') {
        node = document.getElementById(node);
    }
    var template = document.getElementById(template_id).content;
    var bound = new BoundTemplate(node, template, data, handlers);
    var patcher = new patch.Patcher(node);
    var render_state = {
        bound_template: bound,
        patcher: patcher,
        text_buffer: ""
    };
    bound.update = function () {
        var next_data = this.data;
        var prev_data = null;
        patcher.start();
        this.template.render(render_state, next_data, prev_data);
        patcher.end();
        this.update_queued = false;
    };
    bound.update();
    return bound;
};

exports.initTemplates = function () {
    var templates = document.getElementsByTagName('template');
    for (var i = 0, len = templates.length; i < len; i++) {
        var tmpl = templates[i].content;
        active_paths.markTemplatePaths(tmpl);
        var children = compile.compileChildren(tmpl);
        tmpl.render_children = children;
        tmpl.render = compile.wrapTemplate(children);
    }
};

exports.BoundTemplate = BoundTemplate;
