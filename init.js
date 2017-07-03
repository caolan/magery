var utils = require('./utils');

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
    var child_paths = utils.mapNodes(node.childNodes, initNode);
    child_paths.forEach(exports.mergePaths.bind(null, paths));
    utils.eachNode(node.childNodes, function (child, i) {
        if (Object.keys(child_paths[i]).length === 0) {
            child.static = true;
        }
        else if (!exports.equivalentPathObjects(child_paths[i], paths)) {
            child.active_paths = child_paths[i];
        }
    });
};

exports.elementPaths = function (node) {
    var paths = {};
    if (node.attributes) {
        for (var i = 0, len = node.attributes.length; i < len; i++) {
            var attr = node.attributes[i];
            exports.mergePaths(paths, exports.stringPaths(attr.value));
        }
    }
    updateChildPaths(paths, node);
    return paths;
};

function templateIfPaths(node) {
    var paths = {};
    var test_prop = node.getAttribute('test');
    exports.markPath(paths, utils.propertyPath(test_prop));
    updateChildPaths(paths, node);
    return paths;
}

function templateEachPaths(node) {
    var paths = {};
    var name_prop = node.getAttribute('name');
    var iter_prop = node.getAttribute('in');
    exports.markPath(paths, utils.propertyPath(iter_prop));
    updateChildPaths(paths, node);
    delete paths[name_prop];
    return paths;
}

var templateTags = {
    'if': templateIfPaths,
    'unless': templateIfPaths,
    'each': templateEachPaths
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
        tmpl.static = (Object.keys(paths).length === 0);
        tmpl.active_paths = paths;
    }
};
