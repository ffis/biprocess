"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisChannelInterface = void 0;
var assert_1 = require("assert");
var RedisChannelInterface = (function () {
    function RedisChannelInterface(parameters) {
        assert_1.ok(parameters.config.channels);
        assert_1.ok(Array.isArray(parameters.config.channels.listen));
        this.redissubscribe = null;
        this.jobs = [];
        this.parameters = Object.assign({}, parameters);
    }
    RedisChannelInterface.prototype.setOptions = function (_options) { };
    RedisChannelInterface.prototype.setJobs = function (jobs) {
        assert_1.ok(Array.isArray(jobs));
        this.jobs = jobs;
    };
    RedisChannelInterface.prototype.run = function () {
        var _this = this;
        if (this.redissubscribe) {
            return Promise.resolve();
        }
        this.redissubscribe = this.parameters.createClient(this.parameters.config);
        this.parameters.config.channels.listen.forEach(function (channel) {
            _this.redissubscribe.subscribe(channel);
        });
        this.redissubscribe.on("message", function (channel, message) {
            var triggeredJobs = _this.jobs.filter(function (j) {
                return j.triggers && j.triggers.filter(function (trigger) {
                    return trigger.on.filter(function (event) {
                        return event.$.action === channel && message.includes(event.$.contains);
                    }).length > 0;
                }).length > 0;
            });
            triggeredJobs.forEach(function (job) {
                _this.parameters
                    .runEnteredCommand(job.$.key)
                    .catch(function (err) {
                    console.error(err);
                });
            });
        });
        return Promise.resolve();
    };
    RedisChannelInterface.prototype.close = function () {
        if (!this.redissubscribe) {
            return Promise.resolve();
        }
        var client = this.redissubscribe;
        this.redissubscribe = null;
        client.unsubscribe();
        client.end();
        return Promise.resolve();
    };
    return RedisChannelInterface;
}());
exports.RedisChannelInterface = RedisChannelInterface;
//# sourceMappingURL=redischannel.js.map