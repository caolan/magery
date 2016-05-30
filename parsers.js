/**
 * Tools for converting any raw template data into structured form
 */

var p = require('parsimmon/build/parsimmon.commonjs');
var utils = require('./utils');


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
