"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runInterfaces = void 0;
var http_1 = require("./http");
var redischannel_1 = require("./redischannel");
var readline_1 = require("./readline");
function runInterfaces(config, runEnteredCommand) {
    var interfaces = [];
    if (config.server && config.server.enabled) {
        var retrieveFn = function (_s) {
            return Promise.resolve("");
        };
        var httpinterface = new http_1.HTTPInterface(config.server, runEnteredCommand, retrieveFn);
        interfaces.push(httpinterface);
    }
    if (!config.quiet) {
        var readLineInterface = new readline_1.ReadLineInterface(runEnteredCommand);
        interfaces.push(readLineInterface);
    }
    var channels2subscribe = config.redis.channels && Array.isArray(config.redis.channels.listen) ? config.redis.channels.listen : [];
    if (channels2subscribe.length > 0) {
        var redisChannelInterface = new redischannel_1.RedisChannelInterface(config.redis, runEnteredCommand);
        interfaces.push(redisChannelInterface);
    }
    return interfaces;
}
exports.runInterfaces = runInterfaces;
//# sourceMappingURL=index.js.map