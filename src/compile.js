var utils = require('./utils');
var html = require('./html');

// these tags are assumed to be normal HTML, all other tags are
// assumed to be template references
var HTML_TAGS = [
    'A', 'ABBR', 'ACRONYM', 'ADDRESS', 'APPLET', 'AREA', 'ARTICLE', 'ASIDE',
    'AUDIO', 'B', 'BASE', 'BASEFONT', 'BDI', 'BDO', 'BGSOUND', 'BIG', 'BLINK',
    'BLOCKQUOTE', 'BODY', 'BR', 'BUTTON', 'CANVAS', 'CAPTION', 'CENTER', 'CITE',
    'CODE', 'COL', 'COLGROUP', 'COMMAND', 'CONTENT', 'DATA', 'DATALIST', 'DD',
    'DEL', 'DETAILS', 'DFN', 'DIALOG', 'DIR', 'DIV', 'DL', 'DT', 'ELEMENT',
    'EM', 'EMBED', 'FIELDSET', 'FIGCAPTION', 'FIGURE', 'FONT', 'FOOTER', 'FORM',
    'FRAME', 'FRAMESET', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'HEAD', 'HEADER',
    'HGROUP', 'HR', 'HTML', 'I', 'IFRAME', 'IMAGE', 'IMG', 'INPUT', 'INS',
    'ISINDEX', 'KBD', 'KEYGEN', 'LABEL', 'LEGEND', 'LI', 'LINK', 'LISTING',
    'MAIN', 'MAP', 'MARK', 'MARQUEE', 'MENU', 'MENUITEM', 'META', 'METER',
    'MULTICOL', 'NAV', 'NOBR', 'NOEMBED', 'NOFRAMES', 'NOSCRIPT', 'OBJECT',
    'OL', 'OPTGROUP', 'OPTION', 'OUTPUT', 'P', 'PARAM', 'PICTURE', 'PLAINTEXT',
    'PRE', 'PROGRESS', 'Q', 'RP', 'RT', 'RTC', 'RUBY', 'S', 'SAMP', 'SCRIPT',
    'SECTION', 'SELECT', 'SHADOW', 'SLOT', 'SMALL', 'SOURCE', 'SPACER', 'SPAN',
    'STRIKE', 'STRONG', 'STYLE', 'SUB', 'SUMMARY', 'SUP', 'TABLE', 'TBODY',
    'TD', 'TEMPLATE', 'TEXTAREA', 'TFOOT', 'TH', 'THEAD', 'TIME', 'TITLE', 'TR',
    'TRACK', 'TT', 'U', 'UL', 'VAR', 'VIDEO', 'WBR', 'XMP'
];

var IGNORED_ATTRS = [
    'data-each',
    'data-if',
    'data-unless',
    'data-key'
];

function compileLookup(path) {
    return 'p.lookup(data, ' + JSON.stringify(path) + ')';
}

function compileTemplateContext(node) {
    var result = '{';
    utils.eachAttribute(node, function (name, value) {
        if (IGNORED_ATTRS.indexOf(name) === -1) {
            result += JSON.stringify(name) + ": " + compileExpandVariables(value);
        }
    });
    return result + '}';
}

// TODO: split out into compileTemplateCall, compileInner, compileHTMLElement etc. ?
function compileElement(node, queue, write, is_root) {
    if (node.tagName === 'TEMPLATE-CHILDREN') {
        write('inner();\n');
        return;
    }
    if (!is_root && node.dataset.template) {
        // compile this template later
        queue.push(node);
        // but also expand the template here
        write('p.render(templates, ' + JSON.stringify(node.dataset.template) + ', data);\n');
        return;
    }
    if (node.dataset.if) {
        var predicate1_path = utils.propertyPath(node.dataset.if);
        write('if (p.isTruthy(' + compileLookup(predicate1_path) + ')) {\n');
    }
    if (node.dataset.unless) {
        var predicate2_path = utils.propertyPath(node.dataset.unless);
        write('if (!p.isTruthy(' + compileLookup(predicate2_path) + ')) {\n');
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
    var is_html = true;
    if (HTML_TAGS.indexOf(node.tagName) === -1) {
        // not a known HTML tag, assume template reference
        write('p.render(' +
              'templates, ' +
              JSON.stringify(node.tagName.toLowerCase()) + ', ' +
              compileTemplateContext(node) +
              (node.childNodes.length ? ', function () {' : ');') + '\n');
        is_html = false;
    }
    else {
        if (node.dataset.key) {
            write('p.enterTag(' +
                  JSON.stringify(node.tagName) + ', ' +
                  compileExpandVariables(node.dataset.key) + ');\n');
        }
        else {
            write('p.enterTag(' + JSON.stringify(node.tagName) + ', null);\n');
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
                var event_name = event[1];
                write('p.eventListener(' +
                      JSON.stringify(event[1]) + ', ' +
                      JSON.stringify(value) + ', ' +
                      'data, template);\n');
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
    }
    utils.eachNode(node.childNodes, function (node) {
        compileNode(node, queue, write, false);
    });
    if (is_html) {
        write('p.exitTag();\n');
    }
    else if (node.childNodes.length) {
        // end inner function of template call
        write('});\n');
    }
    if (node.dataset.each) {
        write('});\n');
    }
    if (node.dataset.unless) {
        write('}\n');
    }
    if (node.dataset.if) {
        write('}\n');
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

function noop() {}

exports.compile = function (node, write) {
    var queue = [];
    compileNode(node, queue, noop, true);
    write('({\n');
    while (queue.length) {
        node = queue.shift();
        console.log(node);
        write(JSON.stringify(node.dataset.template) + ': ');
        write('new Magery.Template(function (template, templates, p, data, inner) {\n');
        compileNode(node, queue, write, true);
        write('})' + (queue.length ? ',' : '') + '\n');
    }
    write('})\n');
};

exports.compileToString = function (node) {
    var result = '';
    exports.compile(node, function (str) {
        result += str;
    });
    return result;
};

exports.eval = function (node) {
    return eval(exports.compileToString(node));
};
