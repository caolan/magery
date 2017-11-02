suite('Public API', function () {

    var assert = chai.assert;

    test('MageryCompiler.compile() within template node', function () {
        var container = document.createElement('div');
        container.innerHTML = '<template>' +
            '<template data-tagname="my-foo">foo</template>' +
            '<template data-tagname="my-bar">bar</template>' +
            '</template>';
        var templates = MageryCompiler.compile(container.childNodes[0]);
        var keys = Object.keys(templates);
        assert.deepEqual(keys.sort(), ['my-foo', 'my-bar'].sort());
    });

    test('MageryCompiler.compile() within div node', function () {
        var container = document.createElement('div');
        container.innerHTML = '' +
            '<template data-tagname="my-foo">foo</template>' +
            '<template data-tagname="my-bar">bar</template>';
        var templates = MageryCompiler.compile(container);
        var keys = Object.keys(templates);
        assert.deepEqual(keys.sort(), ['my-foo', 'my-bar'].sort());
    });

    test('MageryCompiler.compile() directly on data-tagname node', function () {
        var container = document.createElement('div');
        container.innerHTML = '<template data-tagname="my-foo">foo</template>';
        var templates = MageryCompiler.compile(container.childNodes[0]);
        var keys = Object.keys(templates);
        assert.deepEqual(keys.sort(), ['my-foo'].sort());
    });

    test('MageryCompiler.compile() with selector', function () {
        var container = document.createElement('div');
        container.innerHTML = '' +
            '<div class="magery-templates">' +
              '<template data-tagname="my-foo">foo</template>' +
              '<template data-tagname="my-bar">bar</template>' +
            '</div>' +
            '<div>' +
              '<template data-tagname="my-baz">baz</template>' +
              '<template data-tagname="my-qux">qux</template>' +
            '</div>' +
            '<template data-tagname="my-quux" class="magery-templates">' +
              'quux' +
            '</template>';
        container.style.display = 'none';
        document.body.appendChild(container);
        var templates = MageryCompiler.compile('.magery-templates');
        document.body.removeChild(container);
        var keys = Object.keys(templates);
        assert.deepEqual(keys.sort(), ['my-foo', 'my-bar', 'my-quux'].sort());
    });

    test('MageryCompiler.compile(node) with existing templates object', function () {
        var container = document.createElement('div');
        container.innerHTML = '' +
            '<template data-tagname="my-foo">foo</template>' +
            '<template data-tagname="my-bar">bar</template>';
        var templates1 = {'my-asdf': 123};
        var templates2 = MageryCompiler.compile(container, templates1);
        var keys = Object.keys(templates2);
        assert.equal(templates1, templates2);
        assert.deepEqual(keys.sort(), ['my-asdf', 'my-foo', 'my-bar'].sort());
        assert.equal(templates1['my-asdf'], 123);
    });

    test('MageryCompiler.compile(template_tag) with existing templates object', function () {
        var container = document.createElement('div');
        container.innerHTML = '<template>' +
            '<template data-tagname="my-foo">foo</template>' +
            '<template data-tagname="my-bar">bar</template>' +
            '</template>';
        var templates1 = {'my-asdf': 123};
        var templates2 = MageryCompiler.compile(container.childNodes[0], templates1);
        var keys = Object.keys(templates2);
        assert.equal(templates1, templates2);
        assert.deepEqual(keys.sort(), ['my-asdf', 'my-foo', 'my-bar'].sort());
        assert.equal(templates1['my-asdf'], 123);
    });

    test('MageryCompiler.compile(selector) with existing templates object', function () {
        var container = document.createElement('div');
        container.innerHTML = '' +
            '<div class="magery-templates">' +
              '<template data-tagname="my-foo">foo</template>' +
              '<template data-tagname="my-bar">bar</template>' +
            '</div>' +
            '<div>' +
              '<template data-tagname="my-baz">baz</template>' +
              '<template data-tagname="my-qux">qux</template>' +
            '</div>' +
            '<template data-tagname="my-quux" class="magery-templates">' +
              'quux' +
            '</template>';
        container.style.display = 'none';
        document.body.appendChild(container);
        var templates1 = {'my-asdf': 123};
        var templates2 = MageryCompiler.compile('.magery-templates', templates1);
        document.body.removeChild(container);
        var keys = Object.keys(templates2);
        assert.equal(templates1, templates2);
        assert.deepEqual(keys.sort(), ['my-asdf', 'my-foo', 'my-bar', 'my-quux'].sort());
        assert.equal(templates1['my-asdf'], 123);
    });
    
    test('MageryCompiler.compile(selector) with custom runtime', function () {
        var runtime = window.Magery;
        window.Magery = null;
        
        var container = document.createElement('div');
        container.innerHTML = '<template id="custom-runtime-test">' +
            '<template data-tagname="my-foo">foo</template>' +
            '<template data-tagname="my-bar">bar</template>' +
            '</template>';
        document.body.appendChild(container);
        
        var components = {};
        MageryCompiler.compile('#custom-runtime-test', components, runtime);
        var keys = Object.keys(components);
        assert.deepEqual(keys.sort(), ['my-foo', 'my-bar'].sort());

        document.body.removeChild(container);
        window.Magery = runtime;
    });

    // test('MageryCompiler.patch()', function () {
    // });

    // test('MageryCompiler.patch() on mismatched tag type', function () {
    // });

    // test('Template.bind()', function () {
    // });

});
