function createTemplateNode(src) {
    var el = document.getElementById('test-templates');
    if (!el) {
        el = document.createElement('template');
        document.body.appendChild(el);
        el.id = 'test-templates';
    }
    el.innerHTML = src;
    var code = Magery.compile.compileToString(el.content);
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
                Magery.patch(element, this.templates, 'app', data);
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
                Magery.patch(element, this.templates, 'app', data);
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
                Magery.patch(element, this.templates, 'app', data);
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
                Magery.patch(element, this.templates, 'app', data);
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
                Magery.patch(element, this.templates, 'app', data);
            }
        }
    });
});

function input(el, value) {
    el.value = value;
    el.dispatchEvent(new Event('input'));
}

var test_string = 'This is a test of how quickly input events update a managed textbox';

benchsuite('Live update a managed text box', function () {
    bench({
        name: 'React',
        setup: function () {
            this.App = React.createClass({
                getInitialState: function () {
                    return {name: ''};
                },
                updateInput: function (ev) {
                    this.setState({name: ev.target.value});
                },
                render: function () {
                    return React.createElement('input', {
                        type: 'text',
                        value: this.state.name,
                        onInput: this.updateInput.bind(this)
                    });
                }
            });
        },
        fn: function () {
            var container = document.createElement('div');
            ReactDOM.render(React.createElement(this.App, {}), container);
            var el = container.querySelector('input');
            for (var i = 0; i < 100; i++) {
                var str = test_string.substring(0, i + 1);
                el.value = str;
                input(el, str);
            }
        }
    });
    bench({
        name: 'Magery',
        setup: function () {
            this.templates = createTemplateNode(
                '<input data-template="app" type="text" value="{{name}}" data-managed="true" oninput="updateInput(event)" />'
            );
        },
        fn: function () {
            var element = document.createElement('input');
            var data = {name: ''};
            this.templates['app'].bind({
                updateInput: function (ev) {
                    data.name = ev.target.value;
                    Magery.patch(element, this.templates, 'app', data);
                }
            });
            Magery.patch(element, this.templates, 'app', data);
            for (var i = 0; i < 100; i++) {
                var str = test_string.substring(0, i + 1);
                element.value = str;
                input(element, str);
            }
        }
    });
});
