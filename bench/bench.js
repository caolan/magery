function createTemplateNode(src) {
    var el = document.getElementById('test-templates');
    if (!el) {
        el = document.createElement('template');
        document.body.appendChild(el);
        el.id = 'test-templates';
    }
    el.innerHTML = src;
    var code = Magery.compile(el);
    return eval(code);
}

function random (max) {
    return Math.floor(Math.random() * (max + 1));
};

// NOTE: setup() is called once for _multiple_ invocations of the benchmark loop (fn)

benchsuite('Add 100 elements to a list, one at a time (no keys)', function () {
    bench({
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
        },
        fn: function () {
            var container = document.createElement('div');
            var data = {items: []};
            ReactDOM.render(React.createElement(this.App, data), container);
            for (var i = 0; i < 100; i++) {
                data.items.push({name: 'item' + i});
                ReactDOM.render(React.createElement(this.App, data), container);
            }
        }
    });
    bench({
        name: 'Magery',
        setup: function () {
            this.templates = createTemplateNode(
                '<ul data-template="app">' +
                    '<li data-each="item in items">' +
                        '{{item.name}}' +
                    '</li>' +
                '</ul>'
            );
        },
        fn: function () {
            var data = {items: []};
            var container = document.createElement('div');
            var element = document.createElement('ul');
            container.appendChild(element);
            for (var i = 0; i < 100; i++) {
                data.items.push({name: 'item' + i});
                Magery.patch(this.templates, 'app', data, element);
            }
        }
    });
});

benchsuite('Add 100 elements to a list, one at a time (keys)', function () {
    bench({
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
        },
        fn: function () {
            var container = document.createElement('div');
            var data = {items: []};
            ReactDOM.render(React.createElement(this.App, data), container);
            for (var i = 0; i < 100; i++) {
                data.items.push({id: i, name: 'item' + i});
                ReactDOM.render(React.createElement(this.App, data), container);
            }
        }
    });
    bench({
        name: 'Magery',
        setup: function () {
            this.templates = createTemplateNode(
                '<ul data-template="app">' +
                    '<li data-each="item in items" data-key="{{item.id}}">' +
                    '{{item.name}}' +
                    '</li>' +
                    '</ul>'
            );
        },
        fn: function () {
            var container = document.createElement('div');
            var element = document.createElement('ul');
            container.appendChild(element);
            var data = {items: []};
            for (var i = 0; i < 100; i++) {
                data.items.push({id: i, name: 'item' + i});
                Magery.patch(this.templates, 'app', data, element);
            }
        }
    });
});

benchsuite('Randomly remove elements from 100 length list, one at a time (no keys)', function () {
    bench({
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
            this.items = [];
            for (var i = 0; i < 100; i++) {
                this.items.push({name: 'item' + i});
            }
        },
        fn: function () {
            var container = document.createElement('div');
            var data = {items: this.items.slice()};
            ReactDOM.render(React.createElement(this.App, data), container);
            for (var i = 0; i < 100; i++) {
                data.items.splice(random(data.items.length), 1);
                ReactDOM.render(React.createElement(this.App, data), container);
            }
        }
    });
    bench({
        name: 'Magery',
        setup: function () {
            this.templates = createTemplateNode(
                '<ul data-template="app">' +
                    '<li data-each="item in items">' +
                    '{{item.name}}' +
                    '</li>' +
                    '</ul>'
            );
            this.items = [];
            for (var i = 0; i < 100; i++) {
                this.items.push({name: 'item' + i});
            }
        },
        fn: function () {
            var data = {items: this.items.slice()};
            var container = document.createElement('div');
            var element = document.createElement('ul');
            container.appendChild(element);
            for (var i = 0; i < 100; i++) {
                data.items.splice(random(data.items.length - 1), 1);
                Magery.patch(this.templates, 'app', data, element);
            }
        }
    });
});

