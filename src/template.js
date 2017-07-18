var BoundTemplate = require('./bound_template');
var patch = require('./patch');


function Template(render) {
    this.render = render;
    // this.templates = templates;
}

// Template.prototype.render = function (bound, next_data, prev_data, inner) {
//     bound.patcher.start();
//     this.expand(bound, next_data, prev_data, inner);
//     // if (bound.text_buffer) {
//     //     bound.patcher.text(bound.text_buffer);
//     //     bound.text_buffer = '';
//     // }
//     bound.patcher.end();
// };


Template.prototype.bind = function (options) {
    options.patcher = options.patcher || new patch.Patcher(options.element);
    var bound = new BoundTemplate(this, options);
    bound.update();
    return bound;
};

module.exports = Template;
