suite('compile', function () {

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
            '<div data-template="app">' +
                '<i>foo</i>' +
                '<b>bar</b>' +
                '<em>baz</em>' +
            '</div>'
        );
        var patcher_calls = _patch(templates, 'app', {});
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'app']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'I', null]);
        assert.deepEqual(patcher_calls[3], ['text', 'foo']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[6], ['text', 'bar']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.deepEqual(patcher_calls[8], ['enterTag', 'EM', null]);
        assert.deepEqual(patcher_calls[9], ['text', 'baz']);
        assert.deepEqual(patcher_calls[10], ['exitTag']);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.equal(patcher_calls.length, 12);
    });

    test('nested children', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<i>foo</i>\n' +
                '<p>\n' +
                '  <b>bar</b>\n' +
                '  <em>baz</em>\n' +
                '</p>\n' +
            '</div>'
        );
        var patcher_calls = _patch(templates, 'foo', {});
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'I', null]);
        assert.deepEqual(patcher_calls[3], ['text', 'foo']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['text', '\n']);
        assert.deepEqual(patcher_calls[6], ['enterTag', 'P', null]);
        assert.deepEqual(patcher_calls[7], ['text', '\n  ']);
        assert.deepEqual(patcher_calls[8], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[9], ['text', 'bar']);
        assert.deepEqual(patcher_calls[10], ['exitTag']);
        assert.deepEqual(patcher_calls[11], ['text', '\n  ']);
        assert.deepEqual(patcher_calls[12], ['enterTag', 'EM', null]);
        assert.deepEqual(patcher_calls[13], ['text', 'baz']);
        assert.deepEqual(patcher_calls[14], ['exitTag']);
        assert.deepEqual(patcher_calls[15], ['text', '\n']);
        assert.deepEqual(patcher_calls[16], ['exitTag']);
        assert.deepEqual(patcher_calls[17], ['text', '\n']);
        assert.deepEqual(patcher_calls[18], ['exitTag']);
        assert.equal(patcher_calls.length, 19);
    });

    test('variable substitution - text', function () {
        var templates = createTemplateNode('<i data-template="foo">Hello, {{name}}!</i>');
        var patcher_calls = _patch(templates, 'foo', {name: 'world'});
        assert.deepEqual(patcher_calls[0], ['enterTag', 'I', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['text', 'Hello, world!']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.equal(patcher_calls.length, 4);
    });

    test('variable substitution - array', function () {
        var templates = createTemplateNode('<div data-template="foo">{{names}}</div>');
        var patcher_calls = _patch(templates, 'foo', {names: ['foo', 'bar', 'baz']});
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['text', 'foo,bar,baz']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.equal(patcher_calls.length, 4);
    });

    test('variable substitution - undefined', function () {
        var templates = createTemplateNode('<div data-template="foo">Hello, {{name}}</div>');
        var patcher_calls = _patch(templates, 'foo', {});
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['text', 'Hello, ']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.equal(patcher_calls.length, 4);
    });

    test('variable substitution - null', function () {
        var templates = createTemplateNode('<div data-template="foo">Hello, {{name}}</div>');
        var patcher_calls = _patch(templates, 'foo', {name: null});
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['text', 'Hello, ']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.equal(patcher_calls.length, 4);
    });

    test('variable substitution - true', function () {
        var templates = createTemplateNode('<div data-template="foo">Hello, {{name}}</div>');
        var patcher_calls = _patch(templates, 'foo', {name: true});
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['text', 'Hello, true']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.equal(patcher_calls.length, 4);
    });

    test('variable substitution - false', function () {
        var templates = createTemplateNode('<div data-template="foo">Hello, {{name}}</div>');
        var patcher_calls = _patch(templates, 'foo', {name: false});
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['text', 'Hello, false']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.equal(patcher_calls.length, 4);
    });

    test('variable substitution - object', function () {
        var templates = createTemplateNode('<div data-template="foo">Hello, {{name}}</div>');
        var patcher_calls = _patch(templates, 'foo', {name: {first: 'a', last: 'b'}});
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['text', 'Hello, [object Object]']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.equal(patcher_calls.length, 4);
    });

    test('variable substitution - length property', function () {
        var templates = createTemplateNode('<div data-template="foo">Total: {{ items.length }}</div>');
        var patcher_calls = _patch(templates, 'foo', {items: ['a', 'b', 'c']});
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['text', 'Total: 3']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.equal(patcher_calls.length, 4);
    });

    test('data-each', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<h1>title</h1>' +
                '<section data-each="item in items">item</section>' +
            '</div>'
        );
        var data = {items: [{name: 'one'}, {name: 'two'}, {name: 'three'}]};
        var patcher_calls = _patch(templates, 'foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[3], ['text', 'title']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'SECTION', null]);
        assert.deepEqual(patcher_calls[6], ['text', 'item']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.deepEqual(patcher_calls[8], ['enterTag', 'SECTION', null]);
        assert.deepEqual(patcher_calls[9], ['text', 'item']);
        assert.deepEqual(patcher_calls[10], ['exitTag']);
        assert.deepEqual(patcher_calls[11], ['enterTag', 'SECTION', null]);
        assert.deepEqual(patcher_calls[12], ['text', 'item']);
        assert.deepEqual(patcher_calls[13], ['exitTag']);
        assert.deepEqual(patcher_calls[14], ['exitTag']);
        assert.equal(patcher_calls.length, 15);
    });

    test('data-each introduces new context variable', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<h1>title</h1>' +
                '<ul>' +
                    '<li data-each="item in items">' +
                        '{{item.name}}' +
                    '</li>' +
                '</ul>' +
            '</div>'
        );
        var data = {items: [{name: 'one'}, {name: 'two'}, {name: 'three'}]};
        var patcher_calls = _patch(templates, 'foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[3], ['text', 'title']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'UL', null]);
        assert.deepEqual(patcher_calls[6], ['enterTag', 'LI', null]);
        assert.deepEqual(patcher_calls[7], ['text', 'one']);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.deepEqual(patcher_calls[9], ['enterTag', 'LI', null]);
        assert.deepEqual(patcher_calls[10], ['text', 'two']);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.deepEqual(patcher_calls[12], ['enterTag', 'LI', null]);
        assert.deepEqual(patcher_calls[13], ['text', 'three']);
        assert.deepEqual(patcher_calls[14], ['exitTag']);
        assert.deepEqual(patcher_calls[15], ['exitTag']);
        assert.deepEqual(patcher_calls[16], ['exitTag']);
        assert.equal(patcher_calls.length, 17);
    });

    test('data-each with data-key', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<h1>title</h1>' +
                '<section data-each="item in items" data-key="{{item.name}}">' +
                'item' +
                '</section>' +
                '<p>footer</p>' +
                '</div>');
        var data = {items: [{name: 'one'}, {name: 'two'}, {name: 'three'}]};
        var patcher_calls = _patch(templates, 'foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[3], ['text', 'title']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'SECTION', 'one']);
        assert.deepEqual(patcher_calls[6], ['text', 'item']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.deepEqual(patcher_calls[8], ['enterTag', 'SECTION', 'two']);
        assert.deepEqual(patcher_calls[9], ['text', 'item']);
        assert.deepEqual(patcher_calls[10], ['exitTag']);
        assert.deepEqual(patcher_calls[11], ['enterTag', 'SECTION', 'three']);
        assert.deepEqual(patcher_calls[12], ['text', 'item']);
        assert.deepEqual(patcher_calls[13], ['exitTag']);
        assert.deepEqual(patcher_calls[14], ['enterTag', 'P', null]);
        assert.deepEqual(patcher_calls[15], ['text', 'footer']);
        assert.deepEqual(patcher_calls[16], ['exitTag']);
        assert.deepEqual(patcher_calls[17], ['exitTag']);
        assert.equal(patcher_calls.length, 18);
    });

    test('data-if - true', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<h1>title</h1>' +
                '<b data-if="published">published</b>' +
                '</div>');
        var data = {published: true};
        var patcher_calls = _patch(templates, 'foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[3], ['text', 'title']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[6], ['text', 'published']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.equal(patcher_calls.length, 9);
    });
    
    test('data-if - false', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<h1>title</h1>' +
                '<b data-if="published">published</b>' +
                '</div>');
        var data = {published: false};
        var patcher_calls = _patch(templates, 'foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[3], ['text', 'title']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.equal(patcher_calls.length, 6);
    });

    test('data-if - empty array', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<h1>title</h1>' +
                '<b data-if="published">published</b>' +
                '</div>');
        // empty array is falsy
        var data = {published: []};
        var patcher_calls = _patch(templates, 'foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[3], ['text', 'title']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.equal(patcher_calls.length, 6);
    });
    
    test('data-if - empty string', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<h1>title</h1>' +
                '<b data-if="published">published</b>' +
                '</div>');
        // empty string is falsy
        var data = {published: ''};
        var patcher_calls = _patch(templates, 'foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[3], ['text', 'title']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.equal(patcher_calls.length, 6);
    });
    
    test('data-if - zero', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<h1>title</h1>' +
                '<b data-if="published">published</b>' +
                '</div>');
        // zero is falsy
        var data = {published: 0};
        var patcher_calls = _patch(templates, 'foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[3], ['text', 'title']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.equal(patcher_calls.length, 6);
    });
    
    test('data-if - null', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<h1>title</h1>' +
                '<b data-if="published">published</b>' +
                '</div>');
        // null is falsy
        var data = {published: null};
        var patcher_calls = _patch(templates, 'foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[3], ['text', 'title']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.equal(patcher_calls.length, 6);
    });

    test('data-if - undefined', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<h1>title</h1>' +
                '<b data-if="published">published</b>' +
                '</div>');
        // undefined is falsy
        var data = {};
        var patcher_calls = _patch(templates, 'foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[3], ['text', 'title']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.equal(patcher_calls.length, 6);
    });
    
    test('data-unless - true', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<h1>title</h1>' +
                '<b data-unless="published">draft</b>' +
                '</div>');
        var data = {published: true};
        var patcher_calls = _patch(templates, 'foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[3], ['text', 'title']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.equal(patcher_calls.length, 6);
    });
    
    test('data-unless - false', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<h1>title</h1>' +
                '<b data-unless="published">draft</b>' +
                '</div>');
        var data = {published: false};
        var patcher_calls = _patch(templates, 'foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[3], ['text', 'title']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[6], ['text', 'draft']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.equal(patcher_calls.length, 9);
    });

    test('data-unless - empty array', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<h1>title</h1>' +
                '<b data-unless="published">draft</b>' +
                '</div>');
        // empty array is falsy
        var data = {published: []};
        var patcher_calls = _patch(templates, 'foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[3], ['text', 'title']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[6], ['text', 'draft']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.equal(patcher_calls.length, 9);
    });
    
    test('data-unless - empty string', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<h1>title</h1>' +
                '<b data-unless="published">draft</b>' +
                '</div>');
        // empty string is falsy
        var data = {published: ''};
        var patcher_calls = _patch(templates, 'foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[3], ['text', 'title']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[6], ['text', 'draft']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.equal(patcher_calls.length, 9);
    });
    
    test('data-unless - zero', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<h1>title</h1>' +
                '<b data-unless="published">draft</b>' +
                '</div>');
        // zero is falsy
        var data = {published: 0};
        var patcher_calls = _patch(templates, 'foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[3], ['text', 'title']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[6], ['text', 'draft']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.equal(patcher_calls.length, 9);
    });
    
    test('data-unless - null', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<h1>title</h1>' +
                '<b data-unless="published">draft</b>' +
                '</div>');
        // null is falsy
        var data = {published: null};
        var patcher_calls = _patch(templates, 'foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[3], ['text', 'title']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[6], ['text', 'draft']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.equal(patcher_calls.length, 9);
    });

    test('data-unless - undefined', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<h1>title</h1>' +
                '<b data-unless="published">draft</b>' +
                '</div>');
        // undefined is falsy
        var data = {};
        var patcher_calls = _patch(templates, 'foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[3], ['text', 'title']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[6], ['text', 'draft']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.equal(patcher_calls.length, 9);
    });

    test('call another template block statically', function () {
        var templates = createTemplateNode(
            '<b data-template="bar">{{meta.year}}</b>' +
            '<div data-template="foo">' +
                '<h1>title</h1>' +
                '<bar meta="{{ article.meta }}"></bar>' +
            '</div>');
        var data = {
            article: {
                meta: {
                    year: 2015
                }
            }
        };
        var patcher_calls = _patch(templates, 'foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[3], ['text', 'title']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[6], ['attribute', 'data-bind', 'bar']);
        assert.deepEqual(patcher_calls[7], ['text', '2015']);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.deepEqual(patcher_calls[9], ['exitTag']);
        assert.equal(patcher_calls.length, 10);
    });

    test('call another template block with multiple args', function () {
        var templates = createTemplateNode(
            '<b data-template="bar">{{ author }} ({{ year }})</b>' +
            '<div data-template="foo">' +
                '<h1>title</h1>' +
                '<bar author="{{ article.author }}" year="{{ article.year }}"></bar>' +
            '</div>');
        var data = {
            article: {
                author: 'test',
                year: 2015
            }
        };
        var patcher_calls = _patch(templates, 'foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[3], ['text', 'title']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[6], ['attribute', 'data-bind', 'bar']);
        assert.deepEqual(patcher_calls[7], ['text', 'test (2015)']);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.deepEqual(patcher_calls[9], ['exitTag']);
        assert.equal(patcher_calls.length, 10);
    });

    test('call another template with fixed string values', function () {
        var templates = createTemplateNode(
            '<b data-template="bar">{{ msg }}</b>' +
            '<div data-template="foo">' +
                '<h1>title</h1>' +
                '<bar msg="test"></bar>' +
            '</div>');
        var data = {};
        var patcher_calls = _patch(templates, 'foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[3], ['text', 'title']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[6], ['attribute', 'data-bind', 'bar']);
        assert.deepEqual(patcher_calls[7], ['text', 'test']);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.deepEqual(patcher_calls[9], ['exitTag']);
        assert.equal(patcher_calls.length, 10);
    });

    test('call another template with interpolated string values', function () {
        var templates = createTemplateNode(
            '<b data-template="bar">{{ msg }}</b>' +
            '<div data-template="foo">' +
                '<h1>title</h1>' +
                '<bar msg="test-{{ name }}-asdf"></bar>' +
            '</div>');
        var data = {
            name: 'example'
        };
        var patcher_calls = _patch(templates, 'foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[3], ['text', 'title']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[6], ['attribute', 'data-bind', 'bar']);
        assert.deepEqual(patcher_calls[7], ['text', 'test-example-asdf']);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.deepEqual(patcher_calls[9], ['exitTag']);
        assert.equal(patcher_calls.length, 10);
    });

    test('call another template block with child expansion', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<h1>title</h1>' +
                '<bar article="{{ article }}">' +
                    '<i>inner</i>' +
                '</bar>' +
            '</div>' +
            '<div data-template="bar">' +
                '<b>{{article.title}}</b>' +
                '<template-children />' +
            '</div>');
        var data = {
            article: {
                title: 'test',
                meta: {
                    year: 2015
                }
            }
        };
        var patcher_calls = _patch(templates, 'foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[3], ['text', 'title']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[6], ['attribute', 'data-bind', 'bar']);
        assert.deepEqual(patcher_calls[7], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[8], ['text', 'test']);
        assert.deepEqual(patcher_calls[9], ['exitTag']);
        assert.deepEqual(patcher_calls[10], ['enterTag', 'I', null]);
        assert.deepEqual(patcher_calls[11], ['text', 'inner']);
        assert.deepEqual(patcher_calls[12], ['exitTag']);
        assert.deepEqual(patcher_calls[13], ['exitTag']);
        assert.deepEqual(patcher_calls[14], ['exitTag']);
        assert.equal(patcher_calls.length, 15);
    });

    test('nested expansions', function () {
        var templates = createTemplateNode(
            '<div data-template="root">' +
                '<one article="{{ article }}">' +
                    '<i>root</i>' +
                '</one>' +
            '</div>' +
                
            '<div data-template="one">' +
                '<h1>title</h1>' +
                '<two meta="{{ article.meta }}">' +
                    '<i>one.1</i>' +
                    '<three>' +
                        '<i>one.2</i>' +
                        '<template-children></template-children>' +
                    '</three>' +
                '</two>' +
            '</div>' +

            '<div data-template="two">' +
                '<b>{{meta.year}}</b>' +
                '<template-children></template-children>' +
            '</div>' +
                
            '<div data-template="three">' +
                '<b>three</b>' +
                '<template-children></template-children>' +
            '</div>'
        );
        var data = {
            article: {
                meta: {
                    year: 2015
                }
            }
        };
        var patcher_calls = _patch(templates, 'root', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'root']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[3], ['attribute', 'data-bind', 'one']);
        assert.deepEqual(patcher_calls[4], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[5], ['text', 'title']);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[8], ['attribute', 'data-bind', 'two']);
        assert.deepEqual(patcher_calls[9], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[10], ['text', '2015']);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.deepEqual(patcher_calls[12], ['enterTag', 'I', null]);
        assert.deepEqual(patcher_calls[13], ['text', 'one.1']);
        assert.deepEqual(patcher_calls[14], ['exitTag']);
        assert.deepEqual(patcher_calls[15], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[16], ['attribute', 'data-bind', 'three']);
        assert.deepEqual(patcher_calls[17], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[18], ['text', 'three']);
        assert.deepEqual(patcher_calls[19], ['exitTag']);
        assert.deepEqual(patcher_calls[20], ['enterTag', 'I', null]);
        assert.deepEqual(patcher_calls[21], ['text', 'one.2']);
        assert.deepEqual(patcher_calls[22], ['exitTag']);
        assert.deepEqual(patcher_calls[23], ['enterTag', 'I', null]);
        assert.deepEqual(patcher_calls[24], ['text', 'root']);
        assert.deepEqual(patcher_calls[25], ['exitTag']);
        assert.deepEqual(patcher_calls[26], ['exitTag']);
        assert.deepEqual(patcher_calls[27], ['exitTag']);
        assert.deepEqual(patcher_calls[28], ['exitTag']);
        assert.deepEqual(patcher_calls[29], ['exitTag']);
        assert.equal(patcher_calls.length, 30);
    });

    test('skip comment nodes in template', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<i>foo</i>' +
                '<!-- this is a comment -->' +
                '<b>bar</b>' +
                '<em>baz</em>' +
                '</div>');
        var data = {};
        var patcher_calls = _patch(templates, 'foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'I', null]);
        assert.deepEqual(patcher_calls[3], ['text', 'foo']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[6], ['text', 'bar']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.deepEqual(patcher_calls[8], ['enterTag', 'EM', null]);
        assert.deepEqual(patcher_calls[9], ['text', 'baz']);
        assert.deepEqual(patcher_calls[10], ['exitTag']);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.equal(patcher_calls.length, 12);
    });

    test('node attributes', function () {
        var templates = createTemplateNode(
            '<a data-template="foo" href="#" class="btn">foo</a>'
        );
        var data = {};
        var patcher_calls = _patch(templates, 'foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'A', null]);
        // order of these events is browser dependant
        assert.deepEqual(patcher_calls.slice(1, 4).sort(), [
            ['attribute', 'class', 'btn'],
            ['attribute', 'data-bind', 'foo'],
            ['attribute', 'href', '#']
        ]);
        assert.deepEqual(patcher_calls[4], ['text', 'foo']);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.equal(patcher_calls.length, 6);
    });

    test('expand variables in node attributes', function () {
        var templates = createTemplateNode(
            '<a data-template="foo" href="{{url}}" class="btn">foo</a>'
        );
        var data = {url: 'http://example.com'};
        var patcher_calls = _patch(templates, 'foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'A', null]);
        // order of these events is browser dependant
        assert.deepEqual(patcher_calls.slice(1, 4).sort(), [
            ['attribute', 'class', 'btn'],
            ['attribute', 'data-bind', 'foo'],
            ['attribute', 'href', 'http://example.com']
        ]);
        assert.deepEqual(patcher_calls[4], ['text', 'foo']);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.equal(patcher_calls.length, 6);
    });

    test('boolean attributes - allowfullscreen', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<iframe allowfullscreen="{{a}}"></iframe>' +
                '<iframe allowfullscreen="{{b}}"></iframe>' +
                '<iframe allowfullscreen="{{c}}"></iframe>' +
                '<iframe allowfullscreen></iframe>' +
            '</div>'
        );
        var data = {
            a: true,
            b: false
        };
        var patcher_calls = _patch(templates, 'foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'IFRAME', null]);
        assert.deepEqual(patcher_calls[3], ['attribute', 'allowfullscreen', true]);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'IFRAME', null]);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['enterTag', 'IFRAME', null]);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.deepEqual(patcher_calls[9], ['enterTag', 'IFRAME', null]);
        assert.deepEqual(patcher_calls[10], ['attribute', 'allowfullscreen', true]);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.deepEqual(patcher_calls[12], ['exitTag']);
        assert.equal(patcher_calls.length, 13);
    });

    test('boolean attributes - async', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<script src="blank.js" async="{{a}}"></script>' +
                '<script src="blank.js" async="{{b}}"></script>' +
                '<script src="blank.js" async="{{c}}"></script>' +
                '<script src="blank.js" async></script>' +
            '</div>'
        );
        var data = {
            a: true,
            b: false
        };
        var patcher_calls = _patch(templates, 'foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'SCRIPT', null]);
        assert.deepEqual(patcher_calls.slice(3, 5).sort(), [
            ['attribute', 'async', true],
            ['attribute', 'src', 'blank.js']
        ]);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.deepEqual(patcher_calls[6], ['enterTag', 'SCRIPT', null]);
        assert.deepEqual(patcher_calls[7], ['attribute', 'src', 'blank.js']);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.deepEqual(patcher_calls[9], ['enterTag', 'SCRIPT', null]);
        assert.deepEqual(patcher_calls[10], ['attribute', 'src', 'blank.js']);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.deepEqual(patcher_calls[12], ['enterTag', 'SCRIPT', null]);
        assert.deepEqual(patcher_calls.slice(13, 15).sort(), [
            ['attribute', 'async', true],
            ['attribute', 'src', 'blank.js']
        ]);
        assert.deepEqual(patcher_calls[15], ['exitTag']);
        assert.deepEqual(patcher_calls[16], ['exitTag']);
        assert.equal(patcher_calls.length, 17);
    });

    test('boolean attributes - autofocus', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<input type="text" autofocus="{{a}}">' +
                '<input type="text" autofocus="{{b}}">' +
                '<input type="text" autofocus="{{c}}">' +
                '<input type="text" autofocus>' +
            '</div>'
        );
        var data = {
            a: true,
            b: false
        };
        var patcher_calls = _patch(templates, 'foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls.slice(3, 5).sort(), [
            ['attribute', 'autofocus', true],
            ['attribute', 'type', 'text']
        ]);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.deepEqual(patcher_calls[6], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls[7], ['attribute', 'type', 'text']);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.deepEqual(patcher_calls[9], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls[10], ['attribute', 'type', 'text']);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.deepEqual(patcher_calls[12], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls.slice(13, 15).sort(), [
            ['attribute', 'autofocus', true],
            ['attribute', 'type', 'text']
        ]);
        assert.deepEqual(patcher_calls[15], ['exitTag']);
        assert.deepEqual(patcher_calls[16], ['exitTag']);
        assert.equal(patcher_calls.length, 17);
    });

    test('boolean attributes - autoplay', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<video autoplay="{{a}}"></video>' +
                '<video autoplay="{{b}}"></video>' +
                '<video autoplay="{{c}}"></video>' +
                '<video autoplay></video>' +
            '</div>'
        );
        var data = {
            a: true,
            b: false
        };
        var patcher_calls = _patch(templates, 'foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'VIDEO', null]);
        assert.deepEqual(patcher_calls[3], ['attribute', 'autoplay', true]);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'VIDEO', null]);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['enterTag', 'VIDEO', null]);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.deepEqual(patcher_calls[9], ['enterTag', 'VIDEO', null]);
        assert.deepEqual(patcher_calls[10], ['attribute', 'autoplay', true]);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.deepEqual(patcher_calls[12], ['exitTag']);
        assert.equal(patcher_calls.length, 13);
    });

    test('boolean attributes - capture', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<input type="file" capture="{{a}}">' +
                '<input type="file" capture="{{b}}">' +
                '<input type="file" capture="{{c}}">' +
                '<input type="file" capture>' +
            '</div>'
        );
        var data = {
            a: true,
            b: false
        };
        var patcher_calls = _patch(templates, 'foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls.slice(3, 5).sort(), [
            ['attribute', 'capture', true],
            ['attribute', 'type', 'file']
        ]);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.deepEqual(patcher_calls[6], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls[7], ['attribute', 'type', 'file']);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.deepEqual(patcher_calls[9], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls[10], ['attribute', 'type', 'file']);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.deepEqual(patcher_calls[12], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls.slice(13, 15).sort(), [
            ['attribute', 'capture', true],
            ['attribute', 'type', 'file']
        ]);
        assert.deepEqual(patcher_calls[15], ['exitTag']);
        assert.deepEqual(patcher_calls[16], ['exitTag']);
        assert.equal(patcher_calls.length, 17);
    });
    
    test('boolean attributes - checked', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<input type="checkbox" checked="{{a}}">' +
                '<input type="checkbox" checked="{{b}}">' +
                '<input type="checkbox" checked="{{c}}">' +
                '<input type="checkbox" checked>' +
            '</div>'
        );
        var data = {
            a: true,
            b: false
        };
        var patcher_calls = _patch(templates, 'foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls.slice(3, 5).sort(), [
            ['attribute', 'checked', true],
            ['attribute', 'type', 'checkbox']
        ]);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.deepEqual(patcher_calls[6], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls[7], ['attribute', 'type', 'checkbox']);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.deepEqual(patcher_calls[9], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls[10], ['attribute', 'type', 'checkbox']);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.deepEqual(patcher_calls[12], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls.slice(13, 15).sort(), [
            ['attribute', 'checked', true],
            ['attribute', 'type', 'checkbox']
        ]);
        assert.deepEqual(patcher_calls[15], ['exitTag']);
        assert.deepEqual(patcher_calls[16], ['exitTag']);
        assert.equal(patcher_calls.length, 17);
    });

    test('boolean attributes - controls', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<video controls="{{a}}"></video>' +
                '<video controls="{{b}}"></video>' +
                '<video controls="{{c}}"></video>' +
                '<video controls></video>' +
            '</div>'
        );
        var data = {
            a: true,
            b: false
        };
        var patcher_calls = _patch(templates, 'foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'VIDEO', null]);
        assert.deepEqual(patcher_calls[3], ['attribute', 'controls', true]);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'VIDEO', null]);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['enterTag', 'VIDEO', null]);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.deepEqual(patcher_calls[9], ['enterTag', 'VIDEO', null]);
        assert.deepEqual(patcher_calls[10], ['attribute', 'controls', true]);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.deepEqual(patcher_calls[12], ['exitTag']);
        assert.equal(patcher_calls.length, 13);
    });
    
    test('boolean attributes - default', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<audio><track src="test.vtt" default="{{a}}"></audio>' +
                '<audio><track src="test.vtt" default="{{b}}"></audio>' +
                '<audio><track src="test.vtt" default="{{c}}"></audio>' +
                '<audio><track src="test.vtt" default></audio>' +
            '</div>'
        );
        var data = {
            a: true,
            b: false
        };
        var patcher_calls = _patch(templates, 'foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'AUDIO', null]);
        assert.deepEqual(patcher_calls[3], ['enterTag', 'TRACK', null]);
        assert.deepEqual(patcher_calls.slice(4, 6).sort(), [
            ['attribute', 'default', true],
            ['attribute', 'src', 'test.vtt']
        ]);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.deepEqual(patcher_calls[8], ['enterTag', 'AUDIO', null]);
        assert.deepEqual(patcher_calls[9], ['enterTag', 'TRACK', null]);
        assert.deepEqual(patcher_calls[10], ['attribute', 'src', 'test.vtt']);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.deepEqual(patcher_calls[12], ['exitTag']);
        assert.deepEqual(patcher_calls[13], ['enterTag', 'AUDIO', null]);
        assert.deepEqual(patcher_calls[14], ['enterTag', 'TRACK', null]);
        assert.deepEqual(patcher_calls[15], ['attribute', 'src', 'test.vtt']);
        assert.deepEqual(patcher_calls[16], ['exitTag']);
        assert.deepEqual(patcher_calls[17], ['exitTag']);
        assert.deepEqual(patcher_calls[18], ['enterTag', 'AUDIO', null]);
        assert.deepEqual(patcher_calls[19], ['enterTag', 'TRACK', null]);
        assert.deepEqual(patcher_calls.slice(20, 22).sort(), [
            ['attribute', 'default', true],
            ['attribute', 'src', 'test.vtt']
        ]);
        assert.deepEqual(patcher_calls[22], ['exitTag']);
        assert.deepEqual(patcher_calls[23], ['exitTag']);
        assert.deepEqual(patcher_calls[24], ['exitTag']);
        assert.equal(patcher_calls.length, 25);
    });

    test('boolean attributes - defer', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<script src="blank.js" defer="{{a}}"></script>' +
                '<script src="blank.js" defer="{{b}}"></script>' +
                '<script src="blank.js" defer="{{c}}"></script>' +
                '<script src="blank.js" defer></script>' +
            '</div>'
        );
        var data = {
            a: true,
            b: false
        };
        var patcher_calls = _patch(templates, 'foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'SCRIPT', null]);
        assert.deepEqual(patcher_calls.slice(3, 5).sort(), [
            ['attribute', 'defer', true],
            ['attribute', 'src', 'blank.js']
        ]);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.deepEqual(patcher_calls[6], ['enterTag', 'SCRIPT', null]);
        assert.deepEqual(patcher_calls[7], ['attribute', 'src', 'blank.js']);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.deepEqual(patcher_calls[9], ['enterTag', 'SCRIPT', null]);
        assert.deepEqual(patcher_calls[10], ['attribute', 'src', 'blank.js']);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.deepEqual(patcher_calls[12], ['enterTag', 'SCRIPT', null]);
        assert.deepEqual(patcher_calls.slice(13, 15).sort(), [
            ['attribute', 'defer', true],
            ['attribute', 'src', 'blank.js']
        ]);
        assert.deepEqual(patcher_calls[15], ['exitTag']);
        assert.deepEqual(patcher_calls[16], ['exitTag']);
        assert.equal(patcher_calls.length, 17);
    });

    test('boolean attributes - disabled', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<input type="text" disabled="{{a}}">' +
                '<input type="text" disabled="{{b}}">' +
                '<input type="text" disabled="{{c}}">' +
                '<input type="text" disabled>' +
            '</div>'
        );
        var data = {
            a: true,
            b: false
        };
        var patcher_calls = _patch(templates, 'foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls.slice(3, 5).sort(), [
            ['attribute', 'disabled', true],
            ['attribute', 'type', 'text']
        ]);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.deepEqual(patcher_calls[6], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls[7], ['attribute', 'type', 'text']);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.deepEqual(patcher_calls[9], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls[10], ['attribute', 'type', 'text']);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.deepEqual(patcher_calls[12], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls.slice(13, 15).sort(), [
            ['attribute', 'disabled', true],
            ['attribute', 'type', 'text']
        ]);
        assert.deepEqual(patcher_calls[15], ['exitTag']);
        assert.deepEqual(patcher_calls[16], ['exitTag']);
        assert.equal(patcher_calls.length, 17);
    });

    test('boolean attributes - formvalidate', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<button formnovalidate="{{a}}">Test</button>' +
                '<button formnovalidate="{{b}}">Test</button>' +
                '<button formnovalidate="{{c}}">Test</button>' +
                '<button formnovalidate>Test</button>' +
            '</div>'
        );
        var data = {
            a: true,
            b: false
        };
        var patcher_calls = _patch(templates, 'foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'BUTTON', null]);
        assert.deepEqual(patcher_calls[3], ['attribute', 'formnovalidate', true]);
        assert.deepEqual(patcher_calls[4], ['text', 'Test']);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.deepEqual(patcher_calls[6], ['enterTag', 'BUTTON', null]);
        assert.deepEqual(patcher_calls[7], ['text', 'Test']);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.deepEqual(patcher_calls[9], ['enterTag', 'BUTTON', null]);
        assert.deepEqual(patcher_calls[10], ['text', 'Test']);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.deepEqual(patcher_calls[12], ['enterTag', 'BUTTON', null]);
        assert.deepEqual(patcher_calls[13], ['attribute', 'formnovalidate', true]);
        assert.deepEqual(patcher_calls[14], ['text', 'Test']);
        assert.deepEqual(patcher_calls[15], ['exitTag']);
        assert.deepEqual(patcher_calls[16], ['exitTag']);
        assert.equal(patcher_calls.length, 17);
    });

    test('boolean attributes - hidden', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<p hidden="{{a}}">Test</p>' +
                '<p hidden="{{b}}">Test</p>' +
                '<p hidden="{{c}}">Test</p>' +
                '<p hidden>Test</p>' +
            '</div>'
        );
        var data = {
            a: true,
            b: false
        };
        var patcher_calls = _patch(templates, 'foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'P', null]);
        assert.deepEqual(patcher_calls[3], ['attribute', 'hidden', true]);
        assert.deepEqual(patcher_calls[4], ['text', 'Test']);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.deepEqual(patcher_calls[6], ['enterTag', 'P', null]);
        assert.deepEqual(patcher_calls[7], ['text', 'Test']);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.deepEqual(patcher_calls[9], ['enterTag', 'P', null]);
        assert.deepEqual(patcher_calls[10], ['text', 'Test']);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.deepEqual(patcher_calls[12], ['enterTag', 'P', null]);
        assert.deepEqual(patcher_calls[13], ['attribute', 'hidden', true]);
        assert.deepEqual(patcher_calls[14], ['text', 'Test']);
        assert.deepEqual(patcher_calls[15], ['exitTag']);
        assert.deepEqual(patcher_calls[16], ['exitTag']);
        assert.equal(patcher_calls.length, 17);
    });

    test('boolean attributes - itemscope', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<div itemscope="{{a}}">Test</div>' +
                '<div itemscope="{{b}}">Test</div>' +
                '<div itemscope="{{c}}">Test</div>' +
                '<div itemscope>Test</div>' +
            '</div>'
        );
        var data = {
            a: true,
            b: false
        };
        var patcher_calls = _patch(templates, 'foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[3], ['attribute', 'itemscope', true]);
        assert.deepEqual(patcher_calls[4], ['text', 'Test']);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.deepEqual(patcher_calls[6], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[7], ['text', 'Test']);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.deepEqual(patcher_calls[9], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[10], ['text', 'Test']);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.deepEqual(patcher_calls[12], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[13], ['attribute', 'itemscope', true]);
        assert.deepEqual(patcher_calls[14], ['text', 'Test']);
        assert.deepEqual(patcher_calls[15], ['exitTag']);
        assert.deepEqual(patcher_calls[16], ['exitTag']);
        assert.equal(patcher_calls.length, 17);
    });

    test('boolean attributes - loop', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<audio loop="{{a}}"></audio>' +
                '<audio loop="{{b}}"></audio>' +
                '<audio loop="{{c}}"></audio>' +
                '<audio loop></audio>' +
            '</div>'
        );
        var data = {
            a: true,
            b: false
        };
        var patcher_calls = _patch(templates, 'foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'AUDIO', null]);
        assert.deepEqual(patcher_calls[3], ['attribute', 'loop', true]);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'AUDIO', null]);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['enterTag', 'AUDIO', null]);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.deepEqual(patcher_calls[9], ['enterTag', 'AUDIO', null]);
        assert.deepEqual(patcher_calls[10], ['attribute', 'loop', true]);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.deepEqual(patcher_calls[12], ['exitTag']);
        assert.equal(patcher_calls.length, 13);
    });

    test('boolean attributes - multiple', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<select multiple="{{a}}"></select>' +
                '<select multiple="{{b}}"></select>' +
                '<select multiple="{{c}}"></select>' +
                '<select multiple></select>' +
            '</div>'
        );
        var data = {
            a: true,
            b: false
        };
        var patcher_calls = _patch(templates, 'foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'SELECT', null]);
        assert.deepEqual(patcher_calls[3], ['attribute', 'multiple', true]);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'SELECT', null]);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['enterTag', 'SELECT', null]);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.deepEqual(patcher_calls[9], ['enterTag', 'SELECT', null]);
        assert.deepEqual(patcher_calls[10], ['attribute', 'multiple', true]);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.deepEqual(patcher_calls[12], ['exitTag']);
        assert.equal(patcher_calls.length, 13);
    });

    test('boolean attributes - muted', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<video muted="{{a}}"></video>' +
                '<video muted="{{b}}"></video>' +
                '<video muted="{{c}}"></video>' +
                '<video muted></video>' +
            '</div>'
        );
        var data = {
            a: true,
            b: false
        };
        var patcher_calls = _patch(templates, 'foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'VIDEO', null]);
        assert.deepEqual(patcher_calls[3], ['attribute', 'muted', true]);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'VIDEO', null]);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['enterTag', 'VIDEO', null]);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.deepEqual(patcher_calls[9], ['enterTag', 'VIDEO', null]);
        assert.deepEqual(patcher_calls[10], ['attribute', 'muted', true]);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.deepEqual(patcher_calls[12], ['exitTag']);
        assert.equal(patcher_calls.length, 13);
    });

    test('boolean attributes - novalidate', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<form novalidate="{{a}}"></form>' +
                '<form novalidate="{{b}}"></form>' +
                '<form novalidate="{{c}}"></form>' +
                '<form novalidate></form>' +
            '</div>'
        );
        var prev_data = {};
        var data = {
            a: true,
            b: false
        };
        var patcher_calls = _patch(templates, 'foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'FORM', null]);
        assert.deepEqual(patcher_calls[3], ['attribute', 'novalidate', true]);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'FORM', null]);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['enterTag', 'FORM', null]);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.deepEqual(patcher_calls[9], ['enterTag', 'FORM', null]);
        assert.deepEqual(patcher_calls[10], ['attribute', 'novalidate', true]);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.deepEqual(patcher_calls[12], ['exitTag']);
        assert.equal(patcher_calls.length, 13);
    });

    test('boolean attributes - open', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<details open="{{a}}"><summary>Test</summary></details>' +
                '<details open="{{b}}"><summary>Test</summary></details>' +
                '<details open="{{c}}"><summary>Test</summary></details>' +
                '<details open><summary>Test</summary></details>' +
            '</div>'
        );
        var data = {
            a: true,
            b: false
        };
        var patcher_calls = _patch(templates, 'foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'DETAILS', null]);
        assert.deepEqual(patcher_calls[3], ['attribute', 'open', true]);
        assert.deepEqual(patcher_calls[4], ['enterTag', 'SUMMARY', null]);
        assert.deepEqual(patcher_calls[5], ['text', 'Test']);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.deepEqual(patcher_calls[8], ['enterTag', 'DETAILS', null]);
        assert.deepEqual(patcher_calls[9], ['enterTag', 'SUMMARY', null]);
        assert.deepEqual(patcher_calls[10], ['text', 'Test']);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.deepEqual(patcher_calls[12], ['exitTag']);
        assert.deepEqual(patcher_calls[13], ['enterTag', 'DETAILS', null]);
        assert.deepEqual(patcher_calls[14], ['enterTag', 'SUMMARY', null]);
        assert.deepEqual(patcher_calls[15], ['text', 'Test']);
        assert.deepEqual(patcher_calls[16], ['exitTag']);
        assert.deepEqual(patcher_calls[17], ['exitTag']);
        assert.deepEqual(patcher_calls[18], ['enterTag', 'DETAILS', null]);
        assert.deepEqual(patcher_calls[19], ['attribute', 'open', true]);
        assert.deepEqual(patcher_calls[20], ['enterTag', 'SUMMARY', null]);
        assert.deepEqual(patcher_calls[21], ['text', 'Test']);
        assert.deepEqual(patcher_calls[22], ['exitTag']);
        assert.deepEqual(patcher_calls[23], ['exitTag']);
        assert.deepEqual(patcher_calls[24], ['exitTag']);
        assert.equal(patcher_calls.length, 25);
    });

    test('boolean attributes - readonly', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<input type="text" readonly="{{a}}">' +
                '<input type="text" readonly="{{b}}">' +
                '<input type="text" readonly="{{c}}">' +
                '<input type="text" readonly>' +
            '</div>'
        );
        var data = {
            a: true,
            b: false
        };
        var patcher_calls = _patch(templates, 'foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls.slice(3, 5).sort(), [
            ['attribute', 'readonly', true],
            ['attribute', 'type', 'text']
        ]);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.deepEqual(patcher_calls[6], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls[7], ['attribute', 'type', 'text']);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.deepEqual(patcher_calls[9], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls[10], ['attribute', 'type', 'text']);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.deepEqual(patcher_calls[12], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls.slice(13, 15).sort(), [
            ['attribute', 'readonly', true],
            ['attribute', 'type', 'text']
        ]);
        assert.deepEqual(patcher_calls[15], ['exitTag']);
        assert.deepEqual(patcher_calls[16], ['exitTag']);
        assert.equal(patcher_calls.length, 17);
    });

    test('boolean attributes - required', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<input type="text" required="{{a}}">' +
                '<input type="text" required="{{b}}">' +
                '<input type="text" required="{{c}}">' +
                '<input type="text" required>' +
            '</div>'
        );
        var data = {
            a: true,
            b: false
        };
        var patcher_calls = _patch(templates, 'foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls.slice(3, 5).sort(), [
            ['attribute', 'required', true],
            ['attribute', 'type', 'text']
        ]);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.deepEqual(patcher_calls[6], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls[7], ['attribute', 'type', 'text']);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.deepEqual(patcher_calls[9], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls[10], ['attribute', 'type', 'text']);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.deepEqual(patcher_calls[12], ['enterTag', 'INPUT', null]);
        assert.deepEqual(patcher_calls.slice(13, 15).sort(), [
            ['attribute', 'required', true],
            ['attribute', 'type', 'text']
        ]);
        assert.deepEqual(patcher_calls[15], ['exitTag']);
        assert.deepEqual(patcher_calls[16], ['exitTag']);
        assert.equal(patcher_calls.length, 17);
    });

    test('boolean attributes - reversed', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<ol reversed="{{a}}"></ol>' +
                '<ol reversed="{{b}}"></ol>' +
                '<ol reversed="{{c}}"></ol>' +
                '<ol reversed></ol>' +
            '</div>'
        );
        var data = {
            a: true,
            b: false
        };
        var patcher_calls = _patch(templates, 'foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'OL', null]);
        assert.deepEqual(patcher_calls[3], ['attribute', 'reversed', true]);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'OL', null]);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['enterTag', 'OL', null]);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.deepEqual(patcher_calls[9], ['enterTag', 'OL', null]);
        assert.deepEqual(patcher_calls[10], ['attribute', 'reversed', true]);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.deepEqual(patcher_calls[12], ['exitTag']);
        assert.equal(patcher_calls.length, 13);
    });
    
    // // TODO: move collapsing of adjacent text nodes into patcher?
    // test('collapse text nodes around conditional', function () {
    //     createTemplateNode('foo', 'Hello, <b>world</b>!');
    //     var templates = createTemplateNode(
    //         '<div data-template="foo">' +
    //             'MESSAGE ' +
    //             '<span data-if="{{nope}}"></span>\n' +
    //             'END' +
    //             '</div>');
    //     var data = {};
    //     var patcher_calls = _patch(templates, 'foo', data);
    //     assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
    //     assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
    //     assert.deepEqual(patcher_calls[2], ['text', 'MESSAGE \nEND']);
    //     assert.deepEqual(patcher_calls[3], ['exitTag']);
    //     assert.equal(patcher_calls.length, 4);
    // });

    test('render missing variables in text block', function () {
        var templates = createTemplateNode(
            '<h1 data-template="foo">Hello, {{user.name}}!</h1>'
        );
        var data = {};
        var patcher_calls = _patch(templates, 'foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['text', 'Hello, !']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.equal(patcher_calls.length, 4);
    });

    test('render missing variables in text attributes', function () {
        var templates = createTemplateNode(
            '<a data-template="foo" href="{{url}}">link</a>'
        );
        var data = {};
        var patcher_calls = _patch(templates, 'foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'A', null]);
        assert.deepEqual(patcher_calls.slice(1, 3), [
            ['attribute', 'data-bind', 'foo'],
            ['attribute', 'href', '']
        ]);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.equal(patcher_calls.length, 5);
    });

    test('template tags inside select element', function () {
        var templates = createTemplateNode(
            '<select data-template="foo">' +
                '<option data-each="opt in options" value="{{opt.value}}">{{opt.label}}</option>' +
                '</select>');
        var data = {
            options: [
                {value: 1, label: 'one'},
                {value: 2, label: 'two'},
                {value: 3, label: 'three'},
            ]
        };
        var patcher_calls = _patch(templates, 'foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'SELECT', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
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
        assert.equal(patcher_calls.length, 15);
    });

    test('data-each processed before data-if', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<p data-each="item in items" data-if="item.published">' +
                    '{{ item.name }}' +
                '</p>' +
            '</div>'
        );
        var data = {items: [
            {name: 'one', published: true},
            {name: 'two', published: false},
            {name: 'three', published: true}
        ]};
        var patcher_calls = _patch(templates, 'foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'P', null]);
        assert.deepEqual(patcher_calls[3], ['text', 'one']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'P', null]);
        assert.deepEqual(patcher_calls[6], ['text', 'three']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.equal(patcher_calls.length, 9);
    });

    test('data-each processed before data-unless', function () {
        var templates = createTemplateNode(
            '<div data-template="foo">' +
                '<p data-each="item in items" data-unless="item.hidden">' +
                    '{{ item.name }}' +
                '</p>' +
            '</div>'
        );
        var data = {items: [
            {name: 'one', hidden: false},
            {name: 'two', hidden: true},
            {name: 'three', hidden: false}
        ]};
        var patcher_calls = _patch(templates, 'foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'P', null]);
        assert.deepEqual(patcher_calls[3], ['text', 'one']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'P', null]);
        assert.deepEqual(patcher_calls[6], ['text', 'three']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.equal(patcher_calls.length, 9);
    });

    test('data-each on template call', function () {
        var templates = createTemplateNode(
            '<li data-template="entry">{{ name }}</li>' +
            '<ul data-template="foo">' +
                '<entry data-each="item in items" name="{{ item.name }}"></entry>' +
            '</ul>'
        );
        var data = {items: [
            {name: 'one'},
            {name: 'two'},
            {name: 'three'}
        ]};
        var patcher_calls = _patch(templates, 'foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'UL', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'LI', null]);
        assert.deepEqual(patcher_calls[3], ['attribute', 'data-bind', 'entry']);
        assert.deepEqual(patcher_calls[4], ['text', 'one']);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.deepEqual(patcher_calls[6], ['enterTag', 'LI', null]);
        assert.deepEqual(patcher_calls[7], ['attribute', 'data-bind', 'entry']);
        assert.deepEqual(patcher_calls[8], ['text', 'two']);
        assert.deepEqual(patcher_calls[9], ['exitTag']);
        assert.deepEqual(patcher_calls[10], ['enterTag', 'LI', null]);
        assert.deepEqual(patcher_calls[11], ['attribute', 'data-bind', 'entry']);
        assert.deepEqual(patcher_calls[12], ['text', 'three']);
        assert.deepEqual(patcher_calls[13], ['exitTag']);
        assert.deepEqual(patcher_calls[14], ['exitTag']);
        assert.equal(patcher_calls.length, 15);
    });
    
    test('data-key on template call', function () {
        var templates = createTemplateNode(
            '<li data-template="entry">{{ name }}</li>' +
            '<ul data-template="foo">' +
                '<entry data-each="item in items" data-key="key{{ item.id }}" name="{{ item.name }}"></entry>' +
            '</ul>'
        );
        var data = {items: [
            {id: 1, name: 'one'},
            {id: 2, name: 'two'},
            {id: 3, name: 'three'}
        ]};
        var patcher_calls = _patch(templates, 'foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'UL', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'LI', 'key1']);
        assert.deepEqual(patcher_calls[3], ['attribute', 'data-bind', 'entry']);
        assert.deepEqual(patcher_calls[4], ['text', 'one']);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.deepEqual(patcher_calls[6], ['enterTag', 'LI', 'key2']);
        assert.deepEqual(patcher_calls[7], ['attribute', 'data-bind', 'entry']);
        assert.deepEqual(patcher_calls[8], ['text', 'two']);
        assert.deepEqual(patcher_calls[9], ['exitTag']);
        assert.deepEqual(patcher_calls[10], ['enterTag', 'LI', 'key3']);
        assert.deepEqual(patcher_calls[11], ['attribute', 'data-bind', 'entry']);
        assert.deepEqual(patcher_calls[12], ['text', 'three']);
        assert.deepEqual(patcher_calls[13], ['exitTag']);
        assert.deepEqual(patcher_calls[14], ['exitTag']);
        assert.equal(patcher_calls.length, 15);
    });

    test('data-if on template call', function () {
        var templates = createTemplateNode(
            '<h1 data-template="greeting">Hello, {{ name }}!</h1>' +
            '<div data-template="foo">' +
                '<greeting data-if="greet" name="{{ name }}"></greeting>' +
            '</div>'
        );
        var data = {greet: true, name: 'world'};
        var patcher_calls = _patch(templates, 'foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[3], ['attribute', 'data-bind', 'greeting']);
        assert.deepEqual(patcher_calls[4], ['text', 'Hello, world!']);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.equal(patcher_calls.length, 7);
        data.greet = false;
        patcher_calls = _patch(templates, 'foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['exitTag']);
        assert.equal(patcher_calls.length, 3);
    });

    test('data-unless on template call', function () {
        var templates = createTemplateNode(
            '<h1 data-template="greeting">Hello, {{ name }}!</h1>' +
            '<div data-template="foo">' +
                '<greeting data-unless="quiet" name="{{ name }}"></greeting>' +
            '</div>'
        );
        var data = {quiet: false, name: 'world'};
        var patcher_calls = _patch(templates, 'foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[3], ['attribute', 'data-bind', 'greeting']);
        assert.deepEqual(patcher_calls[4], ['text', 'Hello, world!']);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.equal(patcher_calls.length, 7);
        data.quiet = true;
        patcher_calls = _patch(templates, 'foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['exitTag']);
        assert.equal(patcher_calls.length, 3);
    });
    
    test('data-each on caller with data-if on callee template', function () {
        var templates = createTemplateNode(
            '<li data-template="entry" data-if="public">{{ name }}</li>' +
            '<ul data-template="foo">' +
                '<entry data-each="item in items" public="{{ item.public }}" name="{{ item.name }}"></entry>' +
            '</ul>'
        );
        var data = {items: [
            {name: 'one', public: true},
            {name: 'two', public: true},
            {name: 'three', public: false}
        ]};
        var patcher_calls = _patch(templates, 'foo', data);
        assert.deepEqual(patcher_calls[0], ['enterTag', 'UL', null]);
        assert.deepEqual(patcher_calls[1], ['attribute', 'data-bind', 'foo']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'LI', null]);
        assert.deepEqual(patcher_calls[3], ['attribute', 'data-bind', 'entry']);
        assert.deepEqual(patcher_calls[4], ['text', 'one']);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.deepEqual(patcher_calls[6], ['enterTag', 'LI', null]);
        assert.deepEqual(patcher_calls[7], ['attribute', 'data-bind', 'entry']);
        assert.deepEqual(patcher_calls[8], ['text', 'two']);
        assert.deepEqual(patcher_calls[9], ['exitTag']);
        assert.deepEqual(patcher_calls[10], ['exitTag']);
        assert.equal(patcher_calls.length, 11);
    });

});
