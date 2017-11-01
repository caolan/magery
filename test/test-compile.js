suite('Compile', function () {

    var assert = chai.assert;

    function test_patcher(calls) {
        var el = document.createElement('div');
        var patcher = new patch.Patcher(el);
        patcher.enterTag = function (tag, key) {
            calls.push(['enterTag', tag, key]);
        };
        patcher.attribute = function (name, value) {
            calls.push(['attribute', name, value]);
        };
        patcher.text = function (text) {
            calls.push(['text', text]);
        };
        patcher.exitTag = function () {
            calls.push(['exitTag']);
        };
        patcher.skip = function (tag, key) {
            calls.push(['skip', tag, key]);
        };
        return patcher;
    }

    function _patch(templates, name, data) {
        var calls = [];
        test_patcher(calls).render(templates, name, data);
        return calls;
    }

    function createTemplateNode(src) {
        var el = document.getElementById('test-templates');
        if (!el) {
            el = document.createElement('div');
            document.body.appendChild(el);
            el.id = 'test-templates';
            el.style = 'display: none;';
        }
        el.innerHTML = src;
        return compile.eval(el);
    }
 
    test('flat children', function () {
        var templates = createTemplateNode(
            '<template data-tag="my-app">' +
                '<i>foo</i>' +
                '<b>bar</b>' +
                '<em>baz</em>' +
            '</template>'
        );
        var patcher_calls = _patch(templates, 'my-app', {});
        assert.deepEqual(patcher_calls[0], ['enterTag', 'MY-APP', null]);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'I', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'foo']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[5], ['text', 'bar']);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['enterTag', 'EM', null]);
        assert.deepEqual(patcher_calls[8], ['text', 'baz']);
        assert.deepEqual(patcher_calls[9], ['exitTag']);
        assert.deepEqual(patcher_calls[10], ['exitTag']);
        assert.equal(patcher_calls.length, 11);
    });

    test('nested children', function () {
        var templates = createTemplateNode(
            '<template data-tag="my-app">' +
                '<i>foo</i>\n' +
                '<p>\n' +
                '  <b>bar</b>\n' +
                '  <em>baz</em>\n' +
                '</p>\n' +
            '</div>'
        );
        var patcher_calls = _patch(templates, 'my-app', {});
        assert.deepEqual(patcher_calls[0], ['enterTag', 'MY-APP', null]);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'I', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'foo']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['text', '\n']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'P', null]);
        assert.deepEqual(patcher_calls[6], ['text', '\n  ']);
        assert.deepEqual(patcher_calls[7], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[8], ['text', 'bar']);
        assert.deepEqual(patcher_calls[9], ['exitTag']);
        assert.deepEqual(patcher_calls[10], ['text', '\n  ']);
        assert.deepEqual(patcher_calls[11], ['enterTag', 'EM', null]);
        assert.deepEqual(patcher_calls[12], ['text', 'baz']);
        assert.deepEqual(patcher_calls[13], ['exitTag']);
        assert.deepEqual(patcher_calls[14], ['text', '\n']);
        assert.deepEqual(patcher_calls[15], ['exitTag']);
        assert.deepEqual(patcher_calls[16], ['text', '\n']);
        assert.deepEqual(patcher_calls[17], ['exitTag']);
        assert.equal(patcher_calls.length, 18);
    });

    test('variable substitution - text', function () {
        var templates = createTemplateNode(
            '<template data-tag="my-app">Hello, {{name}}!</template>'
        );
        var patcher_calls = _patch(templates, 'my-app', {name: 'world'});
        assert.deepEqual(patcher_calls[0], ['enterTag', 'MY-APP', null]);
        assert.deepEqual(patcher_calls[1], ['text', 'Hello, world!']);
        assert.deepEqual(patcher_calls[2], ['exitTag']);
        assert.equal(patcher_calls.length, 3);
    });

    test('variable substitution - array', function () {
        var templates = createTemplateNode(
            '<template data-tag="my-app">{{names}}</template>'
        );
        var patcher_calls = _patch(templates, 'my-app', {names: ['foo', 'bar', 'baz']});
        assert.deepEqual(patcher_calls[0], ['enterTag', 'MY-APP', null]);
        assert.deepEqual(patcher_calls[1], ['text', 'foo,bar,baz']);
        assert.deepEqual(patcher_calls[2], ['exitTag']);
        assert.equal(patcher_calls.length, 3);
    });
 
    test('variable substitution - undefined', function () {
        var templates = createTemplateNode(
            '<template data-tag="my-app">Hello, {{name}}</template>'
        );
        var patcher_calls = _patch(templates, 'my-app', {});
        assert.deepEqual(patcher_calls[0], ['enterTag', 'MY-APP', null]);
        assert.deepEqual(patcher_calls[1], ['text', 'Hello, ']);
        assert.deepEqual(patcher_calls[2], ['exitTag']);
        assert.equal(patcher_calls.length, 3);
    });

    test('variable substitution - null', function () {
        var templates = createTemplateNode(
            '<template data-tag="my-app">Hello, {{name}}</template>'
        );
        var patcher_calls = _patch(templates, 'my-app', {name: null});
        assert.deepEqual(patcher_calls[0], ['enterTag', 'MY-APP', null]);
        assert.deepEqual(patcher_calls[1], ['text', 'Hello, ']);
        assert.deepEqual(patcher_calls[2], ['exitTag']);
        assert.equal(patcher_calls.length, 3);
    });

    test('variable substitution - true', function () {
        var templates = createTemplateNode(
            '<template data-tag="my-app">Hello, {{name}}</template>'
        );
        var patcher_calls = _patch(templates, 'my-app', {name: true});
        assert.deepEqual(patcher_calls[0], ['enterTag', 'MY-APP', null]);
        assert.deepEqual(patcher_calls[1], ['text', 'Hello, true']);
        assert.deepEqual(patcher_calls[2], ['exitTag']);
        assert.equal(patcher_calls.length, 3);
    });

    test('variable substitution - false', function () {
        var templates = createTemplateNode(
            '<template data-tag="my-app">Hello, {{name}}</template>'
        );
        var patcher_calls = _patch(templates, 'my-app', {name: false});
        assert.deepEqual(patcher_calls[0], ['enterTag', 'MY-APP', null]);
        assert.deepEqual(patcher_calls[1], ['text', 'Hello, false']);
        assert.deepEqual(patcher_calls[2], ['exitTag']);
        assert.equal(patcher_calls.length, 3);
    });

    test('variable substitution - object', function () {
        var templates = createTemplateNode(
            '<template data-tag="my-app">Hello, {{name}}</template>'
        );
        var patcher_calls = _patch(templates, 'my-app', {name: {first: 'a', last: 'b'}});
        assert.deepEqual(patcher_calls[0], ['enterTag', 'MY-APP', null]);
        assert.deepEqual(patcher_calls[1], ['text', 'Hello, [object Object]']);
        assert.deepEqual(patcher_calls[2], ['exitTag']);
        assert.equal(patcher_calls.length, 3);
    });

    test('variable substitution - length property', function () {
        var templates = createTemplateNode('<template data-tag="my-app">Total: {{ items.length }}</template>');
        var patcher_calls = _patch(templates, 'my-app', {items: ['a', 'b', 'c']});
        assert.deepEqual(patcher_calls[0], ['enterTag', 'MY-APP', null]);
        assert.deepEqual(patcher_calls[1], ['text', 'Total: 3']);
        assert.deepEqual(patcher_calls[2], ['exitTag']);
        assert.equal(patcher_calls.length, 3);
    });

    test('data-each', function () {
        var templates = createTemplateNode(
            '<template data-tag="my-app">' +
                '<h1>title</h1>' +
                '<section data-each="item in items">item</section>' +
            '</template>'
        );
        var data = {items: [{name: 'one'}, {name: 'two'}, {name: 'three'}]};
        var patcher_calls = _patch(templates, 'my-app', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'MY-APP', null]);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'title']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['enterTag', 'SECTION', null]);
        assert.deepEqual(patcher_calls[5], ['text', 'item']);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['enterTag', 'SECTION', null]);
        assert.deepEqual(patcher_calls[8], ['text', 'item']);
        assert.deepEqual(patcher_calls[9], ['exitTag']);
        assert.deepEqual(patcher_calls[10], ['enterTag', 'SECTION', null]);
        assert.deepEqual(patcher_calls[11], ['text', 'item']);
        assert.deepEqual(patcher_calls[12], ['exitTag']);
        assert.deepEqual(patcher_calls[13], ['exitTag']);
        assert.equal(patcher_calls.length, 14);
    });

    test('data-each introduces new context variable', function () {
        var templates = createTemplateNode(
            '<template data-tag="my-app">' +
                '<h1>title</h1>' +
                '<ul>' +
                    '<li data-each="item in items">' +
                        '{{item.name}}' +
                    '</li>' +
                '</ul>' +
            '</template>'
        );
        var data = {items: [{name: 'one'}, {name: 'two'}, {name: 'three'}]};
        var patcher_calls = _patch(templates, 'my-app', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'MY-APP', null]);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'title']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['enterTag', 'UL', null]);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'LI', null]);
        assert.deepEqual(patcher_calls[6], ['text', 'one']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.deepEqual(patcher_calls[8], ['enterTag', 'LI', null]);
        assert.deepEqual(patcher_calls[9], ['text', 'two']);
        assert.deepEqual(patcher_calls[10], ['exitTag']);
        assert.deepEqual(patcher_calls[11], ['enterTag', 'LI', null]);
        assert.deepEqual(patcher_calls[12], ['text', 'three']);
        assert.deepEqual(patcher_calls[13], ['exitTag']);
        assert.deepEqual(patcher_calls[14], ['exitTag']);
        assert.deepEqual(patcher_calls[15], ['exitTag']);
        assert.equal(patcher_calls.length, 16);
    });

    test('data-each with data-key', function () {
        var templates = createTemplateNode(
            '<template data-tag="my-app">' +
                '<h1>title</h1>' +
                '<section data-each="item in items" data-key="{{item.name}}">' +
                    'item' +
                '</section>' +
                '<p>footer</p>' +
            '</template>'
        );
        var data = {items: [{name: 'one'}, {name: 'two'}, {name: 'three'}]};
        var patcher_calls = _patch(templates, 'my-app', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'MY-APP', null]);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'title']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['enterTag', 'SECTION', 'one']);
        assert.deepEqual(patcher_calls[5], ['text', 'item']);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['enterTag', 'SECTION', 'two']);
        assert.deepEqual(patcher_calls[8], ['text', 'item']);
        assert.deepEqual(patcher_calls[9], ['exitTag']);
        assert.deepEqual(patcher_calls[10], ['enterTag', 'SECTION', 'three']);
        assert.deepEqual(patcher_calls[11], ['text', 'item']);
        assert.deepEqual(patcher_calls[12], ['exitTag']);
        assert.deepEqual(patcher_calls[13], ['enterTag', 'P', null]);
        assert.deepEqual(patcher_calls[14], ['text', 'footer']);
        assert.deepEqual(patcher_calls[15], ['exitTag']);
        assert.deepEqual(patcher_calls[16], ['exitTag']);
        assert.equal(patcher_calls.length, 17);
    });

    test('data-if - true', function () {
        var templates = createTemplateNode(
            '<template data-tag="my-app">' +
                '<h1>title</h1>' +
                '<b data-if="published">published</b>' +
            '</template>'
        );
        var data = {published: true};
        var patcher_calls = _patch(templates, 'my-app', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'MY-APP', null]);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'title']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[5], ['text', 'published']);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.equal(patcher_calls.length, 8);
    });
    
    test('data-if - false', function () {
        var templates = createTemplateNode(
            '<template data-tag="my-app">' +
                '<h1>title</h1>' +
                '<b data-if="published">published</b>' +
            '</template>'
        );
        var data = {published: false};
        var patcher_calls = _patch(templates, 'my-app', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'MY-APP', null]);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'title']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.equal(patcher_calls.length, 5);
    });

    test('data-if - empty array', function () {
        var templates = createTemplateNode(
            '<template data-tag="my-app">' +
                '<h1>title</h1>' +
                '<b data-if="published">published</b>' +
            '</template>'
        );
        // empty array is falsy
        var data = {published: []};
        var patcher_calls = _patch(templates, 'my-app', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'MY-APP', null]);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'title']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.equal(patcher_calls.length, 5);
    });
    
    test('data-if - empty string', function () {
        var templates = createTemplateNode(
            '<template data-tag="my-app">' +
                '<h1>title</h1>' +
                '<b data-if="published">published</b>' +
            '</template>'
        );
        // empty string is falsy
        var data = {published: ''};
        var patcher_calls = _patch(templates, 'my-app', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'MY-APP', null]);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'title']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.equal(patcher_calls.length, 5);
    });
    
    test('data-if - zero', function () {
        var templates = createTemplateNode(
            '<template data-tag="my-app">' +
                '<h1>title</h1>' +
                '<b data-if="published">published</b>' +
            '</template>'
        );
        // zero is falsy
        var data = {published: 0};
        var patcher_calls = _patch(templates, 'my-app', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'MY-APP', null]);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'title']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.equal(patcher_calls.length, 5);
    });
    
    test('data-if - null', function () {
        var templates = createTemplateNode(
            '<template data-tag="my-app">' +
                '<h1>title</h1>' +
                '<b data-if="published">published</b>' +
            '</template>'
        );
        // null is falsy
        var data = {published: null};
        var patcher_calls = _patch(templates, 'my-app', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'MY-APP', null]);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'title']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.equal(patcher_calls.length, 5);
    });

    test('data-if - undefined', function () {
        var templates = createTemplateNode(
            '<template data-tag="my-app">' +
                '<h1>title</h1>' +
                '<b data-if="published">published</b>' +
            '</template>'
        );
        // undefined is falsy
        var data = {};
        var patcher_calls = _patch(templates, 'my-app', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'MY-APP', null]);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'title']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.equal(patcher_calls.length, 5);
    });
    
    test('data-unless - true', function () {
        var templates = createTemplateNode(
            '<template data-tag="my-app">' +
                '<h1>title</h1>' +
                '<b data-unless="published">draft</b>' +
            '</template>'
        );
        var data = {published: true};
        var patcher_calls = _patch(templates, 'my-app', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'MY-APP', null]);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'title']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.equal(patcher_calls.length, 5);
    });
    
    test('data-unless - false', function () {
        var templates = createTemplateNode(
            '<template data-tag="my-app">' +
                '<h1>title</h1>' +
                '<b data-unless="published">draft</b>' +
            '</template>'
        );
        var data = {published: false};
        var patcher_calls = _patch(templates, 'my-app', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'MY-APP', null]);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'title']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[5], ['text', 'draft']);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.equal(patcher_calls.length, 8);
    });

    test('data-unless - empty array', function () {
        var templates = createTemplateNode(
            '<template data-tag="my-app">' +
                '<h1>title</h1>' +
                '<b data-unless="published">draft</b>' +
            '</template>'
        );
        // empty array is falsy
        var data = {published: []};
        var patcher_calls = _patch(templates, 'my-app', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'MY-APP', null]);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'title']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[5], ['text', 'draft']);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.equal(patcher_calls.length, 8);
    });
    
    test('data-unless - empty string', function () {
        var templates = createTemplateNode(
            '<template data-tag="my-app">' +
                '<h1>title</h1>' +
                '<b data-unless="published">draft</b>' +
            '</template>'
        );
        // empty string is falsy
        var data = {published: ''};
        var patcher_calls = _patch(templates, 'my-app', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'MY-APP', null]);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'title']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[5], ['text', 'draft']);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.equal(patcher_calls.length, 8);
    });
    
    test('data-unless - zero', function () {
        var templates = createTemplateNode(
            '<template data-tag="my-app">' +
                '<h1>title</h1>' +
                '<b data-unless="published">draft</b>' +
            '</template>'
        );
        // zero is falsy
        var data = {published: 0};
        var patcher_calls = _patch(templates, 'my-app', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'MY-APP', null]);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'title']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[5], ['text', 'draft']);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.equal(patcher_calls.length, 8);
    });
    
    test('data-unless - null', function () {
        var templates = createTemplateNode(
            '<template data-tag="my-app">' +
                '<h1>title</h1>' +
                '<b data-unless="published">draft</b>' +
            '</template>'
        );
        // null is falsy
        var data = {published: null};
        var patcher_calls = _patch(templates, 'my-app', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'MY-APP', null]);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'title']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[5], ['text', 'draft']);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.equal(patcher_calls.length, 8);
    });

    test('data-unless - undefined', function () {
        var templates = createTemplateNode(
            '<template data-tag="my-app">' +
                '<h1>title</h1>' +
                '<b data-unless="published">draft</b>' +
            '</template>'
        );
        // undefined is falsy
        var data = {};
        var patcher_calls = _patch(templates, 'my-app', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'MY-APP', null]);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'title']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[5], ['text', 'draft']);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.equal(patcher_calls.length, 8);
    });

    test('call another template block statically', function () {
        var templates = createTemplateNode(
            '<template data-tag="test-bar">{{meta.year}}</template>' +
            '<template data-tag="test-foo">' +
                '<h1>title</h1>' +
                '<test-bar meta="{{ article.meta }}"></test-bar>' +
            '</template>');
        var data = {
            article: {
                meta: {
                    year: 2015
                }
            }
        };
        var patcher_calls = _patch(templates, 'test-foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'TEST-FOO', null]);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'title']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['enterTag', 'TEST-BAR', null]);
        assert.deepEqual(patcher_calls[5], ['text', '2015']);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.equal(patcher_calls.length, 8);
    });

    test('call another template block dynamically via template-call', function () {
        var templates = createTemplateNode(
            '<template data-tag="test-bar">{{meta.year}}</template>' +
            '<template data-tag="test-foo">' +
                '<h1>title</h1>' +
                '<template-call template="{{ tmpl }}" meta="{{ article.meta }}">' +
                '</template-call>' +
            '</template>');
        var data = {
            tmpl: 'test-bar',
            article: {
                meta: {
                    year: 2015
                }
            }
        };
        var patcher_calls = _patch(templates, 'test-foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'TEST-FOO', null]);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'title']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['enterTag', 'TEST-BAR', null]);
        assert.deepEqual(patcher_calls[5], ['text', '2015']);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.equal(patcher_calls.length, 8);
    });

    test('call another template block with multiple args', function () {
        var templates = createTemplateNode(
            '<template data-tag="test-bar">{{ author }} ({{ year }})</template>' +
            '<template data-tag="test-foo">' +
                '<h1>title</h1>' +
                '<test-bar author="{{ article.author }}" year="{{ article.year }}"></test-bar>' +
            '</template>');
        var data = {
            article: {
                author: 'test',
                year: 2015
            }
        };
        var patcher_calls = _patch(templates, 'test-foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'TEST-FOO', null]);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'title']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['enterTag', 'TEST-BAR', null]);
        assert.deepEqual(patcher_calls[5], ['text', 'test (2015)']);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.equal(patcher_calls.length, 8);
    });

    test('call another template with fixed string values', function () {
        var templates = createTemplateNode(
            '<template data-tag="test-bar">{{ msg }}</template>' +
            '<template data-tag="test-foo">' +
                '<h1>title</h1>' +
                '<test-bar msg="test"></test-bar>' +
            '</template>');
        var data = {};
        var patcher_calls = _patch(templates, 'test-foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'TEST-FOO', null]);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'title']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['enterTag', 'TEST-BAR', null]);
        assert.deepEqual(patcher_calls[5], ['text', 'test']);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.equal(patcher_calls.length, 8);
    });

    test('call another template with interpolated string values', function () {
        var templates = createTemplateNode(
            '<template data-tag="test-bar">{{ msg }}</template>' +
            '<template data-tag="test-foo">' +
                '<h1>title</h1>' +
                '<test-bar msg="test-{{ name }}-asdf"></test-bar>' +
            '</template>');
        var data = {
            name: 'example'
        };
        var patcher_calls = _patch(templates, 'test-foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'TEST-FOO', null]);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'title']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['enterTag', 'TEST-BAR', null]);
        assert.deepEqual(patcher_calls[5], ['text', 'test-example-asdf']);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.equal(patcher_calls.length, 8);
    });

    test('call another template block with child expansion', function () {
        var templates = createTemplateNode(
            '<template data-tag="test-foo">' +
                '<h1>title</h1>' +
                '<test-bar article="{{ article }}">' +
                    '<i>inner</i>' +
                '</test-bar>' +
            '</template>' +
            '<template data-tag="test-bar">' +
                '<b>{{article.title}}</b>' +
                '<template-children />' +
            '</template>');
        var data = {
            article: {
                title: 'test',
                meta: {
                    year: 2015
                }
            }
        };
        var patcher_calls = _patch(templates, 'test-foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'TEST-FOO', null]);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'title']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['enterTag', 'TEST-BAR', null]);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[6], ['text', 'test']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.deepEqual(patcher_calls[8], ['enterTag', 'I', null]);
        assert.deepEqual(patcher_calls[9], ['text', 'inner']);
        assert.deepEqual(patcher_calls[10], ['exitTag']);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.deepEqual(patcher_calls[12], ['exitTag']);
        assert.equal(patcher_calls.length, 13);
    });

    test('nested expansions', function () {
        var templates = createTemplateNode(
            '<template data-tag="test-root">' +
                '<test-one article="{{ article }}">' +
                    '<i>root</i>' +
                '</test-one>' +
            '</template>' +
                
            '<template data-tag="test-one">' +
                '<h1>title</h1>' +
                '<test-two meta="{{ article.meta }}">' +
                    '<i>one.1</i>' +
                    '<test-three>' +
                        '<i>one.2</i>' +
                        '<template-children></template-children>' +
                    '</test-three>' +
                '</test-two>' +
            '</template>' +

            '<template data-tag="test-two">' +
                '<b>{{meta.year}}</b>' +
                '<template-children></template-children>' +
            '</template>' +
                
            '<template data-tag="test-three">' +
                '<b>three</b>' +
                '<template-children></template-children>' +
            '</template>'
        );
        var data = {
            article: {
                meta: {
                    year: 2015
                }
            }
        };
        var patcher_calls = _patch(templates, 'test-root', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'TEST-ROOT', null]);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'TEST-ONE', null]);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[3], ['text', 'title']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'TEST-TWO', null]);
        assert.deepEqual(patcher_calls[6], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[7], ['text', '2015']);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.deepEqual(patcher_calls[9], ['enterTag', 'I', null]);
        assert.deepEqual(patcher_calls[10], ['text', 'one.1']);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.deepEqual(patcher_calls[12], ['enterTag', 'TEST-THREE', null]);
        assert.deepEqual(patcher_calls[13], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[14], ['text', 'three']);
        assert.deepEqual(patcher_calls[15], ['exitTag']);
        assert.deepEqual(patcher_calls[16], ['enterTag', 'I', null]);
        assert.deepEqual(patcher_calls[17], ['text', 'one.2']);
        assert.deepEqual(patcher_calls[18], ['exitTag']);
        assert.deepEqual(patcher_calls[19], ['enterTag', 'I', null]);
        assert.deepEqual(patcher_calls[20], ['text', 'root']);
        assert.deepEqual(patcher_calls[21], ['exitTag']);
        assert.deepEqual(patcher_calls[22], ['exitTag']);
        assert.deepEqual(patcher_calls[23], ['exitTag']);
        assert.deepEqual(patcher_calls[24], ['exitTag']);
        assert.deepEqual(patcher_calls[25], ['exitTag']);
        assert.equal(patcher_calls.length, 26);
    });

    test('skip comment nodes in template', function () {
        var templates = createTemplateNode(
            '<template data-tag="test-foo">' +
                '<i>foo</i>' +
                '<!-- this is a comment -->' +
                '<b>bar</b>' +
                '<em>baz</em>' +
            '</template>'
        );
        var data = {};
        var patcher_calls = _patch(templates, 'test-foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'TEST-FOO', null]);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'I', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'foo']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[5], ['text', 'bar']);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['enterTag', 'EM', null]);
        assert.deepEqual(patcher_calls[8], ['text', 'baz']);
        assert.deepEqual(patcher_calls[9], ['exitTag']);
        assert.deepEqual(patcher_calls[10], ['exitTag']);
        assert.equal(patcher_calls.length, 11);
    });

    test('component attributes', function () {
        var templates = createTemplateNode(
            '<template data-tag="test-foo" href="#" class="btn">foo</template>'
        );
        var data = {};
        var patcher_calls = _patch(templates, 'test-foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'TEST-FOO', null]);
        // order of these events is browser dependant
        assert.deepEqual(patcher_calls.slice(1, 3).sort(), [
            ['attribute', 'class', 'btn'],
            ['attribute', 'href', '#']
        ]);
        assert.deepEqual(patcher_calls[3], ['text', 'foo']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.equal(patcher_calls.length, 5);
    });

    test('expand variables in template attributes', function () {
        var templates = createTemplateNode(
            '<template data-tag="test-foo" href="{{url}}" class="btn">foo</template>'
        );
        var data = {url: 'http://example.com'};
        var patcher_calls = _patch(templates, 'test-foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'TEST-FOO', null]);
        // order of these events is browser dependant
        assert.deepEqual(patcher_calls.slice(1, 3).sort(), [
            ['attribute', 'class', 'btn'],
            ['attribute', 'href', 'http://example.com']
        ]);
        assert.deepEqual(patcher_calls[3], ['text', 'foo']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.equal(patcher_calls.length, 5);
    });

    test('boolean attributes - allowfullscreen', function () {
        var templates = createTemplateNode(
            '<template data-tag="test-foo">' +
                '<iframe allowfullscreen="{{a}}"></iframe>' +
                '<iframe allowfullscreen="{{b}}"></iframe>' +
                '<iframe allowfullscreen="{{c}}"></iframe>' +
                '<iframe allowfullscreen></iframe>' +
            '</template>'
        );
        var data = {
            a: true,
            b: false
        };
        var patcher_calls = _patch(templates, 'test-foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'TEST-FOO', null]);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'IFRAME', null]);
        assert.deepEqual(patcher_calls[2], ['attribute', 'allowfullscreen', true]);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['enterTag', 'IFRAME', null]);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.deepEqual(patcher_calls[6], ['enterTag', 'IFRAME', null]);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.deepEqual(patcher_calls[8], ['enterTag', 'IFRAME', null]);
        assert.deepEqual(patcher_calls[9], ['attribute', 'allowfullscreen', true]);
        assert.deepEqual(patcher_calls[10], ['exitTag']);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.equal(patcher_calls.length, 12);
    });

    test('boolean attributes - async', function () {
        var templates = createTemplateNode(
            '<template data-tag="test-foo">' +
                '<script src="blank.js" async="{{a}}"></script>' +
                '<script src="blank.js" async="{{b}}"></script>' +
                '<script src="blank.js" async="{{c}}"></script>' +
                '<script src="blank.js" async></script>' +
            '</template>'
        );
        var data = {
            a: true,
            b: false
        };
        var patcher_calls = _patch(templates, 'test-foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'TEST-FOO', null]);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'SCRIPT', null]);
        assert.deepEqual(patcher_calls.slice(2, 4).sort(), [
            ['attribute', 'async', true],
            ['attribute', 'src', 'blank.js']
        ]);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'SCRIPT', null]);
        assert.deepEqual(patcher_calls[6], ['attribute', 'src', 'blank.js']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.deepEqual(patcher_calls[8], ['enterTag', 'SCRIPT', null]);
        assert.deepEqual(patcher_calls[9], ['attribute', 'src', 'blank.js']);
        assert.deepEqual(patcher_calls[10], ['exitTag']);
        assert.deepEqual(patcher_calls[11], ['enterTag', 'SCRIPT', null]);
        assert.deepEqual(patcher_calls.slice(12, 14).sort(), [
            ['attribute', 'async', true],
            ['attribute', 'src', 'blank.js']
        ]);
        assert.deepEqual(patcher_calls[14], ['exitTag']);
        assert.deepEqual(patcher_calls[15], ['exitTag']);
        assert.equal(patcher_calls.length, 16);
    });

    test('boolean attributes - autofocus', function () {
        var templates = createTemplateNode(
            '<template data-tag="test-foo">' +
                '<input type="text" autofocus="{{a}}">' +
                '<input type="text" autofocus="{{b}}">' +
                '<input type="text" autofocus="{{c}}">' +
                '<input type="text" autofocus>' +
            '</template>'
        );
        var data = {
            a: true,
            b: false
        };
        var patcher_calls = _patch(templates, 'test-foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'TEST-FOO', null]);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls.slice(2, 4).sort(), [
            ['attribute', 'autofocus', true],
            ['attribute', 'type', 'text']
        ]);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls[6], ['attribute', 'type', 'text']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.deepEqual(patcher_calls[8], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls[9], ['attribute', 'type', 'text']);
        assert.deepEqual(patcher_calls[10], ['exitTag']);
        assert.deepEqual(patcher_calls[11], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls.slice(12, 14).sort(), [
            ['attribute', 'autofocus', true],
            ['attribute', 'type', 'text']
        ]);
        assert.deepEqual(patcher_calls[14], ['exitTag']);
        assert.deepEqual(patcher_calls[15], ['exitTag']);
        assert.equal(patcher_calls.length, 16);
    });

    test('boolean attributes - autoplay', function () {
        var templates = createTemplateNode(
            '<template data-tag="test-foo">' +
                '<video autoplay="{{a}}"></video>' +
                '<video autoplay="{{b}}"></video>' +
                '<video autoplay="{{c}}"></video>' +
                '<video autoplay></video>' +
            '</template>'
        );
        var data = {
            a: true,
            b: false
        };
        var patcher_calls = _patch(templates, 'test-foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'TEST-FOO', null]);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'VIDEO', null]);
        assert.deepEqual(patcher_calls[2], ['attribute', 'autoplay', true]);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['enterTag', 'VIDEO', null]);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.deepEqual(patcher_calls[6], ['enterTag', 'VIDEO', null]);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.deepEqual(patcher_calls[8], ['enterTag', 'VIDEO', null]);
        assert.deepEqual(patcher_calls[9], ['attribute', 'autoplay', true]);
        assert.deepEqual(patcher_calls[10], ['exitTag']);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.equal(patcher_calls.length, 12);
    });

    test('boolean attributes - capture', function () {
        var templates = createTemplateNode(
            '<template data-tag="test-foo">' +
                '<input type="file" capture="{{a}}">' +
                '<input type="file" capture="{{b}}">' +
                '<input type="file" capture="{{c}}">' +
                '<input type="file" capture>' +
            '</template>'
        );
        var data = {
            a: true,
            b: false
        };
        var patcher_calls = _patch(templates, 'test-foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'TEST-FOO', null]);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls.slice(2, 4).sort(), [
            ['attribute', 'capture', true],
            ['attribute', 'type', 'file']
        ]);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls[6], ['attribute', 'type', 'file']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.deepEqual(patcher_calls[8], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls[9], ['attribute', 'type', 'file']);
        assert.deepEqual(patcher_calls[10], ['exitTag']);
        assert.deepEqual(patcher_calls[11], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls.slice(12, 14).sort(), [
            ['attribute', 'capture', true],
            ['attribute', 'type', 'file']
        ]);
        assert.deepEqual(patcher_calls[14], ['exitTag']);
        assert.deepEqual(patcher_calls[15], ['exitTag']);
        assert.equal(patcher_calls.length, 16);
    });
    
    test('boolean attributes - checked', function () {
        var templates = createTemplateNode(
            '<template data-tag="test-foo">' +
                '<input type="checkbox" checked="{{a}}">' +
                '<input type="checkbox" checked="{{b}}">' +
                '<input type="checkbox" checked="{{c}}">' +
                '<input type="checkbox" checked>' +
            '</template>'
        );
        var data = {
            a: true,
            b: false
        };
        var patcher_calls = _patch(templates, 'test-foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'TEST-FOO', null]);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls.slice(2, 4).sort(), [
            ['attribute', 'checked', true],
            ['attribute', 'type', 'checkbox']
        ]);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls[6], ['attribute', 'type', 'checkbox']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.deepEqual(patcher_calls[8], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls[9], ['attribute', 'type', 'checkbox']);
        assert.deepEqual(patcher_calls[10], ['exitTag']);
        assert.deepEqual(patcher_calls[11], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls.slice(12, 14).sort(), [
            ['attribute', 'checked', true],
            ['attribute', 'type', 'checkbox']
        ]);
        assert.deepEqual(patcher_calls[14], ['exitTag']);
        assert.deepEqual(patcher_calls[15], ['exitTag']);
        assert.equal(patcher_calls.length, 16);
    });

    test('boolean attributes - controls', function () {
        var templates = createTemplateNode(
            '<template data-tag="test-foo">' +
                '<video controls="{{a}}"></video>' +
                '<video controls="{{b}}"></video>' +
                '<video controls="{{c}}"></video>' +
                '<video controls></video>' +
            '</template>'
        );
        var data = {
            a: true,
            b: false
        };
        var patcher_calls = _patch(templates, 'test-foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'TEST-FOO', null]);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'VIDEO', null]);
        assert.deepEqual(patcher_calls[2], ['attribute', 'controls', true]);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['enterTag', 'VIDEO', null]);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.deepEqual(patcher_calls[6], ['enterTag', 'VIDEO', null]);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.deepEqual(patcher_calls[8], ['enterTag', 'VIDEO', null]);
        assert.deepEqual(patcher_calls[9], ['attribute', 'controls', true]);
        assert.deepEqual(patcher_calls[10], ['exitTag']);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.equal(patcher_calls.length, 12);
    });
    
    test('boolean attributes - default', function () {
        var templates = createTemplateNode(
            '<template data-tag="test-foo">' +
                '<audio><track src="test.vtt" default="{{a}}"></audio>' +
                '<audio><track src="test.vtt" default="{{b}}"></audio>' +
                '<audio><track src="test.vtt" default="{{c}}"></audio>' +
                '<audio><track src="test.vtt" default></audio>' +
            '</template>'
        );
        var data = {
            a: true,
            b: false
        };
        var patcher_calls = _patch(templates, 'test-foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'TEST-FOO', null]);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'AUDIO', null]);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'TRACK', null]);
        assert.deepEqual(patcher_calls.slice(3, 5).sort(), [
            ['attribute', 'default', true],
            ['attribute', 'src', 'test.vtt']
        ]);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['enterTag', 'AUDIO', null]);
        assert.deepEqual(patcher_calls[8], ['enterTag', 'TRACK', null]);
        assert.deepEqual(patcher_calls[9], ['attribute', 'src', 'test.vtt']);
        assert.deepEqual(patcher_calls[10], ['exitTag']);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.deepEqual(patcher_calls[12], ['enterTag', 'AUDIO', null]);
        assert.deepEqual(patcher_calls[13], ['enterTag', 'TRACK', null]);
        assert.deepEqual(patcher_calls[14], ['attribute', 'src', 'test.vtt']);
        assert.deepEqual(patcher_calls[15], ['exitTag']);
        assert.deepEqual(patcher_calls[16], ['exitTag']);
        assert.deepEqual(patcher_calls[17], ['enterTag', 'AUDIO', null]);
        assert.deepEqual(patcher_calls[18], ['enterTag', 'TRACK', null]);
        assert.deepEqual(patcher_calls.slice(19, 21).sort(), [
            ['attribute', 'default', true],
            ['attribute', 'src', 'test.vtt']
        ]);
        assert.deepEqual(patcher_calls[21], ['exitTag']);
        assert.deepEqual(patcher_calls[22], ['exitTag']);
        assert.deepEqual(patcher_calls[23], ['exitTag']);
        assert.equal(patcher_calls.length, 24);
    });

    test('boolean attributes - defer', function () {
        var templates = createTemplateNode(
            '<template data-tag="test-foo">' +
                '<script src="blank.js" defer="{{a}}"></script>' +
                '<script src="blank.js" defer="{{b}}"></script>' +
                '<script src="blank.js" defer="{{c}}"></script>' +
                '<script src="blank.js" defer></script>' +
            '</template>'
        );
        var data = {
            a: true,
            b: false
        };
        var patcher_calls = _patch(templates, 'test-foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'TEST-FOO', null]);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'SCRIPT', null]);
        assert.deepEqual(patcher_calls.slice(2, 4).sort(), [
            ['attribute', 'defer', true],
            ['attribute', 'src', 'blank.js']
        ]);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'SCRIPT', null]);
        assert.deepEqual(patcher_calls[6], ['attribute', 'src', 'blank.js']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.deepEqual(patcher_calls[8], ['enterTag', 'SCRIPT', null]);
        assert.deepEqual(patcher_calls[9], ['attribute', 'src', 'blank.js']);
        assert.deepEqual(patcher_calls[10], ['exitTag']);
        assert.deepEqual(patcher_calls[11], ['enterTag', 'SCRIPT', null]);
        assert.deepEqual(patcher_calls.slice(12, 14).sort(), [
            ['attribute', 'defer', true],
            ['attribute', 'src', 'blank.js']
        ]);
        assert.deepEqual(patcher_calls[14], ['exitTag']);
        assert.deepEqual(patcher_calls[15], ['exitTag']);
        assert.equal(patcher_calls.length, 16);
    });

    test('boolean attributes - disabled', function () {
        var templates = createTemplateNode(
            '<template data-tag="test-foo">' +
                '<input type="text" disabled="{{a}}">' +
                '<input type="text" disabled="{{b}}">' +
                '<input type="text" disabled="{{c}}">' +
                '<input type="text" disabled>' +
            '</template>'
        );
        var data = {
            a: true,
            b: false
        };
        var patcher_calls = _patch(templates, 'test-foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'TEST-FOO', null]);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls.slice(2, 4).sort(), [
            ['attribute', 'disabled', true],
            ['attribute', 'type', 'text']
        ]);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls[6], ['attribute', 'type', 'text']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.deepEqual(patcher_calls[8], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls[9], ['attribute', 'type', 'text']);
        assert.deepEqual(patcher_calls[10], ['exitTag']);
        assert.deepEqual(patcher_calls[11], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls.slice(12, 14).sort(), [
            ['attribute', 'disabled', true],
            ['attribute', 'type', 'text']
        ]);
        assert.deepEqual(patcher_calls[14], ['exitTag']);
        assert.deepEqual(patcher_calls[15], ['exitTag']);
        assert.equal(patcher_calls.length, 16);
    });

    test('boolean attributes - formvalidate', function () {
        var templates = createTemplateNode(
            '<template data-tag="test-foo">' +
                '<button formnovalidate="{{a}}">Test</button>' +
                '<button formnovalidate="{{b}}">Test</button>' +
                '<button formnovalidate="{{c}}">Test</button>' +
                '<button formnovalidate>Test</button>' +
            '</template>'
        );
        var data = {
            a: true,
            b: false
        };
        var patcher_calls = _patch(templates, 'test-foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'TEST-FOO', null]);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'BUTTON', null]);
        assert.deepEqual(patcher_calls[2], ['attribute', 'formnovalidate', true]);
        assert.deepEqual(patcher_calls[3], ['text', 'Test']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'BUTTON', null]);
        assert.deepEqual(patcher_calls[6], ['text', 'Test']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.deepEqual(patcher_calls[8], ['enterTag', 'BUTTON', null]);
        assert.deepEqual(patcher_calls[9], ['text', 'Test']);
        assert.deepEqual(patcher_calls[10], ['exitTag']);
        assert.deepEqual(patcher_calls[11], ['enterTag', 'BUTTON', null]);
        assert.deepEqual(patcher_calls[12], ['attribute', 'formnovalidate', true]);
        assert.deepEqual(patcher_calls[13], ['text', 'Test']);
        assert.deepEqual(patcher_calls[14], ['exitTag']);
        assert.deepEqual(patcher_calls[15], ['exitTag']);
        assert.equal(patcher_calls.length, 16);
    });

    test('boolean attributes - hidden', function () {
        var templates = createTemplateNode(
            '<template data-tag="test-foo">' +
                '<p hidden="{{a}}">Test</p>' +
                '<p hidden="{{b}}">Test</p>' +
                '<p hidden="{{c}}">Test</p>' +
                '<p hidden>Test</p>' +
            '</template>'
        );
        var data = {
            a: true,
            b: false
        };
        var patcher_calls = _patch(templates, 'test-foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'TEST-FOO', null]);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'P', null]);
        assert.deepEqual(patcher_calls[2], ['attribute', 'hidden', true]);
        assert.deepEqual(patcher_calls[3], ['text', 'Test']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'P', null]);
        assert.deepEqual(patcher_calls[6], ['text', 'Test']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.deepEqual(patcher_calls[8], ['enterTag', 'P', null]);
        assert.deepEqual(patcher_calls[9], ['text', 'Test']);
        assert.deepEqual(patcher_calls[10], ['exitTag']);
        assert.deepEqual(patcher_calls[11], ['enterTag', 'P', null]);
        assert.deepEqual(patcher_calls[12], ['attribute', 'hidden', true]);
        assert.deepEqual(patcher_calls[13], ['text', 'Test']);
        assert.deepEqual(patcher_calls[14], ['exitTag']);
        assert.deepEqual(patcher_calls[15], ['exitTag']);
        assert.equal(patcher_calls.length, 16);
    });

    test('boolean attributes - itemscope', function () {
        var templates = createTemplateNode(
            '<template data-tag="test-foo">' +
                '<div itemscope="{{a}}">Test</div>' +
                '<div itemscope="{{b}}">Test</div>' +
                '<div itemscope="{{c}}">Test</div>' +
                '<div itemscope>Test</div>' +
            '</template>'
        );
        var data = {
            a: true,
            b: false
        };
        var patcher_calls = _patch(templates, 'test-foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'TEST-FOO', null]);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[2], ['attribute', 'itemscope', true]);
        assert.deepEqual(patcher_calls[3], ['text', 'Test']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[6], ['text', 'Test']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.deepEqual(patcher_calls[8], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[9], ['text', 'Test']);
        assert.deepEqual(patcher_calls[10], ['exitTag']);
        assert.deepEqual(patcher_calls[11], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[12], ['attribute', 'itemscope', true]);
        assert.deepEqual(patcher_calls[13], ['text', 'Test']);
        assert.deepEqual(patcher_calls[14], ['exitTag']);
        assert.deepEqual(patcher_calls[15], ['exitTag']);
        assert.equal(patcher_calls.length, 16);
    });

    test('boolean attributes - loop', function () {
        var templates = createTemplateNode(
            '<template data-tag="test-foo">' +
                '<audio loop="{{a}}"></audio>' +
                '<audio loop="{{b}}"></audio>' +
                '<audio loop="{{c}}"></audio>' +
                '<audio loop></audio>' +
            '</template>'
        );
        var data = {
            a: true,
            b: false
        };
        var patcher_calls = _patch(templates, 'test-foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'TEST-FOO', null]);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'AUDIO', null]);
        assert.deepEqual(patcher_calls[2], ['attribute', 'loop', true]);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['enterTag', 'AUDIO', null]);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.deepEqual(patcher_calls[6], ['enterTag', 'AUDIO', null]);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.deepEqual(patcher_calls[8], ['enterTag', 'AUDIO', null]);
        assert.deepEqual(patcher_calls[9], ['attribute', 'loop', true]);
        assert.deepEqual(patcher_calls[10], ['exitTag']);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.equal(patcher_calls.length, 12);
    });

    test('boolean attributes - multiple', function () {
        var templates = createTemplateNode(
            '<template data-tag="test-foo">' +
                '<select multiple="{{a}}"></select>' +
                '<select multiple="{{b}}"></select>' +
                '<select multiple="{{c}}"></select>' +
                '<select multiple></select>' +
            '</template>'
        );
        var data = {
            a: true,
            b: false
        };
        var patcher_calls = _patch(templates, 'test-foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'TEST-FOO', null]);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'SELECT', null]);
        assert.deepEqual(patcher_calls[2], ['attribute', 'multiple', true]);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['enterTag', 'SELECT', null]);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.deepEqual(patcher_calls[6], ['enterTag', 'SELECT', null]);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.deepEqual(patcher_calls[8], ['enterTag', 'SELECT', null]);
        assert.deepEqual(patcher_calls[9], ['attribute', 'multiple', true]);
        assert.deepEqual(patcher_calls[10], ['exitTag']);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.equal(patcher_calls.length, 12);
    });

    test('boolean attributes - muted', function () {
        var templates = createTemplateNode(
            '<template data-tag="test-foo">' +
                '<video muted="{{a}}"></video>' +
                '<video muted="{{b}}"></video>' +
                '<video muted="{{c}}"></video>' +
                '<video muted></video>' +
            '</template>'
        );
        var data = {
            a: true,
            b: false
        };
        var patcher_calls = _patch(templates, 'test-foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'TEST-FOO', null]);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'VIDEO', null]);
        assert.deepEqual(patcher_calls[2], ['attribute', 'muted', true]);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['enterTag', 'VIDEO', null]);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.deepEqual(patcher_calls[6], ['enterTag', 'VIDEO', null]);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.deepEqual(patcher_calls[8], ['enterTag', 'VIDEO', null]);
        assert.deepEqual(patcher_calls[9], ['attribute', 'muted', true]);
        assert.deepEqual(patcher_calls[10], ['exitTag']);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.equal(patcher_calls.length, 12);
    });

    test('boolean attributes - novalidate', function () {
        var templates = createTemplateNode(
            '<template data-tag="test-foo">' +
                '<form novalidate="{{a}}"></form>' +
                '<form novalidate="{{b}}"></form>' +
                '<form novalidate="{{c}}"></form>' +
                '<form novalidate></form>' +
            '</template>'
        );
        var prev_data = {};
        var data = {
            a: true,
            b: false
        };
        var patcher_calls = _patch(templates, 'test-foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'TEST-FOO', null]);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'FORM', null]);
        assert.deepEqual(patcher_calls[2], ['attribute', 'novalidate', true]);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['enterTag', 'FORM', null]);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.deepEqual(patcher_calls[6], ['enterTag', 'FORM', null]);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.deepEqual(patcher_calls[8], ['enterTag', 'FORM', null]);
        assert.deepEqual(patcher_calls[9], ['attribute', 'novalidate', true]);
        assert.deepEqual(patcher_calls[10], ['exitTag']);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.equal(patcher_calls.length, 12);
    });

    test('boolean attributes - open', function () {
        var templates = createTemplateNode(
            '<template data-tag="test-foo">' +
                '<details open="{{a}}"><summary>Test</summary></details>' +
                '<details open="{{b}}"><summary>Test</summary></details>' +
                '<details open="{{c}}"><summary>Test</summary></details>' +
                '<details open><summary>Test</summary></details>' +
            '</template>'
        );
        var data = {
            a: true,
            b: false
        };
        var patcher_calls = _patch(templates, 'test-foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'TEST-FOO', null]);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'DETAILS', null]);
        assert.deepEqual(patcher_calls[2], ['attribute', 'open', true]);
        assert.deepEqual(patcher_calls[3], ['enterTag', 'SUMMARY', null]);
        assert.deepEqual(patcher_calls[4], ['text', 'Test']);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['enterTag', 'DETAILS', null]);
        assert.deepEqual(patcher_calls[8], ['enterTag', 'SUMMARY', null]);
        assert.deepEqual(patcher_calls[9], ['text', 'Test']);
        assert.deepEqual(patcher_calls[10], ['exitTag']);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.deepEqual(patcher_calls[12], ['enterTag', 'DETAILS', null]);
        assert.deepEqual(patcher_calls[13], ['enterTag', 'SUMMARY', null]);
        assert.deepEqual(patcher_calls[14], ['text', 'Test']);
        assert.deepEqual(patcher_calls[15], ['exitTag']);
        assert.deepEqual(patcher_calls[16], ['exitTag']);
        assert.deepEqual(patcher_calls[17], ['enterTag', 'DETAILS', null]);
        assert.deepEqual(patcher_calls[18], ['attribute', 'open', true]);
        assert.deepEqual(patcher_calls[19], ['enterTag', 'SUMMARY', null]);
        assert.deepEqual(patcher_calls[20], ['text', 'Test']);
        assert.deepEqual(patcher_calls[21], ['exitTag']);
        assert.deepEqual(patcher_calls[22], ['exitTag']);
        assert.deepEqual(patcher_calls[23], ['exitTag']);
        assert.equal(patcher_calls.length, 24);
    });

    test('boolean attributes - readonly', function () {
        var templates = createTemplateNode(
            '<template data-tag="test-foo">' +
                '<input type="text" readonly="{{a}}">' +
                '<input type="text" readonly="{{b}}">' +
                '<input type="text" readonly="{{c}}">' +
                '<input type="text" readonly>' +
            '</template>'
        );
        var data = {
            a: true,
            b: false
        };
        var patcher_calls = _patch(templates, 'test-foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'TEST-FOO', null]);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls.slice(2, 4).sort(), [
            ['attribute', 'readonly', true],
            ['attribute', 'type', 'text']
        ]);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls[6], ['attribute', 'type', 'text']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.deepEqual(patcher_calls[8], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls[9], ['attribute', 'type', 'text']);
        assert.deepEqual(patcher_calls[10], ['exitTag']);
        assert.deepEqual(patcher_calls[11], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls.slice(12, 14).sort(), [
            ['attribute', 'readonly', true],
            ['attribute', 'type', 'text']
        ]);
        assert.deepEqual(patcher_calls[14], ['exitTag']);
        assert.deepEqual(patcher_calls[15], ['exitTag']);
        assert.equal(patcher_calls.length, 16);
    });

    test('boolean attributes - required', function () {
        var templates = createTemplateNode(
            '<template data-tag="test-foo">' +
                '<input type="text" required="{{a}}">' +
                '<input type="text" required="{{b}}">' +
                '<input type="text" required="{{c}}">' +
                '<input type="text" required>' +
            '</template>'
        );
        var data = {
            a: true,
            b: false
        };
        var patcher_calls = _patch(templates, 'test-foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'TEST-FOO', null]);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls.slice(2, 4).sort(), [
            ['attribute', 'required', true],
            ['attribute', 'type', 'text']
        ]);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls[6], ['attribute', 'type', 'text']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.deepEqual(patcher_calls[8], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls[9], ['attribute', 'type', 'text']);
        assert.deepEqual(patcher_calls[10], ['exitTag']);
        assert.deepEqual(patcher_calls[11], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls.slice(12, 14).sort(), [
            ['attribute', 'required', true],
            ['attribute', 'type', 'text']
        ]);
        assert.deepEqual(patcher_calls[14], ['exitTag']);
        assert.deepEqual(patcher_calls[15], ['exitTag']);
        assert.equal(patcher_calls.length, 16);
    });

    test('boolean attributes - reversed', function () {
        var templates = createTemplateNode(
            '<template data-tag="test-foo">' +
                '<ol reversed="{{a}}"></ol>' +
                '<ol reversed="{{b}}"></ol>' +
                '<ol reversed="{{c}}"></ol>' +
                '<ol reversed></ol>' +
            '</template>'
        );
        var data = {
            a: true,
            b: false
        };
        var patcher_calls = _patch(templates, 'test-foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'TEST-FOO', null]);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'OL', null]);
        assert.deepEqual(patcher_calls[2], ['attribute', 'reversed', true]);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['enterTag', 'OL', null]);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.deepEqual(patcher_calls[6], ['enterTag', 'OL', null]);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.deepEqual(patcher_calls[8], ['enterTag', 'OL', null]);
        assert.deepEqual(patcher_calls[9], ['attribute', 'reversed', true]);
        assert.deepEqual(patcher_calls[10], ['exitTag']);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.equal(patcher_calls.length, 12);
    });
    
    // // // TODO: move collapsing of adjacent text nodes into patcher?
    // // test('collapse text nodes around conditional', function () {
    // //     createTemplateNode('foo', 'Hello, <b>world</b>!');
    // //     var templates = createTemplateNode(
    // //         '<div data-template="foo">' +
    // //             'MESSAGE ' +
    // //             '<span data-if="{{nope}}"></span>\n' +
    // //             'END' +
    // //             '</div>');
    // //     var data = {};
    // //     var patcher_calls = _patch(templates, 'foo', data);
    // //     assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
    // //     assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
    // //     assert.deepEqual(patcher_calls[2], ['text', 'MESSAGE \nEND']);
    // //     assert.deepEqual(patcher_calls[3], ['exitTag']);
    // //     assert.equal(patcher_calls.length, 4);
    // // });

    test('render missing variables in text block', function () {
        var templates = createTemplateNode(
            '<template data-tag="test-foo">Hello, {{user.name}}!</template>'
        );
        var data = {};
        var patcher_calls = _patch(templates, 'test-foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'TEST-FOO', null]);
        assert.deepEqual(patcher_calls[1], ['text', 'Hello, !']);
        assert.deepEqual(patcher_calls[2], ['exitTag']);
        assert.equal(patcher_calls.length, 3);
    });

    test('render missing variables in text attributes', function () {
        var templates = createTemplateNode(
            '<template data-tag="test-foo" href="{{url}}">link</template>'
        );
        var data = {};
        var patcher_calls = _patch(templates, 'test-foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'TEST-FOO', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'href', '']);
        assert.deepEqual(patcher_calls[2], ['text', 'link']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.equal(patcher_calls.length, 4);
    });

    test('template tags inside select element', function () {
        var templates = createTemplateNode(
            '<template data-tag="test-foo">' +
                '<select>' +
                    '<option data-each="opt in options" value="{{opt.value}}">{{opt.label}}</option>' +
                '</select>' +
            '</template>'
        );
        var data = {
            options: [
                {value: 1, label: 'one'},
                {value: 2, label: 'two'},
                {value: 3, label: 'three'},
            ]
        };
        var patcher_calls = _patch(templates, 'test-foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'TEST-FOO', null]);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'SELECT', null]);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'OPTION', null]);
        assert.deepEqual(patcher_calls[3], ['attribute', 'value', 1]);
        assert.deepEqual(patcher_calls[4], ['text', 'one']);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.deepEqual(patcher_calls[6], ['enterTag', 'OPTION', null]);
        assert.deepEqual(patcher_calls[7], ['attribute', 'value', 2]);
        assert.deepEqual(patcher_calls[8], ['text', 'two']);
        assert.deepEqual(patcher_calls[9], ['exitTag']);
        assert.deepEqual(patcher_calls[10], ['enterTag', 'OPTION', null]);
        assert.deepEqual(patcher_calls[11], ['attribute', 'value', 3]);
        assert.deepEqual(patcher_calls[12], ['text', 'three']);
        assert.deepEqual(patcher_calls[13], ['exitTag']);
        assert.deepEqual(patcher_calls[14], ['exitTag']);
        assert.deepEqual(patcher_calls[15], ['exitTag']);
        assert.equal(patcher_calls.length, 16);
    });

    test('data-each processed before data-if', function () {
        var templates = createTemplateNode(
            '<template data-tag="test-foo">' +
                '<p data-each="item in items" data-if="item.published">' +
                    '{{ item.name }}' +
                '</p>' +
            '</template>'
        );
        var data = {items: [
            {name: 'one', published: true},
            {name: 'two', published: false},
            {name: 'three', published: true}
        ]};
        var patcher_calls = _patch(templates, 'test-foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'TEST-FOO', null]);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'P', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'one']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['enterTag', 'P', null]);
        assert.deepEqual(patcher_calls[5], ['text', 'three']);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.equal(patcher_calls.length, 8);
    });

    test('data-each processed before data-unless', function () {
        var templates = createTemplateNode(
            '<template data-tag="test-foo">' +
                '<p data-each="item in items" data-unless="item.hidden">' +
                    '{{ item.name }}' +
                '</p>' +
            '</template>'
        );
        var data = {items: [
            {name: 'one', hidden: false},
            {name: 'two', hidden: true},
            {name: 'three', hidden: false}
        ]};
        var patcher_calls = _patch(templates, 'test-foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'TEST-FOO', null]);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'P', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'one']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['enterTag', 'P', null]);
        assert.deepEqual(patcher_calls[5], ['text', 'three']);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.equal(patcher_calls.length, 8);
    });

    test('data-each on template call', function () {
        var templates = createTemplateNode(
            '<template data-tag="test-entry">{{ name }}</template>' +
            '<template data-tag="test-foo">' +
                '<test-entry data-each="item in items" name="{{ item.name }}"></test-entry>' +
            '</template>'
        );
        var data = {items: [
            {name: 'one'},
            {name: 'two'},
            {name: 'three'}
        ]};
        var patcher_calls = _patch(templates, 'test-foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'TEST-FOO', null]);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'TEST-ENTRY', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'one']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['enterTag', 'TEST-ENTRY', null]);
        assert.deepEqual(patcher_calls[5], ['text', 'two']);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['enterTag', 'TEST-ENTRY', null]);
        assert.deepEqual(patcher_calls[8], ['text', 'three']);
        assert.deepEqual(patcher_calls[9], ['exitTag']);
        assert.deepEqual(patcher_calls[10], ['exitTag']);
        assert.equal(patcher_calls.length, 11);
    });
    
    test('data-key on template call', function () {
        var templates = createTemplateNode(
            '<template data-tag="test-entry">{{ name }}</template>' +
            '<template data-tag="test-foo">' +
                '<test-entry data-each="item in items" data-key="key{{ item.id }}" name="{{ item.name }}"></test-entry>' +
            '</template>'
        );
        var data = {items: [
            {id: 1, name: 'one'},
            {id: 2, name: 'two'},
            {id: 3, name: 'three'}
        ]};
        var patcher_calls = _patch(templates, 'test-foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'TEST-FOO', null]);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'TEST-ENTRY', 'key1']);
        assert.deepEqual(patcher_calls[2], ['text', 'one']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['enterTag', 'TEST-ENTRY', 'key2']);
        assert.deepEqual(patcher_calls[5], ['text', 'two']);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['enterTag', 'TEST-ENTRY', 'key3']);
        assert.deepEqual(patcher_calls[8], ['text', 'three']);
        assert.deepEqual(patcher_calls[9], ['exitTag']);
        assert.deepEqual(patcher_calls[10], ['exitTag']);
        assert.equal(patcher_calls.length, 11);
    });

    test('data-if on template call', function () {
        var templates = createTemplateNode(
            '<template data-tag="test-greeting">Hello, {{ name }}!</template>' +
            '<template data-tag="test-foo">' +
                '<test-greeting data-if="greet" name="{{ name }}"></test-greeting>' +
            '</template>'
        );
        var data = {greet: true, name: 'world'};
        var patcher_calls = _patch(templates, 'test-foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'TEST-FOO', null]);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'TEST-GREETING', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'Hello, world!']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.equal(patcher_calls.length, 5);
        data.greet = false;
        patcher_calls = _patch(templates, 'test-foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'TEST-FOO', null]);
        assert.deepEqual(patcher_calls[1], ['exitTag']);
        assert.equal(patcher_calls.length, 2);
    });

    test('data-unless on template call', function () {
        var templates = createTemplateNode(
            '<template data-tag="test-greeting">Hello, {{ name }}!</template>' +
            '<template data-tag="test-foo">' +
                '<test-greeting data-unless="quiet" name="{{ name }}"></test-greeting>' +
            '</template>'
        );
        var data = {quiet: false, name: 'world'};
        var patcher_calls = _patch(templates, 'test-foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'TEST-FOO', null]);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'TEST-GREETING', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'Hello, world!']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.equal(patcher_calls.length, 5);
        data.quiet = true;
        patcher_calls = _patch(templates, 'test-foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'TEST-FOO', null]);
        assert.deepEqual(patcher_calls[1], ['exitTag']);
        assert.equal(patcher_calls.length, 2);
    });
    
    test('data-each on caller with data-if on callee template', function () {
        var templates = createTemplateNode(
            '<template data-tag="test-entry" data-if="public">{{ name }}</template>' +
            '<template data-tag="test-foo">' +
                '<test-entry data-each="item in items" public="{{ item.public }}" name="{{ item.name }}"></test-entry>' +
            '</template>'
        );
        var data = {items: [
            {name: 'one', public: true},
            {name: 'two', public: true},
            {name: 'three', public: false}
        ]};
        var patcher_calls = _patch(templates, 'test-foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'TEST-FOO', null]);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'TEST-ENTRY', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'one']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['enterTag', 'TEST-ENTRY', null]);
        assert.deepEqual(patcher_calls[5], ['text', 'two']);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.equal(patcher_calls.length, 8);
    });

    test('ignore template-embed tags', function () {
        var templates = createTemplateNode(
            '<template data-tag="test-foo">' +
                '<h1>{{ title }}</h1>' +
                '<template-embed name="test-bar"></template-embed>' +
            '</template>' +
            '<template data-tag="test-bar">Test</template>'
        );
        var data = {
            title: 'test'
        };
        var patcher_calls = _patch(templates, 'test-foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'TEST-FOO', null]);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'test']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.equal(patcher_calls.length, 5);
    });

    test('unknown custom tags render without attrs or children', function () {
        var templates = createTemplateNode(
            '<template data-tag="my-app">' +
                '<foo-bar name="test">asdf</foo-bar>' +
            '</template>'
        );
        var patcher_calls = _patch(templates, 'my-app', {});
        assert.deepEqual(patcher_calls[0], ['enterTag', 'MY-APP', null]);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'FOO-BAR', null]);
        assert.deepEqual(patcher_calls[2], ['exitTag']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.equal(patcher_calls.length, 4);
    });

    // TODO: test for custom tag without hyphen

});
