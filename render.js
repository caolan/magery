/**
 * Walks a template node tree, sending render events to the patcher via method
 * calls. All interaction with the DOM should be done in the patcher/transforms,
 * these functions only process template nodes and prev/next data in order to
 * emit events.
 */

var utils = require('./utils');
var parsers = require('./parsers');
var builtins = require('./builtins');

var ELEMENT_NODE = 1;
var TEXT_NODE = 3;


function isTemplateTag(node) {
    return node._template_tag || /^MAGERY:.*/.test(node.tagName);
}

function isExpandTag(node) {
    return 'MAGERY-EXPAND' === node.tagName;
}

function isBlockTag(node) {
    return 'MAGERY-BLOCK' === node.tagName;
}

function templateTagName(node) {
    if (node._template_tag) {
        return node._template_tag;
    }
    var m = /^MAGERY:([^\s/>]+)/.exec(node.tagName);
    if (!m) {
        throw new Error(
            errorMessage(node, 'Not a template tag: ' + node.tagName)
        );
    }
    node._template_tag = m[1].toLowerCase();
    return node._template_tag;
}


exports.propertyPath = function (str) {
    return str.split('.').filter(function (x) {
        return x;
    });
};

// finds property path array (e.g. ['foo', 'bar']) in data object
exports.lookup = function (data, props) {
    var value = data;
    for(var i = 0, len = props.length; i < len; i++) {
        if (value === undefined || value === null) {
            return '';
        }
        value = value[props[i]];
    }
    return (value === undefined || value === null) ? '' : value;
};

exports.getParams = function (node) {
    if (node._params) {
        return node._params;
    }
    node._params = parsers.parseParams(node.getAttribute('params'));
    return node._params;
};

function templatePath(node) {
    var path = [];
    while (node) {
        if (isBlockTag(node)) {
            if (node.dataset['else'] === 'true') {
                path.unshift('{{else}}');
            }
            // do nothing
        }
        else if (isTemplateTag(node)) {
            path.unshift('{{#' + templateTagName(node) + '}}');
        }
        else if (node.tagName === 'BODY' && node._template) {
            path.unshift('{{#define ' + node._template + '}}');
            return path;
        }
        else {
            path.unshift(node.tagName);
        }
        node = node.parentNode;
    }
    return path;
};

function errorMessage(node, msg) {
    return msg + ' at ' + templatePath(node).join('/');
};


function Renderer(patcher, templates, first_pass) {
    this.patcher = patcher;
    this.templates = templates;
    this.text_buffer = null;
    // used to decide whether to render {{#skip}} blocks
    this.first_pass = first_pass;
    // toggle variable expansion
    // (e.g. for inside {{{html}}} variables)
    this._expand = true;
}
exports.Renderer = Renderer;

Renderer.prototype.render = function (template_name, next_data, prev_data) {
    var tmpl = this.templates[template_name];
    this.patcher.start();
    this.children(tmpl.body, next_data, prev_data, null, null, []);
    this.flushText();
    this.first_pass = false;
    this.patcher.end(next_data);
};

// will expand BOTH {{var}} and {{{var}}} as plain text
Renderer.prototype.expandVarsText = function (str, data) {
    if (!this._expand) {
        return str;
    }
    return str.replace(/{{({?)\s*([^}]+?)\s*}}(}?)/g,
        function (full, before, property, after) {
            if (before.length != after.length) {
                throw new Error(
                    'Mismatched curly braces at {{' +
                        before + property + after +
                    '}}'
                );
            }
            return exports.lookup(data, exports.propertyPath(property));
        }
    );
};

// will expand {{{var}}} as DOM nodes, returns string if only {{var}}'s
// used, <MAGERY-BLOCK> DOM element otherwise
var STATE_TEXT = 0;
var STATE_OPEN = 1;
var STATE_ESCAPED = 2;
var STATE_ESCAPED_END = 3;
var STATE_RAW = 4;
var STATE_RAW_END = 5;

Renderer.prototype.expandVarsDOM = function (str, data) {
    if (!this._expand) {
        return str;
    }
    // TODO: apparently, not all browsers support capturing groups being
    // included in the output of String.split, test to find out which
    var parts = str.split(/{{({?)\s*([^}]+?)\s*}}(}?)/g);
    var raw = false;
    var buffer = parts[0];
    var state = STATE_OPEN;
    var val;
    for (var i = 1, len = parts.length; i < len; i++) {
        var part = parts[i];
        if (state === STATE_TEXT) {
            buffer += raw ? utils.htmlEscape(part) : part;
            state = STATE_OPEN;
        }
        else if (state === STATE_OPEN) {
            state = part ? STATE_RAW : STATE_ESCAPED;
        }
        else if (state === STATE_ESCAPED) {
            val = exports.lookup(data, exports.propertyPath(part));
            buffer += raw ? utils.htmlEscape(val) : val;
            state = STATE_ESCAPED_END;
        }
        else if (state === STATE_ESCAPED_END) {
            if (part) {
                throw new Error(
                    'Mismatched curly braces at {{' + parts[i-1] + '}}}'
                );
            }
            state = STATE_TEXT;
        }
        else if (state === STATE_RAW) {
            if (!raw) {
                raw = true;
                buffer = utils.htmlEscape(buffer);
            }
            val = exports.lookup(data, exports.propertyPath(part));
            var params = encodeURIComponent(part);
            buffer += '<MAGERY:WITH params="' + params + '">' +
                val + '</MAGERY:WITH>';
            state = STATE_RAW_END;
        }
        else if (state === STATE_RAW_END) {
            if (!part) {
                throw new Error(
                    'Mismatched curly braces at {{{' + parts[i-1] + '}}'
                );
            }
            state = STATE_TEXT;
        }
    }
    if (raw) {
        var block = document.createElement('MAGERY-BLOCK');
        block.innerHTML = buffer;
        return block;
    }
    return buffer;
};

