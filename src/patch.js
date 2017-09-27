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
        if (remove[i] === 'value') {
            transforms.removeEventListener(node, 'input', resetInput);
        }
    }
};

// deletes children not marked as visited during patch
function deleteUnvisitedEvents(transforms, node) {
    if (!node.handlers) {
        return;
    }
    for (var type in node.handlers) {
        if (!node.visited_events.has(type)) {
            transforms.removeEventListener(node, type, node.handlers[type]);
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

function makeHandler(type) {
    return function (event) {
        var node = event.target;
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
        if (node.tagName === 'INPUT') {
            var nodeType = node.getAttribute('type');
            if (type == 'change') {
                if (nodeType === 'checkbox') {
                    resetCheckbox(event);
                }
                else if (nodeType === 'radio') {
                    resetRadio(event);
                }
            }
            else if (type == 'input' && node.hasAttribute('value')) {
                resetInput(event);
            }
        }
        else if (node.tagName === 'SELECT') {
            resetSelected(event);
        }
    };
}

function setListener(node, type) {
    if (!node.handlers) {
        node.handlers = {};
    }
    if (!node.handlers.hasOwnProperty(type)) {
        var fn = makeHandler(type);
        node.handlers[type] = {fn: fn};
        node.addEventListener(type, fn);
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

// force checkbox node checked property to match last rendered attribute
function resetCheckbox(event) {
    var node = event.target;
    if (node.dataset['managed'] === 'true') {
        node.checked = node.hasAttribute('checked');
    }
}

function resetRadio(event) {
    var node = event.target;
    if (node.dataset['managed'] === 'true') {
        var expected = node.hasAttribute('checked');
        if (node.checked != expected) {
            if (node.name) {
                // TODO: are radio buttons with the same name in different forms
                // considered part of the same group?
                var els = document.getElementsByName(node.name);
                for (var i = 0, len = els.length; i < len; i++) {
                    var el = els[i];
                    el.checked = el.hasAttribute('checked');
                }
            }
            else {
                // not part of a group
                node.checked = expected;
            }
        }
        //event.target.checked = event.target.hasAttribute('checked');
    }
}

// force option node selected property to match last rendered attribute
function resetSelected(event) {
    var node = event.target;
    if (node.dataset['managed'] === 'true') {
        var options = node.getElementsByTagName('option');
        for (var i = 0, len = options.length; i < len; i++) {
            var option = options[i];
            option.selected = option.hasAttribute('selected');
        }
    }
}

// force input to match last render of value attribute
function resetInput(event) {
    var node = event.target;
    if (node.dataset['managed'] === 'true') {
        var expected = node.getAttribute('value');
        if (node.value !== expected) {
            node.value = expected;
        }
    }
}

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
    if (node.tagName === 'INPUT') {
        var type = node.getAttribute('type');
        if ((type === 'checkbox' || type == 'radio')) {
            setListener(node, 'change');
        }
        else if (node.hasAttribute('value')) {
            setListener(node, 'input');
        }
    }
    else if (node.tagName === 'SELECT') {
        setListener(node, 'change');
    }
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

Patcher.prototype.render = function (templates, name, data, root_key, inner) {
    var template = templates[name];
    var tmp = this.template_root;
    this.template_root = null;
    template._render(template, templates, this, data, root_key, inner);
    this.template_root = tmp;
};

exports.patch = function (templates, name, data, element) {
    new Patcher(element).render(templates, name, data);
};
