var render = require('./render');


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
