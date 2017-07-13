var results = document.getElementById('results');
var container = document.getElementById('output');

var platform = document.getElementById('platform');
var results_tbody = document.getElementById('results_tbody');

platform.textContent = Benchmark.platform.description;

var handlers = {
    onStart: function (event) {
        var suite = event.currentTarget;
        var tr = document.createElement('tr');
        var td = document.createElement('td');
        td.textContent = this.name;
        tr.appendChild(td);
        tr.appendChild(document.createElement('td'));
        tr.appendChild(document.createElement('td'));
        results_tbody.appendChild(tr);
        suite.tr = tr;
    },
    onCycle: function (event) {
        // log(String(event.target));
        console.log(['onCycle', event, event.target.name]);
        var suite = event.currentTarget;
        var bench = event.target,
            error = bench.error,
            hz = bench.hz,
            id = bench.id,
            stats = bench.stats,
            size = stats.sample.length,
            pm = '\xb1',
            result;
        
        if (error) {
            var errorStr;
            if (!_.isObject(error)) {
                errorStr = String(error);
            } else if (!_.isError(Error)) {
                errorStr = join(error);
            } else {
                // Error#name and Error#message properties are non-enumerable.
                errorStr = join(_.assign({ 'name': error.name, 'message': error.message }, error));
            }
            result = errorStr;
        }
        else {
            result = formatNumber(hz.toFixed(hz < 100 ? 2 : 0)) + ' ops/sec ' + pm +
                stats.rme.toFixed(2) + '% (' + size + ' run' + (size == 1 ? '' : 's') + ' sampled)';
        }

        if (this.name == 'React') {
            suite.tr.childNodes[1] = result;
        }
        else if (this.name == 'Magery') {
            suite.tr.childNodes[2] = result;
        }
    },
    onComplete: function() {
        // log('Fastest is ' + this.filter('fastest').map('name'));
    },
    onError: function (err) {
        // log('' + err.target.error.stack);
    }
};


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

function random (max) {
    return Math.floor(Math.random() * (max + 1));
};


var bench;

bench = new Benchmark.Suite(
    'Add 100 elements to a list, one at a time (no keys)',
    handlers
);
bench.add({
    name: 'React',
    setup: function () {
        this.App = React.createClass({
            render: function () {
                var items = this.props.items;
                return React.createElement('ul', null, items.map(function (item) {
                    return React.createElement('li', null, item.name);
                }));
            }
        });
        this.data = {items: []};
    },
    fn: function() {
        for (var i = 0; i < 100; i++) {
            this.data.items.push({name: 'item' + i});
            ReactDOM.render(React.createElement(this.App, this.data), container);
        }
    }
});
bench.add({
    name: 'Magery',
    setup: function () {
        createTemplateNode(
            'app',
            '<ul>' +
                '<li data-each="item in items">' +
                '{{item.name}}' +
                '</li>' +
                '</ul>'
        );
        this.data = {items: []};
        this.app = Magery.bind(container, 'app', this.data, {});
     },
    fn: function() {
        for (var i = 0; i < 100; i++) {
            this.app.context.items.push({name: 'item' + i});
            this.app.update();
        }
    }
});
bench.run({async: true});


bench = new Benchmark.Suite(
    'Add 100 element to a list, one at a time (keys)',
    handlers
);
bench.add({
    name: 'React',
    setup: function () {
        this.App = React.createClass({
            render: function () {
                var items = this.props.items;
                return React.createElement('ul', null, items.map(function (item) {
                    return React.createElement('li', {key: item.id}, item.name);
                }));
            }
        });
        this.data = {items: []};
    },
    fn: function () {
        for (var i = 0; i < 100; i++) {
            this.data.items.push({id: i, name: 'item' + i});
            ReactDOM.render(React.createElement(this.App, this.data), container);
        }
    }
});
bench.add({
    name: 'Magery',
    setup: function () {
        createTemplateNode('app',
                           '<ul>' +
                           '<li data-each="item in items" data-key="{{item.id}}">' +
                           '{{item.name}}' +
                           '</li>' +
                           '</ul>'
                          );
        this.data = {items: []};
        this.app = Magery.bind(container, 'app', this.data, {});
    },
    fn: function () {
        for (var i = 0; i < 100; i++) {
            this.app.context.items.push({id: i, name: 'item' + i});
            this.app.update();
        }
    }
});
bench.run({async: true});


