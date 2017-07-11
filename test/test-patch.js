suite('patch', function () {

    var assert = chai.assert;

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

    function child(node /*...*/) {
        for (var i = 1; i < arguments.length; i++) {
            node = node.childNodes[arguments[i]];
        }
        return node;
    }

    function click(el){
        var ev = document.createEvent("MouseEvent");
        ev.initMouseEvent(
            "click",
            true /* bubble */,
            true /* cancelable */,
            window,
            null,
            0, 0, 0, 0, /* coordinates */
            false, false, false, false, /* modifier keys */
            0 /*left*/,
            null
        );
        el.dispatchEvent(ev);
    }

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
        var tmpl = createTemplateNode('foo',
                                    '<i>foo</i>' +
                                    '<b>bar</b>' +
                                    '<em>baz</em>');
        var prev_data = {};
        var next_data = {};
        transform_log = [];
        var bound = new Magery.BoundTemplate(div, 'foo', next_data, {});
        var patcher = new patch.Patcher(div, test_transforms);
        var state = {
            patcher: patcher,
            bound_template: bound,
            text_buffer: ''
        };
        tmpl.content.render(state, next_data, prev_data);
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
        var tmpl = createTemplateNode('foo',
                                      '<i>foo</i>' +
                                      '<p>' +
                                      '<b>bar</b>' +
                                      '<em>baz</em>' +
                                      '</p>');
        var prev_data = {};
        var next_data = {};
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        var bound = new Magery.BoundTemplate(div, 'foo', next_data, {});
        var state = {
            patcher: patcher,
            bound_template: bound,
            text_buffer: ''
        };
        tmpl.content.render(state, next_data, prev_data);
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
        var tmpl = createTemplateNode('foo',
                                      '<b>Hello</b>');
        var prev_data = {};
        var next_data = {};
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        var bound = new Magery.BoundTemplate(div, 'foo', next_data, {});
        var state = {
            patcher: patcher,
            bound_template: bound,
            text_buffer: ''
        };
        tmpl.content.render(state, next_data, prev_data);
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
        var tmpl = createTemplateNode('foo',
                                      '<b>Hello</b>');
        var prev_data = {};
        var next_data = {};
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        var bound = new Magery.BoundTemplate(div, 'foo', next_data, {});
        var state = {
            patcher: patcher,
            bound_template: bound,
            text_buffer: ''
        };
        tmpl.content.render(state, next_data, prev_data);
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
        var tmpl = createTemplateNode('foo',
                                      '<div><i>Hello</i></div>');
        var prev_data = {};
        var next_data = {};
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        var bound = new Magery.BoundTemplate(div, 'foo', next_data, {});
        var state = {
            patcher: patcher,
            bound_template: bound,
            text_buffer: ''
        };
        tmpl.content.render(state, next_data, prev_data);
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
        var tmpl = createTemplateNode('foo',
                                      '<b>Hi</b>');
        var prev_data = {};
        var next_data = {};
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        var bound = new Magery.BoundTemplate(div, 'foo', next_data, {});
        var state = {
            patcher: patcher,
            bound_template: bound,
            text_buffer: ''
        };
        tmpl.content.render(state, next_data, prev_data);
        assert.equal(div.innerHTML, '<b>Hi</b>');
        assert.deepEqual(transform_log, [
            'replaceText'
        ]);
    });

    test('different element class', function () {
        var div = makeElement(
            '<b class="one">Hello</b>'
        );
        var tmpl = createTemplateNode('foo',
                                      '<b class="two">Hello</b>');
        var prev_data = {};
        var next_data = {};
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        var bound = new Magery.BoundTemplate(div, 'foo', next_data, {});
        var state = {
            patcher: patcher,
            bound_template: bound,
            text_buffer: ''
        };
        tmpl.content.render(state, next_data, prev_data);
        assert.equal(div.innerHTML, '<b class="two">Hello</b>');
        assert.deepEqual(transform_log, [
            'setAttribute'
        ]);
    });

    test('remove attributes not rendered', function () {
        var div = makeElement(
            '<a class="btn" href="#" rel="me">test</a>'
        );
        var tmpl = createTemplateNode('foo',
                                      '<a href="http://example.com">test</a>');
        var prev_data = {};
        var next_data = {};
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        var bound = new Magery.BoundTemplate(div, 'foo', next_data, {});
        var state = {
            patcher: patcher,
            bound_template: bound,
            text_buffer: ''
        };
        tmpl.content.render(state, next_data, prev_data);
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
        var tmpl = createTemplateNode('foo',
                                      '<a data-if="me" class="btn" href="#" rel="me">test</a>' +
                                      '<a data-unless="me" class="btn" href="#">test</a>');
        var prev_data = {me: true};
        var next_data = {me: true};
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        var bound = new Magery.BoundTemplate(div, 'foo', next_data, {});
        var state = {
            patcher: patcher,
            bound_template: bound,
            text_buffer: ''
        };
        tmpl.content.render(state, next_data, prev_data);
        assert.equal(
            div.innerHTML,
            '<a class="btn" href="#" rel="me">test</a>'
        );
        assert.deepEqual(transform_log, [
        ]);
        prev_data = next_data;
        next_data = {me: false};
        transform_log = [];
        tmpl.content.render(state, next_data, prev_data);
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
        var tmpl = createTemplateNode('foo',
                                      '<b class="one">{{name}}</b>');
        var prev_data = {};
        var next_data = {name: 'test'};
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        var bound = new Magery.BoundTemplate(div, 'foo', next_data, {});
        var state = {
            patcher: patcher,
            bound_template: bound,
            text_buffer: ''
        };
        tmpl.content.render(state, next_data, prev_data);
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
        var tmpl = createTemplateNode('foo',
                                      '<b>one</b>' +
                                      '<i class="test">two</i>' +
                                      '<em>three</em>');
        var prev_data = {};
        var next_data = {name: 'test'};
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        var bound = new Magery.BoundTemplate(div, 'foo', next_data, {});
        var state = {
            patcher: patcher,
            bound_template: bound,
            text_buffer: ''
        };
        tmpl.content.render(state, next_data, prev_data);
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
        var tmpl = createTemplateNode('foo',
                                      '<b>one</b>' +
                                      '<i>two</i>');
        var prev_data = {};
        var next_data = {name: 'test'};
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        var bound = new Magery.BoundTemplate(div, 'foo', next_data, {});
        var state = {
            patcher: patcher,
            bound_template: bound,
            text_buffer: ''
        };
        tmpl.content.render(state, next_data, prev_data);
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
        var tmpl = createTemplateNode('foo',
                                      '<b>one</b>');
        var prev_data = {};
        var next_data = {name: 'test'};
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        var bound = new Magery.BoundTemplate(div, 'foo', next_data, {});
        var state = {
            patcher: patcher,
            bound_template: bound,
            text_buffer: ''
        };
        tmpl.content.render(state, next_data, prev_data);
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
        var tmpl = createTemplateNode('foo',
                                      '<i>one</i>' +
                                      '<b>two</b>');
        var prev_data = {};
        var next_data = {name: 'test'};
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        var bound = new Magery.BoundTemplate(div, 'foo', next_data, {});
        var state = {
            patcher: patcher,
            bound_template: bound,
            text_buffer: ''
        };
        tmpl.content.render(state, next_data, prev_data);
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
        var tmpl = createTemplateNode('foo',
                                      '<i>one</i>' +
                                      '<i>two</i>');
        var prev_data = {};
        var next_data = {name: 'test'};
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        var bound = new Magery.BoundTemplate(div, 'foo', next_data, {});
        var state = {
            patcher: patcher,
            bound_template: bound,
            text_buffer: ''
        };
        tmpl.content.render(state, next_data, prev_data);
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
        var tmpl = createTemplateNode('foo',
                           '<b>one</b>' +
                           '<i>two</i>' +
                           '<em>three</em>');
        var prev_data = {};
        var next_data = {};
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        var bound = new Magery.BoundTemplate(div, 'foo', next_data, {});
        var state = {
            patcher: patcher,
            bound_template: bound,
            text_buffer: ''
        };
        tmpl.content.render(state, next_data, prev_data);
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
        var tmpl = createTemplateNode('foo',
                           '<ul>' +
                             '<li data-each="item in items" data-key="{{item.id}}">' +
                               '{{item.id}}' +
                             '</li>' +
                           '</ul>');
        var prev_data = {items: []};
        var next_data = {items: [
            {id: 'one'},
            {id: 'two'},
            {id: 'three'}
        ]};
        // first render sets up keymaps
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        var bound = new Magery.BoundTemplate(div, 'foo', next_data, {});
        var state = {
            patcher: patcher,
            bound_template: bound,
            text_buffer: ''
        };
        tmpl.content.render(state, next_data, prev_data);
        // second render using keys
        prev_data = next_data;
        next_data = {items: [
            prev_data.items[1],
            prev_data.items[2]
        ]};
        transform_log = [];
        tmpl.content.render(state, next_data, prev_data);
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
        var tmpl = createTemplateNode('foo',
                           '<ul>' +
                             '<li data-each="item in items" data-key="{{item.id}}">' +
                               '{{item.id}}' +
                             '</li>' +
                           '</ul>');
        var prev_data = {items: []};
        var next_data = {items: [
            {id: 'one'},
            {id: 'two'},
            {id: 'three'}
        ]};
        // first render sets up keymaps
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        var bound = new Magery.BoundTemplate(div, 'foo', next_data, {});
        var state = {
            patcher: patcher,
            bound_template: bound,
            text_buffer: ''
        };
        tmpl.content.render(state, next_data, prev_data);
        // second render using keys
        prev_data = next_data;
        next_data = {items: [
            prev_data.items[2],
            prev_data.items[0],
            prev_data.items[1]
        ]};
        transform_log = [];
        tmpl.content.render(state, next_data, prev_data);
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
        var tmpl = createTemplateNode('foo',
                           '<ul>' +
                             '<li data-each="item in items" data-key="{{item.id}}">' +
                               '{{item.id}}' +
                             '</li>' +
                           '</ul>');
        var prev_data = {items: []};
        var next_data = {items: [
            {id: 'one'},
            {id: 'two'},
            {id: 'three'}
        ]};
        // first render sets up keymaps
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        var bound = new Magery.BoundTemplate(div, 'foo', next_data, {});
        var state = {
            patcher: patcher,
            bound_template: bound,
            text_buffer: ''
        };
        tmpl.content.render(state, next_data, prev_data);
        // second render using keys
        prev_data = next_data;
        next_data = {items: [
            {id: 'zero'},
            prev_data.items[0],
            prev_data.items[1],
            prev_data.items[2]
        ]};
        transform_log = [];
        tmpl.content.render(state, next_data, prev_data);
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
        var tmpl = createTemplateNode('foo',
                           '<ul>' +
                             '<li data-each="item in items" data-key="{{item.id}}">' +
                               '{{item.id}}' +
                             '</li>' +
                           '</ul>');
        var prev_data = {items: []};
        var next_data = {items: [
            {id: 'one'},
            {id: 'two'},
            {id: 'three'}
        ]};
        // first render sets up keymaps
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        var bound = new Magery.BoundTemplate(div, 'foo', next_data, {});
        var state = {
            patcher: patcher,
            bound_template: bound,
            text_buffer: ''
        };
        tmpl.content.render(state, next_data, prev_data);
        // second render using keys
        prev_data = next_data;
        next_data = {items: [
            prev_data.items[0],
            prev_data.items[1],
            prev_data.items[2],
            {id: 'four'}
        ]};
        transform_log = [];
        tmpl.content.render(state, next_data, prev_data);
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
        var tmpl = createTemplateNode('foo',
                           '<ul>' +
                             '<li data-each="item in items" data-key="{{item.id}}">' +
                               '{{item.id}}' +
                             '</li>' +
                           '</ul>');
        var prev_data = {items: []};
        var next_data = {items: [
            {id: 'one'},
            {id: 'two'},
            {id: 'three'}
        ]};
        // first render sets up keymaps
        transform_log = [];
        var patcher = new patch.Patcher(div, test_transforms);
        var bound = new Magery.BoundTemplate(div, 'foo', next_data, {});
        var state = {
            patcher: patcher,
            bound_template: bound,
            text_buffer: ''
        };
        tmpl.content.render(state, next_data, prev_data);
        // second render using keys
        prev_data = next_data;
        next_data = {items: [
            prev_data.items[0],
            prev_data.items[1],
            {id: '2.5'},
            prev_data.items[2]
        ]};
        transform_log = [];
        tmpl.content.render(state, next_data, prev_data);
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
        var tmpl = createTemplateNode('foo',
                                      '<span>Hello, {{name}}!</span>');
        var prev_data = {};
        var next_data = {name: 'world'};
        var patcher = new patch.Patcher(div, test_transforms);
        var bound = new Magery.BoundTemplate(div, 'foo', next_data, {});
        var state = {
            patcher: patcher,
            bound_template: bound,
            text_buffer: ''
        };
        tmpl.content.render(state, next_data, prev_data);
        assert.equal(div.childNodes[0].innerHTML, 'Hello, world!');
        prev_data = next_data;
        next_data = {name: '<script>alert("bad stuff");</script>'};
        tmpl.content.render(state, next_data, prev_data);
        assert.equal(
            div.childNodes[0].innerHTML,
            'Hello, &lt;script&gt;alert("bad stuff");&lt;/script&gt;!'
        );
    });

    test('escaped var with whitespace', function () {
        var div = document.createElement('div');
        var tmpl = createTemplateNode('foo',
                                      '<span>Hello, {{ name }}!</span>');
        var prev_data = {};
        var next_data = {name: 'world'};
        var patcher = new patch.Patcher(div, test_transforms);
        var bound = new Magery.BoundTemplate(div, 'foo', next_data, {});
        var state = {
            patcher: patcher,
            bound_template: bound,
            text_buffer: ''
        };
        tmpl.content.render(state, next_data, prev_data);
        assert.equal(div.childNodes[0].innerHTML, 'Hello, world!');
        prev_data = next_data;
        next_data = {name: '<script>alert("bad stuff");</script>'};
        tmpl.content.render(state, next_data, prev_data);
        assert.equal(
            div.childNodes[0].innerHTML,
            'Hello, &lt;script&gt;alert("bad stuff");&lt;/script&gt;!'
        );
    });

    test('escaped attribute', function () {
        var div = document.createElement('div');
        var tmpl = createTemplateNode('foo',
                                      '<span class="{{type}}">foo</span>');
        var prev_data = {};
        var next_data = {type: 'test" onclick="throw new Error(\'fail\');'};
        var patcher = new patch.Patcher(div, test_transforms);
        var bound = new Magery.BoundTemplate(div, 'foo', next_data, {});
        var state = {
            patcher: patcher,
            bound_template: bound,
            text_buffer: ''
        };
        tmpl.content.render(state, next_data, prev_data);
        assert.equal(
            div.childNodes[0].className,
            'test" onclick="throw new Error(\'fail\');'
        );
        assert.equal(
            div.innerHTML,
            '<span class="test&quot; onclick=&quot;throw new Error(\'fail\');">foo</span>'
        );
        // this should not trigger an error
        click(div.childNodes[0]);
    });

    // test('patch using body from render of complete html document', function () {
    //     var div = makeElement('<h1>Foo</h1>');
    //     createTemplateNode('app',
    //                        '<html>' +
    //                          '<head>' +
    //                            '<link rel="preload" href=".">' +
    //                          '</head>' +
    //                          '<body>' +
    //                            '<h1>Bar</h1>' +
    //                          '</body>' +
    //                        '</html>');
    //     var prev_data = {};
    //     var next_data = {};
    //     var patcher = new patch.Patcher(div, test_transforms);
    //     var bound = new Magery.BoundTemplate(div, 'foo', next_data, {});
    //     var renderer = new render.Renderer(patcher, bound);
    //     renderer.render('app', next_data, prev_data);
    //     assert.equal(child(div, 0).tagName, 'H1');
    //     assert.equal(child(div, 0).textContent, 'Bar');
    //     assert.equal(div.childNodes.length, 1);
    // });

    // test('patch using body from render of complete html document (with doctype + whitespace)', function () {
    //     var div = makeElement('<h1>Foo</h1>');
    //     createTemplateNode('app',
    //                        '<!DOCTYPE html>\n' +
    //                        '<html>\n' +
    //                        '  <head>\n' +
    //                        '    <link rel="preload" href=".">\n' +
    //                        '  </head>\n' +
    //                        '  <body>\n' +
    //                        '    <p>Test</p>\n' +
    //                        '    <h1>Bar</h1>\n' +
    //                        '  </body>\n' +
    //                        '</html>\n');
    //     var prev_data = {};
    //     var next_data = {};
    //     var patcher = new patch.Patcher(div, test_transforms);
    //     var bound = new Magery.BoundTemplate(div, 'foo', next_data, {});
    //     var renderer = new render.Renderer(patcher, bound);
    //     renderer.render('app', next_data, prev_data);
    //     assert.equal(child(div, 3).tagName, 'H1');
    //     assert.equal(child(div, 3).textContent, 'Bar');
    //     assert.equal(div.childNodes.length, 5);
    // });

    // test('collapse adjacent text nodes', function () {
    //     var div = makeElement(
    //         '<ul>\n  \n    <li>Foo</li>\n    <li>Bar</li>\n  \n</ul>\n'
    //     );
    //     createTemplateNode('item',
    //                        '<span data-if="name">\n' +
    //                        '  {{name}}\n' +
    //                        '</span>\n');
    //     createTemplateNode('app',
    //                        '<ul>\n' +
    //                        '  <li data-each="item in items">\n' +
    //                        '    <template-call template="item" name="item.name">\n' +
    //                        '  </li>' +
    //                        '</ul>\n');
    //     var prev_data = {};
    //     var next_data = {items: [{name: 'Foo'}, {name: 'Bar'}]};
    //     var patcher = new patch.Patcher(div, test_transforms);
    //     var bound = new Magery.BoundTemplate(div, 'app', next_data, {});
    //     var renderer = new render.Renderer(patcher, bound);
    //     renderer.render('app', next_data, prev_data);
    //     assert.equal(child(div, 0).tagName, 'UL');
    //     assert.equal(child(div, 0, 1).tagName, 'LI');
    //     assert.equal(child(div, 0, 1, 1).tagName, 'SPAN');
    //     assert.equal(child(div, 0, 1, 1).textContent, 'Foo');
    //     assert.equal(child(div, 0, 3).tagName, 'LI');
    //     assert.equal(child(div, 0, 3, 0).tagName, 'SPAN');
    //     assert.equal(child(div, 0, 3, 0).textContent, 'Bar');
    //     assert.equal(div.children.length, 1);
    //     assert.equal(child(div, 0).children.length, 2);
    //     assert.equal(child(div, 0, 0).childNodes.length, 3);
    //     assert.equal(child(div, 0, 0, 0).childNodes.length, 3);
    // });

    test('checked property using template conditional', function () {
        var div = document.createElement('div');
        var tmpl = createTemplateNode('app',
                           '<input data-if="complete" type="checkbox" checked />' +
                           '<input data-unless="complete" type="checkbox" />');
        var prev_data = {};
        var next_data = {complete: false};
        var patcher = new patch.Patcher(div, test_transforms);
        var bound = new Magery.BoundTemplate(div, 'app', next_data, {});
        var state = {
            patcher: patcher,
            bound_template: bound,
            text_buffer: ''
        };
        tmpl.content.render(state, next_data, prev_data);
        assert.strictEqual(child(div, 0).checked, false, 'one');
        prev_data = next_data;
        next_data = {complete: true};
        tmpl.content.render(state, next_data, prev_data);
        assert.strictEqual(child(div, 0).checked, true, 'two');
        prev_data = next_data;
        next_data = {complete: false};
        tmpl.content.render(state, next_data, prev_data);
        assert.strictEqual(child(div, 0).checked, false, 'three');
    });

    test('value property', function () {
        var div = document.createElement('div');
        var tmpl = createTemplateNode('app',
                                      '<input type="text" value="{{message}}" />');
        var prev_data = {};
        var next_data = {message: ''};
        var patcher = new patch.Patcher(div, test_transforms);
        var bound = new Magery.BoundTemplate(div, 'app', next_data, {});
        var state = {
            patcher: patcher,
            bound_template: bound,
            text_buffer: ''
        };
        tmpl.content.render(state, next_data, prev_data);
        assert.strictEqual(child(div, 0).value, "");
        prev_data = next_data;
        next_data = {message: 'testing'};
        tmpl.content.render(state, next_data, prev_data);
        assert.strictEqual(child(div, 0).value, "testing");
        prev_data = next_data;
        next_data = {message: 'asdf'};
        tmpl.content.render(state, next_data, prev_data);
        assert.strictEqual(child(div, 0).value, "asdf");
    });

    test('autofocus on conditional causes focus', function () {
        var div = document.createElement('div');
        var tmpl = createTemplateNode('app',
                           '<input data-if="active" type="text" autofocus />' +
                           '<input data-unless="active" type="text" rel="test" />');
        // need to place this in the body so it can receive focus
        document.body.appendChild(div);
        var prev_data = {};
        var next_data = {};
        var patcher = new patch.Patcher(div, test_transforms);
        var bound = new Magery.BoundTemplate(div, 'app', next_data, {});
        var state = {
            patcher: patcher,
            bound_template: bound,
            text_buffer: ''
        };
        tmpl.content.render(state, next_data, prev_data);
        assert.notEqual(document.activeElement, child(div, 0));
        prev_data = next_data;
        next_data = {active: true};
        tmpl.content.render(state, next_data, prev_data);
        assert.equal(document.activeElement, child(div, 0));
        prev_data = next_data;
        next_data = {active: false};
        tmpl.content.render(state, next_data, prev_data);
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
        var tmpl = createTemplateNode('app', '<b>test</b>');
        var prev_data = {};
        var next_data = {};
        var patcher = new patch.Patcher(div, test_transforms);
        var bound = new Magery.BoundTemplate(div, 'app', next_data, {});
        var state = {
            patcher: patcher,
            bound_template: bound,
            text_buffer: ''
        };
        tmpl.content.render(state, next_data, prev_data);
        assert.strictEqual(div.getAttribute('id'), 'testing', 'id not removed');
        click(div);
        assert.deepEqual(calls, ['click'], 'event handler not removed');
    });

    // test("don't destroy external changes inside #skip tags", function () {
    //     var div = document.createElement('div');
    //     var div2 = document.createElement('div');
    //     var templates = Magery.loadTemplates(
    //         '{{#define app}}' +
    //           '<div id="container">' +
    //             '{{#skip}}' +
    //               '<div id="unmanaged">{{name}}</div>' +
    //             '{{/skip}}' +
    //             '<div id="managed">{{name}}</div>' +
    //           '</div>' +
    //         '{{/define}}'
    //     );
    //     var prev_data = {};
    //     var next_data = {name: 'test'};
    //     var patcher = new patch.Patcher(div, test_transforms);
    //     var renderer = new render.Renderer(patcher, templates, true);
    //     renderer.render('app', next_data, prev_data);
    //     div2.innerHTML = 
    //         '<div id="container">' +
    //           '<div id="unmanaged">test</div>' +
    //           '<div id="managed">test</div>' +
    //         '</div>';
    //     assert.ok(div.isEqualNode(div2));
    //     prev_data = next_data;
    //     next_data = {name: 'foo'};
    //     renderer.render('app', next_data, prev_data);
    //     div2.innerHTML =
    //         '<div id="container">' +
    //           '<div id="unmanaged">test</div>' +
    //           '<div id="managed">foo</div>' +
    //         '</div>';
    //     assert.ok(div.isEqualNode(div2));
    //     div.childNodes[0].childNodes[0].innerHTML = '<span>foo</span><span>bar</span>';
    //     div.childNodes[0].childNodes[0].setAttribute('data-test', '123');
    //     prev_data = next_data;
    //     next_data = {name: 'foo'};
    //     renderer.render('app', next_data, prev_data);
    //     div2.innerHTML =
    //         '<div id="container">' +
    //           '<div data-test="123" id="unmanaged">' +
    //             '<span>foo</span>' +
    //             '<span>bar</span>' +
    //           '</div>' +
    //           '<div id="managed">foo</div>' +
    //         '</div>';
    //     assert.ok(div.isEqualNode(div2));
    // });

    
});
