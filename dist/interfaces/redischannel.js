"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisChannelInterface = void 0;
var redis_1 = require("redis");
var assert_1 = require("assert");
var RedisChannelInterface = (function () {
    function RedisChannelInterface(config, runEnteredCommand) {
        this.config = config;
        this.runEnteredCommand = runEnteredCommand;
        assert_1.ok(config.channels);
        assert_1.ok(Array.isArray(config.channels.listen));
        this.redissubscribe = null;
        this.jobs = [];
    }
    RedisChannelInterface.prototype.setOptions = function () { };
    RedisChannelInterface.prototype.setJobs = function (jobs) {
        this.jobs = jobs;
    };
    RedisChannelInterface.prototype.run = function () {
        var _this = this;
        this.redissubscribe = redis_1.createClient(this.config);
        this.config.channels.listen.forEach(function (channel) {
            _this.redissubscribe.subscribe(channel);
        });
        this.redissubscribe.on("message", function (channel, message) {
            if (_this.jobs && Array.isArray(_this.jobs)) {
                var triggeredJobs = _this.jobs.filter(function (j) { return j.triggers && j.triggers.filter(function (trigger) { return trigger.on.filter(function (event) { return event.$.action === channel && message.includes(event.$.contains); }).length > 0; }).length > 0; });
                triggeredJobs.forEach(function (job) {
                    _this.runEnteredCommand(job.$.key);
                });
            }
        });
        return Promise.resolve();
    };
    RedisChannelInterface.prototype.close = function () {
        if (!this.redissubscribe) {
            return Promise.resolve();
        }
        var client = this.redissubscribe;
        this.redissubscribe = null;
        client.end();
        return Promise.resolve();
    };
    return RedisChannelInterface;
}());
exports.RedisChannelInterface = RedisChannelInterface;
//# sourceMappingURL=redischannel.js.map