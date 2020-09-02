"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTTPInterface = void 0;
var express_1 = require("express");
var express = require("express");
var assert_1 = require("assert");
var HTTPInterface = (function () {
    function HTTPInterface(parameters) {
        var _this = this;
        this.app_ = null;
        this.server = null;
        assert_1.ok(parameters.config, "Config is mandatory");
        assert_1.ok(parameters.runEnteredCommand, "runEnteredCommand is mandatory");
        assert_1.ok(parameters.retrieveFromKey, "retrieveFromKey is mandatory");
        assert_1.ok(parameters.config.port, "There must be a port configured");
        assert_1.ok(parameters.config.bind, "There must be a bind address configured");
        this.parameters = Object.assign({}, parameters);
        if (!this.parameters.logger) {
            this.parameters.logger = console;
        }
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
            _this.parameters.runEnteredCommand(req.originalUrl).then(function () {
                res.json(req.originalUrl);
            }).catch(function (err) {
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
    HTTPInterface.prototype.setJobs = function () { };
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