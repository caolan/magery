suite('active_paths', function () {

    var assert = chai.assert;

    function createTemplateNode(src) {
        var el = document.getElementById('test-templates');
        if (!el) {
            el = document.createElement('template');
            document.body.appendChild(el);
            el.id = 'test-templates';
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
        active_paths.markPath(obj, ['foo', 'bar', 'baz']);
        assert.deepEqual(obj, {foo: {bar: {baz: true}}});
        active_paths.markPath(obj, ['foo', 'bar', 'qux']);
        assert.deepEqual(obj, {foo: {bar: true}});
        active_paths.markPath(obj, ['wibble', 'wobble']);
        assert.deepEqual(obj, {
            foo: {bar: true},
            wibble: {wobble: true}
        });
        active_paths.markPath(obj, ['wibble', 'wubble']);
        assert.deepEqual(obj, {
            foo: {bar: true},
            wibble: true
        });
        active_paths.markPath(obj, ['foo', 'quux']);
        assert.deepEqual(obj, {
            foo: true,
            wibble: true
        });
    });

    test('mergePaths', function () {
        var a = {};
        var b = {};
        active_paths.mergePaths(a, b);
        assert.deepEqual(a, {});
        b = {foo: {bar: {baz: true}}};
        active_paths.mergePaths(a, b);
        assert.deepEqual(a, {foo: {bar: {baz: true}}});
        b = {foo: {bar: {qux: true}}, wibble: {wobble: true}};
        active_paths.mergePaths(a, b);
        assert.deepEqual(a, {foo: {bar: true}, wibble: {wobble: true}});
        b = {wibble: {wubble: true}, one: {two: true}};
        active_paths.mergePaths(a, b);
        assert.deepEqual(a, {
            foo: {bar: true},
            wibble: true,
            one: {two: true}
        });
    });

    test('equivalentPathObjects', function () {
        assert.ok(active_paths.equivalentPathObjects(
            {foo: {bar: {baz: true}}},
            {foo: {bar: {baz: true}}}
        ));
        assert.ok(!active_paths.equivalentPathObjects(
            {foo: {bar: {baz: true}}},
            {foo: {bar: true}}
        ));
        assert.ok(active_paths.equivalentPathObjects(
            {
                foo: {bar: {baz: true}},
                wibble: {wobble: true}
            },
            {
                foo: {bar: {baz: true}},
                wibble: {wobble: true}
            }
        ));
        assert.ok(!active_paths.equivalentPathObjects(
            {
                foo: {bar: {baz: true}},
                wibble: {wobble: true}
            },
            {
                foo: {bar: {baz: true}},
                wibble: {wubble: true}
            }
        ));
        assert.ok(!active_paths.equivalentPathObjects(
            {
                foo: {bar: true},
                baz: true
            },
            {
                foo: {bar: true}
            }
        ));
        assert.ok(!active_paths.equivalentPathObjects(
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
            active_paths.stringPaths("{{foo}}"),
            {foo: true}
        );
        assert.deepEqual(
            active_paths.stringPaths('Hello, {{user.name}}!'),
            {user: {name: true}}
        );
        assert.deepEqual(
            active_paths.stringPaths('{{article.title}} by {{user.name}}'),
            {
                article: {title: true},
                user: {name: true}
            }
        );
        assert.deepEqual(
            active_paths.stringPaths('{{article.title}} by {{user.name}} ({{user.nick}})'),
            {
                article: {title: true},
                user: true
            }
        );
        // with spaces around property names
        assert.deepEqual(
            active_paths.stringPaths('{{  user.name  }}'),
            {user: {name: true}}
        );
    });

    test('elementPaths', function () {
        var container = document.createElement('div');

        container.innerHTML = '<span></span>';
        assert.deepEqual(
            active_paths.elementPaths(container.childNodes[0]),
            {}
        );

        container.innerHTML = '<h1>{{title}}</h1>';
        assert.deepEqual(
            active_paths.elementPaths(container.childNodes[0]),
            {title: true}
        );
        assert.ok(!container.childNodes[0].childNodes[0].static);
        assert.ok(!container.childNodes[0].childNodes[0].active_keys);
        
        container.innerHTML = '<img src="{{user.avatar.url}}" />';
        assert.deepEqual(
            active_paths.elementPaths(container.childNodes[0]),
            {user: {avatar: {url: true}}}
        );
        
        container.innerHTML = '<h1 class="{{type}}">' +
            '{{title}} by <span class="author">{{user.name}}</span>' +
            '</h1>';
        assert.deepEqual(
            active_paths.elementPaths(container.childNodes[0]),
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
            active_paths.elementPaths(container.childNodes[0]),
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
        var el = createTemplateNode(
            '<h1 data-template="app">Hello, world!</h1>'
        );
        active_paths.markPaths(el.content);
        assert.ok(el.content.childNodes[0].static);
    });

    test('nested static nodes', function () {
        var el = createTemplateNode(
            '<li data-template="app">' +
                '<span class="user-icon">User:</span>' +
                '<strong>{{ name }}</strong>' +
                '</li>'
        );
        active_paths.markPaths(el.content);
        var tmpl = el.content.childNodes[0];
        assert.ok(!tmpl.static);
        assert.ok(child(tmpl, 0).static);
        assert.ok(child(tmpl, 0, 0).static);
        assert.ok(!child(tmpl, 1).static);
        assert.ok(!child(tmpl, 1, 0).static);
    });

    test('simple active_paths', function () {
        var el = createTemplateNode(
            '<div data-template="app">' +
                '<div class="site-name">Test</div>' +
                '<h1>{{title}}</h1>' +
                'by ' +
                '<a href="{{ author.profile }}">' +
                '{{ author.name }}' +
                '</a>' +
                '</div>'
        );
        var tmpl = el.content.childNodes[0];
        active_paths.markPaths(el.content);
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
    
    test('data-if active_paths', function () {
        var el = createTemplateNode(
            '<span data-template="app" data-if="article.published">' +
                'published' +
                '</span>'
        );
        var tmpl = el.content.childNodes[0];
        active_paths.markPaths(el.content);
        // template root element
        // <span data-if="article.published">...</span>
        assert.ok(!tmpl.static);
        assert.deepEqual(tmpl.active_paths, {
            article: {published: true}
        });
        // published
        assert.ok(child(tmpl, 0).static);
        
        el = createTemplateNode(
            '<span data-template="app" data-if="article.published">' +
                '{{article.title}} is published' +
                '</span>'
        );
        tmpl = el.content.childNodes[0];
        active_paths.markPaths(el.content);
        // template root element
        // <span data-if="article.published">...</span>
        assert.ok(!tmpl.static);
        assert.deepEqual(tmpl.active_paths, {
            article: true
        });
        // {{article.title}} is published
        assert.ok(!child(tmpl, 0).static);
        assert.deepEqual(child(tmpl, 0).active_paths, {
            article: {title: true}
        });
    });

    test('data-unless active_paths', function () {
        var el = createTemplateNode(
            '<span data-template="app" data-unless="article.published">' +
                'draft' +
                '</span>'
        );
        var tmpl = el.content.childNodes[0];
        active_paths.markPaths(el.content);
        // template root element
        // <span data-unless="article.published">...</span>
        assert.ok(!tmpl.static);
        assert.deepEqual(tmpl.active_paths, {
            article: {published: true}
        });
        // draft
        assert.ok(child(tmpl, 0).static);
        
        el = createTemplateNode(
            '<span data-template="app" data-unless="article.published">' +
                '{{article.title}} is a draft' +
                '</span>'
        );
        tmpl = el.content.childNodes[0];
        active_paths.markPaths(el.content);
        // template root element
        // <span data-unless="article.published">...</span>
        assert.ok(!tmpl.static);
        assert.deepEqual(tmpl.active_paths, {
            article: true
        });
        // {{article.title}} is a draft
        assert.ok(!child(tmpl, 0).static);
        assert.deepEqual(child(tmpl, 0).active_paths, {
            article: {title: true}
        });
    });
    
    test('data-each active_paths', function () {
        var el = createTemplateNode(
            '<span data-template="app" data-each="item in items">' +
                '{{ item.name }}' +
                '</span>'
        );
        var tmpl = el.content.childNodes[0];
        active_paths.markPaths(el.content);
        // template root element
        // <span data-each="item" in="items">...</span>
        assert.ok(!tmpl.static);
        assert.deepEqual(tmpl.active_paths, {
            items: true
        });
        // {{ item.name }}
        assert.ok(!child(tmpl, 0).static);
        assert.deepEqual(child(tmpl, 0).active_paths, {
            item: {name: true}
        });

        el = createTemplateNode(
            '<span data-template="app" data-each="item in items">' +
                '{{ item.name }} added by {{ user.name }}' +
                '</span>'
        );
        tmpl = el.content.childNodes[0];
        active_paths.markPaths(el.content);
        // template root element
        // <span data-each="item in items">...</span>
        assert.ok(!tmpl.static);
        assert.deepEqual(tmpl.active_paths, {
            user: {name: true},
            items: true
        });
        // {{ item.name }}
        assert.ok(!child(tmpl, 0).static);
        assert.deepEqual(child(tmpl, 0).active_paths, {
            user: {name: true},
            item: {name: true}
        });
    });

    test('static template-call active_paths', function () {
        var el = createTemplateNode(
            '<template-call template="profileInfo" user="article.author" title="title" />'
        );
        var tmpl = el.content.childNodes[0];
        active_paths.markPaths(el.content);
        // template root element
        // <template-call>
        assert.ok(!tmpl.static);
        assert.deepEqual(tmpl.active_paths, {
            article: {author: true},
            title: true
        });
    });

    test('dynamic template-call active_paths', function () {
        var el = createTemplateNode(
            '<template-call template="{{template}}" user="article.author" title="title" />'
        );
        var tmpl = el.content.childNodes[0];
        active_paths.markPaths(el.content);
        // template root element
        // <template-call>
        assert.ok(!tmpl.static);
        assert.deepEqual(tmpl.active_paths, {
            article: {author: true},
            title: true,
            template: true
        });
    });

    test('template-call with children active_paths', function () {
        var el = createTemplateNode(
            '<template-call template="example" author="article.author">' +
                '<p>{{ text }}</p>' +
                '</template-call>'
        );
        var tmpl = el.content.childNodes[0];
        active_paths.markPaths(el.content);
        // template root element
        // <template-call>
        assert.ok(!tmpl.static);
        assert.deepEqual(tmpl.active_paths, {
            article: {author: true},
            text: true
        });
        // <p>
        assert.ok(!child(tmpl, 0).static);
        assert.deepEqual(child(tmpl, 0).active_paths, {
            text: true
        });
        // {{ text }}
        assert.ok(!child(tmpl, 0, 0).static);
        assert.ok(!child(tmpl, 0, 0).active_paths);
    });

    test('template-children must wildcard active_paths to root of current template', function () {
        var el = createTemplateNode(
            '<div class="container">' +
                '<div class="main">' +
                '{{ test }}' +
                '<template-children></template-children>' +
                'foo' +
                '</div>' +
                '</div>'
        );
        var tmpl = el.content.childNodes[0];
        active_paths.markPaths(el.content);
        // template root element
        // <div class="container">...</div>
        assert.ok(!tmpl.static);
        assert.equal(tmpl.active_paths, false);
        // <div class="main">...</div>
        assert.ok(!child(tmpl, 0).static);
        assert.ok(!child(tmpl, 0).active_paths);
        // {{ test }}
        assert.ok(!child(tmpl, 0, 0).static);
        assert.deepEqual(child(tmpl, 0, 0).active_paths, {
            test: true
        });
        // <template-children />
        assert.ok(!child(tmpl, 0, 1).static);
        assert.ok(!child(tmpl, 0, 1).active_paths);
        // foo
        assert.ok(child(tmpl, 0, 2).static);
    });
    
    test('template-children inside data-each', function () {
        var el = createTemplateNode(
            '<div data-template="app" data-each="item in items">' +
                '<p><template-children/></p>' +
                '</div>'
        );
        var tmpl = el.content.childNodes[0];
        active_paths.markPaths(el.content);
        // template root element
        assert.ok(!tmpl.static);
        assert.ok(!tmpl.active_paths);
        // <p>
        assert.ok(!child(tmpl, 0).static);
        assert.ok(!child(tmpl, 0).active_paths);
        // <template-children>
        assert.ok(!child(tmpl, 0, 0).static);
        assert.ok(!child(tmpl, 0, 0).active_paths);
    });

});