benchsuite('Randomly remove elements from 100 length list, one at a time (keys)', function () {
    bench({
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
            this.items = [];
            for (var i = 0; i < 100; i++) {
                this.items.push({id: i, name: 'item' + i});
            }
        },
        fn: function () {
            var container = document.createElement('div');
            var data = {items: this.items.slice()};
            ReactDOM.render(React.createElement(this.App, data), container);
            for (var i = 0; i < 100; i++) {
                data.items.splice(random(data.items.length), 1);
                ReactDOM.render(React.createElement(this.App, data), container);
            }
        }
    });
    bench({
        name: 'Magery',
        setup: function () {
            this.templates = createTemplateNode(
                               '<ul data-template="app">' +
                               '<li data-each="item in items" data-key="{{item.id}}">' +
                               '{{item.name}}' +
                               '</li>' +
                               '</ul>'
                              );
            this.items = [];
            for (var i = 0; i < 100; i++) {
                this.items.push({id: i, name: 'item' + i});
            }
        },
        fn: function () {
            var container = document.createElement('div');
            var element = document.createElement('ul');
            container.appendChild(element);
            var data = {items: this.items.slice()};
            for (var i = 0; i < 100; i++) {
                data.items.splice(random(data.items.length - 1), 1);
                Magery.patch(this.templates, 'app', data, element);
            }
        }
    });
});

benchsuite('Add 100 more complex elements to a list, one at a time', function () {
    bench({
        name: 'React',
        setup: function () {
            this.App = React.createClass({
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
        },
        fn: function () {
            var container = document.createElement('container');
            var data = {items: []};
            ReactDOM.render(React.createElement(this.App, data), container);
            for (var i = 0; i < 100; i++) {
                data.items.push({id: i, name: 'item' + i});
                ReactDOM.render(React.createElement(this.App, data), container);
            }
        }
    });
    bench({
        name: 'Magery',
        setup: function () {
            this.templates = createTemplateNode(
                '<div id="container" data-template="app">' +
                    '<ul>' +
                    '<li data-each="item in items" data-key="{{item.id}}">' +
                    '<span data-if="item.published">Published</span>' +
                    '<strong>{{item.name}}</strong>' +
                    '</li>' +
                    '</ul>' +
                    '</div>'
            );
        },
        fn: function () {
            var container = document.createElement('div');
            var element = document.createElement('div');
            container.appendChild(element);
            var data = {items: []};
            for (var i = 0; i < 100; i++) {
                data.items.push({id: i, name: 'item' + i});
                Magery.patch(this.templates, 'app', data, element);
            }
        }
    });
});

benchsuite('handle 100 click events to update a counter', function () {
    bench({
        name: 'React (using setState)',
        setup: function () {
            this.App = React.createClass({
                getInitialState: function () {
                    return {counter: 0};
                },
                incrementCounter: function (ev) {
                    this.setState({counter: this.state.counter + 1});
                },
                render: function () {
                    return React.createElement('input', {
                        type: 'button',
                        value: this.state.counter,
                        onClick: this.incrementCounter
                    });
                }
            });
            this.scratch = document.getElementById('scratch-area');
        },
        fn: function () {
            this.scratch.innerHTML = '';
            ReactDOM.render(React.createElement(this.App, {}), this.scratch);
            var el = this.scratch.querySelector('input');
            for (var i = 0; i < 100; i++) {
                el.click();
            }
        }
    });
    bench({
        name: 'React (top-down rendering + props)',
        setup: function () {
            var self = this;
            this.App = React.createClass({
                incrementCounter: function (ev) {
                    self.data.counter++;
                    self.render();
                },
                render: function () {
                    return React.createElement('input', {
                        type: 'button',
                        value: this.props.counter,
                        onClick: this.incrementCounter
                    });
                }
            });
            this.scratch = document.getElementById('scratch-area');
        },
        fn: function () {
            this.scratch.innerHTML = '';
            this.data = {counter: 0};
            this.render = function () {
                ReactDOM.render(React.createElement(this.App, this.data), this.scratch);
            };
            this.render();
            var el = this.scratch.querySelector('input');
            for (var i = 0; i < 100; i++) {
                el.click();
            }
        }
    });
    bench({
        name: 'Magery',
        setup: function () {
            this.templates = createTemplateNode(
                '<input data-template="app" type="button" value="{{counter}}" onclick="incrementCounter(event)" />'
            );
            this.scratch = document.getElementById('scratch-area');
        },
        fn: function () {
            this.scratch.innerHTML = '';
            var templates = this.templates;
            var element = document.createElement('input');
            var data = {counter: 0};
            this.scratch.appendChild(element);
            function render() {
                Magery.patch(templates, 'app', data, element);
            }
            this.templates['app'].bind({
                incrementCounter: function (ev) {
                    data.counter++;
                    render();
                }
            });
            render();
            for (var i = 0; i < 100; i++) {
                element.click();
            }
        }
    });
});
