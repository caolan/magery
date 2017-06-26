// TODO the only requirement is to work around the deficiency in
// equality checks for modified versions of the same object. storing
// the dirty marker in another location allows me to work around this.
// all other comparisons should be used normally.


// TODO go back to using top-level changes object as there's no other
//      way to properly accommodate mutation + transparently wrap the
//      object. using immutables behind the scenes will occasionally
//      cause gotchas. using prototype hacks on context objects means
//      it doesn't quite behave in the same way as the underlying
//      object (and marking the context clean is slow... but checking
//      if properties are dirty will likely be faster)


suite('context', function () {

    var assert = chai.assert;

    test('access properties on context object', function () {
        var ctx = context.toContext({
            foo: 'bar',
            wibble: {wobble: {wubble: 123}}
        });
        assert.strictEqual(ctx.foo, 'bar');
        assert.strictEqual(ctx.wibble.wobble.wubble, 123);
    });

    test('context compares deepEqual to a normal object', function () {
        var ctx = context.toContext({
            foo: 'bar',
            wibble: {wobble: {wubble: 123}}
        });
        assert.deepEqual(ctx, {
            foo: 'bar',
            wibble: {wobble: {wubble: 123}}
        });
    });

    test('set of top-level property', function () {
        var a = context.toContext({foo: 'bar'});
        var b = a;
        context.markClean(a);
        assert(!context.isDirty(a));
        assert(!context.isDirty(b));
        b.foo = 'baz';
        assert.strictEqual(a, b);
        assert(context.isDirty(a));
        assert(context.isDirty(b));
        context.markClean(a);
        assert(!context.isDirty(a));
        assert(!context.isDirty(b));
    });

    test('set of nested property', function () {
        var ctx = context.toContext({
            user: {name: 'foo'},
            wibble: {wobble: {wubble: 123}}
        });
        context.markClean(ctx);
        ctx.wibble.wobble.wubble = 456;
        assert(context.isDirty(ctx.wibble.wobble));
        assert(context.isDirty(ctx.wibble));
        assert(context.isDirty(ctx));
        assert(!context.isDirty(ctx.user));
        ctx.user.name = 'bar';
        assert(context.isDirty(ctx.user));
    });

    test('assigning a new object', function () {
        var ctx = context.toContext({
            foo: 'bar',
            wibble: {wobble: {wubble: 123}}
        });
        context.markClean(ctx);
        var oldWobble = ctx.wibble.wobble;
        var wobble2 = {name: 'jelly'};
        ctx.wibble.wobble = wobble2;
        assert.strictEqual(
            wobble2,
            ctx.wibble.wobble,
            'reference should remain the same until toContext is called'
        );
        ctx = context.toContext(ctx);
        assert(context.isDirty(ctx));
        assert(context.isDirty(ctx.wibble));
        assert(ctx.wibble.wobble !== oldWobble);
        context.markClean(ctx);
        ctx.wibble.wobble.name = 'custard';
        assert(context.isDirty(ctx.wibble.wobble));
    });

    test('moving existing sub-object with changes', function () {
        var ctx = context.toContext({
            user: {name: 'test'},
            article: {title: 'example'}
        });
        context.markClean(ctx);
        ctx.user.id = 123;
        assert(context.isDirty(ctx.user));
        ctx.article.author = ctx.user;
        assert(context.isDirty(ctx.article));
        assert(context.isDirty(ctx.article.author));
        assert.strictEqual(ctx.article.author, ctx.user);
        assert.strictEqual(ctx.article.author.name, 'test');
        ctx = context.toContext(ctx);
        assert.strictEqual(ctx.article.author, ctx.user);
        context.markClean(ctx);
        assert(!context.isDirty(ctx.article));
        assert(!context.isDirty(ctx.article.author));
        assert.strictEqual(ctx.article.author, ctx.user);
    });

    test('updating multiple references to same object', function () {
        var ctx = context.toContext({
            user: {name: 'test'},
            article: {title: 'example'}
        });
        context.markClean(ctx);
        ctx.article.author = ctx.user;
        assert.deepEqual(ctx, {
            article: {title: 'example', author: {name: 'test'}},
            user: {name: 'test'}
        });
        assert.strictEqual(ctx.user, ctx.article.author);
        ctx = context.toContext(ctx);
        assert.strictEqual(ctx.user, ctx.article.author);
        assert(context.isDirty(ctx.article));
        assert(!context.isDirty(ctx.user));
        ctx.article.author.id = 123;
        ctx = context.toContext(ctx);
        assert(context.isDirty(ctx.article.author));
        assert(context.isDirty(ctx.user));
    });

    test('deleting a property', function () {
        var ctx = context.toContext({foo: 'bar', baz: 'qux'});
        context.markClean(ctx);
        assert(!context.isDirty(ctx));
        delete ctx.baz;
        assert(context.isDirty(ctx));
        assert.strictEqual(ctx.foo, 'bar');
        assert.deepEqual(Object.keys(ctx), ['foo']);
    });

    test('deleting a nested property', function () {
        var ctx = context.toContext({
            foo: 'bar',
            wibble: {wobble: {wubble: 123}}
        });
        context.markClean(ctx);
        delete ctx.wibble.wobble;
        assert(context.isDirty(ctx.wibble));
        assert.deepEqual(ctx, {foo: 'bar', wibble: {}});
    });

    test('copied object marks both parents, deleting one ref then marks one parent', function () {
        var ctx = context.toContext({
            user: {profile: {name: 'test'}},
            article: {title: 'example'},
            other: {test: 'test'}
        });
        ctx.article.author = ctx.user.profile;
        context.markClean(ctx);
        assert(!context.isDirty(ctx));
        assert(!context.isDirty(ctx.user));
        assert(!context.isDirty(ctx.article));
        assert(!context.isDirty(ctx.other));
        // this should mark both ctx.user and ctx.article dirty
        ctx.user.profile.id = 123;
        assert(context.isDirty(ctx));
        assert(context.isDirty(ctx.user));
        assert(context.isDirty(ctx.article));
        assert(!context.isDirty(ctx.other));
        context.markClean(ctx);
        delete ctx.article.author;
        assert(context.isDirty(ctx));
        assert(!context.isDirty(ctx.user));
        assert(context.isDirty(ctx.article));
        assert(!context.isDirty(ctx.other));
        context.markClean(ctx);
        // after deleting one reference, only ctx.user should be marked dirty
        ctx.user.profile.id = 456;
        assert(context.isDirty(ctx));
        assert(context.isDirty(ctx.user));
        assert(!context.isDirty(ctx.article));
        assert(!context.isDirty(ctx.other));
    });

    test('re-ordering an array', function () {
        var ctx = context.toContext({
            items: [{id: 2}, {id: 1}, {id: 3}]
        });
        var item2 = ctx.items[0];
        var item1 = ctx.items[1];
        var item3 = ctx.items[2];
        context.markClean(ctx);
        ctx.items.sort(function (a, b) {
            return a.id - b.id;
        });
        assert.deepEqual(ctx.items, [{id: 1}, {id: 2}, {id: 3}]);
        assert(context.isDirty(ctx));
        assert(context.isDirty(ctx.items));
        assert(!context.isDirty(ctx.items[0]));
        assert(!context.isDirty(ctx.items[1]));
        assert(!context.isDirty(ctx.items[2]));
        assert(
            ctx.items[0] !== item2,
            'ctx.items[0] should !== original ctx.items[0]'
        );
        assert.strictEqual(
            ctx.items[0],
            item1,
            'ctx.items[0] should === original ctx.items[1]'
        );
        // but making a change to the item itself, does mark it dirty
        ctx.items[1].name = 'test';
        assert(
            context.isDirty(ctx.items[1]),
            'matched up item (as in DOM) should be dirty'
        );
    });

});
