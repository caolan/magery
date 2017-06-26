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

	module.exports = __webpack_require__(2);


/***/ }),
/* 1 */,
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

	/**
	 * Walks a template node tree, sending render events to the patcher via method
	 * calls. All interaction with the DOM should be done in the patcher/transforms,
	 * these functions only process template nodes and prev/next data in order to
	 * emit events.
	 */

	var utils = __webpack_require__(3);
	var builtins = __webpack_require__(4);

	var ELEMENT_NODE = 1;
	var TEXT_NODE = 3;


	function isTemplateTag(node) {
	    return /^TEMPLATE-/.test(node.tagName);
	}

	function templateTagName(node) {
	    if (node._template_tag) {
	        return node._template_tag;
	    }
	    var m = /^TEMPLATE-([^\s/>]+)/.exec(node.tagName);
	    if (!m) {
	        throw new Error('Not a template tag: ' + node.tagName);
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
	    this.children(template.content, next_data, prev_data, null, inner);
	};

	Renderer.prototype.child = function (node, i, next_data, prev_data, key, inner) {
	    if (node.nodeType === TEXT_NODE) {
	        this.text(node, next_data);
	    }
	    else if (isTemplateTag(node)) {
	        this.templateTag(node, next_data, prev_data, key, inner);
	    }
	    else if (node.nodeType === ELEMENT_NODE) {
	        var k = key && key + '/' + i;
	        this.element(node, next_data, prev_data, k, inner);
	    }
	};

	Renderer.prototype.children = function (parent, next_data, prev_data, key, inner) {
	    var self = this;
	    utils.eachNode(parent.childNodes, function (node, i) {
	        self.child(node, i, next_data, prev_data, key, inner);
	    });
	};

	Renderer.prototype.flushText = function () {
	    if (this.text_buffer) {
	        this.patcher.text(this.text_buffer);
	        this.text_buffer = null;
	    }
	};

	Renderer.prototype.element = function (node, next_data, prev_data, key, inner) {
	    this.flushText();
	    this.patcher.enterTag(node.tagName, key);
	    for (var i = 0, len = node.attributes.length; i < len; i++) {
	        var attr = node.attributes[i];
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
	    this.children(node, next_data, prev_data, null, inner);
	    this.flushText();
	    this.patcher.exitTag();
	};

	Renderer.prototype.expandVars = function (str, data) {
	    return str.replace(/{{\s*([^}]+?)\s*}}/g,
	        function (full, property) {
	            return exports.lookup(data, exports.propertyPath(property));
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

	Renderer.prototype.templateTag = function (node, next_data, prev_data, key, inner) {
	    var name = templateTagName(node);
	    var f = builtins[name];
	    if (!f) {
	        throw new Error('Unknown template tag: ' + node.tagName);
	    }
	    return f(this, node, next_data, prev_data, key, inner);
	};

	exports.Renderer = Renderer;


/***/ }),
/* 3 */
/***/ (function(module, exports) {

	exports.htmlEscape = function (str) {
	    return String(str)
	        .replace(/&/g, '&amp;')
	        .replace(/"/g, '&quot;')
	        .replace(/'/g, '&#39;')
	        .replace(/</g, '&lt;')
	        .replace(/>/g, '&gt;');
	};

	exports.eachNode = function (nodelist, f) {
	    var i = 0;
	    var node = nodelist[0];
	    while (node) {
	        var tmp = node;
	        // need to call nextSibling before f() because f()
	        // might remove the node from the DOM
	        node = node.nextSibling;
	        f(tmp, i++);
	    }
	};


/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

	var render = __webpack_require__(2);

	function getAttr(node, name) {
	    var attr = node.attributes.getNamedItem(name);
	    if (attr) {
	        return attr.value;
	    }
	    throw new Error(
	        render.errorMessage(
	            node,
	            node.tagName + " missing required attribute '" + name + "'"
	        )
	    );
	}

	function hasAttr(node, name) {
	    return !!(node.attributes.getNamedItem(name));
	}

	// TODO: remove this counter side-effect and handle in the template init?
	var each_counter = 0;
	exports['each'] = function (renderer, node, next_data, prev_data, key, inner) {
	    // the counter is to avoid adjacent each blocks from
	    // interfering with each others keys
	    var count = node.count;
	    if (!count) {
	        count = node.count = each_counter++;
	    }
	    var path = render.propertyPath(getAttr(node, 'in'));
	    var iterable = render.lookup(next_data, path);
	    var key_path = null;
	    if (hasAttr(node, 'key')) {
	        key_path = render.propertyPath(getAttr(node, 'key'));
	    }
	    for (var i = 0, len = iterable.length; i < len; i++) {
	        var item = iterable[i];
	        var d = Object.assign({}, next_data);
	        d[getAttr(node, 'name')] = item;
	        var item_key = key_path && render.lookup(item, key_path);
	        var k = key;
	        if (item_key) {
	            if (k) {
	                k += '/' + item_key;
	            }
	            else {
	                k = item_key;
	            }
	        }
	        k = k && count + '/' + k;
	        renderer.children(node, d, prev_data, k);
	    }
	};

	function isTruthy(x) {
	    if (Array.isArray(x)) {
	        return x.length > 0;
	    }
	    return x;
	}

	exports['if'] = function (renderer, node, next_data, prev_data, key, inner) {
	    var path = render.propertyPath(getAttr(node, 'test'));
	    var test = render.lookup(next_data, path);
	    if (isTruthy(test)) {
	        renderer.children(node, next_data, prev_data, key, inner);
	    }
	};

	exports['unless'] = function (renderer, node, next_data, prev_data, key, inner) {
	    var path = render.propertyPath(getAttr(node, 'test'));
	    var test = render.lookup(next_data, path);
	    if (!isTruthy(test)) {
	        renderer.children(node, next_data, prev_data, key, inner);
	    }
	};

	exports['call'] = function (renderer, node, next_data, prev_data, key, inner) {
	    var template_id = renderer.expandVars(getAttr(node, 'template'), next_data);
	    var nd = {};
	    for (var i = 0, len = node.attributes.length; i < len; i++) {
	        var name = node.attributes[i].name;
	        if (name !== 'template') {
	            var path = render.propertyPath(node.attributes[i].value);
	            var value = render.lookup(next_data, path);
	            nd[name] = value;
	        }
	    }
	    var inner2 = function () {
	        renderer.children(node, next_data, prev_data, key, inner);
	    };
	    renderer.renderTemplate(template_id, nd, prev_data, inner2);
	};

	exports['children'] = function (renderer, node, next_data, prev_data, key, inner) {
	    inner();
	};


/***/ })
/******/ ]);