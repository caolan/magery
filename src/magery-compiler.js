exports.compileToString = require('./compile').compileToString;

exports.compile = function (target, templates, runtime) {
    runtime = runtime || window.Magery;
    templates = templates || {};
    if (typeof(target) === 'string') {
        return exports.compile(document.querySelectorAll(target), templates);
    }
    var compiled = eval(exports.compileToString(target))(runtime);
    for (var k in compiled) {
        templates[k] = compiled[k];
    }
    return templates;
};

