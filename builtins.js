var render = require('./render');

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
