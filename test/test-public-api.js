suite('Public API', function () {

    var assert = chai.assert;

    test('Magery.compile() with template node', function () {
        var container = document.createElement('div');
        container.innerHTML = '<template>' +
            '<div data-template="foo">foo</div>' +
            '<p data-template="bar">bar</p>' +
            '</template>';
        var templates = Magery.compile(container.childNodes[0]);
        var keys = Object.keys(templates);
        assert.deepEqual(keys.sort(), ['foo', 'bar'].sort());
        assert.ok(templates['foo'] instanceof Magery.Template);
        assert.ok(templates['bar'] instanceof Magery.Template);
    });

    test('Magery.compile() with div node', function () {
        var container = document.createElement('div');
        container.innerHTML = '' +
            '<div data-template="foo">foo</div>' +
            '<p data-template="bar">bar</p>';
        var templates = Magery.compile(container);
        var keys = Object.keys(templates);
        assert.deepEqual(keys.sort(), ['foo', 'bar'].sort());
        assert.ok(templates['foo'] instanceof Magery.Template);
        assert.ok(templates['bar'] instanceof Magery.Template);
    });

    test('Magery.compile() directly on data-template node', function () {
        var container = document.createElement('div');
        container.innerHTML = '<div data-template="foo">foo</div>';
        var templates = Magery.compile(container.childNodes[0]);
        var keys = Object.keys(templates);
        assert.deepEqual(keys.sort(), ['foo'].sort());
        assert.ok(templates['foo'] instanceof Magery.Template);
    });

    test('Magery.compile() with selector', function () {
        var container = document.createElement('div');
        container.innerHTML = '' +
            '<template class="magery-templates">' +
              '<div data-template="foo">foo</div>' +
              '<div data-template="bar">bar</div>' +
            '</template>' +
            '<template>' +
              '<div data-template="baz">baz</div>' +
              '<div data-template="qux">qux</div>' +
            '</template>' +
            '<template class="magery-templates">' +
              '<div data-template="quux">quux</div>' +
            '</template>';
        container.style.display = 'none';
        document.body.appendChild(container);
        var templates = Magery.compile('.magery-templates');
        document.body.removeChild(container);
        var keys = Object.keys(templates);
        assert.deepEqual(keys.sort(), ['foo', 'bar', 'quux'].sort());
        assert.ok(templates['foo'] instanceof Magery.Template);
        assert.ok(templates['bar'] instanceof Magery.Template);
        assert.ok(templates['quux'] instanceof Magery.Template);
    });

    test('Magery.compile(node) with existing templates object', function () {
        var container = document.createElement('div');
        container.innerHTML = '' +
            '<div data-template="foo">foo</div>' +
            '<p data-template="bar">bar</p>';
        var templates1 = {'asdf': 123};
        var templates2 = Magery.compile(container, templates1);
        var keys = Object.keys(templates2);
        assert.equal(templates1, templates2);
        assert.deepEqual(keys.sort(), ['asdf', 'foo', 'bar'].sort());
        assert.equal(templates1['asdf'], 123);
        assert.ok(templates1['foo'] instanceof Magery.Template);
        assert.ok(templates1['bar'] instanceof Magery.Template);
    });

    test('Magery.compile(template_tag) with existing templates object', function () {
        var container = document.createElement('div');
        container.innerHTML = '<template>' +
            '<div data-template="foo">foo</div>' +
            '<p data-template="bar">bar</p>' +
            '</template>';
        var templates1 = {'asdf': 123};
        var templates2 = Magery.compile(container.childNodes[0], templates1);
        var keys = Object.keys(templates2);
        assert.equal(templates1, templates2);
        assert.deepEqual(keys.sort(), ['asdf', 'foo', 'bar'].sort());
        assert.equal(templates1['asdf'], 123);
        assert.ok(templates1['foo'] instanceof Magery.Template);
        assert.ok(templates1['bar'] instanceof Magery.Template);
    });

    test('Magery.compile(selector) with existing templates object', function () {
        var container = document.createElement('div');
        container.innerHTML = '' +
            '<template class="magery-templates">' +
              '<div data-template="foo">foo</div>' +
              '<div data-template="bar">bar</div>' +
            '</template>' +
            '<template>' +
              '<div data-template="baz">baz</div>' +
              '<div data-template="qux">qux</div>' +
            '</template>' +
            '<template class="magery-templates">' +
              '<div data-template="quux">quux</div>' +
            '</template>';
        container.style.display = 'none';
        document.body.appendChild(container);
        var templates1 = {'asdf': 123};
        var templates2 = Magery.compile('.magery-templates', templates1);
        document.body.removeChild(container);
        var keys = Object.keys(templates2);
        assert.equal(templates1, templates2);
        assert.deepEqual(keys.sort(), ['asdf', 'foo', 'bar', 'quux'].sort());
        assert.equal(templates1['asdf'], 123);
        assert.ok(templates1['foo'] instanceof Magery.Template);
        assert.ok(templates1['bar'] instanceof Magery.Template);
    });

    // test('Magery.patch()', function () {
    // });

    // test('Magery.patch() on mismatched tag type', function () {
    // });

    // test('Template.bind()', function () {
    // });

});
