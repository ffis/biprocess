"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTTPInterface = void 0;
var express_1 = require("express");
var express = require("express");
var assert_1 = require("assert");
var HTTPInterface = (function () {
    function HTTPInterface(config, runEnteredCommand, retrieveFromKey) {
        var _this = this;
        this.config = config;
        this.runEnteredCommand = runEnteredCommand;
        this.retrieveFromKey = retrieveFromKey;
        this.app = null;
        this.server = null;
        assert_1.ok(this.config.port, "There must be a port configured");
        assert_1.ok(this.config.bind, "There must be a bind address configured");
        this.router = express_1.Router();
        this.router.get("*", function (req, res) {
            if (req.originalUrl === "/") {
                res.json(_this.options);
            }
            else {
                _this.retrieveFromKey(req.originalUrl).then(function (val) {
                    if (val) {
                        res.type("application/json").send(val).end();
                    }
                    else {
                        res.status(404).type("application/json").send("404").end();
                    }
                }).catch(function (err) {
                    res.status(500).json(err);
                });
            }
        }).post("*", function (req, res) {
            _this.runEnteredCommand(req.originalUrl).then(function () {
                res.json(req.originalUrl);
            }).catch(function (err) {
                res.status(500).json(err);
            });
        });
        this.options = [];
    }
    HTTPInterface.prototype.setOptions = function (options) {
        this.options = options;
    };
    HTTPInterface.prototype.setJobs = function () { };
    HTTPInterface.prototype.run = function () {
        var _this = this;
        if (this.app && this.server) {
            return Promise.resolve();
        }
        return new Promise(function (resolve, reject) {
            _this.app = express();
            _this.app.use(_this.router);
            _this.server = _this.app.listen(_this.config.port, _this.config.bind, function () {
                if (_this.server && _this.server.listening) {
                    console.debug("Listenning on port", _this.config.port);
                    resolve();
                }
                else {
                    reject("Error trying to listen on port " + _this.config.port);
                }
            });
        });
    };
    HTTPInterface.prototype.close = function () {
        if (this.server) {
            var server_1 = this.server;
            this.server = null;
            this.app = null;
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