var render =
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

	module.exports = __webpack_require__(3);


/***/ }),
/* 1 */,
/* 2 */,
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

	/**
	 * Walks a template node tree, sending render events to the patcher via method
	 * calls. All interaction with the DOM should be done in the patcher/transforms,
	 * these functions only process template nodes and prev/next data in order to
	 * emit events.
	 */

	var utils = __webpack_require__(4);


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

	exports.isTemplateTag = function (node) {
	    return /^TEMPLATE-/.test(node.tagName);
	};

	exports.templateTagName = function (node) {
	    if (node._template_tag) {
	        return node._template_tag;
	    }
	    var m = /^TEMPLATE-([^\s/>]+)/.exec(node.tagName);
	    if (!m) {
	        throw new Error('Not a template tag: ' + node.tagName);
	    }
	    node._template_tag = m[1].toLowerCase();
	    return node._template_tag;
	};


/***/ })
/******/ ]);