function child(node /*...*/) {
    for (var i = 1; i < arguments.length; i++) {
        node = node.childNodes[arguments[i]];
    }
    return node;
}

suite('patch', function () {

    var transform_log = [];
    var test_transforms = {};
    Object.keys(transforms).forEach(function (k) {
        var f = transforms[k];
        test_transforms[k] = function () {
            transform_log.push(k);
            return f.apply(this, arguments);
        };
    });

    var patcher = new patch.Patcher(test_transforms);

    function makeElement(str) {
        var el = document.createElement('div');
        el.innerHTML = str;
        return el;
    };

    test('flat children', function () {
        var div = makeElement(
            '<i>asdf</i>' +
            '<em>baz</em>'
        );
        var src = '{{#define foo}}' +
                '<i>foo</i>' +
                '<b>bar</b>' +
                '<em>baz</em>' +
                '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var prev_data = {};
        var next_data = {};
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        var renderer = new render.Renderer(patcher, templates, true);
        renderer.render('foo', next_data, prev_data);
        assert.equal(div.innerHTML, '<i>foo</i><b>bar</b><em>baz</em>');
        assert.deepEqual(transform_log, [
            'replaceText',
            'insertElement',
            'insertTextNode'
        ]);
    });

    test('nested children', function () {
        var div = makeElement(
            '<i>foo</i>' +
            '<p>' +
              '<em>qux</em>' +
            '</p>'
        );
        var src = '{{#define foo}}\n' +
                '<i>foo</i>' +
                '<p>' +
                  '<b>bar</b>' +
                  '<em>baz</em>' +
                '</p>' +
                '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var prev_data = {};
        var next_data = {};
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        var renderer = new render.Renderer(patcher, templates, true);
        renderer.render('foo', next_data, prev_data);
        assert.equal(div.innerHTML, '<i>foo</i><p><b>bar</b><em>baz</em></p>');
        assert.deepEqual(transform_log, [
            'insertElement',
            'insertTextNode',
            'replaceText'
        ]);
    });

    test('single span vs div', function () {
        var div = makeElement(
            '<span>Hello</span>'
        );
        var src = '' +
            '{{#define foo}}' +
                '<b>Hello</b>' +
            '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var prev_data = {};
        var next_data = {};
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        var renderer = new render.Renderer(patcher, templates, true);
        renderer.render('foo', next_data, prev_data);
        assert.equal(div.innerHTML, '<b>Hello</b>');
        assert.deepEqual(transform_log, [
            'insertElement',
            'insertTextNode',
            'removeChild'
        ]);
    });

    test('comment nodes in DOM', function () {
        var div = makeElement(
            '<!-- comment -->' +
            '<span>Hello</span>' +
            '<!-- comment2 -->'
        );
        var src = '' +
            '{{#define foo}}' +
                '<b>Hello</b>' +
            '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var prev_data = {};
        var next_data = {};
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        var renderer = new render.Renderer(patcher, templates, true);
        renderer.render('foo', next_data, prev_data);
        assert.equal(div.innerHTML, '<b>Hello</b>');
        assert.deepEqual(transform_log, [
            'insertElement',
            'insertTextNode',
            'removeChild',
            'removeChild',
            'removeChild'
        ]);
    });

    test('same outer element, different inner', function () {
        var div = makeElement(
            '<div><b>Hello</b></div>'
        );
        var src = '' +
            '{{#define foo}}' +
                '<div><i>Hello</i></div>' +
            '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var prev_data = {};
        var next_data = {};
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        var renderer = new render.Renderer(patcher, templates, true);
        renderer.render('foo', next_data, prev_data);
        assert.equal(div.innerHTML, '<div><i>Hello</i></div>');
        assert.deepEqual(transform_log, [
            'insertElement',
            'insertTextNode',
            'removeChild'
        ]);
    });

    test('different inner text', function () {
        var div = makeElement(
            '<b>Hello</b>'
        );
        var src = '' +
            '{{#define foo}}' +
                '<b>Hi</b>' +
            '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var prev_data = {};
        var next_data = {};
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        var renderer = new render.Renderer(patcher, templates, true);
        renderer.render('foo', next_data, prev_data);
        assert.equal(div.innerHTML, '<b>Hi</b>');
        assert.deepEqual(transform_log, [
            'replaceText'
        ]);
    });

    test('different element class', function () {
        var div = makeElement(
            '<b class="one">Hello</b>'
        );
        var src = '' +
            '{{#define foo}}' +
                '<b class="two">Hello</b>' +
            '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var prev_data = {};
        var next_data = {};
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        var renderer = new render.Renderer(patcher, templates, true);
        renderer.render('foo', next_data, prev_data);
        assert.equal(div.innerHTML, '<b class="two">Hello</b>');
        assert.deepEqual(transform_log, [
            'setAttribute'
        ]);
    });

    test('remove attributes not rendered', function () {
        var div = makeElement(
            '<a class="btn" href="#" rel="me">test</a>'
        );
        var src = '' +
            '{{#define foo}}' +
                '<a href="http://example.com">test</a>' +
            '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var prev_data = {};
        var next_data = {};
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        var renderer = new render.Renderer(patcher, templates, true);
        renderer.render('foo', next_data, prev_data);
        assert.equal(div.innerHTML, '<a href="http://example.com">test</a>');
        assert.deepEqual(transform_log, [
            'setAttribute',
            'removeAttribute',
            'removeAttribute'
        ]);
    });

    test('managing attributes across multiple renders', function () {
        var div = makeElement(
            '<a class="btn" href="#" rel="me">test</a>'
        );
        var src = '' +
            '{{#define foo}}' +
                '{{#if me}}' +
                    '<a class="btn" href="#" rel="me">test</a>' +
                '{{/if}}' +
                '{{#unless me}}' +
                    '<a class="btn" href="#">test</a>' +
                '{{/unless}}' +
            '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var prev_data = {me: true};
        var next_data = {me: true};
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        var renderer = new render.Renderer(patcher, templates, true);
        renderer.render('foo', next_data, prev_data);
        assert.equal(
            div.innerHTML,
            '<a class="btn" href="#" rel="me">test</a>'
        );
        assert.deepEqual(transform_log, [
        ]);
        prev_data = next_data;
        next_data = {me: false};
        transform_log = [];
        renderer.render('foo', next_data, prev_data);
        assert.equal(
            div.innerHTML,
            '<a class="btn" href="#">test</a>'
        );
        assert.deepEqual(transform_log, [
            'removeAttribute'
        ]);
    });


    test('same DOM means no change', function () {
        var div = makeElement(
            '<b class="one">test</b>'
        );
        var src = '' +
            '{{#define foo}}' +
                '<b class="one">{{name}}</b>' +
            '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var prev_data = {};
        var next_data = {name: 'test'};
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        var renderer = new render.Renderer(patcher, templates, true);
        renderer.render('foo', next_data, prev_data);
        assert.equal(div.innerHTML, '<b class="one">test</b>');
        assert.deepEqual(transform_log, [
        ]);
    });

    test('multiple siblings', function () {
        var div = makeElement(
            '<b>one</b>' +
            '<i>two</i>' +
            '<em>three</em>'
        );
        var src = '' +
            '{{#define foo}}' +
                '<b>one</b>' +
                '<i class="test">two</i>' +
                '<em>three</em>' +
            '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var prev_data = {};
        var next_data = {name: 'test'};
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        var renderer = new render.Renderer(patcher, templates, true);
        renderer.render('foo', next_data, prev_data);
        assert.equal(
            div.innerHTML,
            '<b>one</b><i class="test">two</i><em>three</em>'
        );
        assert.deepEqual(transform_log, [
            'setAttribute'
        ]);
    });

    test('append sibling', function () {
        var div = makeElement(
            '<b>one</b>'
        );
        var src = '' +
            '{{#define foo}}' +
                '<b>one</b>' +
                '<i>two</i>' +
            '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var prev_data = {};
        var next_data = {name: 'test'};
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        var renderer = new render.Renderer(patcher, templates, true);
        renderer.render('foo', next_data, prev_data);
        assert.equal(div.innerHTML, '<b>one</b><i>two</i>');
        assert.deepEqual(transform_log, [
            'insertElement',
            'insertTextNode'
        ]);
    });

    test('remove sibling from end', function () {
        var div = makeElement(
            '<b>one</b>' +
            '<i>two</i>' 
        );
        var src = '' +
            '{{#define foo}}' +
                '<b>one</b>' +
            '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var prev_data = {};
        var next_data = {name: 'test'};
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        var renderer = new render.Renderer(patcher, templates, true);
        renderer.render('foo', next_data, prev_data);
        assert.equal(div.innerHTML, '<b>one</b>');
        assert.deepEqual(transform_log, [
            'removeChild'
        ]);
    });

    test('replace node, keep sibling', function () {
        var div = makeElement(
            '<b>one</b>' +
            '<b>two</b>'
        );
        var src = '' +
            '{{#define foo}}' +
                '<i>one</i>' +
                '<b>two</b>' +
            '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var prev_data = {};
        var next_data = {name: 'test'};
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        var renderer = new render.Renderer(patcher, templates, true);
        renderer.render('foo', next_data, prev_data);
        assert.equal(div.innerHTML, '<i>one</i><b>two</b>');
        assert.deepEqual(transform_log, [
            'insertElement',
            'insertTextNode',
            'replaceText',
            'removeChild'
        ]);
    });

    test('replace all siblings', function () {
        var div = makeElement(
            '<b>one</b>' +
            '<b>two</b>'
        );
        var src = '' +
            '{{#define foo}}' +
                '<i>one</i>' +
                '<i>two</i>' +
            '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var prev_data = {};
        var next_data = {name: 'test'};
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        var renderer = new render.Renderer(patcher, templates, true);
        renderer.render('foo', next_data, prev_data);
        assert.equal(div.innerHTML, '<i>one</i><i>two</i>');
        assert.deepEqual(transform_log, [
            'insertElement',
            'insertTextNode',
            'insertElement',
            'insertTextNode',
            'removeChild',
            'removeChild'
        ]);
    });

    test('insert middle sibling', function () {
        var div = makeElement(
            '<b>one</b>' +
            '<em>three</em>'
        );
        var src = '' +
            '{{#define foo}}' +
                '<b>one</b>' +
                '<i>two</i>' +
                '<em>three</em>' +
            '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var prev_data = {};
        var next_data = {};
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        var renderer = new render.Renderer(patcher, templates, true);
        renderer.render('foo', next_data, prev_data);
        assert.equal(div.innerHTML, '<b>one</b><i>two</i><em>three</em>');
        assert.deepEqual(transform_log, [
            'insertElement',
            'insertTextNode'
        ]);
    });

    test('remove sibling with keys', function () {
        var div = makeElement(
            '<ul>' +
              '<li>one</li>' +
              '<li>two</li>' +
              '<li>three</li>' +
            '</ul>'
        );
        var src = '' +
            '{{#define foo}}' +
              '<ul>' +
                '{{#each items key=id}}' +
                  '<li>{{id}}</li>' +
                '{{/each}}' +
              '</ul>' +
            '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var prev_data = {items: []};
        var next_data = {items: [
            {id: 'one'},
            {id: 'two'},
            {id: 'three'}
        ]};
        // first render sets up keymaps
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        var renderer = new render.Renderer(patcher, templates, true);
        renderer.render('foo', next_data, prev_data);
        // second render using keys
        prev_data = next_data;
        next_data = {items: [
            prev_data.items[1],
            prev_data.items[2]
        ]};
        transform_log = [];
        renderer.render('foo', next_data, prev_data);
        assert.equal(
            div.innerHTML,
            '<ul>' +
              '<li>two</li>' +
              '<li>three</li>' +
            '</ul>'
        );
        window.div = div;
        assert.deepEqual(transform_log, [
            'replaceChild'
        ]);
    });

    test('re-order siblings with keys', function () {
        var div = makeElement(
            '<ul>' +
              '<li>one</li>' +
              '<li>two</li>' +
              '<li>three</li>' +
            '</ul>'
        );
        var src = '' +
            '{{#define foo}}' +
              '<ul>' +
                '{{#each items key=id}}' +
                  '<li>{{id}}</li>' +
                '{{/each}}' +
              '</ul>' +
            '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var prev_data = {items: []};
        var next_data = {items: [
            {id: 'one'},
            {id: 'two'},
            {id: 'three'}
        ]};
        // first render sets up keymaps
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        var renderer = new render.Renderer(patcher, templates, true);
        renderer.render('foo', next_data, prev_data);
        // second render using keys
        prev_data = next_data;
        next_data = {items: [
            prev_data.items[2],
            prev_data.items[0],
            prev_data.items[1]
        ]};
        transform_log = [];
        renderer.render('foo', next_data, prev_data);
        assert.equal(
            div.innerHTML,
            '<ul>' +
              '<li>three</li>' +
              '<li>one</li>' +
              '<li>two</li>' +
            '</ul>'
        );
        window.div = div;
        assert.deepEqual(transform_log, [
            'replaceChild',
            'replaceChild',
            'appendChild'
        ]);
    });

    test('prepend sibling with keys', function () {
        var div = makeElement(
            '<ul>' +
              '<li>one</li>' +
              '<li>two</li>' +
              '<li>three</li>' +
            '</ul>'
        );
        var src = '' +
            '{{#define foo}}' +
              '<ul>' +
                '{{#each items key=id}}' +
                  '<li>{{id}}</li>' +
                '{{/each}}' +
              '</ul>' +
            '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var prev_data = {items: []};
        var next_data = {items: [
            {id: 'one'},
            {id: 'two'},
            {id: 'three'}
        ]};
        // first render sets up keymaps
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        var renderer = new render.Renderer(patcher, templates, true);
        renderer.render('foo', next_data, prev_data);
        // second render using keys
        prev_data = next_data;
        next_data = {items: [
            {id: 'zero'},
            prev_data.items[0],
            prev_data.items[1],
            prev_data.items[2]
        ]};
        transform_log = [];
        renderer.render('foo', next_data, prev_data);
        assert.equal(
            div.innerHTML,
            '<ul>' +
              '<li>zero</li>' +
              '<li>one</li>' +
              '<li>two</li>' +
              '<li>three</li>' +
            '</ul>'
        );
        window.div = div;
        assert.deepEqual(transform_log, [
            'insertElement',
            'insertTextNode'
        ]);
    });

    test('append sibling with keys', function () {
        var div = makeElement(
            '<ul>' +
              '<li>one</li>' +
              '<li>two</li>' +
              '<li>three</li>' +
            '</ul>'
        );
        var src = '' +
            '{{#define foo}}' +
              '<ul>' +
                '{{#each items key=id}}' +
                  '<li>{{id}}</li>' +
                '{{/each}}' +
              '</ul>' +
            '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var prev_data = {items: []};
        var next_data = {items: [
            {id: 'one'},
            {id: 'two'},
            {id: 'three'}
        ]};
        // first render sets up keymaps
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        var renderer = new render.Renderer(patcher, templates, true);
        renderer.render('foo', next_data, prev_data);
        // second render using keys
        prev_data = next_data;
        next_data = {items: [
            prev_data.items[0],
            prev_data.items[1],
            prev_data.items[2],
            {id: 'four'}
        ]};
        transform_log = [];
        renderer.render('foo', next_data, prev_data);
        assert.equal(
            div.innerHTML,
            '<ul>' +
              '<li>one</li>' +
              '<li>two</li>' +
              '<li>three</li>' +
              '<li>four</li>' +
            '</ul>'
        );
        assert.deepEqual(transform_log, [
            'insertElement',
            'insertTextNode'
        ]);
    });

    test('insert middle sibling with keys', function () {
        var div = makeElement(
            '<ul>' +
              '<li>one</li>' +
              '<li>two</li>' +
              '<li>three</li>' +
            '</ul>'
        );
        var src = '' +
            '{{#define foo}}' +
              '<ul>' +
                '{{#each items key=id}}' +
                  '<li>{{id}}</li>' +
                '{{/each}}' +
              '</ul>' +
            '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var prev_data = {items: []};
        var next_data = {items: [
            {id: 'one'},
            {id: 'two'},
            {id: 'three'}
        ]};
        // first render sets up keymaps
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        var renderer = new render.Renderer(patcher, templates, true);
        renderer.render('foo', next_data, prev_data);
        // second render using keys
        prev_data = next_data;
        next_data = {items: [
            prev_data.items[0],
            prev_data.items[1],
            {id: '2.5'},
            prev_data.items[2]
        ]};
        transform_log = [];
        renderer.render('foo', next_data, prev_data);
        assert.equal(
            div.innerHTML,
            '<ul>' +
              '<li>one</li>' +
              '<li>two</li>' +
              '<li>2.5</li>' +
              '<li>three</li>' +
            '</ul>'
        );
        assert.deepEqual(transform_log, [
            'insertElement',
            'insertTextNode'
        ]);
    });

    test('escaped var', function () {
        var div = document.createElement('div');
        var templates = Magery.loadTemplates(
            '{{#define foo}}' +
                '<span>Hello, {{name}}!</span>' +
            '{{/define}}'
        );
        var prev_data = {};
        var next_data = {name: 'world'};
        var patcher = new patch.Patcher(div, test_transforms);
        var renderer = new render.Renderer(patcher, templates, true);
        renderer.render('foo', next_data, prev_data);
        assert.equal(div.childNodes[0].innerHTML, 'Hello, world!');
        prev_data = next_data;
        next_data = {name: '<script>alert("bad stuff");</script>'};
        renderer.render('foo', next_data, prev_data);
        assert.equal(
            div.childNodes[0].innerHTML,
            'Hello, &lt;script&gt;alert("bad stuff");&lt;/script&gt;!'
        );
    });

    test('escaped var with whitespace', function () {
        var div = document.createElement('div');
        var templates = Magery.loadTemplates(
            '{{#define foo}}' +
                '<span>Hello, {{ name }}!</span>' +
            '{{/define}}'
        );
        var prev_data = {};
        var next_data = {name: 'world'};
        var patcher = new patch.Patcher(div, test_transforms);
        var renderer = new render.Renderer(patcher, templates, true);
        renderer.render('foo', next_data, prev_data);
        assert.equal(div.childNodes[0].innerHTML, 'Hello, world!');
        prev_data = next_data;
        next_data = {name: '<script>alert("bad stuff");</script>'};
        renderer.render('foo', next_data, prev_data);
        assert.equal(
            div.childNodes[0].innerHTML,
            'Hello, &lt;script&gt;alert("bad stuff");&lt;/script&gt;!'
        );
    });

    test('escaped attribute', function () {
        var div = document.createElement('div');
        var templates = Magery.loadTemplates(
            '{{#define foo}}' +
                '<span class="{{type}}">foo</span>' +
            '{{/define}}'
        );
        var prev_data = {};
        var next_data = {type: 'te" onclick="alert()"><script>alert();'};
        var patcher = new patch.Patcher(div, test_transforms);
        var renderer = new render.Renderer(patcher, templates, true);
        renderer.render('foo', next_data, prev_data);
        assert.equal(
            div.childNodes[0].className,
            'te&quot; onclick=&quot;alert()&quot;&gt;&lt;script&gt;alert();'
        );
    });

    test('escaped attribute with whitespace', function () {
        var div = document.createElement('div');
        var templates = Magery.loadTemplates(
            '{{#define foo}}' +
                '<span class="{{ type }}">foo</span>' +
            '{{/define}}'
        );
        var prev_data = {};
        var next_data = {type: 'te" onclick="alert()"><script>alert();'};
        var patcher = new patch.Patcher(div, test_transforms);
        var renderer = new render.Renderer(patcher, templates, true);
        renderer.render('foo', next_data, prev_data);
        assert.equal(
            div.childNodes[0].className,
            'te&quot; onclick=&quot;alert()&quot;&gt;&lt;script&gt;alert();'
        );
    });

    test('patch using body from render of complete html document', function () {
        var div = makeElement('<h1>Foo</h1>');
        var templates = Magery.loadTemplates(
            '{{#define app}}' +
                '<html>' +
                  '<head>' +
                    '<link rel="preload" href=".">' +
                  '</head>' +
                  '<body>' +
                    '<h1>Bar</h1>' +
                  '</body>' +
                '</html>' +
            '{{/define}}'
        );
        var prev_data = {};
        var next_data = {};
        var patcher = new patch.Patcher(div, test_transforms);
        var renderer = new render.Renderer(patcher, templates, true);
        renderer.render('app', next_data, prev_data);
        assert.equal(child(div, 0).tagName, 'H1');
        assert.equal(child(div, 0).textContent, 'Bar');
        assert.equal(div.childNodes.length, 1);
    });

    test('patch using body from render of complete html document (with doctype + whitespace)', function () {
        var div = makeElement('<h1>Foo</h1>');
        var templates = Magery.loadTemplates(
            '{{#define app}}\n' +
            '<!DOCTYPE html>\n' +
            '<html>\n' +
            '  <head>\n' +
            '    <link rel="preload" href=".">\n' +
            '  </head>\n' +
            '  <body>\n' +
            '    <p>Test</p>\n' +
            '    <h1>Bar</h1>\n' +
            '  </body>\n' +
            '</html>\n' +
            '{{/define}}'
        );
        var prev_data = {};
        var next_data = {};
        var patcher = new patch.Patcher(div, test_transforms);
        var renderer = new render.Renderer(patcher, templates, true);
        renderer.render('app', next_data, prev_data);
        assert.equal(child(div, 3).tagName, 'H1');
        assert.equal(child(div, 3).textContent, 'Bar');
        assert.equal(div.childNodes.length, 5);
    });

    test('collapse adjacent text nodes', function () {
        var div = makeElement(
            '<ul>\n  \n    <li>Foo</li>\n    <li>Bar</li>\n  \n</ul>\n'
        );
        var templates = Magery.loadTemplates(
            '{{#define item}}\n' +
            '  {{#if name}}\n' +
            '    <li>{{name}}</li>\n' +
            '  {{/if}}\n' +
            '{{/define}}\n' +
            '{{#define app}}' +
            '<ul>\n' +
            '  {{#each items}}\n' +
            '    {{#item /}}\n' +
            '  {{/each}}' +
            '</ul>\n' +
            '{{/define}}'
        );
        var prev_data = {};
        var next_data = {items: [{name: 'Foo'}, {name: 'Bar'}]};
        var patcher = new patch.Patcher(div, test_transforms);
        var renderer = new render.Renderer(patcher, templates, true);
        renderer.render('app', next_data, prev_data);
        assert.equal(child(div, 0).tagName, 'UL');
        assert.equal(child(div, 0, 1).tagName, 'LI');
        assert.equal(child(div, 0, 1).textContent, 'Foo');
        assert.equal(child(div, 0, 3).tagName, 'LI');
        assert.equal(child(div, 0, 3).textContent, 'Bar');
        assert.equal(div.children.length, 1);
        assert.equal(child(div, 0).children.length, 2);
        assert.equal(child(div, 0).childNodes.length, 5);
    });

    test('checked property using template conditional', function () {
        var div = document.createElement('div');
        var templates = Magery.loadTemplates(
            '{{#define app}}' +
                '{{#if complete}}' +
                    '<input type="checkbox" checked />' +
                '{{/if}}' +
                '{{#unless complete}}' +
                    '<input type="checkbox" />' +
                '{{/unless}}' +
            '{{/define}}'
        );
        var prev_data = {};
        var next_data = {complete: false};
        var patcher = new patch.Patcher(div, test_transforms);
        var renderer = new render.Renderer(patcher, templates, true);
        renderer.render('app', next_data, prev_data);
        assert.strictEqual(child(div, 0).checked, false, 'one');
        prev_data = next_data;
        next_data = {complete: true};
        renderer.render('app', next_data, prev_data);
        assert.strictEqual(child(div, 0).checked, true, 'two');
        prev_data = next_data;
        next_data = {complete: false};
        renderer.render('app', next_data, prev_data);
        assert.strictEqual(child(div, 0).checked, false, 'three');
    });

    test('value property', function () {
        var div = document.createElement('div');
        var templates = Magery.loadTemplates(
            '{{#define app}}' +
                '<input type="text" value="{{message}}" />' +
            '{{/define}}'
        );
        var prev_data = {};
        var next_data = {message: ''};
        var patcher = new patch.Patcher(div, test_transforms);
        var renderer = new render.Renderer(patcher, templates, true);
        renderer.render('app', next_data, prev_data);
        assert.strictEqual(child(div, 0).value, "");
        prev_data = next_data;
        next_data = {message: 'testing'};
        renderer.render('app', next_data, prev_data);
        assert.strictEqual(child(div, 0).value, "testing");
        prev_data = next_data;
        next_data = {message: 'asdf'};
        renderer.render('app', next_data, prev_data);
        assert.strictEqual(child(div, 0).value, "asdf");
    });

    test('autofocus on conditional causes focus', function () {
        var div = document.createElement('div');
        var templates = Magery.loadTemplates(
            '{{#define app}}' +
                '{{#if active}}' +
                    '<input type="text" autofocus />' +
                '{{else}}' +
                    '<input type="text" rel="test" />' +
                '{{/if}}' +
            '{{/define}}'
        );
        // need to place this in the body so it can receive focus
        document.body.appendChild(div);
        var prev_data = {};
        var next_data = {};
        var patcher = new patch.Patcher(div, test_transforms);
        var renderer = new render.Renderer(patcher, templates, true);
        renderer.render('app', next_data, prev_data);
        assert.notEqual(document.activeElement, child(div, 0));
        prev_data = next_data;
        next_data = {active: true};
        renderer.render('app', next_data, prev_data);
        assert.equal(document.activeElement, child(div, 0));
        prev_data = next_data;
        next_data = {active: false};
        renderer.render('app', next_data, prev_data);
        assert.notEqual(document.activeElement, child(div, 0));
        document.body.removeChild(div);
    });

    test("don't remove attributes on container", function () {
        var div = document.createElement('div');
        div.setAttribute('id', 'testing');
        var calls = [];
        div.addEventListener('click', function () {
            calls.push('click');
        });
        var templates = Magery.loadTemplates(
            '{{#define app}}<b>test</b>{{/define}}'
        );
        var prev_data = {};
        var next_data = {};
        var patcher = new patch.Patcher(div, test_transforms);
        var renderer = new render.Renderer(patcher, templates, true);
        renderer.render('app', next_data, prev_data);
        assert.strictEqual(div.getAttribute('id'), 'testing', 'id not removed');
        div.click();
        assert.deepEqual(calls, ['click'], 'event handler not removed');
    });

    test("don't destroy external changes inside #skip tags", function () {
        var div = document.createElement('div');
        var div2 = document.createElement('div');
        var templates = Magery.loadTemplates(
            '{{#define app}}' +
              '<div id="container">' +
                '{{#skip}}' +
                  '<div id="unmanaged">{{name}}</div>' +
                '{{/skip}}' +
                '<div id="managed">{{name}}</div>' +
              '</div>' +
            '{{/define}}'
        );
        var prev_data = {};
        var next_data = {name: 'test'};
        var patcher = new patch.Patcher(div, test_transforms);
        var renderer = new render.Renderer(patcher, templates, true);
        renderer.render('app', next_data, prev_data);
        div2.innerHTML = 
            '<div id="container">' +
              '<div id="unmanaged">test</div>' +
              '<div id="managed">test</div>' +
            '</div>';
        assert.ok(div.isEqualNode(div2));
        prev_data = next_data;
        next_data = {name: 'foo'};
        renderer.render('app', next_data, prev_data);
        div2.innerHTML =
            '<div id="container">' +
              '<div id="unmanaged">test</div>' +
              '<div id="managed">foo</div>' +
            '</div>';
        assert.ok(div.isEqualNode(div2));
        div.childNodes[0].childNodes[0].innerHTML = '<span>foo</span><span>bar</span>';
        div.childNodes[0].childNodes[0].setAttribute('data-test', '123');
        prev_data = next_data;
        next_data = {name: 'foo'};
        renderer.render('app', next_data, prev_data);
        div2.innerHTML =
            '<div id="container">' +
              '<div data-test="123" id="unmanaged">' +
                '<span>foo</span>' +
                '<span>bar</span>' +
              '</div>' +
              '<div id="managed">foo</div>' +
            '</div>';
        assert.ok(div.isEqualNode(div2));
    });

});
