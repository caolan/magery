var html = require('./html');
var utils = require('./utils');
var active_paths = require('./active_paths');
var Template = require('./template');


function run_all(xs) {
    var funs = xs.filter(function (x) { return x; });
    var length = funs.length;
    return function (bound, next_data, prev_data, inner) {
        var index = -1;
        while (++index < length) {
            funs[index](bound, next_data, prev_data, inner);
        }
    };
}

function flushText(bound) {
    if (bound.text_buffer) {
        bound.patcher.text(bound.text_buffer);
        bound.text_buffer = '';
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
    return function (bound, next_data, prev_data, inner) {
        bound.text_buffer += expand(next_data);
    };
}

function compileElement(templates, node) {
    var children = compileChildren(templates, node);
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
            name == 'data-key' ||
            name == 'data-template') {
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
    var render = function (bound, next_data, prev_data, inner) {
        var key = expand_key ? expand_key(next_data) : null;
        flushText(bound);
        bound.patcher.enterTag(node.tagName, key);
        for (var attr_name in attrs) {
            var value = attrs[attr_name](next_data);
            if (value || !(html.attributes[attr_name] & html.BOOLEAN_ATTRIBUTE)) {
                bound.patcher.attribute(attr_name, value);
            }
        }
        for (var event_name in events) {
            bound.patcher.eventListener(
                event_name,
                events[event_name],
                next_data,
                bound
            );
        }
        children(bound, next_data, prev_data, inner);
        flushText(bound);
        bound.patcher.exitTag();
    };
    if (node.dataset.template) {
        var template_name = node.dataset.template;
        if (templates[template_name]) {
            throw new Error("Template '" + template_name + "' already exists");
        }
        templates[template_name] = new Template(render);
    }
    else {
        if (node.dataset.unless) {
            render = compileUnless(node, render);
        }
        if (node.dataset.if) {
            render = compileIf(node, render);
        }
        if (node.dataset.each) {
            render = compileEach(node, render);
        }
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
    return function (bound, next_data, prev_data, inner) {
        if (!isTruthy(utils.lookup(next_data, path))) {
            render(bound, next_data, prev_data, inner);
        }
    };
}

function compileIf(node, render) {
    var path = utils.propertyPath(node.dataset.if);
    return function (bound, next_data, prev_data, inner) {
        if (isTruthy(utils.lookup(next_data, path))) {
            render(bound, next_data, prev_data, inner);
        }
    };
}

function compileEach(node, render) {
    var parts = node.dataset.each.split(' in ');
    var name = parts[0];
    var path = utils.propertyPath(parts[1]);
    return function (bound, next_data, prev_data, inner) {
        var next_arr = utils.lookup(next_data, path);
        var prev_arr = utils.lookup(prev_data, path);
        var length = next_arr.length;
        var index = -1;
        while (++index < length) {
            var next_data2 = Object.assign({}, next_data);
            var prev_data2 = Object.assign({}, prev_data);
            next_data2[name] = next_arr[index];
            prev_data2[name] = prev_arr && prev_arr[index];
            render(bound, next_data2, prev_data2, inner);
        }
    };
}

function compileTemplateCall(templates, node) {
    var attr = node.getAttribute('template');
    if (!attr) {
        throw new Error("<template-call> tags must include a 'template' attribute");
    }
    var template_id_pattern = compileExpandVars(attr);
    var children = compileChildren(templates, node);
    return function (bound, next_data, prev_data, inner) {
        var template_id = template_id_pattern(next_data);
        var template = templates[template_id];
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
        template.render(bound, next_data2, prev_data2, function () {
            children(bound, next_data, prev_data, inner);
        });
    };
}

function compileNode(templates, node) {
    if (utils.isTextNode(node)) {
        return compileText(node);
    }
    else if (utils.isElementNode(node)) {
        var name = utils.templateTagName(node);
        if (name) {
            if (name == 'call') {
                return compileTemplateCall(templates, node);
            }
            else if (name == 'children') {
                return function (bound, next_data, prev_data, inner) {
                    inner && inner();
                };
            }
            throw new Error(
                'Unkonwn template tag: <template-' + name + '>'
            );
        }
        return compileElement(templates, node);
    }
    return null;
}

function compileChildren(templates, parent) {
    return run_all(
        utils.mapNodes(
            parent.childNodes,
            compileNode.bind(null, templates)
        )
    );
}

module.exports = function (node, templates) {
    templates = templates || {};
    if (typeof node === 'string') {
        node = document.getElementById(node);
    }
    if (node.tagName === 'TEMPLATE' && node.content) {
        node = node.content;
    }
    active_paths.markPaths(node);
    utils.eachNode(node.childNodes, compileNode.bind(null, templates));
    return templates;
};
