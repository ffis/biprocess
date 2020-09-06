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
var redischannel_1 = require("../../../interfaces/redischannel");
var types_1 = require("../../../types");
var FakeSubscribable = (function () {
    function FakeSubscribable() {
        this.callbacks = {};
        this.listenningChannels = [];
    }
    FakeSubscribable.prototype.on = function (event, cb) {
        if (typeof this.callbacks[event] === "undefined") {
            this.callbacks[event] = [];
        }
        this.callbacks[event].push(cb);
    };
    FakeSubscribable.prototype.emit = function (event, channel, message) {
        var _a;
        (_a = this.callbacks[event]) === null || _a === void 0 ? void 0 : _a.forEach(function (cb) {
            setImmediate(function () {
                cb(channel, message);
            });
        });
    };
    FakeSubscribable.prototype.end = function () {
        this.callbacks = {};
        this.listenningChannels = [];
    };
    FakeSubscribable.prototype.subscribe = function (channel) {
        this.listenningChannels.push(channel);
    };
    FakeSubscribable.prototype.unsubscribe = function () {
        this.listenningChannels = [];
    };
    return FakeSubscribable;
}());
describe("RedisChannel Interface", function () {
    beforeEach(function () {
        jasmine.clock().install();
    });
    afterEach(function () {
        jasmine.clock().uninstall();
    });
    it("should work", function () { return __awaiter(void 0, void 0, void 0, function () {
        var expectedValue, config, fake, createClient, runEnteredCommand, rcInterface, options, apiDescription, jobs;
        return __generator(this, function (_a) {
            config = {
                channels: {
                    listen: ["a"]
                },
                host: "localhost",
                no_ready_check: true
            };
            fake = new FakeSubscribable();
            createClient = function () { return fake; };
            runEnteredCommand = function (_command) {
                return expectedValue === _command ? Promise.resolve() : Promise.reject();
            };
            rcInterface = new redischannel_1.RedisChannelInterface({
                config: config,
                createClient: createClient,
                runEnteredCommand: runEnteredCommand
            });
            options = [
                "a", "b", "c"
            ];
            apiDescription = "Api endpoint example";
            jobs = [
                {
                    $: {
                        key: "/api",
                        method: types_1.Method.UtilGenericQuery,
                    },
                    description: [apiDescription],
                    parameters: [],
                    triggers: [
                        {
                            on: [
                                { $: { action: config.channels.listen[0], contains: apiDescription.split(" ")[0] } }
                            ]
                        }
                    ]
                }
            ];
            rcInterface.setOptions(options);
            rcInterface.setJobs(jobs);
            return [2, expectAsync(rcInterface.run()).toBeResolved()
                    .then(function () { return expectAsync(rcInterface.run()).toBeResolved(); })
                    .then(function () {
                    console.log(fake.listenningChannels);
                    expect(fake.listenningChannels).withContext("listenningChannels to be equals").toEqual(config.channels.listen);
                    expect(fake.callbacks.message).withContext("callbacks.message to be defined").toBeDefined();
                    expect(fake.callbacks.message.length).withContext("callbacks.message.length").toBe(1);
                })
                    .then(function () {
                    expectedValue = "";
                    fake.emit("message", config.channels.listen[0], "this is a test");
                    jasmine.clock().tick(1);
                    expectedValue = jobs[0].$.key;
                    fake.emit("message", config.channels.listen[0], apiDescription);
                    jasmine.clock().tick(1);
                    expectedValue = "failed";
                    fake.emit("message", config.channels.listen[0], apiDescription);
                    jasmine.clock().tick(1);
                })
                    .then(function () { return expectAsync(rcInterface.close()).toBeResolved(); })
                    .then(function () { return expectAsync(rcInterface.close()).toBeResolved(); })];
        });
    }); });
});
//# sourceMappingURL=redischannel.spec.js.map