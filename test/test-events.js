suite('events', function () {

    var assert = chai.assert;

    function createTemplateNode(src) {
        var el = document.getElementById('test-templates');
        if (!el) {
            el = document.createElement('template');
            document.body.appendChild(el);
            el.id = 'test-templates';
        }
        el.innerHTML = src;
        return Magery.compileTemplates(el);
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

    function input(el, value){
        el.value = value;
        el.dispatchEvent(new Event('input'));
    }

    test('click event to dispatch', function (done) {
        var container = document.createElement('div');
        var templates = createTemplateNode(
            '<div data-template="main">' +
                '<button onclick="clicked(event)">click me</button>' +
                '</div>');
        var data = {};
        templates['main'].bind({
            clicked: function (event) {
                assert.equal(event.target, child(container, 0));
                done();
            }
        });
        templates['main'].patch(container, data);
        click(child(container, 0));
    });

    test('click event with context data', function (done) {
        var container = document.createElement('div');
        var templates = createTemplateNode(
            '<div data-template="main">' +
                '<button onclick="clicked(user)">click me</button>' +
                '</div>');
        var data = {user: {name: 'test'}};
        templates['main'].bind({
            clicked: function (user) {
                assert.deepEqual(user, {name: 'test'});
                done();
            }
        });
        templates['main'].patch(container, data);
        click(child(container, 0));
    });
    
    test('click event with event and context data', function (done) {
        var container = document.createElement('div');
        var templates = createTemplateNode(
            '<div data-template="main">' +
                '<button onclick="clicked(event, user)">click me</button>' +
                '</div>');
        var data = {user: {name: 'test'}};
        templates['main'].bind({
            clicked: function (event, user) {
                assert.equal(event.target, child(container, 0));
                assert.deepEqual(user, {name: 'test'});
                done();
            }
        });
        templates['main'].patch(container, data);
        click(child(container, 0));
    });

    // test('click event with nested context data and literal values', function (done) {
    //     var container = document.createElement('div');
    //     createTemplateNode('main',
    //                        '<button onclick="clicked(user.name, \'foo\', 123)">click me</button>');
    //     var data = {user: {name: 'test'}};
    //     Magery.bind(container, 'main', data, {
    //         clicked: function (name, str, num) {
    //             assert.equal(name, 'test');
    //             assert.equal(str, 'foo');
    //             assert.equal(num, 123);
    //             done();
    //         }
    //     });
    //     click(child(container, 0));
    // });

    // test('page is updated after event handler returns', function (done) {
    //     var container = document.createElement('div');
    //     var templates = createTemplateNode(
    //         '<div data-template="main">' +
    //             '<div id="counter">{{app.counter}}</div>' +
    //             '<button onclick="increment(app)">add one</button>' +
    //             '</div>');
    //     var data = {app: {counter: 0}};
    //     templates['main'].bind({
    //         increment: function (app) {
    //             app.counter++;
    //         }
    //     });
    //     templates['main'].patch(container, data);
    //     assert.equal(child(container, 0).textContent, '0');
    //     click(child(container, 1));
    //     assert.equal(child(container, 0).textContent, '1');
    //     click(child(container, 1));
    //     assert.equal(child(container, 0).textContent, '2');
    //     done();
    // });
    
    test('reference named item in loop', function () {
        var container = document.createElement('div');
        var templates = createTemplateNode(
            '<div data-template="main">' +
                '<button data-each="item in items" onclick="test(item)">test</button>' +
                '</div>');
        var data = {items: [{name: 'one'}, {name: 'two'}, {name: 'three'}]};
        var calls = [];
        templates['main'].bind({
            test: function (item) {
                calls.push(item.name);
            }
        });
        templates['main'].patch(container, data);
        click(child(container, 0));
        click(child(container, 1));
        click(child(container, 2));
        assert.deepEqual(calls, ['one', 'two', 'three']);
    });

    test('oninput for managed text input does not interfere with resetInput', function () {
        var container = document.createElement('div');
        var templates = createTemplateNode(
            '<div data-template="main">' +
                '<input type="text" value="{{user.id}}" data-managed="true" oninput="updateID(user, event)">' +
                '</div>');
        var data = {user: {id: '123'}};
        var calls = [];
        templates['main'].bind({
            updateID: function (user, event) {
                user.id = event.target.value.replace(/[^0-9]/g, '');
                templates['main'].patch(container, data);
            }
        });
        templates['main'].patch(container, data);
        input(child(container, 0), '123abc4');
        assert.equal(child(container, 0).value, '1234');
        input(child(container, 0), '12345');
        assert.equal(child(container, 0).value, '12345');
        input(child(container, 0), '5');
        assert.equal(child(container, 0).value, '5');
        input(child(container, 0), '5a');
        assert.equal(child(container, 0).value, '5');
    });

    test('render html tags back into managed input', function () {
        var container = document.createElement('div');
        var templates = createTemplateNode(
            '<div data-template="main">' +
                '<input type="text" value="{{user.name}}" data-managed="true" oninput="updateID(user, event)">' +
                '</div>');
        var data = {user: {name: 'test'}};
        templates['main'].bind({
            updateID: function (user, event) {
                user.name = event.target.value;
                templates['main'].patch(container, data);
            }
        });
        templates['main'].patch(container, data);
        assert.equal(child(container, 0).value, 'test');
        input(child(container, 0), '<h1>test</h1>');
        assert.equal(child(container, 0).value, '<h1>test</h1>');
    });

    test('text input value reset to match template data on input', function () {
        var container = document.createElement('div');
        var templates = createTemplateNode(
            '<div data-template="main">' +
                '<input data-managed="true" type="text" value="{{name}}">' +
                '</div>');
        var data = {name: 'testing'};
        templates['main'].patch(container, data);
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
        var templates = createTemplateNode(
            '<div data-template="main">' +
                '<input data-managed="true" type="text" value="{{name}}" oninput="updateInput()">' +
                '</div>');
        var data = {name: 'testing'};
        templates['main'].bind({
            updateInput: function () {
                data.name = 'bar';
                templates['main'].patch(container, data);
            }
        });
        templates['main'].patch(container, data);
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
        var templates = createTemplateNode(
            '<div data-template="main">' +
                '<input data-managed="true" data-if="checked" type="checkbox" checked>' +
                '<input data-managed="true" data-unless="checked" type="checkbox">' +
                '</div>');
        var data = {checked: true};
        templates['main'].patch(container, data);
        var input = child(container, 0);
        document.body.appendChild(container);
        assert.ok(input.checked);
        click(input);
        setTimeout(function () {
            assert.ok(input.checked);
            document.body.removeChild(container);
            done();
        }, 0);
    });

    test('update checkbox via dispatch', function (done) {
        var container = document.createElement('div');
        var templates = createTemplateNode(
            '<div data-template="main">' +
                '<input data-if="checked" type="checkbox" onclick="toggle()" checked>' +
                '<input data-unless="checked" type="checkbox" onclick="toggle()">' +
                '</div>');
        var data = {checked: true};
        templates['main'].bind({
            toggle: function () {
                data.checked = !data.checked;
            }
        });
        templates['main'].patch(container, data);
        var input = child(container, 0);
        document.body.appendChild(container);
        assert.ok(input.checked);
        click(input);
        setTimeout(function () {
            assert.ok(!input.checked);
            click(input);
            setTimeout(function () {
                assert.ok(input.checked);
                document.body.removeChild(container);
                done();
            }, 0);
        }, 0);
    });
    
    test('reset radio to match template data', function (done) {
        var container = document.createElement('div');
        var templates = createTemplateNode(
            '<div data-template="main">' +
                '<div data-each="option in options">' +
                '<input data-if="option.checked" data-managed="true" type="radio" name="example" value="{{option.value}}" checked>' +
                '<input data-unless="option.checked" data-managed="true" type="radio" name="example" value="{{option.value}}">' +
                '</div>' +
                '</div>');
        var data = {
            options: [
                {value: 'one', checked: false},
                {value: 'two', checked: true},
                {value: 'three', checked: false}
            ]
        };
        templates['main'].patch(container, data);
        var radioOne = child(container, 0, 0);
        var radioTwo = child(container, 1, 0);
        var radioThree = child(container, 2, 0);
        document.body.appendChild(container);
        assert.ok(!radioOne.checked, 'radio one (pre)');
        assert.ok(radioTwo.checked, 'radio two (pre)');
        assert.ok(!radioThree.checked, 'radio three (pre)');
        click(radioThree);
        setTimeout(function () {
            assert.ok(!radioOne.checked, 'radio one (post)');
            assert.ok(radioTwo.checked, 'radio two (post)');
            assert.ok(!radioThree.checked, 'radio three (post)');
            document.body.removeChild(container);
            done();
        }, 0);
    });

    test('update radio via event handler', function (done) {
        var container = document.createElement('div');
        var templates = createTemplateNode(
            '<div data-template="main">' +
                '<div data-each="option in options">' +
                '<input data-if="option.checked" data-managed="true" type="radio" onclick="pick(option.value)" name="example" value="{{option.value}}" checked>' +
                '<input data-unless="option.checked" data-managed="true" type="radio" onclick="pick(option.value)" name="example" value="{{option.value}}">' +
                '</div>' +
                '</div>');
        var data = {
            options: [
                {value: 'one', checked: false},
                {value: 'two', checked: true},
                {value: 'three', checked: false}
            ]
        };
        templates['main'].bind({
            pick: function (value) {
                data.options.forEach(function (option) {
                    option.checked = (option.value === value);
                });
                templates['main'].patch(container, data);
            }
        });
        templates['main'].patch(container, data);
        var radioOne = child(container, 0, 0);
        var radioTwo = child(container, 1, 0);
        var radioThree = child(container, 2, 0);
        document.body.appendChild(container);
        assert.ok(!radioOne.checked, 'radioOne (0)');
        assert.ok(radioTwo.checked, 'radioTwo (0)');
        assert.ok(!radioThree.checked, 'radioThree (0)');
        click(radioThree);
        setTimeout(function () {
            assert.ok(!radioOne.checked, 'radioOne (1)');
            assert.ok(!radioTwo.checked, 'radioTwo (1)');
            assert.ok(radioThree.checked, 'radioThree (1)');
            click(radioOne);
            setTimeout(function () {
                assert.ok(radioOne.checked, 'radioOne (2)');
                assert.ok(!radioTwo.checked, 'radioTwo (2)');
                assert.ok(!radioThree.checked, 'radioThree (2)');
                document.body.removeChild(container);
                done();
            }, 0);
        }, 0);
    });

    test('reset select to match template data', function (done) {
        var container = document.createElement('div');
        var templates = createTemplateNode(
            '<div data-template="main">' +
                '<select>' +
                '<option data-each="option in options" value="{{option.value}}" selected="{{option.selected}}">' +
                '{{option.label}}' +
                '</option>' +
                '</select>' +
                '</div>');
        var data = {
            options: [
                {value: 1, label: 'one', selected: false},
                {value: 2, label: 'two', selected: true},
                {value: 3, label: 'three', selected: false}
            ]
        };
        templates['main'].patch(container, data);
        var select = child(container, 0);
        var optionOne = child(select, 0);
        var optionTwo = child(select, 1);
        var optionThree = child(select, 2);
        document.body.appendChild(container);
        assert.ok(!optionOne.selected, 'option one (pre)');
        assert.ok(optionTwo.selected, 'option two (pre)');
        assert.ok(!optionThree.selected, 'option three (pre)');
        assert.equal(select.value, 2);
        click(optionThree);
        setTimeout(function () {
            assert.ok(!optionOne.selected, 'option one (pre)');
            assert.ok(optionTwo.selected, 'option two (pre)');
            assert.ok(!optionThree.selected, 'option three (pre)');
            assert.equal(select.value, 2);
            document.body.removeChild(container);
            done();
        }, 0);
    });

    test('bind handlers on nested template definition', function (done) {
        var container = document.createElement('div');
        var templates = createTemplateNode(
            '<div data-template="main">' +
                '<div data-template="entry">' +
                    '<p>{{ item_one.name }}: {{ item_one.count }}</p>' +
                    '<button onclick="incrementCount()">Add one</button>' +
                '</div>' +
                '<button onclick="incrementCount()">Add one</button>' +
            '</div>'
        );
        var data = {
            item_one: {
                name: 'one',
                count: 0
            },
            item_two: {
                name: 'two',
                count: 0
            }
        };
        templates['main'].bind({
            incrementCount: function () {
                data.item_two.count++;
            }
        });
        templates['entry'].bind({
            incrementCount: function () {
                data.item_one.count++;
            }
        });
        templates['main'].patch(container, data);
        var btn1 = child(container, 0, 1);
        var btn2 = child(container, 1);
        assert.equal(data.item_one.count, 0, 'item_one.count after patch');
        assert.equal(data.item_two.count, 0, 'item_two.count after patch');
        click(btn1);
        assert.equal(data.item_one.count, 1, 'item_one.count after click btn1');
        assert.equal(data.item_two.count, 0, 'item_two.count after click btn1');
        click(btn2);
        assert.equal(data.item_one.count, 1, 'item_one.count after click btn2');
        assert.equal(data.item_two.count, 1, 'item_two count after click btn2');
        done();
    });

    test('bind handlers on components', function (done) {
        var container = document.createElement('div');
        var templates = createTemplateNode(
            '<div data-template="entry">' +
                '<p>{{ item.name }}: {{ item.count }}</p>' +
                '<button onclick="incrementCount()">Add one</button>' +
            '</div>' +
            '<div data-template="main">' +
                '<entry item="item_one"></entry>' +
                '<button onclick="incrementCount()">Add one</button>' +
            '</div>'
        );
        var data = {
            item_one: {
                name: 'one',
                count: 0
            },
            item_two: {
                name: 'two',
                count: 0
            }
        };
        templates['main'].bind({
            incrementCount: function () {
                data.item_two.count++;
            }
        });
        templates['entry'].bind({
            incrementCount: function () {
                data.item_one.count++;
            }
        });
        templates['main'].patch(container, data);
        var btn1 = child(container, 0, 1);
        var btn2 = child(container, 1);
        assert.equal(data.item_one.count, 0, 'item_one.count after patch');
        assert.equal(data.item_two.count, 0, 'item_two.count after patch');
        click(btn1);
        assert.equal(data.item_one.count, 1, 'item_one.count after click btn1');
        assert.equal(data.item_two.count, 0, 'item_two.count after click btn1');
        click(btn2);
        assert.equal(data.item_one.count, 1, 'item_one.count after click btn2');
        assert.equal(data.item_two.count, 1, 'item_two count after click btn2');
        done();
    });

    test('bind handlers inside template-children', function (done) {
        var container = document.createElement('div');
        var templates = createTemplateNode(
            '<div data-template="entry">' +
                '<p>{{ item.name }}: {{ item.count }}</p>' +
                '<button onclick="incrementCount()">Add one</button>' +
                '<template-children></template-children>' +
            '</div>' +
            '<div data-template="main">' +
                '<entry item="item_one">' +
                    '<button onclick="incrementCount()">Add one</button>' +
                '</entry>' +
            '</div>'
        );
        var data = {
            item_one: {
                name: 'one',
                count: 0
            },
            item_two: {
                name: 'two',
                count: 0
            }
        };
        templates['main'].bind({
            incrementCount: function () {
                data.item_two.count++;
            }
        });
        templates['entry'].bind({
            incrementCount: function () {
                data.item_one.count++;
            }
        });
        templates['main'].patch(container, data);
        var btn1 = child(container, 0, 1);
        var btn2 = child(container, 0, 2);
        assert.equal(data.item_one.count, 0, 'item_one.count after patch');
        assert.equal(data.item_two.count, 0, 'item_two.count after patch');
        click(btn1);
        assert.equal(data.item_one.count, 1, 'item_one.count after click btn1');
        assert.equal(data.item_two.count, 0, 'item_two.count after click btn1');
        click(btn2);
        assert.equal(data.item_one.count, 1, 'item_one.count after click btn2');
        assert.equal(data.item_two.count, 1, 'item_two count after click btn2');
        done();
    });

    // test('update select via dispatch', function (done) {
    //     var container = document.createElement('div');
    //     var src = '' +
    //             '{{#define main}}' +
    //               '<select>' +
    //                 '{{#each options}}' +
    //                   '{{#if selected}}' +
    //                     '<option value="{{value}}" onclick="pick" selected>{{label}}</option>' +
    //                   '{{else}}' +
    //                     '<option value="{{value}}" onclick="pick">{{label}}</option>' +
    //                   '{{/if}}' +
    //                 '{{/each}}' +
    //               '</select>' +
    //             '{{/define}}';
    //     var templates = Magery.loadTemplates(src);
    //     var data = {
    //         options: [
    //             {value: 1, label: 'one', selected: false},
    //             {value: 2, label: 'two', selected: true},
    //             {value: 3, label: 'three', selected: false}
    //         ]
    //     };
    //     Magery.patch(templates, 'main', container, data);
    //     container.dispatch = function (name, event, context, path) {
    //         if (name === 'pick') {
    //             data.options = data.options.map(function (opt) {
    //                 opt.selected = (opt.value == context.value);
    //                 return opt;
    //             });
    //         }
    //         Magery.patch(templates, 'main', container, data);
    //     };
    //     var select = child(container, 0);
    //     var optionOne = child(select, 0);
    //     var optionTwo = child(select, 1);
    //     var optionThree = child(select, 2);
    //     document.body.appendChild(container);
    //     assert.ok(!optionOne.selected, 'option one (pre)');
    //     assert.ok(optionTwo.selected, 'option two (pre)');
    //     assert.ok(!optionThree.selected, 'option three (pre)');
    //     assert.equal(select.value, 2);
    //     click(optionThree);
    //     setTimeout(function () {
    //         assert.ok(!optionOne.selected, 'option one (pre)');
    //         assert.ok(!optionTwo.selected, 'option two (pre)');
    //         assert.ok(optionThree.selected, 'option three (pre)');
    //         assert.equal(select.value, 3);
    //         click(optionOne);
    //         setTimeout(function () {
    //             assert.ok(optionOne.selected, 'option one (pre)');
    //             assert.ok(!optionTwo.selected, 'option two (pre)');
    //             assert.ok(!optionThree.selected, 'option three (pre)');
    //             assert.equal(select.value, 1);
    //             document.body.removeChild(container);
    //             done();
    //         }, 0);
    //     }, 0);
    // });

    // test('reset muliselect to match template data', function (done) {
    //     var container = document.createElement('div');
    //     var src = '' +
    //             '{{#define main}}' +
    //               '<select multiple>' +
    //                 '{{#each options}}' +
    //                   '{{#if selected}}' +
    //                     '<option value="{{value}}" selected>{{label}}</option>' +
    //                   '{{else}}' +
    //                     '<option value="{{value}}">{{label}}</option>' +
    //                   '{{/if}}' +
    //                 '{{/each}}' +
    //               '</select>' +
    //             '{{/define}}';
    //     var templates = Magery.loadTemplates(src);
    //     var data = {
    //         options: [
    //             {value: 1, label: 'one', selected: true},
    //             {value: 2, label: 'two', selected: true},
    //             {value: 3, label: 'three', selected: false}
    //         ]
    //     };
    //     Magery.patch(templates, 'main', container, data);
    //     var select = child(container, 0);
    //     var optionOne = child(select, 0);
    //     var optionTwo = child(select, 1);
    //     var optionThree = child(select, 2);
    //     document.body.appendChild(container);
    //     assert.ok(optionOne.selected, 'option one (pre)');
    //     assert.ok(optionTwo.selected, 'option two (pre)');
    //     assert.ok(!optionThree.selected, 'option three (pre)');
    //     click(optionThree);
    //     setTimeout(function () {
    //         assert.ok(optionOne.selected, 'option one (pre)');
    //         assert.ok(optionTwo.selected, 'option two (pre)');
    //         assert.ok(!optionThree.selected, 'option three (pre)');
    //         document.body.removeChild(container);
    //         done();
    //     }, 0);
    // });

    // test('update multiselect via dispatch', function (done) {
    //     var container = document.createElement('div');
    //     var src = '' +
    //             '{{#define main}}' +
    //               '<select multiple>' +
    //                 '{{#each options}}' +
    //                   '{{#if selected}}' +
    //                     '<option value="{{value}}" onclick="toggle" selected>{{label}}</option>' +
    //                   '{{else}}' +
    //                     '<option value="{{value}}" onclick="toggle">{{label}}</option>' +
    //                   '{{/if}}' +
    //                 '{{/each}}' +
    //               '</select>' +
    //             '{{/define}}';
    //     var templates = Magery.loadTemplates(src);
    //     var data = {
    //         options: [
    //             {value: 1, label: 'one', selected: true},
    //             {value: 2, label: 'two', selected: true},
    //             {value: 3, label: 'three', selected: false}
    //         ]
    //     };
    //     Magery.patch(templates, 'main', container, data);
    //     container.dispatch = function (name, event, context, path) {
    //         if (name === 'toggle') {
    //             data.options = data.options.map(function (opt) {
    //                 if (opt.value == context.value) {
    //                     opt.selected = !opt.selected;
    //                 }
    //                 return opt;
    //             });
    //         }
    //         Magery.patch(templates, 'main', container, data);
    //     };
    //     var select = child(container, 0);
    //     var optionOne = child(select, 0);
    //     var optionTwo = child(select, 1);
    //     var optionThree = child(select, 2);
    //     document.body.appendChild(container);
    //     assert.ok(optionOne.selected, 'option one (pre)');
    //     assert.ok(optionTwo.selected, 'option two (pre)');
    //     assert.ok(!optionThree.selected, 'option three (pre)');
    //     click(optionThree);
    //     setTimeout(function () {
    //         assert.ok(optionOne.selected, 'option one (pre)');
    //         assert.ok(optionTwo.selected, 'option two (pre)');
    //         assert.ok(optionThree.selected, 'option three (pre)');
    //         click(optionOne);
    //         setTimeout(function () {
    //             assert.ok(!optionOne.selected, 'option one (pre)');
    //             assert.ok(optionTwo.selected, 'option two (pre)');
    //             assert.ok(optionThree.selected, 'option three (pre)');
    //             document.body.removeChild(container);
    //             done();
    //         }, 0);
    //     }, 0);
    // });

    // test('update select with optgroups via dispatch', function (done) {
    //     var container = document.createElement('div');
    //     var src = '' +
    //             '{{#define main}}' +
    //               '<select>' +
    //                 '{{#each groups}}' +
    //                   '<optgroup label="{{label}}">' +
    //                     '{{#each options}}' +
    //                       '{{#if selected}}' +
    //                         '<option value="{{value}}" onclick="pick" selected>{{label}}</option>' +
    //                       '{{else}}' +
    //                         '<option value="{{value}}" onclick="pick">{{label}}</option>' +
    //                       '{{/if}}' +
    //                     '{{/each}}' +
    //                   '</optgroup>' +
    //                 '{{/each}}' +
    //               '</select>' +
    //             '{{/define}}';
    //     var templates = Magery.loadTemplates(src);
    //     var data = {
    //         groups: [
    //             {
    //                 label: 'Group A',
    //                 options: [
    //                     {value: 1, label: 'one', selected: false},
    //                     {value: 2, label: 'two', selected: true}
    //                 ]
    //             },
    //             {
    //                 label: 'Group B',
    //                 options: [
    //                     {value: 3, label: 'three', selected: false}
    //                 ]
    //             }
    //         ]
    //     };
    //     Magery.patch(templates, 'main', container, data);
    //     container.dispatch = function (name, event, context, path) {
    //         if (name === 'pick') {
    //             data.groups.forEach(function (group) {
    //                 group.options = group.options.map(function (opt) {
    //                     opt.selected = (opt.value == context.value);
    //                     return opt;
    //                 });
    //             });
    //         }
    //         Magery.patch(templates, 'main', container, data);
    //     };
    //     var select = child(container, 0);
    //     var groupA = child(select, 0);
    //     var groupB = child(select, 1);
    //     var optionOne = child(groupA, 0);
    //     var optionTwo = child(groupA, 1);
    //     var optionThree = child(groupB, 0);
    //     document.body.appendChild(container);
    //     assert.ok(!optionOne.selected, 'option one (1)');
    //     assert.ok(optionTwo.selected, 'option two (1)');
    //     assert.ok(!optionThree.selected, 'option three (1)');
    //     assert.equal(select.value, 2);
    //     click(optionThree);
    //     setTimeout(function () {
    //         assert.ok(!optionOne.selected, 'option one (2)');
    //         assert.ok(!optionTwo.selected, 'option two (2)');
    //         assert.ok(optionThree.selected, 'option three (2)');
    //         assert.equal(select.value, 3);
    //         click(optionOne);
    //         setTimeout(function () {
    //             assert.ok(optionOne.selected, 'option one (3)');
    //             assert.ok(!optionTwo.selected, 'option two (3)');
    //             assert.ok(!optionThree.selected, 'option three (3)');
    //             assert.equal(select.value, 1);
    //             document.body.removeChild(container);
    //             done();
    //         }, 0);
    //     }, 0);
    // });

});
