suite('render', function () {

    var assert = chai.assert;

    var patcher_calls = [];
    var test_patcher = {
        start: function () {
            patcher_calls.push(['start']);
        },
        enterTag: function (tag, key) {
            patcher_calls.push(['enterTag', tag, key]);
        },
        attribute: function (name, value) {
            patcher_calls.push(['attribute', name, value]);
        },
        text: function (text) {
            patcher_calls.push(['text', text]);
        },
        exitTag: function () {
            patcher_calls.push(['exitTag']);
        },
        skip: function (tag, key) {
            patcher_calls.push(['skip', tag, key]);
        },
        end: function () {
            patcher_calls.push(['end']);
        }
    };

    test('flat children', function () {
        var src = '{{#define foo}}' +
                '<i>foo</i>' +
                '<b>bar</b>' +
                '<em>baz</em>' +
                '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var prev_data = {};
        var next_data = {};
        patcher_calls = [];
        var renderer = new render.Renderer(test_patcher, templates);
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'I', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'foo']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[5], ['text', 'bar']);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['enterTag', 'EM', null]);
        assert.deepEqual(patcher_calls[8], ['text', 'baz']);
        assert.deepEqual(patcher_calls[9], ['exitTag']);
        assert.deepEqual(patcher_calls[10], ['end']);
        assert.equal(patcher_calls.length, 11);
    });

    test('nested children', function () {
        var src = '{{#define foo}}\n' +
                '<i>foo</i>\n' +
                '<p>\n' +
                '  <b>bar</b>\n' +
                '  <em>baz</em>\n' +
                '</p>\n' +
                '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var prev_data = {};
        var next_data = {};
        patcher_calls = [];
        var renderer = new render.Renderer(test_patcher, templates);
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
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
        assert.deepEqual(patcher_calls[17], ['end']);
        assert.equal(patcher_calls.length, 18);
    });

    test('variable substitution - text', function () {
        var src = '{{#define foo}}<i>Hello, {{name}}!</i>{{/define}}';
        var templates = Magery.loadTemplates(src);
        var prev_data = {};
        var next_data = {name: 'world'};
        patcher_calls = [];
        var renderer = new render.Renderer(test_patcher, templates);
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'I', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'Hello, world!']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['end']);
        assert.equal(patcher_calls.length, 5);
    });

    test('variable substitution - array', function () {
        var src = '{{#define foo}}{{names}}{{/define}}';
        var templates = Magery.loadTemplates(src);
        var prev_data = {};
        var next_data = {names: ['foo', 'bar', 'baz']};
        patcher_calls = [];
        var renderer = new render.Renderer(test_patcher, templates);
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['text', 'foo,bar,baz']);
        assert.deepEqual(patcher_calls[2], ['end']);
        assert.equal(patcher_calls.length, 3);
    });

    test('variable substitution - undefined', function () {
        var src = '{{#define foo}}Hello, {{name}}{{/define}}';
        var templates = Magery.loadTemplates(src);
        var prev_data = {};
        var next_data = {};
        patcher_calls = [];
        var renderer = new render.Renderer(test_patcher, templates);
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['text', 'Hello, ']);
        assert.deepEqual(patcher_calls[2], ['end']);
        assert.equal(patcher_calls.length, 3);
    });

    test('variable substitution - null', function () {
        var src = '{{#define foo}}Hello, {{name}}{{/define}}';
        var templates = Magery.loadTemplates(src);
        var prev_data = {};
        var next_data = {name: null};
        patcher_calls = [];
        var renderer = new render.Renderer(test_patcher, templates);
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['text', 'Hello, ']);
        assert.deepEqual(patcher_calls[2], ['end']);
        assert.equal(patcher_calls.length, 3);
    });

    test('variable substitution - true', function () {
        var src = '{{#define foo}}Hello, {{name}}{{/define}}';
        var templates = Magery.loadTemplates(src);
        var prev_data = {};
        var next_data = {name: true};
        patcher_calls = [];
        var renderer = new render.Renderer(test_patcher, templates);
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['text', 'Hello, true']);
        assert.deepEqual(patcher_calls[2], ['end']);
        assert.equal(patcher_calls.length, 3);
    });

    test('variable substitution - false', function () {
        var src = '{{#define foo}}Hello, {{name}}{{/define}}';
        var templates = Magery.loadTemplates(src);
        var prev_data = {};
        var next_data = {name: false};
        patcher_calls = [];
        var renderer = new render.Renderer(test_patcher, templates);
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['text', 'Hello, false']);
        assert.deepEqual(patcher_calls[2], ['end']);
        assert.equal(patcher_calls.length, 3);
    });

    test('variable substitution - object', function () {
        var src = '{{#define foo}}Hello, {{name}}{{/define}}';
        var templates = Magery.loadTemplates(src);
        var prev_data = {};
        var next_data = {name: {first: 'a', last: 'b'}};
        patcher_calls = [];
        var renderer = new render.Renderer(test_patcher, templates);
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['text', 'Hello, [object Object]']);
        assert.deepEqual(patcher_calls[2], ['end']);
        assert.equal(patcher_calls.length, 3);
    });

    test('variable substitution - length property', function () {
        var src = '{{#define foo}}Total: {{ items.length }}{{/define}}';
        var templates = Magery.loadTemplates(src);
        var prev_data = {};
        var next_data = {items: ['a', 'b', 'c']};
        patcher_calls = [];
        var renderer = new render.Renderer(test_patcher, templates);
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['text', 'Total: 3']);
        assert.deepEqual(patcher_calls[2], ['end']);
        assert.equal(patcher_calls.length, 3);
    });

    test('with block, variable substitution', function () {
        var src = '' +
                '{{#define foo}}' +
                  '{{#with user}}' +
                    '<i>Hello, {{name}}!</i>' +
                  '{{/with}}' +
                '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var prev_data = {};
        var next_data = {user: {name: 'world'}};
        patcher_calls = [];
        var renderer = new render.Renderer(test_patcher, templates);
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'I', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'Hello, world!']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['end']);
        assert.equal(patcher_calls.length, 5);
    });

    test('nested with blocks, flat output', function () {
        var src = '' +
        '{{#define foo}}' +
            '<i>foo</i>' +
            '{{#with author}}' +
                '<b>bar</b>' +
                '<em>baz</em>' +
                '{{#with profile}}' +
                    '<p>test</p>' +
                '{{/with}}' +
            '{{/with}}' +
            '<strong>other</strong>' +
        '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var prev_data = {author: {profile: {}}};
        var next_data = {author: {profile: {}}};
        patcher_calls = [];
        var renderer = new render.Renderer(test_patcher, templates);
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'I', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'foo']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[5], ['text', 'bar']);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['enterTag', 'EM', null]);
        assert.deepEqual(patcher_calls[8], ['text', 'baz']);
        assert.deepEqual(patcher_calls[9], ['exitTag']);
        assert.deepEqual(patcher_calls[10], ['enterTag', 'P', null]);
        assert.deepEqual(patcher_calls[11], ['text', 'test']);
        assert.deepEqual(patcher_calls[12], ['exitTag']);
        assert.deepEqual(patcher_calls[13], ['enterTag', 'STRONG', null]);
        assert.deepEqual(patcher_calls[14], ['text', 'other']);
        assert.deepEqual(patcher_calls[15], ['exitTag']);
        assert.deepEqual(patcher_calls[16], ['end']);
        assert.equal(patcher_calls.length, 17);
    });

    test('nested with blocks, skip identical contexts', function () {
        var src = '' +
        '{{#define foo}}' +
            '<i>foo</i>' +
            '{{#with author}}' +
                '<b>bar</b>' +
                '<em>baz</em>' +
            '{{/with}}' +
            '{{#with article}}' +
                '<p>test</p>' +
            '{{/with}}' +
        '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var prev_data = {author: 'name', article: 'foo'};
        var next_data = {author: 'name', article: 'bar'};
        patcher_calls = [];
        var renderer = new render.Renderer(test_patcher, templates);
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'I', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'foo']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['skip', 'B', null]);
        assert.deepEqual(patcher_calls[5], ['skip', 'EM', null]);
        assert.deepEqual(patcher_calls[6], ['enterTag', 'P', null]);
        assert.deepEqual(patcher_calls[7], ['text', 'test']);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.deepEqual(patcher_calls[9], ['end']);
        assert.equal(patcher_calls.length, 10);
    });

    test('#each block', function () {
        var src = '' +
                '{{#define foo}}' +
                '<h1>title</h1>' +
                '{{#each items}}' +
                '<section>item</section>' +
                '{{/each}}' +
                '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var next_data = {items: [{name: 'one'}, {name: 'two'}, {name: 'three'}]};
        var prev_data = {items: []};
        patcher_calls = [];
        var renderer = new render.Renderer(test_patcher, templates);
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
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
        assert.deepEqual(patcher_calls[13], ['end']);
        assert.equal(patcher_calls.length, 14);
    });

    test('#each block with multiple child nodes', function () {
        var src = '' +
                '{{#define foo}}' +
                    '<h1>title</h1>' +
                    '{{#each items}}' +
                        '<section>item</section>' +
                        '<div>separator</div>' +
                    '{{/each}}' +
                    '<p>footer</p>' +
                '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var next_data = {items: [{name: 'one'}, {name: 'two'}, {name: 'three'}]};
        var prev_data = {items: []};
        patcher_calls = [];
        var renderer = new render.Renderer(test_patcher, templates);
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'title']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['enterTag', 'SECTION', null]);
        assert.deepEqual(patcher_calls[5], ['text', 'item']);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[8], ['text', 'separator']);
        assert.deepEqual(patcher_calls[9], ['exitTag']);
        assert.deepEqual(patcher_calls[10], ['enterTag', 'SECTION', null]);
        assert.deepEqual(patcher_calls[11], ['text', 'item']);
        assert.deepEqual(patcher_calls[12], ['exitTag']);
        assert.deepEqual(patcher_calls[13], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[14], ['text', 'separator']);
        assert.deepEqual(patcher_calls[15], ['exitTag']);
        assert.deepEqual(patcher_calls[16], ['enterTag', 'SECTION', null]);
        assert.deepEqual(patcher_calls[17], ['text', 'item']);
        assert.deepEqual(patcher_calls[18], ['exitTag']);
        assert.deepEqual(patcher_calls[19], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[20], ['text', 'separator']);
        assert.deepEqual(patcher_calls[21], ['exitTag']);
        assert.deepEqual(patcher_calls[22], ['enterTag', 'P', null]);
        assert.deepEqual(patcher_calls[23], ['text', 'footer']);
        assert.deepEqual(patcher_calls[24], ['exitTag']);
        assert.deepEqual(patcher_calls[25], ['end']);
        assert.equal(patcher_calls.length, 26);
    });

    test('#each block with keys', function () {
        var src = '' +
                '{{#define foo}}' +
                    '<h1>title</h1>' +
                    '{{#each items key=name}}' +
                        '<section>item</section>' +
                        '<div>separator</div>' +
                    '{{/each}}' +
                    '<p>footer</p>' +
                '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var next_data = {items: [{name: 'one'}, {name: 'two'}, {name: 'three'}]};
        var prev_data = {items: []};
        patcher_calls = [];
        var renderer = new render.Renderer(test_patcher, templates);
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'title']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['enterTag', 'SECTION', '2/one/0']);
        assert.deepEqual(patcher_calls[5], ['text', 'item']);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['enterTag', 'DIV', '2/one/1']);
        assert.deepEqual(patcher_calls[8], ['text', 'separator']);
        assert.deepEqual(patcher_calls[9], ['exitTag']);
        assert.deepEqual(patcher_calls[10], ['enterTag', 'SECTION', '2/two/0']);
        assert.deepEqual(patcher_calls[11], ['text', 'item']);
        assert.deepEqual(patcher_calls[12], ['exitTag']);
        assert.deepEqual(patcher_calls[13], ['enterTag', 'DIV', '2/two/1']);
        assert.deepEqual(patcher_calls[14], ['text', 'separator']);
        assert.deepEqual(patcher_calls[15], ['exitTag']);
        assert.deepEqual(patcher_calls[16], ['enterTag', 'SECTION', '2/three/0']);
        assert.deepEqual(patcher_calls[17], ['text', 'item']);
        assert.deepEqual(patcher_calls[18], ['exitTag']);
        assert.deepEqual(patcher_calls[19], ['enterTag', 'DIV', '2/three/1']);
        assert.deepEqual(patcher_calls[20], ['text', 'separator']);
        assert.deepEqual(patcher_calls[21], ['exitTag']);
        assert.deepEqual(patcher_calls[22], ['enterTag', 'P', null]);
        assert.deepEqual(patcher_calls[23], ['text', 'footer']);
        assert.deepEqual(patcher_calls[24], ['exitTag']);
        assert.deepEqual(patcher_calls[25], ['end']);
        assert.equal(patcher_calls.length, 26);
    });

    test('#each block skip keys with identical context', function () {
        var src = '' +
                '{{#define foo}}' +
                  '<h1>title</h1>' +
                  '<ul>' +
                    '{{#each items key=name}}' +
                      '<li>{{name}}</li>' +
                    '{{/each}}' +
                  '</ul>' +
                '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var next_data = {items: [{name: 'one'}, {name: 'two'}, {name: 'three'}]};
        var prev_data = {items: []};

        patcher_calls = [];
        var renderer = new render.Renderer(test_patcher, templates);
        renderer.render('foo', next_data, prev_data);

        prev_data = next_data;
        next_data = {items: [
            prev_data.items[2],
            prev_data.items[0],
            prev_data.items[1]
        ]};
        patcher_calls = [];
        renderer.render('foo', next_data, prev_data);

        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'title']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['enterTag', 'UL', null]);
        assert.deepEqual(patcher_calls[5], ['skip', 'LI', '3/three/0']);
        assert.deepEqual(patcher_calls[6], ['skip', 'LI', '3/one/0']);
        assert.deepEqual(patcher_calls[7], ['skip', 'LI', '3/two/0']);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.deepEqual(patcher_calls[9], ['end']);
        assert.equal(patcher_calls.length, 10);
    });

    test('#each block siblings should avoid conflicting keys', function () {
        var src = '' +
                '{{#define foo}}' +
                  '{{#each items key=id}}' +
                    '<li>{{name}}</li>' +
                  '{{/each}}' +
                  '{{#each items2 key=id}}' +
                    '<li>{{name}}</li>' +
                  '{{/each}}' +
                '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var prev_data = {};
        var next_data = {
            items: [
                {id: 'one', name: '1.1'},
                {id: 'two', name: '1.2'}
            ],
            items2: [
                {id: 'one', name: '2.1'},
                {id: 'two', name: '2.2'}
            ]
        };

        patcher_calls = [];
        var renderer = new render.Renderer(test_patcher, templates);
        renderer.render('foo', next_data, prev_data);

        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'LI', '4/one/0']);
        assert.deepEqual(patcher_calls[2], ['text', '1.1']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['enterTag', 'LI', '4/two/0']);
        assert.deepEqual(patcher_calls[5], ['text', '1.2']);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['enterTag', 'LI', '5/one/0']);
        assert.deepEqual(patcher_calls[8], ['text', '2.1']);
        assert.deepEqual(patcher_calls[9], ['exitTag']);
        assert.deepEqual(patcher_calls[10], ['enterTag', 'LI', '5/two/0']);
        assert.deepEqual(patcher_calls[11], ['text', '2.2']);
        assert.deepEqual(patcher_calls[12], ['exitTag']);
        assert.deepEqual(patcher_calls[13], ['end']);
        assert.equal(patcher_calls.length, 14);
    });

    test('#if block', function () {
        var src = '' +
            '{{#define foo}}' +
                '<h1>title</h1>' +
                '{{#if published}}' +
                    '<b>published</b>' +
                '{{/if}}' +
            '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var next_data = {published: true};
        var prev_data = {};
        patcher_calls = [];
        var renderer = new render.Renderer(test_patcher, templates);
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'title']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[5], ['text', 'published']);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['end']);
        assert.equal(patcher_calls.length, 8);
        prev_data = next_data;
        next_data = {published: false};
        patcher_calls = [];
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'title']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['end']);
        assert.equal(patcher_calls.length, 5);
        // empty array is falsy
        next_data = {published: []};
        patcher_calls = [];
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'title']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['end']);
        assert.equal(patcher_calls.length, 5);
        // empty string is falsy
        next_data = {published: ''};
        patcher_calls = [];
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'title']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['end']);
        assert.equal(patcher_calls.length, 5);
        // zero is falsy
        next_data = {published: 0};
        patcher_calls = [];
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'title']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['end']);
        assert.equal(patcher_calls.length, 5);
        // undefined is falsy
        next_data = {};
        patcher_calls = [];
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'title']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['end']);
        assert.equal(patcher_calls.length, 5);
    });

    test('#unless block', function () {
        var src = '' +
            '{{#define foo}}' +
                '<h1>title</h1>' +
                '{{#unless published}}' +
                    '<b>published</b>' +
                '{{/unless}}' +
            '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var next_data = {published: true};
        var prev_data = {};
        patcher_calls = [];
        var renderer = new render.Renderer(test_patcher, templates);
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'title']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['end']);
        assert.equal(patcher_calls.length, 5);
        prev_data = next_data;
        next_data = {published: false};
        patcher_calls = [];
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'title']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[5], ['text', 'published']);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['end']);
        assert.equal(patcher_calls.length, 8);
        // empty array is falsy
        prev_data = next_data;
        next_data = {published: []};
        patcher_calls = [];
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'title']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[5], ['text', 'published']);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['end']);
        assert.equal(patcher_calls.length, 8);
        // empty string is falsy
        prev_data = next_data;
        next_data = {published: ''};
        patcher_calls = [];
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'title']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[5], ['text', 'published']);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['end']);
        assert.equal(patcher_calls.length, 8);
        // zero is falsy
        prev_data = next_data;
        next_data = {published: 0};
        patcher_calls = [];
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'title']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[5], ['text', 'published']);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['end']);
        assert.equal(patcher_calls.length, 8);
        // undefined is falsy
        prev_data = next_data;
        next_data = {};
        patcher_calls = [];
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'title']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[5], ['text', 'published']);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['end']);
        assert.equal(patcher_calls.length, 8);
    });

    test('call another template block directly', function () {
        var src = '' +
                '{{#define foo}}' +
                  '<h1>title</h1>' +
                  '{{#with article}}' +
                    '{{#bar meta/}}' +
                  '{{/with}}' +
                '{{/define}}' +
                '{{#define bar}}' +
                  '<b>{{year}}</b>' +
                '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var tmpl = templates['foo'];
        var prev_data = {};
        var next_data = {
            article: {
                meta: {
                    year: 2015
                }
            }
        };
        patcher_calls = [];
        var renderer = new render.Renderer(test_patcher, templates);
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'title']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[5], ['text', '2015']);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['end']);
        assert.equal(patcher_calls.length, 8);
    });

    test('call another template block dynamically via #call', function () {
        var src = '' +
            '{{#define foo}}' +
                '<h1>title</h1>' +
                '{{#with article}}' +
                    '{{#call mytemplate meta/}}' +
                '{{/with}}' +
            '{{/define}}' +
            '{{#define bar}}' +
                '<b>{{year}}</b>' +
            '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var prev_data = {};
        var next_data = {
            article: {
                mytemplate: 'bar',
                meta: {
                    year: 2015
                }
            }
        };
        patcher_calls = [];
        var renderer = new render.Renderer(test_patcher, templates);
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'title']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[5], ['text', '2015']);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['end']);
        assert.equal(patcher_calls.length, 8);
    });

    test('call another template block with child expansion', function () {
        var src = '' +
            '{{#define foo}}' +
                '<h1>title</h1>' +
                '{{#bar article}}' +
                    '<i>inner</i>' +
                '{{/bar}}' +
            '{{/define}}' +
            '{{#define bar}}' +
                '<div>' +
                    '<b>{{title}}</b>' +
                    '{{#with meta}}' +
                        '{{...}}' +
                    '{{/with}}' +
                '</div>' +
            '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var prev_data = {};
        var next_data = {
            article: {
                title: 'test',
                meta: {
                    year: 2015
                }
            }
        };
        patcher_calls = [];
        var renderer = new render.Renderer(test_patcher, templates);
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'title']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[6], ['text', 'test']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.deepEqual(patcher_calls[8], ['enterTag', 'I', null]);
        assert.deepEqual(patcher_calls[9], ['text', 'inner']);
        assert.deepEqual(patcher_calls[10], ['exitTag']);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.deepEqual(patcher_calls[12], ['end']);
        assert.equal(patcher_calls.length, 13);
    });

    test('call another template block dynamically with child expansion', function () {
        var src = '' +
            '{{#define foo}}' +
                '<h1>title</h1>' +
                '{{#call mytemplate article}}' +
                    '<i>inner</i>' +
                '{{/call}}' +
            '{{/define}}' +
            '{{#define bar}}' +
                '<div>' +
                    '<b>{{title}}</b>' +
                    '{{#with meta}}' +
                        '{{...}}' +
                    '{{/with}}' +
                '</div>' +
            '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var prev_data = {};
        var next_data = {
            mytemplate: 'bar',
            article: {
                title: 'test',
                meta: {
                    year: 2015
                }
            }
        };
        patcher_calls = [];
        var renderer = new render.Renderer(test_patcher, templates);
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'title']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[6], ['text', 'test']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.deepEqual(patcher_calls[8], ['enterTag', 'I', null]);
        assert.deepEqual(patcher_calls[9], ['text', 'inner']);
        assert.deepEqual(patcher_calls[10], ['exitTag']);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.deepEqual(patcher_calls[12], ['end']);
        assert.equal(patcher_calls.length, 13);
    });

    test('nested expansions', function () {
        var src = '' +
                '{{#define root}}' +
                  '{{#one}}' +
                    '<i>root</i>' +
                  '{{/one}}' +
                '{{/define}}' +
                '' +
                '{{#define one}}' +
                  '<h1>title</h1>' +
                  '{{#two article}}' +
                    '<i>one.1</i>' +
                    '{{#call tmpl}}' +
                      '<i>one.2</i>' +
                      '{{...}}' +
                    '{{/call}}' +
                  '{{/two}}' +
                '{{/define}}' +
                '' +
                '{{#define two}}' +
                  '<b>{{meta.year}}</b>' +
                  '{{#with meta}}' +
                    '{{...}}' +
                  '{{/with}}' +
                '{{/define}}' +
                '' +
                '{{#define three}}' +
                  '<b>three</b>' +
                  '{{...}}' +
                '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var prev_data = {};
        var next_data = {
            article: {
                meta: {
                    year: 2015,
                    tmpl: 'three'
                }
            }
        };
        patcher_calls = [];
        var renderer = new render.Renderer(test_patcher, templates);
        renderer.render('root', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'title']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[5], ['text', '2015']);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['enterTag', 'I', null]);
        assert.deepEqual(patcher_calls[8], ['text', 'one.1']);
        assert.deepEqual(patcher_calls[9], ['exitTag']);
        assert.deepEqual(patcher_calls[10], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[11], ['text', 'three']);
        assert.deepEqual(patcher_calls[12], ['exitTag']);
        assert.deepEqual(patcher_calls[13], ['enterTag', 'I', null]);
        assert.deepEqual(patcher_calls[14], ['text', 'one.2']);
        assert.deepEqual(patcher_calls[15], ['exitTag']);
        assert.deepEqual(patcher_calls[16], ['enterTag', 'I', null]);
        assert.deepEqual(patcher_calls[17], ['text', 'root']);
        assert.deepEqual(patcher_calls[18], ['exitTag']);
        assert.deepEqual(patcher_calls[19], ['end']);
        assert.equal(patcher_calls.length, 20);
    });

    test('skip comment nodes in template', function () {
        var src = '' +
                '{{#define foo}}' +
                    '<i>foo</i>' +
                    '<!-- this is a comment -->' +
                    '<b>bar</b>' +
                    '<em>baz</em>' +
                '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var prev_data = {};
        var next_data = {};
        patcher_calls = [];
        var renderer = new render.Renderer(test_patcher, templates);
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'I', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'foo']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[5], ['text', 'bar']);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['enterTag', 'EM', null]);
        assert.deepEqual(patcher_calls[8], ['text', 'baz']);
        assert.deepEqual(patcher_calls[9], ['exitTag']);
        assert.deepEqual(patcher_calls[10], ['end']);
        assert.equal(patcher_calls.length, 11);
    });

    test('node attributes', function () {
        var src = '' +
                '{{#define foo}}' +
                    '<a href="#" class="btn">foo</a>' +
                '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var prev_data = {};
        var next_data = {};
        patcher_calls = [];
        var renderer = new render.Renderer(test_patcher, templates);
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'A', null]);
        // order of these events is browser dependant
        assert.deepEqual(patcher_calls.slice(2, 4).sort(), [
            ['attribute', 'class', 'btn'],
            ['attribute', 'href', '#']
        ]);
        assert.deepEqual(patcher_calls[4], ['text', 'foo']);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.deepEqual(patcher_calls[6], ['end']);
        assert.equal(patcher_calls.length, 7);
    });

    test('expand variables in node attributes', function () {
        var src = '' +
                '{{#define foo}}' +
                    '<a href="{{url}}" class="btn">foo</a>' +
                '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var prev_data = {};
        var next_data = {url: 'http://example.com'};
        patcher_calls = [];
        var renderer = new render.Renderer(test_patcher, templates);
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'A', null]);
        // order of these events is browser dependant
        assert.deepEqual(patcher_calls.slice(2, 4).sort(), [
            ['attribute', 'class', 'btn'],
            ['attribute', 'href', 'http://example.com']
        ]);
        assert.deepEqual(patcher_calls[4], ['text', 'foo']);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.deepEqual(patcher_calls[6], ['end']);
        assert.equal(patcher_calls.length, 7);
    });

    test('collapse adjacent text nodes', function () {
        var src = '' +
                '{{#define foo}}' +
                'MESSAGE ' +
                '{{#if greeting}}Hello, <b>world</b>!{{/if}}\n' +
                'END' +
                '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var prev_data = {};
        var next_data = {greeting: true};
        patcher_calls = [];
        var renderer = new render.Renderer(test_patcher, templates);
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['text', 'MESSAGE Hello, ']);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[3], ['text', 'world']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['text', '!\nEND']);
        assert.deepEqual(patcher_calls[6], ['end']);
        assert.equal(patcher_calls.length, 7);
    });

    test('if block with {{else}}', function () {
        var src = '' +
                '{{#define foo}}' +
                  '{{#if published}}' +
                    '<b>published</b>' +
                  '{{else}}' +
                    '<em>not published</em>' +
                  '{{/if}}' +
                '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var prev_data = {};
        var next_data = {published: true};
        patcher_calls = [];
        var renderer = new render.Renderer(test_patcher, templates);
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'published']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['end']);
        assert.equal(patcher_calls.length, 5);
        prev_data = next_data;
        next_data = {published: false};
        patcher_calls = [];
        renderer = new render.Renderer(test_patcher, templates);
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'EM', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'not published']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['end']);
        assert.equal(patcher_calls.length, 5);
        // else blocks of nested tags should not interfere
        src = '' +
                '{{#define foo}}' +
                  '{{#if published}}' +
                    '<b>published</b>' +
                    '{{#if x}}' +
                      '<b>x</b>' +
                    '{{else}}' +
                      '<b>y</b>' +
                    '{{/if}}' +
                  '{{else}}' +
                    '<em>not published</em>' +
                  '{{/if}}' +
                '{{/define}}';
        templates = Magery.loadTemplates(src);
        prev_data = {};
        next_data = {published: false};
        patcher_calls = [];
        renderer = new render.Renderer(test_patcher, templates);
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'EM', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'not published']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['end']);
        assert.equal(patcher_calls.length, 5);
    });

    test('unless block with {{else}}', function () {
        var src = '' +
                '{{#define foo}}' +
                  '{{#unless published}}' +
                    '<b>not published</b>' +
                  '{{else}}' +
                    '<em>published</em>' +
                  '{{/unless}}' +
                '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var prev_data = {};
        var next_data = {published: true};
        patcher_calls = [];
        var renderer = new render.Renderer(test_patcher, templates);
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'EM', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'published']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['end']);
        assert.equal(patcher_calls.length, 5);
        prev_data = next_data;
        next_data = {published: false};
        patcher_calls = [];
        renderer = new render.Renderer(test_patcher, templates);
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'not published']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['end']);
        assert.equal(patcher_calls.length, 5);
        // else blocks of nested tags should not interfere
        src = '' +
                '{{#define foo}}' +
                  '{{#unless published}}' +
                    '<b>not published</b>' +
                    '{{#if x}}' +
                      '<b>x</b>' +
                    '{{else}}' +
                      '<b>y</b>' +
                    '{{/if}}' +
                  '{{else}}' +
                    '<em>published</em>' +
                  '{{/unless}}' +
                '{{/define}}';
        templates = Magery.loadTemplates(src);
        prev_data = {};
        next_data = {published: true};
        patcher_calls = [];
        renderer = new render.Renderer(test_patcher, templates);
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'EM', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'published']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['end']);
        assert.equal(patcher_calls.length, 5);
    });

    test('each block with {{else}}', function () {
        var src = '' +
                '{{#define foo}}' +
                  '{{#each items}}' +
                    '<div>{{name}}</div>' +
                  '{{else}}' +
                    '<div>empty</div>' +
                  '{{/each}}' +
                '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var prev_data = {};
        var next_data = {items: [{name: 'a'}, {name: 'b'}]};
        patcher_calls = [];
        var renderer = new render.Renderer(test_patcher, templates);
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'a']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[5], ['text', 'b']);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['end']);
        assert.equal(patcher_calls.length, 8);
        // empty array executes else block
        prev_data = next_data;
        next_data = {items: []};
        patcher_calls = [];
        renderer = new render.Renderer(test_patcher, templates);
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'empty']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['end']);
        assert.equal(patcher_calls.length, 5);
        // undefined is same as empty array, executes else block
        prev_data = next_data;
        next_data = {};
        patcher_calls = [];
        renderer = new render.Renderer(test_patcher, templates);
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'empty']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['end']);
        assert.equal(patcher_calls.length, 5);
        // nested else tags should not interfere
        src = '' +
                '{{#define foo}}' +
                  '{{#each items}}' +
                    '{{#each props}}' +
                      '<b>prop</b>' +
                    '{{else}}' +
                      '<b>no props</b>' +
                    '{{/each}}' +
                  '{{else}}' +
                    '<div>empty</div>' +
                  '{{/each}}' +
                '{{/define}}';
        templates = Magery.loadTemplates(src);
        prev_data = {};
        next_data = {items: []};
        patcher_calls = [];
        renderer = new render.Renderer(test_patcher, templates);
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'empty']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['end']);
        assert.equal(patcher_calls.length, 5);
    });

    test('{{else}} tag at unexpected point in tree', function () {
        // no associated #if or #each block
        var src = '' +
                '{{#define foo}}' +
                '<p>{{else}}</p>' +
                '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var prev_data = {};
        var next_data = {};
        patcher_calls = [];
        var renderer = new render.Renderer(test_patcher, templates);
        assert.throws(function () {
            renderer.render('foo', next_data, prev_data);
        });
        // nested, not at the same level as #if block
        src = '' +
            '{{#define foo}}' +
              '{{#if test}}' +
                '<p>foo {{else}} bar</p>' +
              '{{/if}}' +
            '{{/define}}';
        templates = Magery.loadTemplates(src);
        prev_data = {};
        next_data = {test: true};
        patcher_calls = [];
        renderer = new render.Renderer(test_patcher, templates);
        assert.throws(function () {
            renderer.render('foo', next_data, prev_data);
        });
    });

    test('reference current context using {{.}}', function () {
        // as text node
        var src = '{{#define foo}}' +
                  '{{#with name}}' +
                    '<div>{{.}}</div>' +
                  '{{/with}}' +
                '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var renderer = new render.Renderer(test_patcher, templates);
        var prev_data = {};
        var next_data = {name: 'test'};
        patcher_calls = [];
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'test']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['end']);
        assert.equal(patcher_calls.length, 5);
        // as attribute
        src = '{{#define foo}}' +
                '<div id="{{.}}"></div>' +
              '{{/define}}';
        templates = Magery.loadTemplates(src);
        renderer = new render.Renderer(test_patcher, templates);
        prev_data = {};
        next_data = 'test';
        patcher_calls = [];
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[2], ['attribute', 'id', 'test']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['end']);
        assert.equal(patcher_calls.length, 5);
        // as positional argument to builtin
        src = '{{#define foo}}' +
                '{{#each .}}' +
                  '<div>item</div>' +
                '{{/each}}' +
              '{{/define}}';
        templates = Magery.loadTemplates(src);
        renderer = new render.Renderer(test_patcher, templates);
        prev_data = [];
        next_data = ['one', 'two'];
        patcher_calls = [];
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'item']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[5], ['text', 'item']);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['end']);
        assert.equal(patcher_calls.length, 8);
        // as keyword argument to builtin
        src = '{{#define foo}}' +
                '{{#each . key=.}}' +
                  '<div>item</div>' +
                '{{/each}}' +
              '{{/define}}';
        templates = Magery.loadTemplates(src);
        renderer = new render.Renderer(test_patcher, templates);
        prev_data = [];
        next_data = ['one', 'two'];
        patcher_calls = [];
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'DIV', '9/one/0']);
        assert.deepEqual(patcher_calls[2], ['text', 'item']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['enterTag', 'DIV', '9/two/0']);
        assert.deepEqual(patcher_calls[5], ['text', 'item']);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['end']);
        assert.equal(patcher_calls.length, 8);
    });

    test('expand unescaped blocks {{{html}}}', function () {
        var src = '' +
                '{{#define foo}}' +
                  '<div>' +
                    '<h1>title</h1>' +
                    '{{{body}}}' +
                    '<div id="footer"></div>' +
                  '</div>' +
                '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var renderer = new render.Renderer(test_patcher, templates);
        var prev_data = {};
        var next_data = {body: '<span>Hello, <b>world</b></span>'};
        patcher_calls = [];
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[3], ['text', 'title']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'SPAN', null]);
        assert.deepEqual(patcher_calls[6], ['text', 'Hello, ']);
        assert.deepEqual(patcher_calls[7], ['enterTag', 'B', null]);
        assert.deepEqual(patcher_calls[8], ['text', 'world']);
        assert.deepEqual(patcher_calls[9], ['exitTag']);
        assert.deepEqual(patcher_calls[10], ['exitTag']);
        assert.deepEqual(patcher_calls[11], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[12], ['attribute', 'id', 'footer']);
        assert.deepEqual(patcher_calls[13], ['exitTag']);
        assert.deepEqual(patcher_calls[14], ['exitTag']);
        assert.deepEqual(patcher_calls[15], ['end']);
        assert.equal(patcher_calls.length, 16);
        prev_data = next_data;
        next_data = {body: '<em>change</em>'};
        patcher_calls = [];
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[3], ['text', 'title']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'EM', null]);
        assert.deepEqual(patcher_calls[6], ['text', 'change']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.deepEqual(patcher_calls[8], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[9], ['attribute', 'id', 'footer']);
        assert.deepEqual(patcher_calls[10], ['exitTag']);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.deepEqual(patcher_calls[12], ['end']);
        assert.equal(patcher_calls.length, 13);
    });

    test('expand unescaped blocks {{{html}}} - coerce to string first', function () {
        var src = '' +
                '{{#define foo}}' +
                  '<div>' +
                    '<h1>title</h1>' +
                    '{{{body}}}' +
                    '<div id="footer"></div>' +
                  '</div>' +
                '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var renderer = new render.Renderer(test_patcher, templates);
        var prev_data = {};
        var next_data = {};
        patcher_calls = [];
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[3], ['text', 'title']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[6], ['attribute', 'id', 'footer']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.deepEqual(patcher_calls[9], ['end']);
        assert.equal(patcher_calls.length, 10);
    });

    test('expand unescaped blocks with whitespace {{{ html }}}', function () {
        var src = '' +
                '{{#define foo}}' +
                  '{{{ body }}}' +
                '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var renderer = new render.Renderer(test_patcher, templates);
        var prev_data = {};
        var next_data = {body: '<span>test</span>'};
        patcher_calls = [];
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'SPAN', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'test']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['end']);
        assert.equal(patcher_calls.length, 5);
    });

    test("don't expand template tags in {{{html}}} vars", function () {
        var src = '' +
                '{{#define foo}}' +
                  '<div>{{{html}}} - {{html}} {{name}}</div>' +
                '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var prev_data = {};
        var next_data = {html: '<h1 rel="{{name}}">Hello, {{name}}!</h1>', name: 'NAME'};
        var renderer = new render.Renderer(test_patcher, templates);
        patcher_calls = [];
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[3], ['attribute', 'rel', '{{name}}']);
        assert.deepEqual(patcher_calls[4], ['text', 'Hello, {{name}}!']);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.deepEqual(patcher_calls[6], [
            'text', ' - <h1 rel="{{name}}">Hello, {{name}}!</h1> NAME'
        ]);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.deepEqual(patcher_calls[8], ['end']);
        assert.equal(patcher_calls.length, 9);
    });

    test("skip nodes when {{{html}}} unchanged", function () {
        var src = '' +
                '{{#define foo}}' +
                  '{{{html}}}' +
                '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var prev_data = {};
        var next_data = {
            html: '<ul><li>one</li><li>two</li></ul><p>footer</p>'
        };
        var renderer = new render.Renderer(test_patcher, templates);
        patcher_calls = [];
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'UL', null]);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'LI', null]);
        assert.deepEqual(patcher_calls[3], ['text', 'one']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'LI', null]);
        assert.deepEqual(patcher_calls[6], ['text', 'two']);
        assert.deepEqual(patcher_calls[7], ['exitTag']);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.deepEqual(patcher_calls[9], ['enterTag', 'P', null]);
        assert.deepEqual(patcher_calls[10], ['text', 'footer']);
        assert.deepEqual(patcher_calls[11], ['exitTag']);
        assert.deepEqual(patcher_calls[12], ['end']);
        assert.equal(patcher_calls.length, 13);
        // next render should skip unchanged nodes
        prev_data = next_data;
        next_data = {
            html: prev_data.html,
            foo: 'bar'
        };
        patcher_calls = [];
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['skip', 'UL', null]);
        assert.deepEqual(patcher_calls[2], ['skip', 'P', null]);
        assert.deepEqual(patcher_calls[3], ['end']);
        assert.equal(patcher_calls.length, 4);
    });

    test('foo="{{{bar}}}" expands but does not escape from attribute', function () {
        var src = '' +
                '{{#define foo}}' +
                  '<div data-test="{{{data}}}" />' +
                '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var renderer = new render.Renderer(test_patcher, templates);
        var prev_data = {};
        var next_data = {
            data: '" onclick="badstuff"'
        };
        patcher_calls = [];
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'DIV', null]);
        assert.deepEqual(
            patcher_calls[2],
            ['attribute', 'data-test', '" onclick="badstuff"']
        );
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['end']);
        assert.equal(patcher_calls.length, 5);
    });

    test('foo="{{{ bar }}}" with whitespace', function () {
        var src = '' +
                '{{#define foo}}' +
                  '<div data-test="{{{ data }}}" />' +
                '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var renderer = new render.Renderer(test_patcher, templates);
        var prev_data = {};
        var next_data = {data: 'test'};
        patcher_calls = [];
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[2], ['attribute', 'data-test', 'test']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['end']);
        assert.equal(patcher_calls.length, 5);
    });

    test('externally managed blocks via {{#skip}}', function () {
        // for libraries that don't play nicely, e.g. maps / charts / ace editor
        // content is always skipped over by patcher after first render
        var src = '' +
                '{{#define foo}}' +
                  '<div id="container">' +
                    '{{#skip}}' +
                      '<div id="unmanaged">{{name}}</div>' +
                      '<span>test</span>' +
                    '{{/skip}}' +
                    '<div id="managed">{{name}}</div>' +
                  '</div>' +
                '{{/define}}';
        var templates = Magery.loadTemplates(src);
        // first render recurses into children
        var prev_data = {};
        var next_data = {name: 'asdf'};
        patcher_calls = [];
        var renderer = new render.Renderer(test_patcher, templates, true);
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[2], ['attribute', 'id', 'container']);
        assert.deepEqual(patcher_calls[3], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[4], ['attribute', 'id', 'unmanaged']);
        assert.deepEqual(patcher_calls[5], ['text', 'asdf']);
        assert.deepEqual(patcher_calls[6], ['exitTag']);
        assert.deepEqual(patcher_calls[7], ['enterTag', 'SPAN', null]);
        assert.deepEqual(patcher_calls[8], ['text', 'test']);
        assert.deepEqual(patcher_calls[9], ['exitTag']);
        assert.deepEqual(patcher_calls[10], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[11], ['attribute', 'id', 'managed']);
        assert.deepEqual(patcher_calls[12], ['text', 'asdf']);
        assert.deepEqual(patcher_calls[13], ['exitTag']);
        assert.deepEqual(patcher_calls[14], ['exitTag']);
        assert.deepEqual(patcher_calls[15], ['end']);
        assert.equal(patcher_calls.length, 16);
        // subsequent renders skip over elements
        prev_data = next_data;
        next_data = {name: 'wibble'};
        patcher_calls = [];
        var renderer = new render.Renderer(test_patcher, templates, false);
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[2], ['attribute', 'id', 'container']);
        assert.deepEqual(patcher_calls[3], ['skip', 'DIV', null]);
        assert.deepEqual(patcher_calls[4], ['skip', 'SPAN', null]);
        assert.deepEqual(patcher_calls[5], ['enterTag', 'DIV', null]);
        assert.deepEqual(patcher_calls[6], ['attribute', 'id', 'managed']);
        assert.deepEqual(patcher_calls[7], ['text', 'wibble']);
        assert.deepEqual(patcher_calls[8], ['exitTag']);
        assert.deepEqual(patcher_calls[9], ['exitTag']);
        assert.deepEqual(patcher_calls[10], ['end']);
        assert.equal(patcher_calls.length, 11);
    });

    test('render missing variables in text block', function () {
        var src = '' +
                '{{#define foo}}' +
                  '<h1>Hello, {{user.name}}!</h1>' +
                '{{/define}}';
        var templates = Magery.loadTemplates(src);
        // first render recurses into children
        var prev_data = {};
        var next_data = {};
        patcher_calls = [];
        var renderer = new render.Renderer(test_patcher, templates, true);
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'H1', null]);
        assert.deepEqual(patcher_calls[2], ['text', 'Hello, !']);
        assert.deepEqual(patcher_calls[3], ['exitTag']);
        assert.deepEqual(patcher_calls[4], ['end']);
        assert.equal(patcher_calls.length, 5);
    });

    test('render missing variables in text attributes', function () {
        var src = '' +
                '{{#define foo}}' +
                  '<a href="{{url}}">link</a>' +
                '{{/define}}';
        var templates = Magery.loadTemplates(src);
        // first render recurses into children
        var prev_data = {};
        var next_data = {};
        patcher_calls = [];
        var renderer = new render.Renderer(test_patcher, templates, true);
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'A', null]);
        assert.deepEqual(patcher_calls[2], ['attribute', 'href', '']);
        assert.deepEqual(patcher_calls[3], ['text', 'link']);
        assert.deepEqual(patcher_calls[4], ['exitTag']);
        assert.deepEqual(patcher_calls[5], ['end']);
        assert.equal(patcher_calls.length, 6);
    });

    test('template tags inside select element', function () {
        var src = '' +
                '{{#define foo}}' +
                  '<select>' +
                    '{{#each options}}' +
                      '<option value="{{value}}">{{label}}</option>' +
                    '{{/each}}' +
                  '</select>' +
                '{{/define}}';
        var templates = Magery.loadTemplates(src);
        // first render recurses into children
        var prev_data = {};
        var next_data = {
            options: [
                {value: 1, label: 'one'},
                {value: 2, label: 'two'},
                {value: 3, label: 'three'},
            ]
        };
        patcher_calls = [];
        var renderer = new render.Renderer(test_patcher, templates, true);
        renderer.render('foo', next_data, prev_data);
        assert.deepEqual(patcher_calls[0], ['start']);
        assert.deepEqual(patcher_calls[1], ['enterTag', 'SELECT', null]);
        assert.deepEqual(patcher_calls[2], ['enterTag', 'OPTION', null]);
        assert.deepEqual(patcher_calls[3], ['attribute', 'value', '1']);
        assert.deepEqual(patcher_calls[4], ['text', 'one']);
        assert.deepEqual(patcher_calls[5], ['exitTag']);
        assert.deepEqual(patcher_calls[6], ['enterTag', 'OPTION', null]);
        assert.deepEqual(patcher_calls[7], ['attribute', 'value', '2']);
        assert.deepEqual(patcher_calls[8], ['text', 'two']);
        assert.deepEqual(patcher_calls[9], ['exitTag']);
        assert.deepEqual(patcher_calls[10], ['enterTag', 'OPTION', null]);
        assert.deepEqual(patcher_calls[11], ['attribute', 'value', '3']);
        assert.deepEqual(patcher_calls[12], ['text', 'three']);
        assert.deepEqual(patcher_calls[13], ['exitTag']);
        assert.deepEqual(patcher_calls[14], ['exitTag']);
        assert.deepEqual(patcher_calls[15], ['end']);
        assert.equal(patcher_calls.length, 16);
    });

});
