var idom = IncrementalDOM;

var now;
if (window.performance) {
    now = function () {
        return window.performance.now();
    };
}
else {
    now = function () {
        return new Date().getTime();
    };
}

function section(heading, f) {
    var section = document.createElement('section');
    var h2 = document.createElement('h2');
    h2.textContent = heading;
    section.appendChild(h2);
    var span = document.createElement('span');
    span.textContent = 'Running...';
    section.appendChild(span);
    var container = document.getElementById('results');
    container.appendChild(section);
    var results = {};
    function bench(name, f) {
        var container = document.getElementById('output');
        f(container, function (iterations, patch) {
            var sample = [];
            var fastest = Infinity;
            var slowest = 0;
            var start = now();
            for (var i = 0; i < iterations; i++) {
                var istart = now();
                patch(i);
                var iend = now();
                var iduration = iend - istart;
                if (i % 10 === 0) {
                    sample.push(iduration);
                }
                if (iduration > slowest) {
                    slowest = iduration;
                }
                if (iduration < fastest) {
                    fastest = iduration;
                }
            }
            var end = now();
            var data = {
                fastest: fastest,
                slowest: slowest,
                total: (end - start),
                average: (end - start) / iterations,
                iterations: iterations,
                sample: sample
            };
            results[name] = data;
        });
    }
    f(bench);
    span.textContent = 'Total time (ms)';
    var responsiveOptions = {};
    var chart = document.createElement('div');
    chart.style = 'height: 200px; width: 80%;';
    container.appendChild(chart);
    chart.className = 'ct-chart ct-perfect-fourth';
    var data = {
        labels: Object.keys(results),
        series: [
            Object.keys(results).map(function (name) {
                return results[name].total;
            })
        ]
    };
    var options = {
        seriesBarDistance: 1,
        reverseData: true,
        horizontalBars: true,
        axisY: {
            offset: 100
        }
    };
    new Chartist.Bar(chart, data, options, responsiveOptions);
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

section('Add 100 elements to a list, one at a time - no keys', function (bench) {
    bench('Magery', function (container, iter) {
        createTemplateNode('app',
              '<ul>' +
                '<li data-each="item in items">' +
                  '{{item.name}}' +
                '</li>' +
              '</ul>'
        );
        var data = {items: []};
        var app = Magery.bind(container, 'app', data, {});
        iter(100, function (i) {
            app.context.items.push({name: 'item' + i});
            app.update();
        });
    });

    bench('React', function (container, iter) {
        var App = React.createClass({
            render: function () {
                var items = this.props.items;
                return React.createElement('ul', null, items.map(function (item) {
                    return React.createElement('li', null, item.name);
                }));
            }
        });
        var data = {items: []};
        iter(100, function (i) {
            data.items.push({name: 'item' + i});
            ReactDOM.render(React.createElement(App, data), container);
        });
    });

    bench('IncrementalDOM', function (container, iter) {
        function render(data) {
            idom.elementOpen('ul', '', null);
            data.items.forEach(function (item) {
                idom.elementOpen('li', '', null);
                idom.text(item.name);
                idom.elementClose('li');
            });
            idom.elementClose('ul');
        }
        var data = {items: []};
        iter(100, function (i) {
            data.items.push({name: 'item' + i});
            idom.patch(container, function() {
                render(data);
            });
        });
    });

});



section('Add 100 elements to a list, one at a time - keys', function (bench) {

    bench('Magery', function (container, iter) {
        createTemplateNode('app',
              '<ul>' +
                '<li data-each="item in items" data-key="{{item.id}}">' +
                  '{{item.name}}' +
                '</li>' +
              '</ul>'
        );
        var data = {items: []};
        var app = Magery.bind(container, 'app', data, {});
        iter(100, function (i) {
            app.context.items.push({id: i, name: 'item' + i});
            app.update();
        });
    });

    bench('React', function (container, iter) {
        var App = React.createClass({
            render: function () {
                var items = this.props.items;
                return React.createElement('ul', null, items.map(function (item) {
                    return React.createElement('li', {key: item.id}, item.name);
                }));
            }
        });
        var data = {items: []};
        iter(100, function (i) {
            data.items.push({id: i, name: 'item' + i});
            ReactDOM.render(React.createElement(App, data), container);
        });
    });

    bench('IncrementalDOM', function (container, iter) {
        function render(data) {
            idom.elementOpen('ul', '', null);
            data.items.forEach(function (item) {
                idom.elementOpen('li', item.id, null);
                idom.text(item.name);
                idom.elementClose('li');
            });
            idom.elementClose('ul');
        }
        var data = {items: []};
        iter(100, function (i) {
            data.items.push({id: i, name: 'item' + i});
            idom.patch(container, function() {
                render(data);
            });
        });
    });

});

section('Randomly remove elements from 100 length list, one at a time - no keys', function (bench) {

    function random(max) {
        return Math.floor(Math.random() * (max + 1));
    }

    bench('Magery', function (container, iter) {
        createTemplateNode('app',
                '<ul>' +
                    '<li data-each="item in items">' +
                        '{{item.name}}' +
                    '</li>' +
                '</ul>'
        );
        var data = {items: []};
        for (var i = 0; i < 100; i++) {
            data.items.push({name: 'item' + i});
        }
        var app = Magery.bind(container, 'app', data, {});
        iter(100, function (i) {
            app.context.items.splice(random(app.context.items.length - 1), 1);
            app.update();
        });
    });

    bench('React', function (container, iter) {
        var App = React.createClass({
            render: function () {
                var items = this.props.items;
                return React.createElement('ul', null, items.map(function (item) {
                    return React.createElement('li', null, item.name);
                }));
            }
        });
        var data = {items: []};
        for (var i = 0; i < 100; i++) {
            data.items.push({name: 'item' + i});
        }
        iter(100, function (i) {
            data.items.splice(random(data.items.length), 1);
            ReactDOM.render(React.createElement(App, data), container);
        });
    });

    bench('IncrementalDOM', function (container, iter) {
        function render(data) {
            idom.elementOpen('ul', '', null);
            data.items.forEach(function (item) {
                idom.elementOpen('li', '', null);
                idom.text(item.name);
                idom.elementClose('li');
            });
            idom.elementClose('ul');
        }
        var data = {items: []};
        for (var i = 0; i < 100; i++) {
            data.items.push({name: 'item' + i});
        }
        iter(100, function (i) {
            data.items.splice(random(data.items.length), 1);
            idom.patch(container, function() {
                render(data);
            });
        });
    });

});

section('Randomly remove elements from 100 length list, one at a time - keys', function (bench) {

    function random(max) {
        return Math.floor(Math.random() * (max + 1));
    }

    bench('Magery', function (container, iter) {
        createTemplateNode('app',
                '<ul>' +
                    '<li data-each="item in items" data-key="{{item.id}}">' +
                        '{{item.name}}' +
                    '</li>' +
                '</ul>'
        );
        var data = {items: []};
        for (var i = 0; i < 100; i++) {
            data.items.push({id: i, name: 'item' + i});
        }
        var app = Magery.bind(container, 'app', data, {});
        iter(100, function (i) {
            app.context.items.splice(random(app.context.items.length - 1), 1);
            app.update();
        });
    });

    bench('React', function (container, iter) {
        var App = React.createClass({
            render: function () {
                var items = this.props.items;
                return React.createElement('ul', null, items.map(function (item) {
                    return React.createElement('li', {key: item.id}, item.name);
                }));
            }
        });
        var data = {items: []};
        for (var i = 0; i < 100; i++) {
            data.items.push({id: i, name: 'item' + i});
        }
        iter(100, function (i) {
            data.items.splice(random(data.items.length), 1);
            ReactDOM.render(React.createElement(App, data), container);
        });
    });

    bench('IncrementalDOM', function (container, iter) {
        function render(data) {
            idom.elementOpen('ul', '', null);
            data.items.forEach(function (item) {
                idom.elementOpen('li', item.id, null);
                idom.text(item.name);
                idom.elementClose('li');
            });
            idom.elementClose('ul');
        }
        var data = {items: []};
        for (var i = 0; i < 100; i++) {
            data.items.push({id: i, name: 'item' + i});
        }
        iter(100, function (i) {
            data.items.splice(random(data.items.length), 1);
            idom.patch(container, function() {
                render(data);
            });
        });
    });

});

section('Live update a managed text box', function (bench) {

    function input(el, value){
        var ev = new InputEvent('input');
        el.value = value;
        el.dispatchEvent(ev);
    }
    
    var test_string = 'This is a test of how quickly input events update a textbox';
    
    bench('Magery', function (container, iter) {
        createTemplateNode(
            'app',
            '<input type="text" id="testInput" value="{{name}}" oninput="updateInput(event)" />'
        );
        var data = {name: ''};
        var app = Magery.bind(container, 'app', data, {
            updateInput: function (ev) {
                this.context.name = ev.target.value;
            }
        });
        var el = document.getElementById('testInput');
        iter(test_string.length, function (i) {
            input(el, test_string.substring(0, i + 1));
        });
    });

    bench('React', function (container, iter) {
        var data = {name: ''};
        var App = React.createClass({
            render: function () {
                return React.createElement('input', {
                    type: 'text',
                    id: 'testInput',
                    value: this.props.name,
                    onInput: this.props.updateInput
                });
            }
        });
        var updateInput = function (ev) {
            data.name = ev.target.value;
            ReactDOM.render(React.createElement(App, {name: data.name, updateInput: updateInput}), container);
        };
        var el = document.getElementById('testInput');
        iter(100, function (i) {
            input(el, test_string.substring(0, i + 1));
        });
    });
    
});
