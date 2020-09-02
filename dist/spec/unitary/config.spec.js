"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var path_1 = require("path");
var config_1 = require("../../config");
var referenceDirectory = path_1.resolve(__dirname, "..", "..", "..", "src", "spec", "testdata");
describe("config", function () {
    it("should be load config file", function () {
        var config = config_1.getConfig(path_1.resolve(referenceDirectory, "config.json"));
        expect(config).toBeDefined();
    });
    it("should be load config file using relative path", function () {
        var abspath = path_1.resolve(referenceDirectory, "config.json");
        var config = config_1.getConfig(path_1.relative(process.cwd(), abspath));
        expect(config).toBeDefined();
    });
    it("should fail when loading a wrong config file", function () {
        expect(function () {
            config_1.getConfig(path_1.resolve(referenceDirectory, "random", "config.json"));
        }).toThrow();
    });
});
//# sourceMappingURL=config.spec.js.map