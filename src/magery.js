var Patcher = require('./patch').Patcher;
var evalTemplates = require('./compile').eval;

exports.Template = require('./template');

exports.compile = function (target, templates) {
    templates = templates || {};
    if (typeof(target) === 'string') {
        return exports.compile(document.querySelectorAll(target), templates);
    }
    if (target instanceof NodeList) {
        for (var i = 0, len = target.length; i < len; i++) {
            exports.compile(target[i], templates);
        }
        return templates;
    }
    if (target.tagName === 'TEMPLATE' && target.content) {
        return exports.compile(target.content, templates);
    }
    var compiled = evalTemplates(target);
    for (var k in compiled) {
        templates[k] = compiled[k];
    }
    return templates;
};

exports.patch = function (templates, name, data, element) {
    new Patcher(element).render(templates, name, data);
};
