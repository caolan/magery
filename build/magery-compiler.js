var MageryCompiler =
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

	exports.compileToString = __webpack_require__(1).compileToString;

	exports.compile = function (target, templates, runtime) {
	    runtime = runtime || window.Magery;
	    templates = templates || {};
	    if (typeof(target) === 'string') {
	        return exports.compile(document.querySelectorAll(target), templates, runtime);
	    }
	    var compiled = eval(exports.compileToString(target))(runtime);
	    for (var k in compiled) {
	        templates[k] = compiled[k];
	    }
	    return templates;
	};



/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

	var utils = __webpack_require__(2);
	var html = __webpack_require__(3);


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
	        if (IGNORED_ATTRS.indexOf(name) === -1 && name.substr(0, 2) !== 'on') {
	            result.push(
	                JSON.stringify(name) + ": " + compileExpandVariables(value)
	            );
	        }
	    });
	    return '{' + result.join(', ') + '}';
	}

	function compileListener(event_name, value) {
	    var start = value.indexOf('(');
	    var end = value.lastIndexOf(')');
	    var handler_name = value.substring(0, start);
	    var args_raw = value.substring(start + 1, end);
	    return 'p.eventListener(' +
	        JSON.stringify(event_name) + ', ' +
	        JSON.stringify(handler_name.split('.')) + ', ' +
	        JSON.stringify('[' + args_raw + ']') + ', ' +
	        'data, ' +
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
	    var children = (node.tagName == 'TEMPLATE') ?
	            node.content.childNodes:
	            node.childNodes;

	    var is_html = true;
	    if (node.tagName == 'TEMPLATE-CALL') {
	        // not a known HTML tag, assume template reference
	        write('p.render(' +
	              'templates' +
	              ', ' + compileExpandVariables(node.getAttribute('template')) +
	              ', ' + "Object.assign( {}, data," + compileTemplateContext(node) + ")" +
	              ', handlers' +
	              ', ' + (node.dataset.key ? compileExpandVariables(node.dataset.key) : 'null') +
	              ', function () {' + compileExtraAttrs(node) + '}' +
	              (children.length ? ', p.wrapChildren(function (p) {' : ');') + '\n');
	        is_html = false;
	    }
	    else if (node.tagName.indexOf('-') !== -1) {
	        // not a known HTML tag, assume template reference
	        write('p.render(' +
	              'templates' +
	              ', ' + JSON.stringify(node.tagName.toLowerCase()) +
	              ', ' + "Object.assign( {}, data," + compileTemplateContext(node) + ")" +
	              ', handlers' +
	              ', ' + (node.dataset.key ? compileExpandVariables(node.dataset.key) : 'null') +
	              ', function () {' + compileExtraAttrs(node) + '}' +
	              (children.length ? ', p.wrapChildren(function (p) {' : ');') + '\n');
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
	    utils.eachNode(children, function (node) {
	        compileNode(node, queue, write, false);
	    });
	    if (is_html) {
	        write('p.exitTag();\n');
	    }
	    else if (children.length) {
	        // end inner function of template call
	        write('}));\n');
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
	    var txt = compileExpandVariables(node.textContent);
	    if (txt[0] !== '"') {
	        // coerce to string
	        txt = '""+' + txt;
	    }
	    if (node.parentNode.tagName === 'TEXTAREA') {
	        // TODO: this could potentially overwrite previous text if its
	        // possible for a textarea to contain multiple text nodes -
	        // however, I've not seen any markup inside a textarea parsed
	        // into separate text nodes yet.

	        // if we're inside a textarea, use the value property instead
	        write('p.attribute("value", ' + txt + ');\n');
	    }
	    else {
	        write('p.text(' + txt + ');\n');
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

	exports.compile = function (nodes, write) {
	    var queue = [];
	    if (!(nodes instanceof NodeList)) {
	        nodes = [nodes];
	    }
	    for (var i = 0, len = nodes.length; i < len; i++) {
	        var node = nodes[i];
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
	    }
	    write('({\n');
	    while (queue.length) {
	        node = queue.shift();
	        if (node.dataset.tagname.indexOf('-') === -1) {
	            throw new Error(
	                "Error compiling template '" + node.dataset.tagname +
	                    "': data-tagname must include a hyphen"
	            );
	        }
	        write(JSON.stringify(node.dataset.tagname) + ': ');
	        write('Magery._template(' +
	              'function (p, data, handlers, root_key, extra_attrs, inner) {\n');
	        write('var templates = this;\n');
	        compileNode(node, queue, write, true);
	        write('})' + (queue.length ? ',' : '') + '\n');
	    }
	    write('})\n');
	};

	exports.compileToString = function (node) {
	    var result = '(function (Magery) { return ';
	    exports.compile(node, function (str) {
	        result += str;
	    });
	    return result + '})';
	};


/***/ }),
/* 2 */
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



/***/ })
/******/ ]);