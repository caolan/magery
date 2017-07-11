var results = document.getElementById('results');
var container = document.getElementById('output');

function log(str) {
    results.textContent += str + '\n';
}

function heading(str) {
    log(str);
    log(new Array(str.length + 1).join('='));
}

function subheading(str) {
    log(str);
    log(new Array(str.length + 1).join('-'));
}

function createTemplateNode(id, src) {
    var el = document.getElementById(id);
    if (!el) {
        el = document.createElement('template');
        document.body.appendChild(el);
        el.id = id;
    }
    el.innerHTML = src;
    Magery.initTemplates();
    return el;
}


heading('Magery benchmarks');
log(Benchmark.platform.description);

var handlers = {
    onStart: function (event) {
        log('');
        subheading(this.name);
    },
    onCycle: function (event) {
        log(String(event.target));
    },
    onComplete: function() {
        log('Fastest is ' + this.filter('fastest').map('name'));
    }
};


createTemplateNode(
    'app',
    '<ul>' +
        '<li data-each="item in items">' +
           '{{item.name}}' +
        '</li>' +
     '</ul>'
);
var App = React.createClass({
    render: function () {
        var items = this.props.items;
        return React.createElement('ul', null, items.map(function (item) {
            return React.createElement('li', null, item.name);
        }));
    }
});
function render(data) {
    idom.elementOpen('ul', '', null);
    data.items.forEach(function (item) {
        idom.elementOpen('li', '', null);
        idom.text(item.name);
        idom.elementClose('li');
    });
    idom.elementClose('ul');
}
new Benchmark.Suite(
    'Add 100 elements to a list, one at a time (no keys)',
    handlers
)
// .add('IncrementalDOM', function() {
//     var data = {items: []};
//     for (var i = 0; i < 100; i++) {
//         data.items.push({name: 'item' + i});
//         idom.patch(container, function() {
//             render(data);
//         });
//     }
// })
.add('React', function() {
    var data = {items: []};
    for (var i = 0; i < 100; i++) {
        data.items.push({name: 'item' + i});
        ReactDOM.render(React.createElement(App, data), container);
    }
})
.add('Magery', function() {
    var data = {items: []};
    var app = Magery.bind(container, 'app', data, {});
    for (var i = 0; i < 100; i++) {
        app.context.items.push({name: 'item' + i});
        app.update();
    }
})
.run();
