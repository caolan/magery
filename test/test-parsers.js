var assert = chai.assert;


suite('parsers', function () {

    test('parseParams - positional property args', function () {
        assert.deepEqual(
            parsers.parseParams('foo'),
            {args: [{type: 'property', value: 'foo'}],
             kwargs: null}
        );
        assert.deepEqual(
            parsers.parseParams('foo bar'),
            {args: [{type: 'property', value: 'foo'},
                    {type: 'property', value: 'bar'}],
             kwargs: null}
        );
        assert.deepEqual(
            parsers.parseParams('foo.bar.baz qux'),
            {args: [{type: 'property', value: 'foo.bar.baz'},
                    {type: 'property', value: 'qux'}],
             kwargs: null}
        );
    });

    test('parseParams - keyword args', function () {
        assert.deepEqual(
            parsers.parseParams('foo=one'),
            {args: [],
             kwargs: {
                 'foo': {type: 'property', value: 'one'}
             }}
        );
        assert.deepEqual(
            parsers.parseParams('foo=one bar=two'),
            {args: [],
             kwargs: {
                 'foo': {type: 'property', value: 'one'},
                 'bar': {type: 'property', value: 'two'}
             }}
        );
        assert.deepEqual(
            parsers.parseParams('foo=bar.baz qux=two'),
            {args: [],
             kwargs: {
                 'foo': {type: 'property', value: 'bar.baz'},
                 'qux': {type: 'property', value: 'two'}
             }}
        );
    });

    test('parseParams - both with literals', function () {
        assert.deepEqual(
            parsers.parseParams(
                'abc 0 false "1 2 3" foo=one.two bar=123 baz=true qux="test ing"'
            ),
            {args: [
                {type: 'property', value: 'abc'},
                {type: 'number', value: 0},
                {type: 'boolean', value: false},
                {type: 'string', value: "1 2 3"}
            ],
             kwargs: {
                 'foo': {type: 'property', value: 'one.two'},
                 'bar': {type: 'number', value: 123},
                 'baz': {type: 'boolean', value: true},
                 'qux': {type: 'string', value: "test ing"}
             }}
        );
    });

    test('parseParams - error on accidental commas', function () {
        assert.throws(function () {
            parsers.parseParams('foo, bar');
        });
        assert.throws(function () {
            parsers.parseParams('foo, bar,');
        });
        assert.throws(function () {
            parsers.parseParams('foo bar,');
        });
        assert.throws(function () {
            parsers.parseParams('foo="asdf", bar');
        });
        assert.throws(function () {
            parsers.parseParams('foo=true, bar');
        });
        assert.throws(function () {
            parsers.parseParams('foo=var, bar');
        });
        assert.throws(function () {
            parsers.parseParams('foo=123, bar');
        });
        assert.throws(function () {
            parsers.parseParams('foo=var,bar');
        });
        assert.throws(function () {
            parsers.parseParams('foo,bar');
        });
    });

    test('translate - simple define', function () {
        var template = '{{#define foo}}Hello{{/define}}';
        assert.equal(
            '<magery:define params="foo"><magery-block>Hello</magery-block></magery:define>',
            parsers.translate(template)
        );
    });

    test('translate - more complicated', function () {
        var template = '' +
                '{{#define item}}' +
                    '<li class="item">{{...}}</li>' +
                '{{/define}}' +
                '' +
                '{{#define foo}}' +
                    '<h1>Items</h1>' +
                    '{{#header/}}' +
                    '{{#each items key=meta.id}}' +
                        '{{#item}}Hello, {{name}}!{{/item}}' +
                    '{{/each}}' +
                '{{/define}}';
        assert.equal(
            '<magery:define params="item">' +
                '<magery-block>' +
                    '<li class="item"><magery-expand></magery-expand></li>' +
                '</magery-block>' +
            '</magery:define>' +
            '<magery:define params="foo">' +
                '<magery-block>' +
                    '<h1>Items</h1>' +
                    '<magery:header></magery:header>' +
                    '<magery:each params="items key=meta.id">' +
                        '<magery-block>' +
                            '<magery:item>' +
                                '<magery-block>Hello, {{name}}!</magery-block>' +
                            '</magery:item>' +
                        '</magery-block>' +
                    '</magery:each>' +
                '</magery-block>' +
            '</magery:define>',
            parsers.translate(template)
        );
    });

    test('translate - select box', function () {
        var template = '' +
                '{{#define foo}}' +
                  '<select>' +
                    '{{#each options}}' +
                      '<option value="{{value}}">{{label}}</option>' +
                    '{{/each}}' +
                  '</select>' +
                '{{/define}}';
        var expected = '' +
            '<magery:define params="foo">' +
              '<magery-block>' +
                '<magery-tag:select>' +
                  '<magery:each params="options">' +
                    '<magery-block>' +
                      '<option value="{{value}}">{{label}}</option>' +
                    '</magery-block>' +
                  '</magery:each>' +
                '</magery-tag:select>' +
              '</magery-block>' +
                '</magery:define>';
        assert.equal(expected, parsers.translate(template));
    });

    test('loadTemplates - with #define', function () {
        var src = '{{#define foo}}Hello{{/define}}\n' +
                '{{#define bar}}<span>world</span>{{/define}}';
        var templates = parsers.loadTemplates(src);
        assert.deepEqual(Object.keys(templates), ['foo', 'bar']);
        assert.equal(
            templates.foo.body.childNodes[0].textContent,
            'Hello'
        );
        assert.equal(
            templates.bar.body.childNodes[0].outerHTML,
            '<span>world</span>'
        );
    });

});
