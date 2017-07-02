suite('initTemplates', function () {

    var assert = chai.assert;

    function createTemplateNode(id, src) {
        var el = document.getElementById(id);
        if (!el) {
            el = document.createElement('template');
            document.body.appendChild(el);
            el.id = id;
        }
        el.innerHTML = src;
        return el;
    }

    function child(node /*...*/) {
        for (var i = 1; i < arguments.length; i++) {
            node = node.childNodes[arguments[i]];
        }
        return node;
    }

    test('simple static markup', function () {
        createTemplateNode('app',
                           '<h1>Hello, world!</h1>');
        Magery.initTemplates();
        var tmpl = document.getElementById('app').content;
        assert.ok(tmpl.static);
    });

    test('nested static nodes', function () {
        createTemplateNode('app',
                           '<li>' +
                             '<span class="user-icon">User:</span>' +
                             '<strong>{{ name }}</strong>' +
                           '</li>');
        Magery.initTemplates();
        var tmpl = document.getElementById('app').content;
        assert.ok(!tmpl.static);
        assert.ok(!child(tmpl, 0).static, true);
        assert.ok(child(tmpl, 0, 0).static, true);
        assert.ok(child(tmpl, 0, 0, 0).static, true);
        assert.ok(!child(tmpl, 0, 1).static, true);
        assert.ok(!child(tmpl, 0, 1, 0).static, true);
    });

});
