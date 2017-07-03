suite('initTemplates', function () {

    var assert = chai.assert;

    function createTemplateNode(id, src) {
        var el = document.getElementById(id);
        if (!el) {
            el = document.createElement('template');
            document.body.appendChild(el);
            el.id = id;
        }
        el.innerHTML = src;
        return el;
    }

    function child(node /*...*/) {
        for (var i = 1; i < arguments.length; i++) {
            node = node.childNodes[arguments[i]];
        }
        return node;
    }

    test('markPath', function () {
        var obj = {};
        init.markPath(obj, ['foo', 'bar', 'baz']);
        assert.deepEqual(obj, {foo: {bar: {baz: true}}});
        init.markPath(obj, ['foo', 'bar', 'qux']);
        assert.deepEqual(obj, {foo: {bar: true}});
        init.markPath(obj, ['wibble', 'wobble']);
        assert.deepEqual(obj, {
            foo: {bar: true},
            wibble: {wobble: true}
        });
        init.markPath(obj, ['wibble', 'wubble']);
        assert.deepEqual(obj, {
            foo: {bar: true},
            wibble: true
        });
        init.markPath(obj, ['foo', 'quux']);
        assert.deepEqual(obj, {
            foo: true,
            wibble: true
        });
    });

    test('mergePaths', function () {
        var a = {};
        var b = {};
        init.mergePaths(a, b);
        assert.deepEqual(a, {});
        b = {foo: {bar: {baz: true}}};
        init.mergePaths(a, b);
        assert.deepEqual(a, {foo: {bar: {baz: true}}});
        b = {foo: {bar: {qux: true}}, wibble: {wobble: true}};
        init.mergePaths(a, b);
        assert.deepEqual(a, {foo: {bar: true}, wibble: {wobble: true}});
        b = {wibble: {wubble: true}, one: {two: true}};
        init.mergePaths(a, b);
        assert.deepEqual(a, {
            foo: {bar: true},
            wibble: true,
            one: {two: true}
        });
    });

    test('equivalentPathObjects', function () {
        assert.ok(init.equivalentPathObjects(
            {foo: {bar: {baz: true}}},
            {foo: {bar: {baz: true}}}
        ));
        assert.ok(!init.equivalentPathObjects(
            {foo: {bar: {baz: true}}},
            {foo: {bar: true}}
        ));
        assert.ok(init.equivalentPathObjects(
            {
                foo: {bar: {baz: true}},
                wibble: {wobble: true}
            },
            {
                foo: {bar: {baz: true}},
                wibble: {wobble: true}
            }
        ));
        assert.ok(!init.equivalentPathObjects(
            {
                foo: {bar: {baz: true}},
                wibble: {wobble: true}
            },
            {
                foo: {bar: {baz: true}},
                wibble: {wubble: true}
            }
        ));
        assert.ok(!init.equivalentPathObjects(
            {
                foo: {bar: true},
                baz: true
            },
            {
                foo: {bar: true}
            }
        ));
        assert.ok(!init.equivalentPathObjects(
            {
                foo: {bar: true}
            },
            {
                foo: {bar: true},
                baz: true
            }
        ));
    });

    test('stringPaths', function () {
        assert.deepEqual(
            init.stringPaths("{{foo}}"),
            {foo: true}
        );
        assert.deepEqual(
            init.stringPaths('Hello, {{user.name}}!'),
            {user: {name: true}}
        );
        assert.deepEqual(
            init.stringPaths('{{article.title}} by {{user.name}}'),
            {
                article: {title: true},
                user: {name: true}
            }
        );
        assert.deepEqual(
            init.stringPaths('{{article.title}} by {{user.name}} ({{user.nick}})'),
            {
                article: {title: true},
                user: true
            }
        );
        // with spaces around property names
        assert.deepEqual(
            init.stringPaths('{{  user.name  }}'),
            {user: {name: true}}
        );
    });

    test('elementPaths', function () {
        var container = document.createElement('div');

        container.innerHTML = '<span></span>';
        assert.deepEqual(
            init.elementPaths(container.childNodes[0]),
            {}
        );

        container.innerHTML = '<h1>{{title}}</h1>';
        assert.deepEqual(
            init.elementPaths(container.childNodes[0]),
            {title: true}
        );
        assert.ok(!container.childNodes[0].childNodes[0].static);
        assert.ok(!container.childNodes[0].childNodes[0].active_keys);
        
        container.innerHTML = '<img src="{{user.avatar.url}}" />';
        assert.deepEqual(
            init.elementPaths(container.childNodes[0]),
            {user: {avatar: {url: true}}}
        );
        
        container.innerHTML = '<h1 class="{{type}}">' +
            '{{title}} by <span class="author">{{user.name}}</span>' +
            '</h1>';
        assert.deepEqual(
            init.elementPaths(container.childNodes[0]),
            {
                type: true,
                title: true,
                user: {name: true}
            }
        );
        assert.ok(!container.childNodes[0].childNodes[0].static);
        assert.deepEqual(
            container.childNodes[0].childNodes[0].active_paths,
            {title: true}
        );
        assert.ok(!container.childNodes[0].childNodes[1].static);
        assert.deepEqual(
            container.childNodes[0].childNodes[1].active_paths,
            {user: {name: true}}
        );
        assert.ok(!container.childNodes[0].childNodes[1].childNodes[0].static);
        assert.ok(!container.childNodes[0].childNodes[1].childNodes[0].active_paths);
        
        container.innerHTML = '<h1 class="{{article.type}}">' +
            '{{article.title}} by <a href="{{user.profile}}">{{user.name}}</a>' +
            '</h1>';
        assert.deepEqual(
            init.elementPaths(container.childNodes[0]),
            {article: true, user: true}
        );
        assert.ok(!container.childNodes[0].childNodes[0].static);
        assert.deepEqual(
            container.childNodes[0].childNodes[0].active_paths,
            {article: {title: true}}
        );
        assert.ok(!container.childNodes[0].childNodes[1].static);
        assert.deepEqual(
            container.childNodes[0].childNodes[1].active_paths,
            {user: true}
        );
        assert.ok(!container.childNodes[0].childNodes[1].childNodes[0].static);
        assert.deepEqual(
            container.childNodes[0].childNodes[1].childNodes[0].active_paths,
            {user: {name: true}}
        );
        
    });

    test('simple static markup', function () {
        createTemplateNode('app',
                           '<h1>Hello, world!</h1>');
        init.initTemplates();
        var tmpl = document.getElementById('app').content;
        assert.ok(tmpl.static);
    });

    test('nested static nodes', function () {
        createTemplateNode('app',
                           '<li>' +
                             '<span class="user-icon">User:</span>' +
                             '<strong>{{ name }}</strong>' +
                           '</li>');
        init.initTemplates();
        var tmpl = document.getElementById('app').content;
        assert.ok(!tmpl.static);
        assert.ok(!child(tmpl, 0).static, true);
        assert.ok(child(tmpl, 0, 0).static, true);
        assert.ok(child(tmpl, 0, 0, 0).static, true);
        assert.ok(!child(tmpl, 0, 1).static, true);
        assert.ok(!child(tmpl, 0, 1, 0).static, true);
    });

    test('simple active_paths', function () {
        createTemplateNode('app',
                           '<div class="site-name">Test</div>' +
                           '<h1>{{title}}</h1>' +
                           'by ' +
                           '<a href="{{ author.profile }}">' +
                             '{{ author.name }}' +
                           '</a>');
        init.initTemplates();
        var tmpl = document.getElementById('app').content;
        // template root element
        assert.ok(!tmpl.static);
        assert.deepEqual(tmpl.active_paths, {
            title: true,
            author: true
        });
        // <div class="site-name">Test</div>
        assert.ok(child(tmpl, 0).static);
        // <h1>{{title}}</h1>
        assert.ok(!child(tmpl, 1).static);
        assert.deepEqual(child(tmpl, 1).active_paths, {
            title: true
        });
        // {{title}}
        assert.ok(!child(tmpl, 1, 0).static);
        assert.ok(!child(tmpl, 1, 0).active_paths);
        // by
        assert.ok(child(tmpl, 2).static);
        // <a href="{{ author.profile }}">...</a>
        assert.ok(!child(tmpl, 3).static);
        assert.deepEqual(child(tmpl, 3).active_paths, {
            author: true
        });
        // {{ author.name }}
        assert.ok(!child(tmpl, 3, 0).static);
        assert.deepEqual(child(tmpl, 3, 0).active_paths, {
            author: {name: true}
        });
    });

});
