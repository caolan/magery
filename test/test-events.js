var assert = chai.assert;

function child(node /*...*/) {
    for (var i = 1; i < arguments.length; i++) {
        node = node.childNodes[arguments[i]];
    }
    return node;
}

suite('events', function () {

    test('click event to dispatch', function (done) {
        var container = document.createElement('div');
        var src = '' +
                '{{#define main}}' +
                  '<button onclick="clicked">click me</button>' +
                '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var data = {};
        Magery.patch(templates, 'main', container, data);
        container.dispatch = function (name, event, context, path) {
            assert.equal(name, 'clicked');
            assert.equal(event.target, child(container, 0));
            assert.deepEqual(context, data);
            assert.deepEqual(path, []);
            done();
        };
        child(container, 0).click();
    });

    test('click event with nested context', function (done) {
        var container = document.createElement('div');
        var src = '' +
                '{{#define main}}' +
                  '{{#with user}}' +
                    '<button onclick="clicked">click me</button>' +
                  '{{/with}}' +
                '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var data = {user: {name: 'test'}};
        Magery.patch(templates, 'main', container, data);
        container.dispatch = function (name, event, context, path) {
            assert.equal(name, 'clicked');
            assert.equal(event.target, child(container, 0));
            assert.deepEqual(context, {name: 'test'});
            assert.deepEqual(path, ['user']);
            done();
        };
        child(container, 0).click();
    });

    test('text input value reset to match template data on input', function () {
        var container = document.createElement('div');
        var src = '' +
                '{{#define main}}' +
                  '<input type="text" value="{{name}}">' +
                '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var data = {name: 'testing'};
        Magery.patch(templates, 'main', container, data);
        var input = child(container, 0);
        input.value = 'foo';
        assert.equal(input.value, 'foo');
        // input event fires synchronously
        var event = document.createEvent('Event');
        event.initEvent('input', true, true);
        input.dispatchEvent(event);
        assert.equal(input.value, 'testing');
    });

    test('update input value via dispatch + patch', function () {
        var container = document.createElement('div');
        var src = '' +
                '{{#define main}}' +
                  '<input type="text" value="{{name}}" oninput="updateInput">' +
                '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var data = {name: 'testing'};
        Magery.patch(templates, 'main', container, data);
        container.dispatch = function (name, event, context, path) {
            if (name == 'updateInput') {
                data.name = 'bar';
                Magery.patch(templates, 'main', container, data);
            }
        };
        var input = child(container, 0);
        input.value = 'foo';
        assert.equal(input.value, 'foo');
        // input event fires synchronously
        var event = document.createEvent('Event');
        event.initEvent('input', true, true);
        input.dispatchEvent(event);
        assert.equal(input.value, 'bar');
    });

    // TODO: check this in other browsers and confirm it actually tests cursor position changes
    /*
    test('maintain text cursor position if patch results in expected event value', function () {
        var container = document.createElement('div');
        var src = '' +
                '{{#define main}}' +
                  '<input type="text" value="{{name}}" oninput="updateInput">' +
                '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var data = {name: 'testing'};
        Magery.patch(templates, 'main', container, data);
        container.dispatch = function (name, event, context, path) {
            if (name == 'updateInput') {
                data.name = event.target.value;
                Magery.patch(templates, 'main', container, data);
            }
        };
        var input = child(container, 0);
        document.body.appendChild(container);
        input.focus();
        input.value = 'test-ing';
        input.selectionStart = 5;
        input.selectionEnd = 5;
        // input event fires synchronously
        var event = document.createEvent('Event');
        event.initEvent('input', true, true);
        input.dispatchEvent(event);
        assert.equal(input.value, 'test-ing');
        assert.equal(input.selectionStart, 5);
        assert.equal(input.selectionEnd, 5);
        document.body.removeChild(container);
    });
     */

    test('reset checkbox to match template data', function (done) {
        var container = document.createElement('div');
        var src = '' +
                '{{#define main}}' +
                  '{{#if checked}}' +
                    '<input type="checkbox" checked>' +
                  '{{else}}' +
                    '<input type="checkbox">' +
                  '{{/if}}' +
                '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var data = {checked: true};
        Magery.patch(templates, 'main', container, data);
        var input = child(container, 0);
        document.body.appendChild(container);
        assert.ok(input.checked);
        input.click();
        setTimeout(function () {
            assert.ok(input.checked);
            document.body.removeChild(container);
            done();
        }, 0);
    });
    
    test('reset radio to match template data', function (done) {
        var container = document.createElement('div');
        var src = '' +
                '{{#define main}}' +
                  '{{#each options}}' +
                    '{{#if checked}}' +
                      '<input type="radio" name="example" value="{{value}}" checked>' +
                    '{{else}}' +
                      '<input type="radio" name="example" value="{{value}}">' +
                    '{{/if}}' +
                  '{{/each}}' +
                '{{/define}}';
        var templates = Magery.loadTemplates(src);
        var data = {
            options: [
                {value: 'one', checked: false},
                {value: 'two', checked: true},
                {value: 'three', checked: false}
            ]
        };
        Magery.patch(templates, 'main', container, data);
        var radioOne = child(container, 0);
        var radioTwo = child(container, 1);
        var radioThree = child(container, 2);
        document.body.appendChild(container);
        assert.ok(!radioOne.checked, 'radio one (pre)');
        assert.ok(radioTwo.checked, 'radio two (pre)');
        assert.ok(!radioThree.checked, 'radio three (pre)');
        radioThree.click();
        setTimeout(function () {
            assert.ok(!radioOne.checked, 'radio one (post)');
            assert.ok(radioTwo.checked, 'radio two (post)');
            assert.ok(!radioThree.checked, 'radio three (post)');
            document.body.removeChild(container);
            done();
        }, 0);
    });

});
