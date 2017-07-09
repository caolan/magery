/**
 * Walks a template node tree, sending render events to the patcher via method
 * calls. All interaction with the DOM should be done in the patcher/transforms,
 * these functions only process template nodes and prev/next data in order to
 * emit events.
 */

var utils = require('./utils');


function Renderer(patcher, bound_template) {
    this.bound_template = bound_template;
    this.patcher = patcher;
    this.text_buffer = null;
}

Renderer.prototype.render = function (template_id, next_data, prev_data) {
    this.patcher.start();
    this.renderTemplate(template_id, next_data, prev_data, null);
    this.flushText();
    this.patcher.end(next_data);
};

Renderer.prototype.renderTemplate = function (template_id, next_data, prev_data, inner) {
    var template = document.getElementById(template_id);
    if (!template) {
        throw new Error("Template not found: '" + template_id + "'");
    }
    if (!template.content.initialized) {
        throw new Error(
            "Template '" + template_id + "' has not been initialized, " +
                "call Magery.initTemplates() first"
        );
    }
    this.children(template.content, next_data, prev_data, inner);
};

Renderer.prototype.each = function (node, next_data, prev_data, inner) {
    var name = node._each_name;
    var iterable = utils.lookup(next_data, node._each_iterable);
    for (var i = 0, len = iterable.length; i < len; i++) {
        var item = iterable[i];
        var d = Object.assign({}, next_data);
        d[name] = item;
        this.element(node, d, prev_data);
    }
};

Renderer.prototype.child = function (node, next_data, prev_data, inner) {
    if (utils.isTextNode(node)) {
        return this.text(node, next_data);
    }
    else if (utils.isElementNode(node)) {
        if (node._template_call) {
            return this.templateCall(node, next_data, prev_data, inner);
        }
        else if (node._template_children) {
            return inner();
        }
        else if (node._each_name) {
            return this.each(node, next_data, prev_data, inner);
        }
        else {
            return this.element(node, next_data, prev_data, inner);
        }
    }
};

Renderer.prototype.children = function (parent, next_data, prev_data, inner) {
    var self = this;
    utils.eachNode(parent.childNodes, function (node) {
        self.child(node, next_data, prev_data, inner);
    });
};

Renderer.prototype.flushText = function () {
    if (this.text_buffer) {
        this.patcher.text(this.text_buffer);
        this.text_buffer = null;
    }
};

function isTruthy(x) {
    if (Array.isArray(x)) {
        return x.length > 0;
    }
    return x;
}

Renderer.prototype.element = function (node, next_data, prev_data, inner) {
    var path, test;
    if (node._if) {
        path = node._if;
        test = utils.lookup(next_data, path);
        if (!isTruthy(test)) {
            return;
        }
    }
    if (node._unless) {
        path = node._unless;
        test = utils.lookup(next_data, path);
        if (isTruthy(test)) {
            return;
        }
    }
    this.flushText();
    var key = null;
    if (node._key) {
        key = this.expandVars(node._key, next_data);
    }
    this.patcher.enterTag(node.tagName, key);
    for (var i = 0, len = node.attributes.length; i < len; i++) {
        var attr = node.attributes[i];
        var name = attr.name;
        if (name[0] == 'o' && name[1] == 'n') {
            this.patcher.eventListener(
                name.substr(2),
                attr.value,
                next_data,
                this.bound_template
            );
        }
        else {
            this.patcher.attribute(
                name,
                this.expandVars(attr.value, next_data)
            );
        }
    }
    this.children(node, next_data, prev_data, inner);
    this.flushText();
    this.patcher.exitTag();
};

Renderer.prototype.expandVars = function (str, data) {
    return str.replace(/{{\s*([^}]+?)\s*}}/g,
        function (full, property) {
            return utils.lookup(data, utils.propertyPath(property));
        }
    );
};

Renderer.prototype.text = function (node, data) {
    var str = this.expandVars(node.textContent, data);
    if (!this.text_buffer) {
        this.text_buffer = str;
    }
    else {
        this.text_buffer += str;
    }
};

Renderer.prototype.templateCall = function (node, next_data, prev_data, inner) {
    var attr = node.getAttribute('template');
    if (!attr) {
        throw new Error("<template-call> tags must include a 'template' attribute");
    }
    var template_id = this.expandVars(attr, next_data);
    var nd = {};
    for (var i = 0, len = node.attributes.length; i < len; i++) {
        var name = node.attributes[i].name;
        if (name !== 'template') {
            var path = utils.propertyPath(node.attributes[i].value);
            var value = utils.lookup(next_data, path);
            nd[name] = value;
        }
    }
    var self = this;
    this.renderTemplate(template_id, nd, prev_data, function () {
        self.children(node, next_data, prev_data, inner);
    });
};

exports.Renderer = Renderer;
