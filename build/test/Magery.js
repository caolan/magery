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

	module.exports = __webpack_require__(1);


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

	var Patcher = __webpack_require__(2).Patcher;
	var evalTemplates = __webpack_require__(7).eval;

	exports.Template = __webpack_require__(8);

	exports.compile = function (target, templates) {
	    templates = templates || {};
	    if (typeof(target) === 'string') {
	        return exports.compile(document.querySelectorAll(target), templates);
	    }
	    if (target instanceof NodeList) {
	        for (var i = 0, len = target.length; i < len; i++) {
	            exports.compile(target[i], templates);
	        }
	        return templates;
	    }
	    if (target.tagName === 'TEMPLATE' && target.content) {
	        return exports.compile(target.content, templates);
	    }
	    var compiled = evalTemplates(target);
	    for (var k in compiled) {
	        templates[k] = compiled[k];
	    }
	    return templates;
	};

	exports.patch = function (templates, name, data, element) {
	    new Patcher(element).render(templates, name, data);
	};


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

	/**
	 * Processes render events (e.g. enterTag, exitTag) and matches them against the
	 * current state of the DOM. Where there is a mismatch a transform function is
	 * called to reconcile the differences. The Patcher code should only _read_ the
	 * DOM, performing DOM mutation only through transform calls.
	 */

	var transforms = __webpack_require__(3);
	var utils = __webpack_require__(5);
	var html = __webpack_require__(4);
	var Set = __webpack_require__(6);

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
	    if (!node.bound_events) {
	        return;
	    }
	    for (var type in node.bound_events) {
	        if (!node.visited_events.has(type)) {
	            transforms.removeEventListener(node, type, node.bound_events[type].fn);
	            delete node.bound_events[type];
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
	        var handler = node.bound_events[type];
	        if (handler.path) {
	            var args = handler.args.map(function (arg) {
	                if (arg === Patcher.prototype.EVENT) {
	                    return event;
	                }
	                return arg;
	            });
	            var fn = utils.lookup(node.handlers, handler.path);
	            if (!fn) {
	                throw new Error(
	                    "on" + type + ": no '" + handler.path.join('.') + "' handler defined"
	                );
	            }
	            fn.apply(handler.template_root, args);
	        }
	    };
	}

	function setListener(node, type) {
	    if (!node.bound_events) {
	        node.bound_events = {};
	    }
	    if (!node.bound_events.hasOwnProperty(type)) {
	        var fn = makeHandler(node, type);
	        node.bound_events[type] = {fn: fn};
	        transforms.addEventListener(node, type, fn);
	    }
	    node.visited_events.add(type);
	}

	Patcher.prototype.eventListener = function (type, handler_path, args, handlers) {
	    var node = this.parent;
	    if (node.handlers !== handlers) {
	        node.handlers = handlers;
	    }
	    setListener(node, type);
	    var event = node.bound_events[type];
	    event.path = handler_path;
	    event.args = args;
	    event.template_root = this.template_root;
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
	    return node.bound_events &&
	        node.bound_events[type] &&
	        node.bound_events[type].fn;
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

	Patcher.prototype.render = function (templates, name, data, handlers, root_key, root_attrs, inner) {
	    if (!templates[name]) {
	        this.enterTag(name.toUpperCase(), null);
	        this.exitTag();
	        return;
	    }
	    var template = templates[name];
	    if (template._render) {
	        var tmp = this.template_root;
	        this.template_root = null;
	        template._render.call(templates, this, data, handlers, root_key, root_attrs, inner);
	        this.template_root = tmp;
	    }
	    else {
	        this.enterTag(name.toUpperCase(), null);
	        template(this.parent, data, handlers);
	        this.exitTag();
	    }
	};


/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

	/**
	 * DOM mutation procedures called by the patcher. This module provides
	 * a cleaner API for our purposes and a place to intercept and
	 * monitor mutations during testing.
	 */

	var html = __webpack_require__(4);


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
/* 4 */
/***/ (function(module, exports) {

	var BOOLEAN_ATTRIBUTE = exports.BOOLEAN_ATTRIBUTE = 1;
	var USE_PROPERTY = exports.USE_PROPERTY = 2;
	var USE_STRING = exports.USE_STRING = 4;

	exports.attributes = {
	    'allowfullscreen': BOOLEAN_ATTRIBUTE,
	    'async': BOOLEAN_ATTRIBUTE,
	    'autofocus': BOOLEAN_ATTRIBUTE,
	    'autoplay': BOOLEAN_ATTRIBUTE,
	    'capture': BOOLEAN_ATTRIBUTE,
	    'checked': BOOLEAN_ATTRIBUTE | USE_PROPERTY,
	    'controls': BOOLEAN_ATTRIBUTE,
	    'default': BOOLEAN_ATTRIBUTE,
	    'defer': BOOLEAN_ATTRIBUTE,
	    'disabled': BOOLEAN_ATTRIBUTE,
	    'formnovalidate': BOOLEAN_ATTRIBUTE,
	    'hidden': BOOLEAN_ATTRIBUTE,
	    'itemscope': BOOLEAN_ATTRIBUTE,
	    'loop': BOOLEAN_ATTRIBUTE,
	    'multiple': BOOLEAN_ATTRIBUTE | USE_PROPERTY,
	    'muted': BOOLEAN_ATTRIBUTE | USE_PROPERTY,
	    'novalidate': BOOLEAN_ATTRIBUTE,
	    'open': BOOLEAN_ATTRIBUTE,
	    'readonly': BOOLEAN_ATTRIBUTE,
	    'required': BOOLEAN_ATTRIBUTE,
	    'reversed': BOOLEAN_ATTRIBUTE,
	    'selected': BOOLEAN_ATTRIBUTE | USE_PROPERTY,
	    'value': USE_PROPERTY | USE_STRING
	};



/***/ }),
/* 5 */
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

	exports.shallowClone = function (obj) {
	    var result = {};
	    for (var k in obj) {
	        result[k] = obj[k];
	    }
	    return result;
	    // return Object.assign({}, obj);
	};

	exports.eachAttribute = function (node, f) {
	    var attrs = node.attributes;
	    for (var i = 0, len = node.attributes.length; i < len; i++) {
	        f(node.attributes[i].name, node.attributes[i].value);
	    }
	};


/***/ }),
/* 6 */
/***/ (function(module, exports) {

	// use built in Set() if available
	if (typeof Set === 'undefined') {

	function SetPolyfill() {
	    this.values = [];
	}

	SetPolyfill.prototype.add = function (x) {
	    this.values.push(x);
	};

	SetPolyfill.prototype.has = function (x) {
	    return this.values.indexOf(x) !== -1;
	};

	SetPolyfill.prototype.clear = function () {
	    this.values = [];
	};

	    module.exports = SetPolyfill;
	}
	else {
		module.exports = Set;
	}


/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

	var utils = __webpack_require__(5);
	var html = __webpack_require__(4);
	var make_template = __webpack_require__(8).make_template;


	var IGNORED_ATTRS = [
	    'data-tagname',
	    'data-each',
	    'data-if',
	    'data-unless',
	    'data-key'
	];

	function compileLookup(path) {
	    return 'p.lookup(data, ' + JSON.stringify(path) + ')';
	}

	function compileTemplateContext(node) {
	    var result = [];
	    utils.eachAttribute(node, function (name, value) {
	        if (IGNORED_ATTRS.indexOf(name) === -1) {
	            result.push(JSON.stringify(name) + ": " + compileExpandVariables(value));
	        }
	    });
	    return '{' + result.join(', ') + '}';
	}

	function compileListener(event_name, value) {
	    var start = value.indexOf('(');
	    var end = value.lastIndexOf(')');
	    var handler_name = value.substring(0, start);
	    var parts = value.substring(start + 1, end).split(',');
	    var args = [];
	    for (var i = 0, len = parts.length; i < len; i++) {
	        var part = utils.trim(parts[i]);
	        if (!part) {
	            continue;
	        }
	        if (part === 'event') {
	            args.push('p.EVENT');
	        }
	        else {
	            args.push(compileLookup(utils.propertyPath(part)));
	        }
	    }
	    return 'p.eventListener(' +
	        JSON.stringify(event_name) + ', ' +
	        JSON.stringify(handler_name.split('.')) + ', ' +
	        '[' + args.join(', ') + '], ' +
	        'handlers);\n';
	}

	function compileExtraAttrs(node) {
	    var extra_attrs = '';
	    utils.eachAttribute(node, function (name, value) {
	        var event = name.match(/^on(.*)/);
	        if (event) {
	            extra_attrs += compileListener(event[1], value);
	        }
	    });
	    return extra_attrs;
	}

	// TODO: split out into compileTemplateCall, compileInner, compileHTMLElement etc. ?
	function compileElement(node, queue, write, is_root) {
	    if (node.tagName === 'TEMPLATE-EMBED') {
	        // ignored client-side
	        return;
	    }
	    if (node.tagName === 'TEMPLATE-CHILDREN') {
	        write('inner();\n');
	        return;
	    }
	    if (!is_root && node.tagName === 'TEMPLATE' && node.dataset.tagname) {
	        // compile this template later
	        queue.push(node);
	        // TODO validate node.dataset.tagname includes hyphen
	        return;
	    }
	    if (node.dataset.each) {
	        var parts = node.dataset.each.split(/\s+in\s+/);
	        var name = parts[0];
	        var iterable_path = utils.propertyPath(parts[1]);
	        write('p.each(' +
	              'data, ' +
	              JSON.stringify(name) + ', ' +
	              compileLookup(iterable_path) + ', ' +
	              'function (data) {\n');
	    }
	    if (node.dataset.if) {
	        var predicate1_path = utils.propertyPath(node.dataset.if);
	        write('if (p.isTruthy(' + compileLookup(predicate1_path) + ')) {\n');
	    }
	    if (node.dataset.unless) {
	        var predicate2_path = utils.propertyPath(node.dataset.unless);
	        write('if (!p.isTruthy(' + compileLookup(predicate2_path) + ')) {\n');
	    }
	    var is_html = true;
	    if (node.tagName == 'TEMPLATE-CALL') {
	        // not a known HTML tag, assume template reference
	        write('p.render(' +
	              'templates' +
	              ', ' + compileExpandVariables(node.getAttribute('template')) +
	              ', ' + compileTemplateContext(node) +
	              ', handlers' +
	              ', ' + (node.dataset.key ? compileExpandVariables(node.dataset.key) : 'null') +
	              ', function () {' + compileExtraAttrs(node) + '}' +
	              (node.childNodes.length ? ', function () {' : ');') + '\n');
	        is_html = false;
	    }
	    else if (node.tagName.indexOf('-') !== -1) {
	        // not a known HTML tag, assume template reference
	        write('p.render(' +
	              'templates' +
	              ', ' + JSON.stringify(node.tagName.toLowerCase()) +
	              ', ' + compileTemplateContext(node) +
	              ', handlers' +
	              ', ' + (node.dataset.key ? compileExpandVariables(node.dataset.key) : 'null') +
	              ', function () {' + compileExtraAttrs(node) + '}' +
	              (node.childNodes.length ? ', function () {' : ');') + '\n');
	        is_html = false;
	    }
	    else {
	        var tag = node.tagName;
	        if (tag === 'TEMPLATE' && node.dataset.tagname) {
	            tag = node.dataset.tagname.toUpperCase();
	        }
	        if (is_root) {
	            // check if a key was passed into this template by caller
	            if (node.dataset.key) {
	                write('p.enterTag(' +
	                      JSON.stringify(tag) + ', ' +
	                      'root_key || ' + compileExpandVariables(node.dataset.key) + ');\n');
	            }
	            else {
	                write('p.enterTag(' + JSON.stringify(tag) + ', root_key || null);\n');
	            }
	        }
	        else if (node.dataset.key) {
	            write('p.enterTag(' +
	                  JSON.stringify(tag) + ', ' +
	                  compileExpandVariables(node.dataset.key) + ');\n');
	        }
	        else {
	            write('p.enterTag(' + JSON.stringify(tag) + ', null);\n');
	        }
	        utils.eachAttribute(node, function (name, value) {
	            if (name === 'data-template') {
	                name = 'data-bind';
	            }
	            if (IGNORED_ATTRS.indexOf(name) !== -1) {
	                return;
	            }
	            var event = name.match(/^on(.*)/);
	            if (event) {
	                write(compileListener(event[1], value));
	            }
	            else if (html.attributes[name] & html.BOOLEAN_ATTRIBUTE) {
	                if (value === "") {
	                    // empty boolean attribute is always true
	                    write('p.attribute(' + JSON.stringify(name) + ', true);\n');
	                }
	                else {
	                    write('if (p.isTruthy(' + compileExpandVariables(value) + ')) {\n');
	                    write('p.attribute(' + JSON.stringify(name) + ', true);\n');
	                    write('}\n');
	                }
	            }
	            else {
	                write('p.attribute(' +
	                      JSON.stringify(name) + ', ' +
	                      compileExpandVariables(value) + ');\n');
	            }
	        });
	        if (is_root) {
	            // expand any extra attributes passed into template call
	            // from calling tag (e.g. onchange)
	            write('if (extra_attrs) { extra_attrs(); }\n');
	        }
	    }
	    var children = (node.tagName == 'TEMPLATE') ?
	            node.content.childNodes:
	            node.childNodes;
	    
	    utils.eachNode(children, function (node) {
	        compileNode(node, queue, write, false);
	    });
	    if (is_html) {
	        write('p.exitTag();\n');
	    }
	    else if (children.length) {
	        // end inner function of template call
	        write('});\n');
	    }
	    if (node.dataset.unless) {
	        write('}\n');
	    }
	    if (node.dataset.if) {
	        write('}\n');
	    }
	    if (node.dataset.each) {
	        write('});\n');
	    }
	}

	function compileExpandVariables(str, boolean) {
	    var parts = str.split(/{{\s*|\s*}}/);
	    var length = parts.length;
	    var i = -1;
	    while (++i < length) {
	        if (i % 2) {
	            var path = utils.propertyPath(parts[i]);
	            parts[i] = path;
	        }
	    }
	    // presence of empty boolean property is actually truthy
	    if (length == 1 && !parts[0] && boolean) {
	        return 'true';
	    }
	    // otherwise build a result string by expanding nested variables
	    var result_parts = [];
	    var j = -1;
	    while (++j < length) {
	        if (parts[j].length) {
	            result_parts.push(
	                (j % 2) ? compileLookup(parts[j]): JSON.stringify(parts[j])
	            );
	        }
	    }
	    if (!result_parts.length) {
	        return JSON.stringify('');
	    }
	    return result_parts.join(' + ');
	}

	function compileText(node, write) {
	    var arg = compileExpandVariables(node.textContent);
	    if (arg[0] === '"') {
	        write('p.text(' + arg + ');\n');
	    }
	    else {
	        // coerce to string
	        write('p.text("" + ' + arg + ');\n');
	    }
	}

	function compileDocumentFragment(fragment, queue, write) {
	    utils.eachNode(fragment.childNodes, function (node) {
	        compileNode(node, queue, write, false);
	    });
	}

	function compileNode(node, queue, write, is_root) {
	    switch (node.nodeType) {
	    case 1: compileElement(node, queue, write, is_root); break;
	    case 3: compileText(node, write); break;
	    case 11: compileDocumentFragment(node, queue, write); break;
	    }
	}

	function ignore_output(str) {}

	exports.compile = function (node, write) {
	    var queue = [];
	    compileNode(
	        node,
	        queue,
	        ignore_output,
	        // if current node is not a template, ignore output until
	        // a template node is found
	        !(node.tagName == 'TEMPLATE' &&
	          node.dataset &&
	          node.dataset.hasOwnProperty('tagname'))
	    );
	    write('({\n');
	    while (queue.length) {
	        node = queue.shift();
	        if (node.dataset.tagname.indexOf('-') === -1) {
	            throw new Error(
	                "Error compiling template '" + node.dataset.tagname +
	                    "': data-tagname must include a hyphen"
	            );
	        }
	        // TODO validate node.dataset.tagname includes hyphen
	        write(JSON.stringify(node.dataset.tagname) + ': ');
	        write('make_template(' +
	              'function (p, data, handlers, root_key, extra_attrs, inner) {\n');
	        write('var templates = this;\n');
	        compileNode(node, queue, write, true);
	        write('})' + (queue.length ? ',' : '') + '\n');
	    }
	    write('})\n');
	};

	exports.compileToString = function (node) {
	    var result = '(function (make_template) { return ';
	    exports.compile(node, function (str) {
	        result += str;
	    });
	    return result + '})';
	};

	exports.eval = function (node) {
	    // console.log(exports.compileToString(node));
	    return eval(exports.compileToString(node))(make_template);
	};


/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

	var Patcher = __webpack_require__(2).Patcher;

	exports.make_template = function (render) {
	    var f = function (node, data, handlers) {
	        var patcher = new Patcher(node);
	        return render.call(this, patcher, data, handlers);
	    };
	    f._render = render;
	    return f;
	};


/***/ })
/******/ ]);