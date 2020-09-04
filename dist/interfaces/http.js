"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTTPInterface = exports.Commands = void 0;
var express_1 = require("express");
var express = require("express");
var _1 = require(".");
var assert_1 = require("assert");
var Commands = (function () {
    function Commands() {
    }
    Commands.prototype.help = function (jobs) {
        var comms = Object.keys(_1.supportedCommandsDescription).map(function (s) {
            return { command: "/" + s, description: _1.supportedCommandsDescription[s] };
        });
        var options = jobs.map(function (job) {
            var _a;
            return { command: job.$.key, description: (_a = job.description) === null || _a === void 0 ? void 0 : _a.join("\n") };
        }).concat(comms);
        return Promise.resolve(options);
    };
    Commands.prototype.isCommand = function (str) {
        return str.startsWith("/") && Object.keys(_1.AvailableCommands).indexOf(str.replace("/", "")) >= 0;
    };
    Commands.prototype.run = function (command, jobs, runEnteredCommand) {
        if (this.isCommand(command)) {
            switch (command) {
                case "/help":
                    return this.help(jobs);
            }
        }
        return runEnteredCommand(command).then(function () { return command; });
    };
    return Commands;
}());
exports.Commands = Commands;
var HTTPInterface = (function () {
    function HTTPInterface(parameters) {
        var _this = this;
        this.app_ = null;
        this.server = null;
        this.jobs = [];
        assert_1.ok(parameters.config, "Config is mandatory");
        assert_1.ok(parameters.runEnteredCommand, "runEnteredCommand is mandatory");
        assert_1.ok(parameters.retrieveFromKey, "retrieveFromKey is mandatory");
        assert_1.ok(parameters.config.port, "There must be a port configured");
        assert_1.ok(parameters.config.bind, "There must be a bind address configured");
        this.parameters = Object.assign({}, parameters);
        if (!this.parameters.logger) {
            this.parameters.logger = console;
        }
        this.commands = new Commands();
        this.router = express_1.Router();
        this.router.get("*", function (req, res) {
            if (req.originalUrl === "/") {
                res.json(_this.options);
            }
            else {
                _this.parameters.retrieveFromKey(req.originalUrl).then(function (val) {
                    if (val) {
                        res.type("application/json").send(val).end();
                    }
                    else {
                        res.status(404).type("application/json").send("404").end();
                    }
                }).catch(function (err) {
                    _this.parameters.logger.error(err);
                    res.status(500).end();
                });
            }
        }).post("*", function (req, res) {
            _this.commands.run(req.originalUrl, _this.jobs, _this.parameters.runEnteredCommand)
                .then(function (value) { res.json(value); })
                .catch(function (err) {
                _this.parameters.logger.error(err);
                res.status(500).end();
            });
        });
        this.options = [];
    }
    Object.defineProperty(HTTPInterface.prototype, "app", {
        get: function () {
            return this.app_;
        },
        enumerable: false,
        configurable: true
    });
    HTTPInterface.prototype.setOptions = function (options) {
        this.options = options;
    };
    HTTPInterface.prototype.setJobs = function (jobs) {
        this.jobs = jobs;
    };
    HTTPInterface.prototype.run = function () {
        var _this = this;
        if (this.app_ && this.server) {
            return Promise.resolve();
        }
        return new Promise(function (resolve, reject) {
            _this.app_ = express();
            _this.app_.use(_this.router);
            _this.server = _this.app_.listen(_this.parameters.config.port, _this.parameters.config.bind, function () {
                _this.parameters.logger.log("Listenning on port", _this.parameters.config.port);
                resolve();
            });
            _this.server.on("error", function () {
                reject("Error trying to listen on port " + _this.parameters.config.port);
            });
        });
    };
    HTTPInterface.prototype.close = function () {
        if (this.server) {
            var server_1 = this.server;
            this.server = null;
            this.app_ = null;
            return new Promise(function (resolve, reject) {
                server_1.close(function (err) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve();
                    }
                });
            });
        }
        return Promise.resolve();
    };
    return HTTPInterface;
}());
exports.HTTPInterface = HTTPInterface;
//# sourceMappingURL=http.js.map