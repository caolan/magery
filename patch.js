/**
 * Processes render events (e.g. enterTag, exitTag) and matches them against the
 * current state of the DOM. Where there is a mismatch a transform function is
 * called to reconcile the differences. The Patcher code should only _read_ the
 * DOM, performing DOM mutation only through transform calls.
 */

var utils = require('./utils');
var transforms = require('./transforms');
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

// includes some virtual attributes (e.g. 'checked')
function getAttributes(node) {
    var attrs = node.attributes;
    if (node.checked) {
        attrs = Array.prototype.slice.call(attrs);
        attrs.push({name: 'checked', value: node.checked});
    }
    return attrs;
}

function deleteUnvisitedAttributes(transforms, node) {
    var attrs = getAttributes(node);
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
    if (!node.event_handlers) {
        return;
    }
    for (var type in node.event_handlers) {
        if (!node.visited_events.has(type)) {
            transforms.removeEventListener(node, type, node.event_handlers[type]);
            delete node.event_handlers[type];
        }
    }
};


function Patcher(node, custom_transforms) {
    this.container = node;
    this.parent = null;
    this.current = null;
    this.transforms = custom_transforms || transforms;
};

exports.Patcher = Patcher;

Patcher.prototype.start = function () {
    this.stepInto(this.container);
};

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

function getListener(node, type) {
    return node.event_handlers && node.event_handlers[type];
}

function setListener(transforms, node, type, handler) {
    transforms.addEventListener(node, type, handler);
    node.visited_events.add(type);
    if (!node.event_handlers) {
        node.event_handlers = {};
    }
    node.event_handlers[type] = handler;
}

function replaceListener(transforms, node, type, handler) {
    var old_handler = getListener(node, type);
    if (old_handler) {
        // remove existing event handler
        transforms.removeEventListener(node, type, old_handler);
    }
    setListener(transforms, node, type, handler);
}

// TODO: these get re-bound every render of an element because
// the context etc may have changed - probably a better to do this
Patcher.prototype.eventListener = function (type, name, context, path) {
    var container = this.container;
    var f = function (event) {
        if (container.dispatch) {
            container.dispatch(name, event, context, path);
        }
        var node = event.target;
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
    replaceListener(this.transforms, this.parent, type, f);
};

// force checkbox node checked property to match last rendered attribute
function resetCheckbox(event) {
    event.target.checked = event.target.hasAttribute('checked');
}

function resetRadio(event) {
    var expected = event.target.hasAttribute('checked');
    if (event.target.checked != expected) {
        if (event.target.name) {
            // TODO: are radio buttons with the same name in different forms
            // considered part of the same group?
            var els = document.getElementsByName(event.target.name);
            for (var i = 0, len = els.length; i < len; i++) {
                var el = els[i];
                el.checked = el.hasAttribute('checked');
            }
        }
        else {
            // not part of a group
            event.target.checked = expected;
        }
    }
    //event.target.checked = event.target.hasAttribute('checked');
}

// force option node selected property to match last rendered attribute
function resetSelected(event) {
    var options = event.target.getElementsByTagName('option');
    for (var i = 0, len = options.length; i < len; i++) {
        var option = options[i];
        option.selected = option.hasAttribute('selected');
    }
}

// force input to match last render of value attribute
function resetInput(event) {
    var node = event.target;
    var expected = node.getAttribute('value');
    if (node.value !== expected) {
        node.value = expected;
    }
}

Patcher.prototype.attribute = function (name, value) {
    var node = this.parent;
    if (node.getAttribute(name) !== value) {
        this.transforms.setAttribute(node, name, utils.htmlEscape(value));
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
        if (type === 'checkbox' && !getListener(node, 'change')) {
            setListener(this.transforms, node, 'change', resetCheckbox);
        }
        else if (type === 'radio' && !getListener(node, 'change')) {
            setListener(this.transforms, node, 'change', resetRadio);
        }
        else if (node.hasAttribute('value') && !getListener(node, 'input')) {
            setListener(this.transforms, node, 'input', resetInput);
        }
    }
    else if (node.tagName === 'SELECT') {
        setListener(this.transforms, node, 'change', resetSelected);
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

Patcher.prototype.end = function (data) {
    deleteChildren(this.transforms, this.parent, this.current);
    this.parent = null;
};
