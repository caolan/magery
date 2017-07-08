var builtins =
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
/******/ ({

/***/ 0:
/***/ (function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(9);


/***/ }),

/***/ 4:
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


/***/ }),

/***/ 9:
/***/ (function(module, exports, __webpack_require__) {

	var utils = __webpack_require__(4);

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

	// exports['each'] = function (renderer, node, next_data, prev_data, inner) {
	//     var path = utils.propertyPath(getAttr(node, 'in'));
	//     var iterable = utils.lookup(next_data, path);
	//     for (var i = 0, len = iterable.length; i < len; i++) {
	//         var item = iterable[i];
	//         var d = Object.assign({}, next_data);
	//         d[getAttr(node, 'name')] = item;
	//         renderer.children(node, d, prev_data);
	//     }
	// };

	// function isTruthy(x) {
	//     if (Array.isArray(x)) {
	//         return x.length > 0;
	//     }
	//     return x;
	// }

	// exports['if'] = function (renderer, node, next_data, prev_data, inner) {
	//     var path = utils.propertyPath(getAttr(node, 'test'));
	//     var test = utils.lookup(next_data, path);
	//     if (isTruthy(test)) {
	//         renderer.children(node, next_data, prev_data, inner);
	//     }
	// };

	// exports['unless'] = function (renderer, node, next_data, prev_data, inner) {
	//     var path = utils.propertyPath(getAttr(node, 'test'));
	//     var test = utils.lookup(next_data, path);
	//     if (!isTruthy(test)) {
	//         renderer.children(node, next_data, prev_data, inner);
	//     }
	// };

	exports['call'] = function (renderer, node, next_data, prev_data, inner) {
	    var template_id = renderer.expandVars(getAttr(node, 'template'), next_data);
	    var nd = {};
	    for (var i = 0, len = node.attributes.length; i < len; i++) {
	        var name = node.attributes[i].name;
	        if (name !== 'template') {
	            var path = utils.propertyPath(node.attributes[i].value);
	            var value = utils.lookup(next_data, path);
	            nd[name] = value;
	        }
	    }
	    var inner2 = function () {
	        renderer.children(node, next_data, prev_data, inner);
	    };
	    renderer.renderTemplate(template_id, nd, prev_data, inner2);
	};

	exports['children'] = function (renderer, node, next_data, prev_data, inner) {
	    inner();
	};


/***/ })

/******/ });