bench = new Benchmark.Suite(
    'Randomly remove elements from 100 length list, one at a time (no keys)',
    handlers({
        onReset: function () {
            console.log(['reset', arguments]);
        },
        onStart: function () {
            window.App = React.createClass({
                render: function () {
                    var items = this.props.items;
                    return React.createElement('ul', null, items.map(function (item) {
                        return React.createElement('li', null, item.name);
                    }));
                }
            });
            window.react_data = {items: []};
            for (var i = 0; i < 100; i++) {
                window.react_data.items.push({name: 'item' + i});
            }
            createTemplateNode('app',
                               '<ul>' +
                               '<li data-each="item in items">' +
                               '{{item.name}}' +
                               '</li>' +
                               '</ul>'
                              );
            window.magery_data = {items: []};
            for (var i = 0; i < 100; i++) {
                window.magery_data.items.push({name: 'item' + i});
            }
            
        }
    })
);
bench.add('React', function () {
    for (var i = 0; i < 100; i++) {
        react_data.items.splice(random(react_data.items.length), 1);
        ReactDOM.render(React.createElement(App, window.react_data), container);
    }
})
bench.add('Magery', function () {
    var app = Magery.bind(container, 'app', window.magery_data, {});
    for (var i = 0; i < 100; i++) {
        app.context.items.splice(random(app.context.items.length - 1), 1);
        app.update();
        }
});
benches.push(bench);

var App = React.createClass({
    render: function () {
        var items = this.props.items;
        return React.createElement('ul', null, items.map(function (item) {
            return React.createElement('li', {key: item.id}, item.name);
        }));
    }
});
var react_data = {items: []};
for (var i = 0; i < 100; i++) {
    react_data.items.push({id: i, name: 'item' + i});
}

createTemplateNode('app',
                   '<ul>' +
                   '<li data-each="item in items" data-key="{{item.id}}">' +
                   '{{item.name}}' +
                   '</li>' +
                   '</ul>'
                  );
var magery_data = {items: []};
for (var i = 0; i < 100; i++) {
    magery_data.items.push({id: i, name: 'item' + i});
}

new Benchmark.Suite(
    'Randomly remove elements from 100 length list, one at a time (keys)',
    handlers
)
    .add('React', function () {
        for (var i = 0; i < 100; i++) {
            react_data.items.splice(random(react_data.items.length), 1);
            ReactDOM.render(React.createElement(App, react_data), container);
        }
    })
    .add('Magery', function () {
        var app = Magery.bind(container, 'app', magery_data, {});
        for (var i = 0; i < 100; i++) {
            app.context.items.splice(random(app.context.items.length - 1), 1);
            app.update();
        }
    })
    .run();


var App = React.createClass({
    render: function () {
        var items = this.props.items;
        return React.createElement('div', {id: 'container'}, [
            React.createElement('ul', null, items.map(function (item) {
                var children = [];
                if (item.published) {
                    children.push(
                        React.createElement('span', null, 'Published')
                    );
                }
                children.push(
                    React.createElement('strong', null, item.name)
                );
                return React.createElement('li', {key: item.id}, children);
            }))
        ]);
    }
});

createTemplateNode('app',
                   '<div id="container">' +
                   '<ul>' +
                   '<li data-each="item in items" data-key="{{item.id}}">' +
                   '<span data-if="item.published">Published</span>' +
                   '<strong>{{item.name}}</strong>' +
                   '</li>' +
                   '</ul>' +
                   '</div>'
                  );

new Benchmark.Suite(
    'Add 100 more complex elements to a list, one at a time',
    handlers
)
    .add('React', function () {
        var data = {items: []};
        for (var i = 0; i < 100; i++) {
            data.items.push({id: i, name: 'item' + i});
            ReactDOM.render(React.createElement(App, data), container);
        }
    })
    .add('Magery', function () {
        var data = {items: []};
        var app = Magery.bind(container, 'app', data, {});
        for (var i = 0; i < 100; i++) {
            app.context.items.push({id: i, name: 'item' + i});
            app.update();
        }
    })
    .run();

function input(el, value) {
    el.value = value;
    el.dispatchEvent(new Event('input'));
}

var test_string = 'This is a test of how quickly input events update a managed textbox';

var App = React.createClass({
    getInitialState: function () {
        return {name: ''};
    },
    updateInput: function (ev) {
        this.setState({name: ev.target.value});
    },
    render: function () {
        return React.createElement('input', {
            type: 'text',
            id: 'testInput',
            value: this.state.name,
            onInput: this.updateInput.bind(this)
        });
    }
});

createTemplateNode(
    'app',
    '<input type="text" id="testInput" value="{{name}}" data-managed="true" oninput="updateInput(event)" />'
);

new Benchmark.Suite(
    'Live update a managed text box',
    handlers
)
    .add('React', function () {
        ReactDOM.render(React.createElement(App, {}), container);
        var el = document.getElementById('testInput');
        for (var i = 0; i < 100; i++) {
            var str = test_string.substring(0, i + 1);
            el.value = str;
            input(el, str);
        }
    })
    .add('Magery', function () {
        var data = {name: ''};
        var app = Magery.bind(container, 'app', data, {
            updateInput: function (ev) {
                this.context.name = ev.target.value;
            }
        });
        var el = document.getElementById('testInput');
        for (var i = 0; i < 100; i++) {
            var str = test_string.substring(0, i + 1);
            el.value = str;
            input(el, str);
        }
    })
    .run();
