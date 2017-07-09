var init =
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

	module.exports = __webpack_require__(8);


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

/***/ 8:
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
	                node._each_name = parts[0];
	                node._each_iterable = path;
	            }
	            if (attr.name == 'data-if') {
	                path = utils.propertyPath(attr.value);
	                exports.markPath(paths, path);
	                node._if = path;
	            }
	            else if (attr.name == 'data-unless') {
	                path = utils.propertyPath(attr.value);
	                exports.markPath(paths, path);
	                node._unless = path;
	            }
	            else if (attr.name == 'data-key') {
	                exports.mergePaths(paths, exports.stringPaths(attr.value));
	                node._key = attr.value;
	            }
	            else {
	                exports.mergePaths(paths, exports.stringPaths(attr.value));
	            }
	        }
	        node.removeAttribute('data-each');
	        node.removeAttribute('data-if');
	        node.removeAttribute('data-unless');
	        node.removeAttribute('data-key');
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
	            node._template_call = attr.value;
	        }
	        else {
	            exports.markPath(paths, utils.propertyPath(attr.value));
	        }
	    }
	    paths = updateChildPaths(paths, node);
	    return paths;
	}

	function templateChildrenPaths(node) {
	    node._template_children = true;
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
	    else if (utils.isTemplateTag(node)) {
	        var name = utils.templateTagName(node);
	        var f = templateTags[name];
	        if (!f) {
	            throw new Error('Unknown template tag: ' + node.tagName);
	        }
	        return f(node);
	    }
	    else if (utils.isElementNode(node) || utils.isDocumentFragment(node)) {
	        return exports.elementPaths(node);
	    }
	    return false;
	}

	exports.initTemplates = function () {
	    var templates = document.getElementsByTagName('template');
	    for (var i = 0, len = templates.length; i < len; i++) {
	        var tmpl = templates[i].content;
	        var paths = initNode(tmpl);
	        tmpl.static = (paths && Object.keys(paths).length === 0);
	        tmpl.active_paths = paths;
	        tmpl.initialized = true;
	    }
	};


/***/ })

/******/ });