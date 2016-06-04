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
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var parsers = __webpack_require__(1);
	var render = __webpack_require__(4);
	var patch = __webpack_require__(6);


	/***** Public API *****/

	exports.loadTemplates = parsers.loadTemplates;

	exports.patch = function (templates, name, node, next_data, prev_data, first_pass) {
	    var patcher = new patch.Patcher(node);
	    var renderer = new render.Renderer(patcher, templates, first_pass);
	    renderer.render(name, next_data, prev_data);
	};


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Tools for converting any raw template data into structured form
	 */

	var p = __webpack_require__(2);
	var utils = __webpack_require__(3);


	function parseHTML(src) {
	    var html = document.createElement('html');
	    html.innerHTML = src;
	    return html;
	}

	function parseDefineContents(src) {
	    var html = parseHTML(src);
	    var result = {};
	    var node = html.childNodes[0];
	    while (node) {
	        switch (node.tagName) {
	            case 'HEAD': result.head = node; break;
	            case 'BODY': result.body = node; break;
	        }
	        node = node.nextSibling;
	    }
	    return result;
	};

	exports.parseParams = function (str) {
	    return str ?
	        runParser('parameters', tagParameters, str):
	        {args: [], kwargs: null};
	};

	function runParser(name, parser, str) {
	    var result = parser.parse(str);
	    if (result.status === false) {
	        var e = new Error(
	            result.expected?
	                'Expected: ' + result.expected.join(' or ') +
	                    ' at \'' + str.substr(result.index) + '\'':
	                'Failed to parse ' + name
	        );
	        for (var k in result) {
	            if (result.hasOwnProperty(k)) {
	                e[k] = result[k];
	            }
	        }
	        throw e;
	    }
	    return result.value;
	};

	var basicString = p.regex(/(?!{{)[\s\S]+?(?={{)/)
	    .desc('non-template chars');

	var variableName = p.regex(/\s*(?!\d)(\.|(?:(?:[^"\.\s\,=}/]\.?)+))/, 1)
	    .desc('variable name')
	    .map(function (x) {
	        return {type: 'property', value: x};
	     });

	var trueLiteral = p.string('true').skip(p.optWhitespace)
	    .result({type: 'boolean', value: true});

	var falseLiteral = p.string('false').skip(p.optWhitespace)
	    .result({type: 'boolean', value: false});

	var booleanLiteral = p.alt(trueLiteral, falseLiteral).desc('boolean');

	var numberLiteral = p.regex(/-?(0|[1-9]\d*)([.]\d+)?(e[+-]?\d+)?/i)
	    .skip(p.optWhitespace)
	    .desc('numeral')
	    .map(function (x) {
	        return {type: 'number', value: Number(x)};
	    });

	var stringLiteral = p.regex(/"((?:\\.|.)*?)"/, 1)
	    .skip(p.optWhitespace)
	    .desc('quoted string')
	    .map(interpretEscapes)
	    .map(function (x) {
	        return {type: 'string', value: x};
	    });

	// thanks to parsimmon json example
	function interpretEscapes(str) {
	  var escapes = {
	    b: '\b',
	    f: '\f',
	    n: '\n',
	    r: '\r',
	    t: '\t'
	  };
	  return str.replace(/\\(u[0-9a-fA-F]{4}|[^u])/g, function(_, escape) {
	    var type = escape.charAt(0);
	    var hex = escape.slice(1);
	    if (type === 'u') return String.fromCharCode(parseInt(hex, 16));
	    if (escapes.hasOwnProperty(type)) return escapes[type];
	    return type;
	  });
	}

	var argumentValue = p.alt(
	    booleanLiteral,
	    variableName,
	    stringLiteral,
	    numberLiteral
	).skip(p.optWhitespace);

	var tagPositionalArgument = p.optWhitespace.then(argumentValue)
	    .desc('positional argument');

	var keywordName = p.regex(/(?!\d)([0-9a-zA-Z_]+)=/, 1).desc('key name');

	var tagKeywordArgument = p.optWhitespace.then(
	    p.seqMap(
	        keywordName,
	        argumentValue,
	        function (key, value) {
	            return {
	                type: 'kwarg',
	                key: key,
	                value: value
	            };
	        }
	    )
	).desc('keyword argument');

	var tagParameters = p.alt(
	    tagKeywordArgument,
	    tagPositionalArgument
	).many().map(function (xs) {
	    var kwargs = null;
	    var args = [];
	    for (var i = 0, len = xs.length; i < len; i++) {
	        var x = xs[i];
	        if (x.type === 'kwarg') {
	            if (kwargs === null) {
	                kwargs = {};
	            }
	            kwargs[x.key] = x.value;
	        }
	        else {
	            args.push(x);
	        }
	    }
	    return {
	        args: args,
	        kwargs: kwargs
	    };
	});

	var defineInner = p.regex(/(?!{{[\/#]define[\s}])[\s\S]+?(?={{[\/#]define[\s}])/)
	        .desc('template definition block');

	var defineTag = p.seqMap(
	    p.optWhitespace,
	    p.string("{{#define").desc("{{#define..."),
	    p.whitespace,
	    variableName.desc('definition name'),
	    function (before, define, _, name) {
	        return name.value;
	    }
	).chain(function (name) {
	    return p.alt(
	        p.string("/}}").desc("self-closed tag '/}}'"),
	        p.string("}}").then(defineInner.skip(p.string('{{/define}}')))
	    ).map(function (contents) {
	        return {
	            name: name,
	            contents: contents
	        };
	    });
	});

	var defineTags = defineTag.many().skip(p.optWhitespace);

	exports.translate = function (str) {
	    return str
	        // select tags ignore non-option children when parsing as HTML,
	        // need to rename to keep template tags inside select tags
	        .replace(/<select/gi, '<magery-tag:select')
	        .replace(/<\/select/gi, '</magery-tag:select')
	        .replace(/{{\.\.\.}}/g, '<magery-expand></magery-expand>')
	        .replace(/{{else}}/g, '</magery-block><magery-block data-else="true">')
	        .replace(/{{\/([^\s\/]+)}}/g, '</magery-block></magery:$1>')
	        .replace(/{{#([^\s\/}]+)(?:\s+((?:\s*[^\/}]+)+))?\s*(\/)?}}/g,
	            function (_, tag, args, closed) {
	                return '<magery:' + tag +
	                    (args ? ' params="' + utils.htmlEscape(args) + '"': '') +
	                    '>' + (closed ? '</magery:' + tag + '>' : '<magery-block>');
	            }
	        );
	};

	exports.loadTemplates = function (src) {
	    var templates = {};
	    var defines = runParser('define blocks', defineTags, src);
	    defines.forEach(function (d) {
	        var markup = exports.translate(d.contents);
	        var tree = parseDefineContents(markup);
	        tree.body._template = d.name; // for reporting error paths
	        templates[d.name] = tree;
	    });
	    return templates;
	};


/***/ },
/* 2 */
/***/ function(module, exports) {

	// pass
	var Parsimmon = {};

	Parsimmon.Parser = (function() {
	  "use strict";

	  // The Parser object is a wrapper for a parser function.
	  // Externally, you use one to parse a string by calling
	  //   var result = SomeParser.parse('Me Me Me! Parse Me!');
	  // You should never call the constructor, rather you should
	  // construct your Parser from the base parsers and the
	  // parser combinator methods.
	  function Parser(action) {
	    if (!(this instanceof Parser)) return new Parser(action);
	    this._ = action;
	  };

	  var _ = Parser.prototype;

	  function makeSuccess(index, value) {
	    return {
	      status: true,
	      index: index,
	      value: value,
	      furthest: -1,
	      expected: []
	    };
	  }

	  function makeFailure(index, expected) {
	    return {
	      status: false,
	      index: -1,
	      value: null,
	      furthest: index,
	      expected: [expected]
	    };
	  }

	  function mergeReplies(result, last) {
	    if (!last) return result;
	    if (result.furthest > last.furthest) return result;

	    var expected = (result.furthest === last.furthest)
	      ? result.expected.concat(last.expected)
	      : last.expected;

	    return {
	      status: result.status,
	      index: result.index,
	      value: result.value,
	      furthest: last.furthest,
	      expected: expected
	    }
	  }

	  function assertParser(p) {
	    if (!(p instanceof Parser)) throw new Error('not a parser: '+p);
	  }

	  function formatExpected(expected) {
	    if (expected.length === 1) return expected[0];

	    return 'one of ' + expected.join(', ')
	  }

	  function formatGot(stream, error) {
	    var i = error.index;

	    if (i === stream.length) return ', got the end of the stream'


	    var prefix = (i > 0 ? "'..." : "'");
	    var suffix = (stream.length - i > 12 ? "...'" : "'");

	    return ' at character ' + i + ', got ' + prefix + stream.slice(i, i+12) + suffix
	  }

	  var formatError = Parsimmon.formatError = function(stream, error) {
	    return 'expected ' + formatExpected(error.expected) + formatGot(stream, error)
	  };

	  _.parse = function(stream) {
	    var result = this.skip(eof)._(stream, 0);

	    return result.status ? {
	      status: true,
	      value: result.value
	    } : {
	      status: false,
	      index: result.furthest,
	      expected: result.expected
	    };
	  };

	  // [Parser a] -> Parser [a]
	  var seq = Parsimmon.seq = function() {
	    var parsers = [].slice.call(arguments);
	    var numParsers = parsers.length;

	    return Parser(function(stream, i) {
	      var result;
	      var accum = new Array(numParsers);

	      for (var j = 0; j < numParsers; j += 1) {
	        result = mergeReplies(parsers[j]._(stream, i), result);
	        if (!result.status) return result;
	        accum[j] = result.value
	        i = result.index;
	      }

	      return mergeReplies(makeSuccess(i, accum), result);
	    });
	  };


	  var seqMap = Parsimmon.seqMap = function() {
	    var args = [].slice.call(arguments);
	    var mapper = args.pop();
	    return seq.apply(null, args).map(function(results) {
	      return mapper.apply(null, results);
	    });
	  };

	  /**
	   * Allows to add custom primitive parsers
	   */
	  var custom = Parsimmon.custom = function(parsingFunction) {
	    return Parser(parsingFunction(makeSuccess, makeFailure));
	  };

	  var alt = Parsimmon.alt = function() {
	    var parsers = [].slice.call(arguments);
	    var numParsers = parsers.length;
	    if (numParsers === 0) return fail('zero alternates')

	    return Parser(function(stream, i) {
	      var result;
	      for (var j = 0; j < parsers.length; j += 1) {
	        result = mergeReplies(parsers[j]._(stream, i), result);
	        if (result.status) return result;
	      }
	      return result;
	    });
	  };

	  // -*- primitive combinators -*- //
	  _.or = function(alternative) {
	    return alt(this, alternative);
	  };

	  _.then = function(next) {
	    if (typeof next === 'function') {
	      throw new Error('chaining features of .then are no longer supported, use .chain instead');
	    }

	    assertParser(next);
	    return seq(this, next).map(function(results) { return results[1]; });
	  };

	  // -*- optimized iterative combinators -*- //
	  // equivalent to:
	  // _.many = function() {
	  //   return this.times(0, Infinity);
	  // };
	  // or, more explicitly:
	  // _.many = function() {
	  //   var self = this;
	  //   return self.then(function(x) {
	  //     return self.many().then(function(xs) {
	  //       return [x].concat(xs);
	  //     });
	  //   }).or(succeed([]));
	  // };
	  _.many = function() {
	    var self = this;

	    return Parser(function(stream, i) {
	      var accum = [];
	      var result;
	      var prevResult;

	      for (;;) {
	        result = mergeReplies(self._(stream, i), result);

	        if (result.status) {
	          i = result.index;
	          accum.push(result.value);
	        }
	        else {
	          return mergeReplies(makeSuccess(i, accum), result);
	        }
	      }
	    });
	  };

	  // equivalent to:
	  // _.times = function(min, max) {
	  //   if (arguments.length < 2) max = min;
	  //   var self = this;
	  //   if (min > 0) {
	  //     return self.then(function(x) {
	  //       return self.times(min - 1, max - 1).then(function(xs) {
	  //         return [x].concat(xs);
	  //       });
	  //     });
	  //   }
	  //   else if (max > 0) {
	  //     return self.then(function(x) {
	  //       return self.times(0, max - 1).then(function(xs) {
	  //         return [x].concat(xs);
	  //       });
	  //     }).or(succeed([]));
	  //   }
	  //   else return succeed([]);
	  // };
	  _.times = function(min, max) {
	    if (arguments.length < 2) max = min;
	    var self = this;

	    return Parser(function(stream, i) {
	      var accum = [];
	      var start = i;
	      var result;
	      var prevResult;

	      for (var times = 0; times < min; times += 1) {
	        result = self._(stream, i);
	        prevResult = mergeReplies(result, prevResult);
	        if (result.status) {
	          i = result.index;
	          accum.push(result.value);
	        }
	        else return prevResult;
	      }

	      for (; times < max; times += 1) {
	        result = self._(stream, i);
	        prevResult = mergeReplies(result, prevResult);
	        if (result.status) {
	          i = result.index;
	          accum.push(result.value);
	        }
	        else break;
	      }

	      return mergeReplies(makeSuccess(i, accum), prevResult);
	    });
	  };

	  // -*- higher-level combinators -*- //
	  _.result = function(res) { return this.map(function(_) { return res; }); };
	  _.atMost = function(n) { return this.times(0, n); };
	  _.atLeast = function(n) {
	    var self = this;
	    return seqMap(this.times(n), this.many(), function(init, rest) {
	      return init.concat(rest);
	    });
	  };

	  _.map = function(fn) {
	    var self = this;
	    return Parser(function(stream, i) {
	      var result = self._(stream, i);
	      if (!result.status) return result;
	      return mergeReplies(makeSuccess(result.index, fn(result.value)), result);
	    });
	  };

	  _.skip = function(next) {
	    return seq(this, next).map(function(results) { return results[0]; });
	  };

	  _.mark = function() {
	    return seqMap(index, this, index, function(start, value, end) {
	      return { start: start, value: value, end: end };
	    });
	  };

	  _.desc = function(expected) {
	    var self = this;
	    return Parser(function(stream, i) {
	      var reply = self._(stream, i);
	      if (!reply.status) reply.expected = [expected];
	      return reply;
	    });
	  };

	  // -*- primitive parsers -*- //
	  var string = Parsimmon.string = function(str) {
	    var len = str.length;
	    var expected = "'"+str+"'";

	    return Parser(function(stream, i) {
	      var head = stream.slice(i, i+len);

	      if (head === str) {
	        return makeSuccess(i+len, head);
	      }
	      else {
	        return makeFailure(i, expected);
	      }
	    });
	  };

	  var regex = Parsimmon.regex = function(re, group) {
	    var anchored = RegExp('^(?:'+re.source+')', (''+re).slice((''+re).lastIndexOf('/')+1));
	    var expected = '' + re;
	    if (group == null) group = 0;

	    return Parser(function(stream, i) {
	      var match = anchored.exec(stream.slice(i));

	      if (match) {
	        var fullMatch = match[0];
	        var groupMatch = match[group];
	        if (groupMatch != null) return makeSuccess(i+fullMatch.length, groupMatch);
	      }

	      return makeFailure(i, expected);
	    });
	  };

	  var succeed = Parsimmon.succeed = function(value) {
	    return Parser(function(stream, i) {
	      return makeSuccess(i, value);
	    });
	  };

	  var fail = Parsimmon.fail = function(expected) {
	    return Parser(function(stream, i) { return makeFailure(i, expected); });
	  };

	  var letter = Parsimmon.letter = regex(/[a-z]/i).desc('a letter')
	  var letters = Parsimmon.letters = regex(/[a-z]*/i)
	  var digit = Parsimmon.digit = regex(/[0-9]/).desc('a digit');
	  var digits = Parsimmon.digits = regex(/[0-9]*/)
	  var whitespace = Parsimmon.whitespace = regex(/\s+/).desc('whitespace');
	  var optWhitespace = Parsimmon.optWhitespace = regex(/\s*/);

	  var any = Parsimmon.any = Parser(function(stream, i) {
	    if (i >= stream.length) return makeFailure(i, 'any character');

	    return makeSuccess(i+1, stream.charAt(i));
	  });

	  var all = Parsimmon.all = Parser(function(stream, i) {
	    return makeSuccess(stream.length, stream.slice(i));
	  });

	  var eof = Parsimmon.eof = Parser(function(stream, i) {
	    if (i < stream.length) return makeFailure(i, 'EOF');

	    return makeSuccess(i, null);
	  });

	  var test = Parsimmon.test = function(predicate) {
	    return Parser(function(stream, i) {
	      var char = stream.charAt(i);
	      if (i < stream.length && predicate(char)) {
	        return makeSuccess(i+1, char);
	      }
	      else {
	        return makeFailure(i, 'a character matching '+predicate);
	      }
	    });
	  };

	  var oneOf = Parsimmon.oneOf = function(str) {
	    return test(function(ch) { return str.indexOf(ch) >= 0; });
	  };

	  var noneOf = Parsimmon.noneOf = function(str) {
	    return test(function(ch) { return str.indexOf(ch) < 0; });
	  };

	  var takeWhile = Parsimmon.takeWhile = function(predicate) {
	    return Parser(function(stream, i) {
	      var j = i;
	      while (j < stream.length && predicate(stream.charAt(j))) j += 1;
	      return makeSuccess(j, stream.slice(i, j));
	    });
	  };

	  var lazy = Parsimmon.lazy = function(desc, f) {
	    if (arguments.length < 2) {
	      f = desc;
	      desc = undefined;
	    }

	    var parser = Parser(function(stream, i) {
	      parser._ = f()._;
	      return parser._(stream, i);
	    });

	    if (desc) parser = parser.desc(desc)

	    return parser;
	  };

	  var index = Parsimmon.index = Parser(function(stream, i) {
	    return makeSuccess(i, i);
	  });

	  //- fantasyland compat

	  //- Monoid (Alternative, really)
	  _.concat = _.or;
	  _.empty = fail('empty')

	  //- Applicative
	  _.of = Parser.of = Parsimmon.of = succeed

	  _.ap = function(other) {
	    return seqMap(this, other, function(f, x) { return f(x); })
	  };

	  //- Monad
	  _.chain = function(f) {
	    var self = this;
	    return Parser(function(stream, i) {
	      var result = self._(stream, i);
	      if (!result.status) return result;
	      var nextParser = f(result.value);
	      return mergeReplies(nextParser._(stream, result.index), result);
	    });
	  };

	  return Parser;
	})();
	module.exports = Parsimmon;


/***/ },
/* 3 */
/***/ function(module, exports) {

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


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Walks a template node tree, sending render events to the patcher via method
	 * calls. All interaction with the DOM should be done in the patcher/transforms,
	 * these functions only process template nodes and prev/next data in order to
	 * emit events.
	 */

	var utils = __webpack_require__(3);
	var parsers = __webpack_require__(1);
	var builtins = __webpack_require__(5);

	var ELEMENT_NODE = 1;
	var TEXT_NODE = 3;


	function isTemplateTag(node) {
	    return node._template_tag || /^MAGERY:.*/.test(node.tagName);
	}

	function isExpandTag(node) {
	    return 'MAGERY-EXPAND' === node.tagName;
	}

	function isBlockTag(node) {
	    return 'MAGERY-BLOCK' === node.tagName;
	}

	function templateTagName(node) {
	    if (node._template_tag) {
	        return node._template_tag;
	    }
	    var m = /^MAGERY:([^\s/>]+)/.exec(node.tagName);
	    if (!m) {
	        throw new Error(
	            errorMessage(node, 'Not a template tag: ' + node.tagName)
	        );
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

	exports.getParams = function (node) {
	    if (node._params) {
	        return node._params;
	    }
	    node._params = parsers.parseParams(node.getAttribute('params'));
	    return node._params;
	};

	function templatePath(node) {
	    var path = [];
	    while (node) {
	        if (isBlockTag(node)) {
	            if (node.dataset['else'] === 'true') {
	                path.unshift('{{else}}');
	            }
	            // do nothing
	        }
	        else if (isTemplateTag(node)) {
	            path.unshift('{{#' + templateTagName(node) + '}}');
	        }
	        else if (node.tagName === 'BODY' && node._template) {
	            path.unshift('{{#define ' + node._template + '}}');
	            return path;
	        }
	        else {
	            path.unshift(node.tagName);
	        }
	        node = node.parentNode;
	    }
	    return path;
	};

	function errorMessage(node, msg) {
	    return msg + ' at ' + templatePath(node).join('/');
	};


	function Renderer(patcher, templates, first_pass) {
	    this.patcher = patcher;
	    this.templates = templates;
	    this.text_buffer = null;
	    // used to decide whether to render {{#skip}} blocks
	    this.first_pass = first_pass;
	    // toggle variable expansion
	    // (e.g. for inside {{{html}}} variables)
	    this._expand = true;
	}
	exports.Renderer = Renderer;

	Renderer.prototype.render = function (template_name, next_data, prev_data) {
	    var tmpl = this.templates[template_name];
	    this.patcher.start();
	    this.children(tmpl.body, next_data, prev_data, null, null, []);
	    this.flushText();
	    this.first_pass = false;
	    this.patcher.end(next_data);
	};

	// will expand BOTH {{var}} and {{{var}}} as plain text
	Renderer.prototype.expandVarsText = function (str, data) {
	    if (!this._expand) {
	        return str;
	    }
	    return str.replace(/{{({?)\s*([^}]+?)\s*}}(}?)/g,
	        function (full, before, property, after) {
	            if (before.length != after.length) {
	                throw new Error(
	                    'Mismatched curly braces at {{' +
	                        before + property + after +
	                    '}}'
	                );
	            }
	            return exports.lookup(data, exports.propertyPath(property));
	        }
	    );
	};

	// will expand {{{var}}} as DOM nodes, returns string if only {{var}}'s
	// used, <MAGERY-BLOCK> DOM element otherwise
	var STATE_TEXT = 0;
	var STATE_OPEN = 1;
	var STATE_ESCAPED = 2;
	var STATE_ESCAPED_END = 3;
	var STATE_RAW = 4;
	var STATE_RAW_END = 5;

	Renderer.prototype.expandVarsDOM = function (str, data) {
	    if (!this._expand) {
	        return str;
	    }
	    // TODO: apparently, not all browsers support capturing groups being
	    // included in the output of String.split, test to find out which
	    var parts = str.split(/{{({?)\s*([^}]+?)\s*}}(}?)/g);
	    var raw = false;
	    var buffer = parts[0];
	    var state = STATE_OPEN;
	    var val;
	    for (var i = 1, len = parts.length; i < len; i++) {
	        var part = parts[i];
	        if (state === STATE_TEXT) {
	            buffer += raw ? utils.htmlEscape(part) : part;
	            state = STATE_OPEN;
	        }
	        else if (state === STATE_OPEN) {
	            state = part ? STATE_RAW : STATE_ESCAPED;
	        }
	        else if (state === STATE_ESCAPED) {
	            val = exports.lookup(data, exports.propertyPath(part));
	            buffer += raw ? utils.htmlEscape(val) : val;
	            state = STATE_ESCAPED_END;
	        }
	        else if (state === STATE_ESCAPED_END) {
	            if (part) {
	                throw new Error(
	                    'Mismatched curly braces at {{' + parts[i-1] + '}}}'
	                );
	            }
	            state = STATE_TEXT;
	        }
	        else if (state === STATE_RAW) {
	            if (!raw) {
	                raw = true;
	                buffer = utils.htmlEscape(buffer);
	            }
	            val = exports.lookup(data, exports.propertyPath(part));
	            var params = encodeURIComponent(part);
	            buffer += '<MAGERY:WITH params="' + params + '">' +
	                val + '</MAGERY:WITH>';
	            state = STATE_RAW_END;
	        }
	        else if (state === STATE_RAW_END) {
	            if (!part) {
	                throw new Error(
	                    'Mismatched curly braces at {{{' + parts[i-1] + '}}'
	                );
	            }
	            state = STATE_TEXT;
	        }
	    }
	    if (raw) {
	        var block = document.createElement('MAGERY-BLOCK');
	        block.innerHTML = buffer;
	        return block;
	    }
	    return buffer;
	};

	Renderer.prototype.child = function (node, i, next_data, prev_data, key, inner, path) {
	    if (node.nodeType === TEXT_NODE) {
	        this.text(node, next_data, prev_data, key, inner, path);
	    }
	    else if (node.nodeType === ELEMENT_NODE) {
	        if (isBlockTag(node)) {
	            if (node.dataset['else'] === 'true') {
	                throw new Error(errorMessage(node, 'Unexpected {{else}}'));
	            }
	            else {
	                this.children(node, next_data, prev_data, key, inner, path);
	            }
	        }
	        else if (isTemplateTag(node)) {
	            this.templateTag(node, next_data, prev_data, key, inner, path);
	        }
	        else if (isExpandTag(node)) {
	            if (inner) {
	                inner.call(this, next_data, prev_data, key, path);
	            }
	        }
	        else {
	            var k = key && key + '/' + i;
	            this.element(node, next_data, prev_data, k, inner, path);
	        }
	    }
	};

	Renderer.prototype.children = function (parent, next_data, prev_data, key, inner, path) {
	    var self = this;
	    utils.eachNode(parent.childNodes, function (node, i) {
	        self.child(node, i, next_data, prev_data, key, inner, path);
	    });
	};

	Renderer.prototype.skipChildren = function (parent, key) {
	    var self = this;
	    utils.eachNode(parent.childNodes, function (node, i) {
	        self.patcher.skip(node.tagName, key && key + '/' + i);
	    });
	};

	Renderer.prototype.text = function (node, next_data, prev_data, key, inner, path) {
	    var value = this.expandVarsDOM(node.textContent, next_data);
	    if (value instanceof Element) {
	        // turn off variable expansion while rendering child nodes
	        this._expand = false;
	        this.children(value, next_data, prev_data, key, inner, path);
	        this._expand = true;
	    }
	    else if (!this.text_buffer) {
	        this.text_buffer = value;
	    }
	    else {
	        this.text_buffer += value;
	    }
	};

	Renderer.prototype.flushText = function () {
	    if (this.text_buffer) {
	        this.patcher.text(this.text_buffer);
	        this.text_buffer = null;
	    }
	};

	Renderer.prototype.templateTag = function (node, next_data, prev_data, key, inner, path) {
	    var name = templateTagName(node);
	    var f = builtins[name];
	    if (f) {
	        // use builtin tag
	        return f(this, node, next_data, prev_data, key, inner, path);
	    }
	    // attempt to render template by name
	    var property;
	    var params = exports.getParams(node);
	    if (params.args.length) {
	        property = params.args[0].value;
	    }
	    this.template(name, property, node, next_data, prev_data, key, inner, path);
	};

	Renderer.prototype.template = function (name, property, node, next_data, prev_data, key, inner, path) {
	    var tmpl = this.templates[name];
	    if (tmpl) {
	        // TODO: validate parameters
	        if (property) {
	            var props = exports.propertyPath(property);
	            prev_data = exports.lookup(prev_data, props);
	            next_data = exports.lookup(next_data, props);
	            path = path.concat(props);
	        }
	        var new_inner = function (next_data, prev_data, key, path) {
	            this.children(node, next_data, prev_data, key, inner, path);
	        };
	        this.children(tmpl.body, next_data, prev_data, key, new_inner, path);
	    }
	    else {
	        throw new Error(
	            errorMessage(node, 'Unrecognized template tag: {{#' + name + '...')
	        );
	    }
	};

	// TODO: don't run this regex on every render - we only need to do it once
	// for each template tag
	function realTagName(name) {
	    var m = /^MAGERY-TAG:([^\s/>]+)/.exec(name);
	    return m ? m[1]: name;
	}

	Renderer.prototype.element = function (node, next_data, prev_data, key, inner, path) {
	    this.flushText();
	    var tagName = realTagName(node.tagName);
	    if (prev_data === next_data) {
	        this.patcher.skip(tagName, key || null);
	    }
	    else {
	        this.patcher.enterTag(tagName, key || null);
	        for (var i = 0, len = node.attributes.length; i < len; i++) {
	            var attr = node.attributes[i];
	            var event_match = /^on([a-zA-Z]+)/.exec(attr.name);
	            if (event_match) {
	                this.patcher.eventListener(
	                    event_match[1],
	                    this.expandVarsText(attr.value, next_data),
	                    next_data,
	                    path
	                );
	            }
	            else {
	                this.patcher.attribute(
	                    attr.name,
	                    this.expandVarsText(attr.value, next_data)
	                );
	            }
	        }
	        this.children(node, next_data, prev_data, null, inner, path);
	        this.flushText();
	        this.patcher.exitTag();
	    }
	};


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	var render = __webpack_require__(4);


	exports['with'] = function (renderer, node, next_data, prev_data, key, inner, path) {
	    var params = render.getParams(node);
	    // TODO: validate parameters
	    var p = params.args[0];
	    var props = render.propertyPath(p.value);
	    prev_data = render.lookup(prev_data, props);
	    next_data = render.lookup(next_data, props);
	    renderer.children(node, next_data, prev_data, null, inner, path.concat(props));
	};

	exports['skip'] = function (renderer, node, next_data, prev_data, key, inner, path) {
	    if (renderer.first_pass) {
	        renderer.children(node.childNodes[0], next_data, prev_data, key, inner, path);
	    }
	    else {
	        renderer.skipChildren(node.childNodes[0], key);
	    }
	};

	function makeKeymap(data, property) {
	    var keymap = {};
	    for (var i = 0, len = data.length; i < len; i++) {
	        var v = data[i];
	        var k = render.lookup(v, property);
	        keymap[k] = v;
	    }
	    return keymap;
	}

	var each_counter = 0;
	exports['each'] = function (renderer, node, next_data, prev_data, key, inner, path) {
	    // the counter is to avoid adjacent each blocks from
	    // interfering with each others keys
	    var count = node.count;
	    if (!count) {
	        count = node.count = each_counter++;
	    }
	    var params = render.getParams(node);
	    // TODO: validate parameters
	    var p = params.args[0];
	    var props = render.propertyPath(p.value);
	    prev_data = render.lookup(prev_data, props) || [];
	    next_data = render.lookup(next_data, props);
	    path = path.concat(props);
	    if (next_data && next_data.length > 0) {
	        var key_property = false;
	        if (params.kwargs && params.kwargs.key) {
	            key_property = render.propertyPath(params.kwargs.key.value);
	        }
	        var keymap;
	        if (key_property) {
	            // TODO: create the keymap only once the key does not match the current node?
	            // then a keymap can be created using only the remaining items in the array
	            // instead of the whole list
	            keymap = makeKeymap(prev_data, key_property);
	        }
	        var new_path, nd, pd, k = null;
	        for (var i = 0, len = next_data.length; i < len; i++) {
	            nd = next_data[i];
	            if (key_property) {
	                // look up the old data for this key
	                // (which may be at a different index in the array)
	                k = render.lookup(nd, key_property);
	                pd = keymap[k];
	                new_path = path.concat([{
	                    property: key_property,
	                    key: k
	                }]);
	            }
	            else {
	                pd = prev_data[i];
	                new_path = path.concat([i]);
	            }
	            key = k && count + '/' + k;
	            renderer.children(node.childNodes[0], nd, pd, key, inner, new_path);
	        }
	    }
	    else {
	        var alt = node.childNodes[1];
	        if (alt) {
	            renderer.children(alt, next_data, prev_data, key, inner, path);
	        }
	    }
	};

	function isTruthy(value) {
	    return value && (!Array.isArray(value) || value.length > 0);
	}

	exports['if'] = function (renderer, node, next_data, prev_data, key, inner, path) {
	    var params = render.getParams(node);
	    // TODO: validate parameters
	    var p = params.args[0];
	    var props = render.propertyPath(p.value);
	    var predicate = render.lookup(next_data, props);
	    var block = isTruthy(predicate) ? node.childNodes[0] : node.childNodes[1];
	    if (block) {
	        renderer.children(block, next_data, prev_data, key, inner, path);
	    }
	};

	exports['unless'] = function (renderer, node, next_data, prev_data, key, inner, path) {
	    var params = render.getParams(node);
	    // TODO: validate parameters
	    var p = params.args[0];
	    var props = render.propertyPath(p.value);
	    var predicate = render.lookup(next_data, props);
	    var block = isTruthy(predicate) ? node.childNodes[1] : node.childNodes[0];
	    if (block) {
	        renderer.children(block, next_data, prev_data, key, inner, path);
	    }
	};

	exports['call'] = function (renderer, node, next_data, prev_data, key, inner, path) {
	    var params = render.getParams(node);
	    // TODO: validate parameters
	    var k = render.propertyPath(params.args[0].value);
	    var name = render.lookup(next_data, k);
	    var property = params.args.length >= 2 ? params.args[1].value : false;
	    renderer.template(name, property, node, next_data, prev_data, key, inner, path);
	};


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Processes render events (e.g. enterTag, exitTag) and matches them against the
	 * current state of the DOM. Where there is a mismatch a transform function is
	 * called to reconcile the differences. The Patcher code should only _read_ the
	 * DOM, performing DOM mutation only through transform calls.
	 */

	var utils = __webpack_require__(3);
	var transforms = __webpack_require__(7);

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


/***/ },
/* 7 */
/***/ function(module, exports) {

	/**
	 * DOM mutation procedures called by the patcher. This module provides
	 * a cleaner API for our purposes and a place to intercept and
	 * monitor mutations during testing.
	 */

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
	    switch (name) {
	        case 'checked':
	            node.checked = true;
	            break;
	        case 'selected':
	            node.selected = true;
	            break;
	        case 'value':
	            node.value = value;
	            break;
	        case 'autofocus':
	            node.focus();
	            break;
	    }
	    node.setAttribute(name, value);
	    return node;
	};

	exports.removeAttribute = function (node, name) {
	    switch (name) {
	        case 'checked':
	            node.checked = false;
	            break;
	        case 'selected':
	            node.selected = false;
	            break;
	        case 'value':
	            node.value = '';
	            break;
	        case 'autofocus':
	            node.blur();
	            break;
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


/***/ }
/******/ ]);