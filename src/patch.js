/**
 * Processes render events (e.g. enterTag, exitTag) and matches them against the
 * current state of the DOM. Where there is a mismatch a transform function is
 * called to reconcile the differences. The Patcher code should only _read_ the
 * DOM, performing DOM mutation only through transform calls.
 */

var transforms = require('./transforms');
var utils = require('./utils');
var html = require('./html');
var Set = require('./set-polyfill');

var ELEMENT_NODE = 1;
var TEXT_NODE = 3;


function matches(node, tag, key) {
    return (
        node.tagName === tag ||
        node.nodeType === TEXT_NODE && tag === '#text'
    ) && node.key == key;
};

function align(parent, node, tag, key) {
    if (node && matches(node, tag, key)) {
        return node;
    }
    if (key && parent.keymap) {
        return parent.keymap[key] || null;
    }
    return null;
};

// deletes all children in parent starting from node (inclusive)
function deleteChildren(transforms, parent, node) {
    while (node) {
        var tmp = node;
        node = node.nextSibling;
        transforms.removeChild(parent, tmp);
    }
}

function deleteUnvisitedAttributes(transforms, node) {
    var attrs = node.attributes;
    var remove = [];
    var i, len;
    for (i = 0, len = attrs.length; i < len; i++) {
        var attr = attrs[i];
        if (!node.visited_attributes.has(attr.name)) {
            remove.push(attr.name);
        }
    }
    for (i = 0, len = remove.length; i < len; i++) {
        transforms.removeAttribute(node, remove[i]);
    }
};

// deletes children not marked as visited during patch
function deleteUnvisitedEvents(transforms, node) {
    if (!node.handlers) {
        return;
    }
    for (var type in node.handlers) {
        if (!node.visited_events.has(type)) {
            transforms.removeEventListener(node, type, node.handlers[type].fn);
            delete node.handlers[type];
        }
    }
};


function Patcher(element, custom_transforms) {
    this.transforms = custom_transforms || transforms;
    this.root = element;
    this.reset();
};

exports.Patcher = Patcher;

Patcher.prototype.reset = function () {
    this.parent = this.root.parentNode;
    this.current = this.root;
};

Patcher.prototype.stepInto = function (node) {
    if (node.visited_attributes) {
        node.visited_attributes.clear();
    }
    else {
        node.visited_attributes = new Set();
    }
    if (node.visited_events) {
        node.visited_events.clear();
    }
    else {
        node.visited_events = new Set();
    }
    this.parent = node;
    this.current = node.firstChild;
};

Patcher.prototype.enterTag = function (tag, key) {
    var node = align(this.parent, this.current, tag, key);
    if (!node) {
        node = this.transforms.insertElement(this.parent, this.current, tag);
        if (key) {
            if (!this.parent.keymap) {
                this.parent.keymap = {};
            }
            this.parent.keymap[key] = node;
            node.key = key;
        }
    }
    else if (!this.current) {
        this.transforms.appendChild(this.parent, node);
    }
    else if (node !== this.current) {
        this.transforms.replaceChild(this.parent, node, this.current);
    }
    if (!this.template_root) {
        this.template_root = node;
    }
    this.stepInto(node);
};

// specific value for referncing an event inside handler arguments
Patcher.prototype.EVENT = {};

function makeHandler(node, type) {
    return function (event) {
        var handler = node.handlers[type];
        if (handler.name) {
            var args = handler.args.map(function (arg) {
                if (arg === Patcher.prototype.EVENT) {
                    return event;
                }
                return arg;
            });
            node.template.handlers[handler.name].apply(handler.template_root, args);
        }
    };
}

function setListener(node, type) {
    if (!node.handlers) {
        node.handlers = {};
    }
    if (!node.handlers.hasOwnProperty(type)) {
        var fn = makeHandler(node, type);
        node.handlers[type] = {fn: fn};
        transforms.addEventListener(node, type, fn);
    }
    node.visited_events.add(type);
}

Patcher.prototype.eventListener = function (type, handler_name, args, template) {
    var node = this.parent;
    if (node.template !== template) {
        node.template = template;
    }
    setListener(node, type);
    var handler = node.handlers[type];
    handler.name = handler_name;
    handler.args = args;
    handler.template_root = this.template_root;
};

// Patcher.prototype.attribute = function (name, value) {
//     var node = this.parent;
//     console.log(['attribute', name, node.getAttribute(name), value, node.value]);
//     if (html.attributes[name] & html.USE_PROPERTY) {
//         if (node[name] !== value) {
//             if (html.attributes[name] & html.USE_STRING) {
//                 value = '' + value;
//             }
//             this.transforms.setAttribute(node, name, value);
//         }
//     }
//     else if (node.getAttribute(name) !== '' + value) {
//         this.transforms.setAttribute(node, name, value);
//     }
//     node.visited_attributes.add(name);
// };
// TODO: add unit tests to justify some of the above logic
Patcher.prototype.attribute = function (name, value) {
    var node = this.parent;
    if (node.getAttribute(name) !== value) {
        this.transforms.setAttribute(node, name, value);
    }
    node.visited_attributes.add(name);
};

Patcher.prototype.text = function (text) {
    var node = align(this.parent, this.current, '#text', null);
    if (!node) {
        node = this.transforms.insertTextNode(this.parent, this.current, text);
    }
    else if (node.textContent !== text) {
        this.transforms.replaceText(node, text);
    }
    this.current = node.nextSibling;
};

function getListener(node, type) {
    return node.handlers && node.handlers[type] && node.handlers[type].fn;
}

Patcher.prototype.exitTag = function () {
    // delete unvisited child nodes
    deleteChildren(this.transforms, this.parent, this.current);
    var node = this.parent;
    this.parent = node.parentNode;
    this.current = node.nextSibling;
    deleteUnvisitedAttributes(this.transforms, node);
    deleteUnvisitedEvents(this.transforms, node);
};

Patcher.prototype.skip = function (tag, key) {
    var node = align(this.parent, this.current, tag, key);
    if (!this.current) {
        this.transforms.appendChild(this.parent, node);
    }
    else if (node !== this.current) {
        this.transforms.replaceChild(this.parent, node, this.current);
    }
    this.current = node.nextSibling;
};

Patcher.prototype.lookup = utils.lookup;

Patcher.prototype.isTruthy = function (x) {
    if (Array.isArray(x)) {
        return x.length > 0;
    }
    return x;
};

Patcher.prototype.each = function (data, name, iterable, f) {
    for (var i = 0, len = iterable.length; i < len; i++) {
        var data2 = utils.shallowClone(data);
        data2[name] = iterable[i];
        f(data2);
    }
};

Patcher.prototype.render = function (templates, name, data, root_key, root_attrs, inner) {
    if (!templates[name]) {
        throw new Error('Template does not exist: <' + name + '>');
    }
    var template = templates[name];
    var tmp = this.template_root;
    this.template_root = null;
    template._render(template, templates, this, data, root_key, root_attrs, inner);
    this.template_root = tmp;
};
