var Magery =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

	var patch = __webpack_require__(1);
	var active_paths = __webpack_require__(6);
	var compile = __webpack_require__(7);


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


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

	/**
	 * Processes render events (e.g. enterTag, exitTag) and matches them against the
	 * current state of the DOM. Where there is a mismatch a transform function is
	 * called to reconcile the differences. The Patcher code should only _read_ the
	 * DOM, performing DOM mutation only through transform calls.
	 */

	var transforms = __webpack_require__(2);
	var utils = __webpack_require__(4);
	var Set = __webpack_require__(5);

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

	Patcher.prototype.end = function (data) {
	    deleteChildren(this.transforms, this.parent, this.current);
	    this.parent = null;
	};


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

	/**
	 * DOM mutation procedures called by the patcher. This module provides
	 * a cleaner API for our purposes and a place to intercept and
	 * monitor mutations during testing.
	 */

	var html = __webpack_require__(3);


	exports.insertTextNode = function (parent, before, str) {
	    var node = document.createTextNode(str);
	    parent.insertBefore(node, before);
	    return node;
	};

	exports.replaceText = function (node, str) {
	    node.textContent = str;
	    return node;
	};

	exports.replaceChild = function (parent, node, old) {
	    parent.replaceChild(node, old);
	    return node;
	};

	exports.appendChild = function (parent, node) {
	    parent.appendChild(node);
	    return node;
	};

	exports.insertElement = function (parent, before, tag) {
	    var node = document.createElement(tag);
	    parent.insertBefore(node, before);
	    return node;
	};

	exports.removeChild = function (parent, node) {
	    parent.removeChild(node);
	    return node;
	};

	exports.setAttribute = function (node, name, value) {
	    if (html.attributes[name] & html.USE_PROPERTY) {
	        node[name] = value;
	    }
	    node.setAttribute(name, value);
	    return node;
	};

	exports.removeAttribute = function (node, name) {
	    if (html.attributes[name] & html.USE_PROPERTY) {
	        node[name] = false;
	    }
	    node.removeAttribute(name);
	    return node;
	};

	exports.addEventListener = function (node, name, handler) {
	    node.addEventListener(name, handler, false);
	    return node;
	};

	exports.removeEventListener = function (node, name, handler) {
	    node.removeEventListener(name, handler);
	    return node;
	};


