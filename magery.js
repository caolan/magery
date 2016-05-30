"use strict";

var parsers = require('./parsers');
var render = require('./render');
var patch = require('./patch');


/***** Public API *****/

exports.loadTemplates = parsers.loadTemplates;

exports.patch = function (templates, name, node, next_data, prev_data, first_pass) {
    var patcher = new patch.Patcher(node);
    var renderer = new render.Renderer(patcher, templates, first_pass);
    renderer.render(name, next_data, prev_data);
};
