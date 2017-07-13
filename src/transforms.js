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