/***/ }),
/* 3 */
/***/ (function(module, exports) {

	var BOOLEAN_ATTRIBUTE = exports.BOOLEAN_ATTRIBUTE = 1;
	var USE_PROPERTY = exports.USE_PROPERTY = 2;

	exports.attributes = {
	    'checked': BOOLEAN_ATTRIBUTE | USE_PROPERTY,
	    'selected': BOOLEAN_ATTRIBUTE | USE_PROPERTY,
	    'value': USE_PROPERTY
	};



/***/ }),
/* 4 */
/***/ (function(module, exports) {

	var ELEMENT_NODE = 1;
	var TEXT_NODE = 3;
	var DOCUMENT_FRAGMENT = 11;

	exports.isDocumentFragment = function (node) {
	    return node.nodeType === DOCUMENT_FRAGMENT;
	};

	exports.isElementNode = function (node) {
	    return node.nodeType === ELEMENT_NODE;
	};

	exports.isTextNode = function (node) {
	    return node.nodeType === TEXT_NODE;
	};

	exports.eachNode = function (nodelist, f) {
	    var i = 0;
	    var node = nodelist[0];
	    while (node) {
	        var tmp = node;
	        // need to call nextSibling before f() because f()
	        // might remove the node from the DOM
	        node = node.nextSibling;
	        f(tmp, i++, nodelist);
	    }
	};

	exports.mapNodes = function (nodelist, f) {
	    var results = [];
	    exports.eachNode(nodelist, function (node, i) {
	        results[i] = f(node, i, nodelist);
	    });
	    return results;
	};

	exports.trim = function (str) {
	    return str.replace(/^\s+|\s+$/g, '');
	};

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

	exports.templateTagName = function (node) {
	    var m = /^TEMPLATE-([^\s/>]+)/.exec(node.tagName);
	    return m && m[1].toLowerCase();
	};


/***/ }),
/* 5 */
/***/ (function(module, exports) {

	function Set() {
	    this.values = [];
	}

	Set.prototype.add = function (x) {
	    this.values.push(x);
	};

	Set.prototype.has = function (x) {
	    return this.values.indexOf(x) !== -1;
	};

	// use built in Set() if available
	module.exports = window.Set || Set;


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

	var utils = __webpack_require__(4);

	exports.markPath = function (obj, props) {
	    switch (props.length) {
	    case 0: return;
	    case 1: obj[props[0]] = true; return;
	    default:
	        for(var i = 0, len = props.length - 2; i < len; i++) {
	            var k = props[i];
	            if (obj[k] === true) {
	                return;
	            }
	            if (obj[k] === undefined) {
	                obj[k] = {};
	            }
	            obj = obj[k];
	        }
	        if (obj[props[i]]) {
	            obj[props[i]] = true;
	        }
	        else {
	            var val = {};
	            val[props[i + 1]] = true;
	            obj[props[i]] = val;
	        }
	    }
	};

	exports.mergePaths = function (a, b) {
	    for (var k in b) {
	        if (a[k] === true) {
	            continue;
	        }
	        else if (b[k] === true) {
	            a[k] = true;
	        }
	        else if (!a[k]) {
	            a[k] = b[k];
	        }
	        else {
	            if (Object.keys(a[k])[0] == Object.keys(b[k])[0]) {
	                exports.mergePaths(a[k], b[k]);
	            }
	            else {
	                a[k] = true;
	            }
	        }
	    }
	};

	exports.equivalentPathObjects = function (a, b) {
	    var a_keys = Object.keys(a);
	    var b_keys = Object.keys(b);
	    // same number of keys
	    if (a_keys.length !== b_keys.length) {
	        return false;
	    }
	    a_keys.sort();
	    b_keys.sort();
	    // same keys
	    for (var i = a_keys.length - 1; i >= 0; i--) {
	        if (a_keys[i] !== b_keys[i]) {
	            return false;
	        }
	    }
	    // same values
	    for (i = a_keys.length - 1; i >= 0; i--) {
	        var k = a_keys[i];
	        var a_val = a[k];
	        var b_val = b[k];
	        if (a_val === true && b_val === true) {
	            continue;
	        }
	        else if (a_val === true || b_val === true) {
	            return false;
	        }
	        else if (!exports.equivalentPathObjects(a[k], b[k])) {
	            return false;
	        }
	    }
	    return true;
	};

	exports.stringPaths = function (str) {
	    var paths = {};
	    var m = str.match(/{{\s*([^}]+?)\s*}}/g);
	    if (m) {
	        m.forEach(function (v) {
	            exports.markPath(
	                paths,
	                utils.propertyPath(v.replace(/^{{\s*|\s*}}$/g, ''))
	            );
	        });
	    }
	    return paths;
	};

	function updateChildPaths (paths, node) {
	    var wildcard = false;
	    var child_paths = utils.mapNodes(node.childNodes, initNode);
	    for (var i = 0, len = child_paths.length; i < len; i++) {
	        var p = child_paths[i];
	        if (!p) {
	            wildcard = true;
	            break;
	        }
	        exports.mergePaths(paths, p);
	    }
	    utils.eachNode(node.childNodes, function (child, i) {
	        var p = child_paths[i];
	        if (p && Object.keys(p).length === 0) {
	            child.static = true;
	        }
	        else if (wildcard || !exports.equivalentPathObjects(p, paths)) {
	            child.active_paths = p;
	        }
	    });
	    return wildcard ? false: paths;
	};

	exports.elementPaths = function (node) {
	    var paths = {};
	    var remove = null;
	    var path;
	    if (node.attributes) {
	        for (var i = 0, len = node.attributes.length; i < len; i++) {
	            var attr = node.attributes[i];
	            if (attr.name == 'data-each') {
	                var parts = attr.value.split(' in ');
	                if (parts.length < 2) {
	                    throw new Error(
	                        'Badly formed data-each attribute value: ' + attr.value
	                    );
	                }
	                path = utils.propertyPath(parts[1]);
	                exports.markPath(paths, path);
	                remove = parts[0];
	            }
	            if (attr.name == 'data-if') {
	                path = utils.propertyPath(attr.value);
	                exports.markPath(paths, path);
	            }
	            else if (attr.name == 'data-unless') {
	                path = utils.propertyPath(attr.value);
	                exports.markPath(paths, path);
	            }
	            else {
	                exports.mergePaths(paths, exports.stringPaths(attr.value));
	            }
	        }
	    }
	    paths = updateChildPaths(paths, node);
	    if (remove) {
	        delete paths[remove];
	    }
	    return paths;
	};

	function templateCallPaths(node) {
	    var paths = {};
	    for (var i = 0, len = node.attributes.length; i < len; i++) {
	        var attr = node.attributes[i];
	        if (attr.name === 'template') {
	            exports.mergePaths(paths, exports.stringPaths(attr.value));
	        }
	        else {
	            exports.markPath(paths, utils.propertyPath(attr.value));
	        }
	    }
	    paths = updateChildPaths(paths, node);
	    return paths;
	}

	function templateChildrenPaths(node) {
	    return false;
	}

	var templateTags = {
	    'call': templateCallPaths,
	    'children': templateChildrenPaths
	};

	function initNode(node) {
	    if (utils.isTextNode(node)) {
	        return exports.stringPaths(node.textContent);
	    }
	    else {
	        var name = utils.templateTagName(node);
	        if (name) {
	            var f = templateTags[name];
	            if (!f) {
	                throw new Error('Unknown template tag: ' + node.tagName);
	            }
	            return f(node);
	        }
	        else if (utils.isElementNode(node) || utils.isDocumentFragment(node)) {
	            return exports.elementPaths(node);
	        }
	    }
	    return false;
	}

	exports.markTemplatePaths = function (tmpl) {
	    var paths = initNode(tmpl);
	    tmpl.static = (paths && Object.keys(paths).length === 0);
	    tmpl.active_paths = paths;
	};


/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

	var html = __webpack_require__(3);
	var utils = __webpack_require__(4);


	function run_all(xs) {
	    var funs = xs.filter(function (x) { return x; });
	    var length = funs.length;
	    return function (state, next_data, prev_data, inner) {
	        var index = -1;
	        while (++index < length) {
	            funs[index](state, next_data, prev_data, inner);
	        }
	    };
	}

	function flushText(state) {
	    if (state.text_buffer) {
	        state.patcher.text(state.text_buffer);
	        state.text_buffer = '';
	    }
	}

	function compileExpandVars(str, boolean) {
	    var parts = str.split(/{{|}}/);
	    var length = parts.length;
	    var i = -1;
	    while (++i < length) {
	        if (i % 2) {
	            var path = utils.propertyPath(utils.trim(parts[i]));
	            parts[i] = path;
	        }
	    }
	    // presence of empty boolean property is actually truthy
	    if (length == 1 && !parts[0] && boolean) {
	        return function () {
	            return true;
	        };
	    }
	    // if the string has only one value expanded, return it directly
	    else if (length == 3 && !parts[0] && !parts[2]) {
	        return function (data) {
	            return utils.lookup(data, parts[1]);
	        };
	    }
	    // otherwise build a result string by expanding nested variables
	    return function (data) {
	        var result = '';
	        var i = -1;
	        while (++i < length) {
	            result += (i % 2) ? utils.lookup(data, parts[i]) : parts[i];
	        }
	        return result;
	    };
	}

	function compileText(node) {
	    var txt = node.textContent;
	    var expand = compileExpandVars(txt);
	    return function (state, next_data, prev_data, inner) {
	        state.text_buffer += expand(next_data);
	    };
	}

	function compileElement(node) {
	    var children = exports.compileChildren(node);
	    var expand_key = null;
	    if (node.dataset.key) {
	        expand_key = compileExpandVars(node.dataset.key);
	    }
	    var events = {};
	    var attrs = {};
	    for (var i = 0, len = node.attributes.length; i < len; i++) {
	        var attr = node.attributes[i];
	        var name = attr.name;
	        if (name == 'data-each' ||
	            name == 'data-if' ||
	            name == 'data-unless' ||
	            name == 'data-key') {
	            continue;
	        }
	        var event = name.match(/^on(.*)/, event);
	        if (event) {
	            var event_name = event[1];
	            events[event_name] = attr.value;
	        }
	        else {
	            attrs[name] = compileExpandVars(
	                attr.value,
	                html.attributes[name] & html.BOOLEAN_ATTRIBUTE
	            );
	        }
	    }
	    var render = function (state, next_data, prev_data, inner) {
	        var key = expand_key ? expand_key(next_data) : null;
	        flushText(state);
	        state.patcher.enterTag(node.tagName, key);
	        for (var attr_name in attrs) {
	            var value = attrs[attr_name](next_data);
	            if (value || !(html.attributes[attr_name] & html.BOOLEAN_ATTRIBUTE)) {
	                state.patcher.attribute(attr_name, value);
	            }
	        }
	        for (var event_name in events) {
	            state.patcher.eventListener(
	                event_name,
	                events[event_name],
	                next_data,
	                state.bound_template
	            );
	        }
	        children(state, next_data, prev_data, inner);
	        flushText(state);
	        state.patcher.exitTag();
	    };
	    if (node.dataset.unless) {
	        render = compileUnless(node, render);
	    }
	    if (node.dataset.if) {
	        render = compileIf(node, render);
	    }
	    if (node.dataset.each) {
	        render = compileEach(node, render);
	    }
	    return render;
	}

	function isTruthy(x) {
	    if (Array.isArray(x)) {
	        return x.length > 0;
	    }
	    return x;
	}

	function compileUnless(node, render) {
	    var path = utils.propertyPath(node.dataset.unless);
	    return function (state, next_data, prev_data, inner) {
	        if (!isTruthy(utils.lookup(next_data, path))) {
	            render(state, next_data, prev_data, inner);
	        }
	    };
	}

	function compileIf(node, render) {
	    var path = utils.propertyPath(node.dataset.if);
	    return function (state, next_data, prev_data, inner) {
	        if (isTruthy(utils.lookup(next_data, path))) {
	            render(state, next_data, prev_data, inner);
	        }
	    };
	}

	function compileEach(node, render) {
	    var parts = node.dataset.each.split(' in ');
	    var name = parts[0];
	    var path = utils.propertyPath(parts[1]);
	    return function (state, next_data, prev_data, inner) {
	        var next_arr = utils.lookup(next_data, path);
	        var prev_arr = utils.lookup(prev_data, path);
	        var length = next_arr.length;
	        var index = -1;
	        while (++index < length) {
	            var next_data2 = Object.assign({}, next_data);
	            var prev_data2 = Object.assign({}, prev_data);
	            next_data2[name] = next_arr[index];
	            prev_data2[name] = prev_arr && prev_arr[index];
	            render(state, next_data2, prev_data2, inner);
	        }
	    };
	}

	function compileTemplateCall(node) {
	    var attr = node.getAttribute('template');
	    if (!attr) {
	        throw new Error("<template-call> tags must include a 'template' attribute");
	    }
	    var template_id_pattern = compileExpandVars(attr);
	    var children = exports.compileChildren(node);
	    return function (state, next_data, prev_data, inner) {
	        var template_id = template_id_pattern(next_data);
	        var template = document.getElementById(template_id);
	        if (!template) {
	            throw new Error("Template not found: '" + template_id + "'");
	        }
	        var next_data2 = {};
	        var prev_data2 = {};
	        for (var i = 0, len = node.attributes.length; i < len; i++) {
	            var name = node.attributes[i].name;
	            if (name !== 'template') {
	                var path = utils.propertyPath(node.attributes[i].value);
	                next_data2[name] = utils.lookup(next_data, path);
	                prev_data2[name] = utils.lookup(prev_data, path);
	            }
	        }
	        var self = this;
	        template.content.render_children(state, next_data2, prev_data2, function () {
	            children(state, next_data, prev_data, inner);
	        });
	    };
	}

	function compileNode(node) {
	    if (utils.isTextNode(node)) {
	        return compileText(node);
	    }
	    else if (utils.isElementNode(node)) {
	        var name = utils.templateTagName(node);
	        if (name) {
	            if (name == 'call') {
	                return compileTemplateCall(node);
	            }
	            else if (name == 'children') {
	                return function (state, next_data, prev_data, inner) {
	                    inner && inner();
	                };
	            }
	            throw new Error(
	                'Unkonwn template tag: <template-' + name + '>'
	            );
	        }
	        return compileElement(node);
	    }
	    return null;
	}

	exports.compileChildren = function (parent) {
	    return run_all(utils.mapNodes(parent.childNodes, compileNode));
	}

	exports.wrapTemplate = function (children) {
	    return function (state, next_data, prev_data, inner) {
	        state.patcher.start();
	        children(state, next_data, prev_data, inner);
	        flushText(state);
	        state.patcher.end();
	    };
	};


/***/ })
/******/ ]);