Renderer.prototype.child = function (node, i, next_data, prev_data, key, inner, path) {
    if (node.nodeType === TEXT_NODE) {
        this.text(node, next_data, prev_data, key, inner, path);
    }
    else if (node.nodeType === ELEMENT_NODE) {
        if (isBlockTag(node)) {
            if (node.dataset['else'] === 'true') {
                throw new Error(errorMessage(node, 'Unexpected {{else}}'));
            }
            else {
                this.children(node, next_data, prev_data, key, inner, path);
            }
        }
        else if (isTemplateTag(node)) {
            this.templateTag(node, next_data, prev_data, key, inner, path);
        }
        else if (isExpandTag(node)) {
            if (inner) {
                inner.call(this, next_data, prev_data, key, path);
            }
        }
        else {
            var k = key && key + '/' + i;
            this.element(node, next_data, prev_data, k, inner, path);
        }
    }
};

Renderer.prototype.children = function (parent, next_data, prev_data, key, inner, path) {
    var self = this;
    utils.eachNode(parent.childNodes, function (node, i) {
        self.child(node, i, next_data, prev_data, key, inner, path);
    });
};

Renderer.prototype.skipChildren = function (parent, key) {
    var self = this;
    utils.eachNode(parent.childNodes, function (node, i) {
        self.patcher.skip(node.tagName, key && key + '/' + i);
    });
};

Renderer.prototype.text = function (node, next_data, prev_data, key, inner, path) {
    var value = this.expandVarsDOM(node.textContent, next_data);
    if (value instanceof Element) {
        // turn off variable expansion while rendering child nodes
        this._expand = false;
        this.children(value, next_data, prev_data, key, inner, path);
        this._expand = true;
    }
    else if (!this.text_buffer) {
        this.text_buffer = value;
    }
    else {
        this.text_buffer += value;
    }
};

Renderer.prototype.flushText = function () {
    if (this.text_buffer) {
        this.patcher.text(this.text_buffer);
        this.text_buffer = null;
    }
};

Renderer.prototype.templateTag = function (node, next_data, prev_data, key, inner, path) {
    var name = templateTagName(node);
    var f = builtins[name];
    if (f) {
        // use builtin tag
        return f(this, node, next_data, prev_data, key, inner, path);
    }
    // attempt to render template by name
    var property;
    var params = exports.getParams(node);
    if (params.args.length) {
        property = params.args[0].value;
    }
    this.template(name, property, node, next_data, prev_data, key, inner, path);
};

Renderer.prototype.template = function (name, property, node, next_data, prev_data, key, inner, path) {
    var tmpl = this.templates[name];
    if (tmpl) {
        // TODO: validate parameters
        if (property) {
            var props = exports.propertyPath(property);
            prev_data = exports.lookup(prev_data, props);
            next_data = exports.lookup(next_data, props);
            path = path.concat(props);
        }
        var new_inner = function (next_data, prev_data, key, path) {
            this.children(node, next_data, prev_data, key, inner, path);
        };
        this.children(tmpl.body, next_data, prev_data, key, new_inner, path);
    }
    else {
        throw new Error(
            errorMessage(node, 'Unrecognized template tag: {{#' + name + '...')
        );
    }
};

// TODO: don't run this regex on every render - we only need to do it once
// for each template tag
function realTagName(name) {
    var m = /^MAGERY-TAG:([^\s/>]+)/.exec(name);
    return m ? m[1]: name;
}

Renderer.prototype.element = function (node, next_data, prev_data, key, inner, path) {
    this.flushText();
    var tagName = realTagName(node.tagName);
    if (prev_data === next_data) {
        this.patcher.skip(tagName, key || null);
    }
    else {
        this.patcher.enterTag(tagName, key || null);
        for (var i = 0, len = node.attributes.length; i < len; i++) {
            var attr = node.attributes[i];
            var event_match = /^on([a-zA-Z]+)/.exec(attr.name);
            if (event_match) {
                this.patcher.eventListener(
                    event_match[1],
                    this.expandVarsText(attr.value, next_data),
                    next_data,
                    path
                );
            }
            else {
                this.patcher.attribute(
                    attr.name,
                    this.expandVarsText(attr.value, next_data)
                );
            }
        }
        this.children(node, next_data, prev_data, null, inner, path);
        this.flushText();
        this.patcher.exitTag();
    }
};
