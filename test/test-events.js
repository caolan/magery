var assert = chai.assert;

suite('events', function () {

    test('emit patch event on container', function (done) {
        var div = document.createElement('div');
        var templates = Magery.loadTemplates(
            '{{#define foo}}' +
                '<button>{{name}}</button>' +
            '{{/define}}'
        );
        var calls = [];
        var data = {name: 'asdf'};
        div.addEventListener('patch', function (event) {
            calls.push(event.data);
        });
        Magery.patch(templates, 'foo', div, data);
        assert.equal(child(div, 0).textContent, 'asdf');
        assert.deepEqual(calls, [
            {name: 'asdf'}
        ]);
        child(div, 0).click();
        window.requestAnimationFrame(function () {
            var prev_data = data;
            data = {name: 'test'};
            Magery.patch(templates, 'foo', div, data);
            assert.equal(child(div, 0).textContent, 'test');
            assert.deepEqual(calls, [
                {name: 'asdf'},
                {name: 'test'}
            ]);
            done();
        });
    });

});
