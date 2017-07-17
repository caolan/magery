var compile =
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

	module.exports = __webpack_require__(9);


/***/ }),
/* 1 */,
/* 2 */,
/* 3 */,
/* 4 */,
/* 5 */
/***/ (function(module, exports) {

	var BOOLEAN_ATTRIBUTE = exports.BOOLEAN_ATTRIBUTE = 1;
	var USE_PROPERTY = exports.USE_PROPERTY = 2;

	exports.attributes = {
	    'checked': BOOLEAN_ATTRIBUTE | USE_PROPERTY,
	    'selected': BOOLEAN_ATTRIBUTE | USE_PROPERTY,
	    'value': USE_PROPERTY
	};



/***/ }),
/* 6 */
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
/* 7 */,
/* 8 */,
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

	var html = __webpack_require__(5);
	var utils = __webpack_require__(6);


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