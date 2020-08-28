"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.caller = exports.generator = exports.calculateKey = void 0;
function calculateKey(basekey, params) {
    var newkey = basekey;
    if (typeof params === "object") {
        newkey = Object.keys(params).reduce(function (p, c) {
            return p.replace(":" + c, params[c]);
        }, newkey);
    }
    return newkey;
}
exports.calculateKey = calculateKey;
function generator(fn, obj, basekey, params, decorate, after) {
    return function () {
        decorate(params);
        return Reflect.apply(fn, obj, [params]).then(function (value) {
            var newkey = calculateKey(basekey, params);
            after(value, newkey);
        }, function (err) {
            console.error(basekey, err);
        });
    };
}
exports.generator = generator;
function caller(functionname, obj, key, parameters, decorate, after) {
    return function () {
        if (typeof parameters === "undefined") {
            return generator(functionname, obj, key, {}, decorate, after)();
        }
        var callingparams = [{}];
        for (var attr in parameters) {
            var possiblevalues = parameters[attr];
            var cp = [];
            do {
                var p = callingparams.shift();
                for (var value in possiblevalues) {
                    p[attr] = possiblevalues[value];
                    cp.push(JSON.parse(JSON.stringify(p)));
                }
            } while (callingparams.length > 0);
            callingparams = cp;
        }
        var fns = callingparams.map(function (p) { return generator(functionname, obj, key, p, decorate, after); });
        return fns.reduce(function (p, c) { return p.then(function () { return c(); }); }, Promise.resolve());
    };
}
exports.caller = caller;
//# sourceMappingURL=utils.js.map