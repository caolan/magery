function Context(data, parents) {
    parents = parents || new Set();
    var dirty = true;
    var ctx = new Proxy(data, {
        get: function (target, property, receiver) {
            switch (property) {
            case '.dirty': return dirty;
            case '.parents': return parents;
            default:
                return target[property];
            }
        },
        set: function (target, property, value, receiver) {
            switch (property) {
            case '.dirty': dirty = value; break;
            case '.parents': parents = value; break;
            default:
                if (isContext(value)) {
                    addParent(value, ctx);
                }
                target[property] = value;
                markDirty(ctx);
            }
            return true;
        },
        deleteProperty: function (target, property) {
            switch (property) {
            case '.dirty': return false;
            case '.parents': return false;
            default:
                var value = target[property];
                if (isContext(value)) {
                    removeParent(value, ctx);
                }
                delete target[property];
                markDirty(ctx);
                return true;
            }
        }
    });
    return ctx;
}

function isContext(obj) {
    return typeof obj === 'object' && obj['.parents'];
}

function addParent(target, parent) {
    return target['.parents'].add(parent);
}

function removeParent(target, parent) {
    return target['.parents'].delete(parent);
}

function isDirty(obj) {
    return obj['.dirty'];
}

function markClean(obj) {
    if (isDirty(obj)) {
        obj['.dirty'] = false;
        for (var k in obj) {
            var v = obj[k];
            if (isContext(v)) {
                markClean(v);
            }
        }
    }
}

function markDirty(obj) {
    if (!isDirty(obj)) {
        obj['.dirty'] = true;
        obj['.parents'].forEach(markDirty);
    }
}

function toContext(obj, parent, converts) {
    converts = converts || new WeakMap();
    if (typeof obj === 'object') {
        if (isContext(obj)) {
            if (!isDirty(obj)) {
                return obj;
            }
        }
        else {
            // if we previously converted this object, use that. this
            // way the converted references will still compare equal
            // to each other
            if (converts.has(obj)) {
                obj = converts.get(obj);
            }
            // otherwise convert to a new context object
            else {
                var original = obj;
                obj = Context(original);
                converts.set(original, obj);
            }
            if (parent) {
                addParent(obj, parent);
            }
        }
        for (var k in obj) {
            obj[k] = toContext(obj[k], obj, converts);
        }
    }
    return obj;
}

// exports.Context = Context;
exports.isDirty = isDirty;
exports.toContext = toContext;
exports.markClean = markClean;
