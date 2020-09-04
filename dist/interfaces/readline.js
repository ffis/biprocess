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
exports.ReadLineInterface = exports.Commands = void 0;
var os_1 = require("os");
var readline = __importStar(require("readline"));
var _1 = require(".");
var Commands = (function () {
    function Commands() {
    }
    Commands.prototype.help = function (jobs, output) {
        var comms = Object.keys(_1.supportedCommandsDescription).map(function (s) {
            return s + (typeof _1.supportedCommandsDescription[s] === "string" ? os_1.EOL + "\t" + _1.supportedCommandsDescription[s] : "");
        });
        var options = jobs.map(function (job) {
            return job.$.key + (job.description ? os_1.EOL + "\t" + job.description : "");
        }).concat(comms);
        output.write("\nThe available options are:\n");
        output.write(options.join(os_1.EOL) + "\n");
        return Promise.resolve();
    };
    Commands.prototype.isCommand = function (str) {
        return Object.keys(_1.AvailableCommands).indexOf(str) >= 0;
    };
    Commands.prototype.run = function (command, jobs, runEnteredCommand, output) {
        if (this.isCommand(command)) {
            switch (command) {
                case "help":
                    return this.help(jobs, output);
            }
        }
        return runEnteredCommand(command);
    };
    return Commands;
}());
exports.Commands = Commands;
var ReadLineInterface = (function () {
    function ReadLineInterface(parameters) {
        this.rl = null;
        this.options = [];
        this.jobs = [];
        this.commands = new Commands();
        this.parameters = Object.assign({}, parameters);
        if (!this.parameters.input) {
            this.parameters.input = process.stdin;
        }
        if (!this.parameters.output) {
            this.parameters.output = process.stdout;
        }
    }
    ReadLineInterface.prototype.setOptions = function (options) {
        this.options = options;
    };
    ReadLineInterface.prototype.setJobs = function (jobs) {
        this.jobs = jobs;
    };
    ReadLineInterface.prototype.run = function () {
        var _this = this;
        if (this.rl) {
            return Promise.resolve();
        }
        this.rl = readline.createInterface({
            input: this.parameters.input,
            output: this.parameters.output,
            prompt: "COMMAND> ",
            completer: this.completer.bind(this)
        });
        this.rl.on("line", function (line) {
            var command = _this.commands.run(line, _this.jobs, _this.parameters.runEnteredCommand, _this.parameters.output);
            command.catch(function (err) {
                _this.parameters.output.write(String(err) + "\n", "utf-8");
            }).finally(function () {
                _this.rl && _this.rl.prompt();
            });
        }).on("close", function () {
            _this.parameters.runEnteredCommand("quit");
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
        return [line.length ? hits : this.options, line];
    };
    return ReadLineInterface;
}());
exports.ReadLineInterface = ReadLineInterface;
//# sourceMappingURL=readline.js.map