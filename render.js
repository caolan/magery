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
    this.children(template.content, next_data, prev_data, inner);
};

Renderer.prototype.each = function (node, next_data, prev_data, inner) {
    var parts = node.dataset.each.split(' in ');
    var path = utils.propertyPath(parts[1]);
    var iterable = utils.lookup(next_data, path);
    for (var i = 0, len = iterable.length; i < len; i++) {
        var item = iterable[i];
        var d = Object.assign({}, next_data);
        d[parts[0]] = item;
        this.element(node, d, prev_data);
    }
};

Renderer.prototype.child = function (node, next_data, prev_data, inner) {
    if (utils.isTextNode(node)) {
        this.text(node, next_data);
    }
    else if (utils.isElementNode(node)) {
        if (node.tagName == 'TEMPLATE-CALL') {
            this.templateCall(node, next_data, prev_data, inner);
        }
        else if (node.tagName == 'TEMPLATE-CHILDREN') {
            inner();
        }
        else if (node.dataset.each) {
            this.each(node, next_data, prev_data, inner);
        }
        else {
            this.element(node, next_data, prev_data, inner);
        }
    }
};

Renderer.prototype.children = function (parent, next_data, prev_data, inner) {
    console.log(['eachNode', parent.childNodes]);
    var self = this;
    utils.eachNode(parent.childNodes, function (node) {
        console.log(node);
        self.child(node, next_data, prev_data, inner);
    });
};

Renderer.prototype.flushText = function () {
    console.log(['flushText', this.text_buffer]);
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
    if (node.dataset['if']) {
        path = utils.propertyPath(node.dataset['if']);
        test = utils.lookup(next_data, path);
        if (!isTruthy(test)) {
            return;
        }
    }
    if (node.dataset['unless']) {
        path = utils.propertyPath(node.dataset['unless']);
        test = utils.lookup(next_data, path);
        if (isTruthy(test)) {
            return;
        }
    }
    this.flushText();
    var key = null;
    if (node.dataset.key) {
        key = this.expandVars(node.dataset.key, next_data);
    }
    this.patcher.enterTag(node.tagName, key);
    for (var i = 0, len = node.attributes.length; i < len; i++) {
        var attr = node.attributes[i];
        if (attr.name == 'data-each' ||
            attr.name == 'data-if' ||
            attr.name == 'data-unless' ||
            attr.name == 'data-key') {
            continue;
        }
        var event_match = /^on([a-zA-Z]+)/.exec(attr.name);
        if (event_match) {
            this.patcher.eventListener(
                event_match[1],
                attr.value,
                next_data,
                this.bound_template
            );
        }
        else {
            this.patcher.attribute(
                attr.name,
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
    console.log(['text', str]);
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
