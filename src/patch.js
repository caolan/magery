/**
 * Processes render events (e.g. enterTag, exitTag) and matches them against the
 * current state of the DOM. Where there is a mismatch a transform function is
 * called to reconcile the differences. The Patcher code should only _read_ the
 * DOM, performing DOM mutation only through transform calls.
 */

var transforms = require('./transforms');
var utils = require('./utils');
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


function Patcher(root, custom_transforms) {
    this.transforms = custom_transforms || transforms;
    this.root = root;
    this.reset();
};

exports.Patcher = Patcher;

Patcher.prototype.reset = function () {
    this.parent = this.root.parentNode;
    this.current = this.root;
};

// Patcher.prototype.start = function () {
//     // this.stepInto(this.container);
// };

Patcher.prototype.stepInto = function (node) {
    node.visited_attributes = new Set();
    node.visited_events = new Set();
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
    this.stepInto(node);
};

function makeHandler(type) {
    return function (event) {
        var node = event.target;
        var handler = node.handlers[type];
        if (handler.name) {
            var args = handler.args.map(function (arg) {
                if (arg.length == 1 && arg[0] == 'event') {
                    return event;
                }
                return utils.lookup(node.data, arg);
            });
            node.bound_template.applyHandler(handler.name, args);
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
}

Patcher.prototype.eventListener = function (type, value, data, bound_template) {
    var node = this.parent;
    if (node.data !== data) {
        node.data = data;
    }
    if (node.bound_template !== bound_template) {
        node.bound_template = bound_template;
    }
    setListener(node, type);
    var handler = node.handlers[type];
    if (handler.value !== value) {
        handler.value = value;
        var start = value.indexOf('(');
        var end = value.lastIndexOf(')');
        handler.name = value.substring(0, start);
        var parts = value.substring(start + 1, end).split(',');
        handler.args = parts.map(function (part) {
            return utils.propertyPath(utils.trim(part));
        });
    }
    node.visited_events.add(type);
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
    if (node.tagName === 'INPUT') {
        var type = node.getAttribute('type');
        if ((type === 'checkbox' || type == 'radio') && !getListener(node, 'change')) {
            setListener(node, 'change');
        }
        else if (node.hasAttribute('value') && !getListener(node, 'input')) {
            setListener(node, 'input');
        }
    }
    else if (node.tagName === 'SELECT') {
        setListener(node, 'change');
    }
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

// Patcher.prototype.end = function (data) {
//     // deleteChildren(this.transforms, this.parent, this.current);
//     // this.parent = null;
// };
