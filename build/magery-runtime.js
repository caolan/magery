var Magery =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

	var Patcher = __webpack_require__(1).Patcher;
	
	exports._template = function (render) {
	    var f = function (node, data, handlers) {
	        var patcher = new Patcher(node);
	        return render.call(this, patcher, data, handlers);
	    };
	    f._render = render;
	    return f;
	};


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
	var html = __webpack_require__(3);
	
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
	        if (!node.visited_attributes.hasOwnProperty(attr.name)) {
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
	        if (!node.visited_events.hasOwnProperty(type)) {
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
	    node.visited_attributes = {};
	    node.visited_events = {};
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
	            var context = utils.shallowClone(handler.data);
	            context.event = event;
	            with (context) {
	                var args = eval(handler.args);
	            }
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
	    node.visited_events[type] = null;
	}
	
	Patcher.prototype.eventListener = function (type, handler_path, args, data, handlers) {
	    var node = this.parent;
	    if (node.handlers !== handlers) {
	        node.handlers = handlers;
	    }
	    setListener(node, type);
	    var event = node.bound_events[type];
	    event.path = handler_path;
	    event.args = args;
	    event.data = data;
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
	    node.visited_attributes[name] = null;
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
	    if (this.parent.tagName !== 'TEXTAREA') {
	        deleteChildren(this.transforms, this.parent, this.current);
	    }
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
	        // it's a compiled magery template
	        var tmp = this.template_root;
	        this.template_root = null;
	        template._render.call(templates, this, data, handlers, root_key, root_attrs, inner);
	        this.template_root = tmp;
	    }
	    else {
	        // it's a custom template function
	        this.enterTag(name.toUpperCase(), null);
	        // bind any event handlers added to custom tag call:
	        root_attrs();
	        template(this.parent, data, handlers, inner);
	        // do exitTag *without* cleaning up unvisited nodes/attributes/etc
	        var node = this.parent;
	        this.parent = node.parentNode;
	        this.current = node.nextSibling;
	    }
	};
	
	
	Patcher.prototype.wrapChildren = function (fn) {
	    var self = this;
	    return function (parent) {
	        if (parent) {
	            var p = new Patcher(parent);
	            p.parent = parent;
	            p.current = parent.firstChild;
	            fn(p);
	        }
	        else {
	            fn(self);
	        }
	    };
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


/***/ })
/******/ ]);
//# sourceMappingURL=magery-runtime.js.map