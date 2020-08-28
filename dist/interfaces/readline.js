"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReadLineInterface = void 0;
var readline = __importStar(require("readline"));
var ReadLineInterface = (function () {
    function ReadLineInterface(runEnteredCommand) {
        this.runEnteredCommand = runEnteredCommand;
        this.rl = null;
        this.options = [];
    }
    ReadLineInterface.prototype.setOptions = function (options) {
        this.options = options;
    };
    ReadLineInterface.prototype.setJobs = function () { };
    ReadLineInterface.prototype.run = function () {
        var _this = this;
        if (this.rl) {
            return Promise.resolve();
        }
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: "COMMAND> ",
            completer: this.completer.bind(this)
        });
        this.rl.on("line", function (line) {
            _this.runEnteredCommand(line).finally(function () {
                _this.rl && _this.rl.prompt();
            });
        }).on("close", function () {
            process.exit(0);
        });
        this.rl.prompt();
        return Promise.resolve();
    };
    ReadLineInterface.prototype.close = function () {
        if (!this.rl) {
            return Promise.resolve();
        }
        this.rl.close();
        this.rl = null;
        return Promise.resolve();
    };
    ReadLineInterface.prototype.completer = function (line) {
        var hits = this.options.filter(function (c) { return c.startsWith(line); });
        return [hits.length ? hits : this.options, line];
    };
    return ReadLineInterface;
}());
exports.ReadLineInterface = ReadLineInterface;
//# sourceMappingURL=readline.js.map