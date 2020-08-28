"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("../../utils");
describe("utils", function () {
    it("should be able to calculate keys", function () {
        expect(utils_1.calculateKey("/a/b/c", {})).toEqual("/a/b/c");
        expect(utils_1.calculateKey("/a/b/:c", { a: "1" })).toEqual("/a/b/:c");
        expect(utils_1.calculateKey("/:a/b/:c", { a: "1" })).toEqual("/1/b/:c");
        expect(utils_1.calculateKey("/:a/b/:c", { a: "1", b: "2" })).toEqual("/1/b/:c");
        expect(utils_1.calculateKey("/:a/b/:c", { a: "1", c: "3" })).toEqual("/1/b/3");
    });
    it("should work with generator", function () { return __awaiter(void 0, void 0, void 0, function () {
        var obj;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    obj = {
                        fn: function () {
                            return Promise.resolve([]);
                        }
                    };
                    return [4, expectAsync(utils_1.generator(obj.fn, obj, "/:a/:b", { a: "1" }, function (params) {
                            params.b = "2";
                        }, function (value, newkey) {
                            expect(value).toEqual([]);
                            expect(newkey).toEqual("/1/2");
                        })()).toBeResolved()];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
    it("should not fail with generator when function returns a rejected promise", function () { return __awaiter(void 0, void 0, void 0, function () {
        var obj, decorateFn, afterFn;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    obj = {
                        fn: function () {
                            return Promise.reject("error");
                        }
                    };
                    decorateFn = function (params) {
                        params.b = "2";
                    };
                    afterFn = function () {
                        throw new Error("this should not be runned");
                    };
                    return [4, expectAsync(utils_1.generator(obj.fn, obj, "/:a/:b", { a: "1" }, decorateFn, afterFn)()).toBeResolved()];
                case 1:
                    _a.sent();
                    return [2];
            }
        });
    }); });
});
//# sourceMappingURL=utils.spec.js.map