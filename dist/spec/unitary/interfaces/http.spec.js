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
var http_1 = require("../../../interfaces/http");
var request = require("supertest");
var getPort = require("get-port");
var types_1 = require("../../../types");
describe("HTTPInterface", function () {
    it("should fail work with non valid values", function () { return __awaiter(void 0, void 0, void 0, function () {
        var config, runEnteredCommand, retrieveFromKey, httpInterface;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    config = {
                        bind: "localhost",
                        port: 1,
                        enabled: true
                    };
                    runEnteredCommand = function (_command) { return Promise.resolve(); };
                    retrieveFromKey = function (_s) { return Promise.resolve(""); };
                    httpInterface = new http_1.HTTPInterface({
                        config: config,
                        logger: console,
                        retrieveFromKey: retrieveFromKey,
                        runEnteredCommand: runEnteredCommand
                    });
                    httpInterface.setOptions([]);
                    httpInterface.setJobs([]);
                    return [4, expectAsync(httpInterface.run()).toBeRejected()];
                case 1: return [2, _a.sent()];
            }
        });
    }); });
    it("should work with default values", function (done) {
        var options = [
            "a", "b", "c"
        ];
        var commandAvailable = "/mycommand";
        var commandNotAvailable = "/mycommand2";
        var failingCommand = "/failing";
        var storedValue = "[{\"a\": 1}]";
        var httpInterface;
        var expectedValue;
        var apiDescription = "Api endpoint example";
        getPort().then(function (port) {
            var config = {
                bind: "localhost",
                port: port,
                enabled: true
            };
            var runEnteredCommand = function (command) {
                expect(command).toEqual(expectedValue);
                return failingCommand === command ? Promise.reject() : Promise.resolve();
            };
            var retrieveFromKey = function (_s) {
                expect(_s).toEqual(expectedValue);
                if (failingCommand === _s) {
                    return Promise.reject();
                }
                return commandNotAvailable === _s ? Promise.resolve("") : Promise.resolve(storedValue);
            };
            var jobs = [
                {
                    $: {
                        key: "/api",
                        method: types_1.Method.UtilGenericQuery,
                    },
                    description: [apiDescription],
                    parameters: []
                }
            ];
            httpInterface = new http_1.HTTPInterface({ config: config, runEnteredCommand: runEnteredCommand, retrieveFromKey: retrieveFromKey });
            httpInterface.setOptions(options);
            httpInterface.setJobs(jobs);
            return expectAsync(httpInterface.run()).toBeResolved();
        }).then(function () { return new Promise(function (resolve) {
            request(httpInterface.app)
                .get("/")
                .expect("Content-Type", /json/)
                .expect(200, options, function () {
                resolve();
            });
        }); }).then(function () { return new Promise(function (resolve) {
            expectedValue = commandAvailable;
            request(httpInterface.app)
                .post(commandAvailable)
                .expect("Content-Type", /json/)
                .expect(200, commandAvailable, function () {
                resolve();
            });
        }); }).then(function () { return new Promise(function (resolve) {
            expectedValue = commandNotAvailable;
            request(httpInterface.app)
                .post(commandNotAvailable)
                .expect("Content-Type", /json/)
                .expect(404, function () {
                resolve();
            });
        }); }).then(function () { return new Promise(function (resolve) {
            expectedValue = commandNotAvailable;
            request(httpInterface.app)
                .get(commandNotAvailable)
                .expect("Content-Type", /json/)
                .expect(404, function () {
                resolve();
            });
        }); }).then(function () { return new Promise(function (resolve) {
            expectedValue = failingCommand;
            request(httpInterface.app)
                .get(failingCommand)
                .expect("Content-Type", /json/)
                .expect(500, function () {
                resolve();
            });
        }); }).then(function () { return new Promise(function (resolve) {
            expectedValue = failingCommand;
            request(httpInterface.app)
                .post(failingCommand)
                .expect("Content-Type", /json/)
                .expect(500, function () {
                resolve();
            });
        }); }).then(function () { return new Promise(function (resolve) {
            expectedValue = commandAvailable;
            request(httpInterface.app)
                .get(commandAvailable)
                .expect("Content-Type", /json/)
                .expect(200, JSON.parse(storedValue), function () {
                resolve();
            });
        }); }).then(function () {
            expectedValue = "/help";
            return request(httpInterface.app)
                .post("/help")
                .expect("Content-Type", /json/)
                .expect(200)
                .then(function (response) {
                var commands = response.body;
                expect(commands).toBeDefined();
                expect(typeof commands).toBe("object");
                expect(Array.isArray(commands)).toBeTrue();
                var apiCommand = commands.find(function (c) { return c.command === "/api"; });
                expect(apiCommand).toBeDefined();
                expect(apiCommand.description).toBe(apiDescription);
            });
        }).then(function () {
            return expectAsync(httpInterface.run()).toBeResolved();
        }).then(function () {
            return expectAsync(httpInterface.close()).toBeResolved();
        }).then(function () {
            return expectAsync(httpInterface.close()).toBeResolved();
        }).then(function () {
            done();
        });
    });
});
//# sourceMappingURL=http.spec.js.map